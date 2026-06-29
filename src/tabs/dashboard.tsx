import { useRef, useEffect, useMemo, useState } from "react"

import "../styles.css"

import {
  applyBatchStatus,
  filterLinks,
  getProbablyNotImportantLinks,
  getWeeklyCleanupStats,
  sortLinks,
  type DashboardSort
} from "../core/dashboard"
import { createDemoLinks } from "../core/demo-data"
import { createExportPayload, parseImportPayload } from "../core/import-export"
import {
  applyReviewDecision,
  createReviewSummary,
  getReviewQueue,
  type ReviewDecision,
  type ReviewEvent
} from "../core/review"
import { DEFAULT_SETTINGS, sanitizeSettings, type UserSettings } from "../core/settings"
import { getTopicClusters, type TopicCluster } from "../core/topics"
import { clearDiscarded, deleteLink, getLinks, replaceLinks, saveLink, updateLink } from "../storage/links"
import { getSettings, saveSettings } from "../storage/settings"
import type { LinkStatus, SavedLink } from "../types/link"

const filters: Array<LinkStatus | "all"> = [
  "all",
  "reading_this_week",
  "summary_queue",
  "task",
  "toolbox",
  "discarded",
  "done"
]

type DashboardFilter = LinkStatus | "all" | "probably_not_important"

const statusLabels: Record<DashboardFilter, string> = {
  all: "All",
  probably_not_important: "Probably not important",
  inbox: "Inbox",
  reading_this_week: "This week",
  summary_queue: "Summary",
  task: "Tasks",
  toolbox: "Toolbox",
  discarded: "Discarded",
  done: "Done"
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function Dashboard() {
  const [links, setLinks] = useState<SavedLink[]>([])
  const [filter, setFilter] = useState<DashboardFilter>("all")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<DashboardSort>("debt")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [notice, setNotice] = useState("")
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [settingsDraft, setSettingsDraft] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [reviewModeOpen, setReviewModeOpen] = useState(false)
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function refreshLinks() {
    setLinks(await getLinks())
  }

  useEffect(() => {
    refreshLinks()
    getSettings().then((storedSettings) => {
      setSettings(storedSettings)
      setSettingsDraft(storedSettings)
    })
  }, [])

  const visibleLinks = useMemo(() => {
    const probablyNotImportantLinks = getProbablyNotImportantLinks(links, new Date(), settings)
    const statusFilteredLinks =
      filter === "all"
        ? links
        : filter === "probably_not_important"
          ? probablyNotImportantLinks
          : links.filter((link) => link.status === filter)
    return sortLinks(filterLinks(statusFilteredLinks, query), sort)
  }, [filter, links, query, settings, sort])

  const stats = useMemo(() => {
    return {
      total: links.length,
      highDebt: links.filter((link) => link.debtScore >= 70 && link.status !== "discarded").length,
      discarded: links.filter((link) => link.status === "discarded").length,
      thisWeek: links.filter((link) => link.status === "reading_this_week").length
    }
  }, [links])
  const weeklyStats = useMemo(() => getWeeklyCleanupStats(links, new Date(), settings), [links, settings])
  const reviewedLinkIds = useMemo(() => reviewEvents.map((event) => event.linkId), [reviewEvents])
  const reviewQueue = useMemo(
    () => getReviewQueue(links, new Date(), settings, reviewedLinkIds),
    [links, settings, reviewedLinkIds]
  )
  const currentReviewLink = reviewQueue[0]
  const reviewSummary = useMemo(() => createReviewSummary(reviewEvents), [reviewEvents])
  const topicClusters = useMemo(() => getTopicClusters(links).slice(0, 4), [links])

  async function setStatus(id: string, status: LinkStatus) {
    await updateLink(id, { status })
    await refreshLinks()
  }

  async function removeLink(id: string) {
    await deleteLink(id)
    await refreshLinks()
  }

  async function removeDiscarded() {
    await clearDiscarded()
    await refreshLinks()
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    )
  }

  async function applyBatch(status: LinkStatus) {
    const updatedLinks = applyBatchStatus(links, selectedIds, status)
    await Promise.all(
      updatedLinks
        .filter((link) => selectedIds.includes(link.id))
        .map((link) => updateLink(link.id, { status: link.status }))
    )
    setSelectedIds([])
    await refreshLinks()
  }

  async function updateNote(id: string, note: string) {
    await updateLink(id, { note: note.trim() || undefined })
    await refreshLinks()
  }

  async function updateTags(id: string, tagsValue: string) {
    await updateLink(id, {
      tags: tagsValue
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    })
    await refreshLinks()
  }

  async function seedDemoData() {
    const demoLinks = createDemoLinks()
    await Promise.all(demoLinks.map((link) => saveLink(link)))
    await refreshLinks()
  }

  function exportLinks() {
    const payload = createExportPayload(links)
    const blob = new Blob([payload], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `read-later-regret-export-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice("Export prepared. Your links escaped in an orderly JSON file.")
  }

  async function importLinks(file: File | undefined) {
    if (!file) return

    const raw = await file.text()
    const result = parseImportPayload(raw, links)

    if (result.ok === false) {
      setNotice(result.error)
      return
    }

    await replaceLinks(result.links)
    setNotice(`Imported ${result.links.length} total links after URL dedupe.`)
    await refreshLinks()
  }

  async function updateSettings(patch: Partial<UserSettings>) {
    const nextSettings = sanitizeSettings({
      ...settingsDraft,
      ...patch
    })

    setSettings(await saveSettings(nextSettings))
    setSettingsDraft(nextSettings)
    setNotice("Preferences saved. The queue has been recalibrated.")
  }

  function updateSettingsDraft(patch: Partial<UserSettings>) {
    setSettingsDraft((currentSettings) => ({
      ...currentSettings,
      ...patch
    }))
  }

  async function applyReview(decision: ReviewDecision) {
    if (!currentReviewLink) return

    const updatedLink = applyReviewDecision(currentReviewLink, decision)
    await updateLink(updatedLink.id, {
      status: updatedLink.status,
      updatedAt: updatedLink.updatedAt
    })
    setReviewEvents((currentEvents) => [
      ...currentEvents,
      {
        linkId: currentReviewLink.id,
        decision,
        previousDebtScore: currentReviewLink.debtScore
      }
    ])
    await refreshLinks()
  }

  function resetReviewSession() {
    setReviewEvents([])
    setReviewModeOpen(true)
  }

  async function applyTopicAction(cluster: TopicCluster, action: "read" | "summarize" | "discard") {
    const ids =
      action === "read"
        ? cluster.suggestedReadIds
        : action === "summarize"
          ? cluster.suggestedSummaryIds
          : cluster.suggestedDiscardIds
    const status: LinkStatus =
      action === "read" ? "reading_this_week" : action === "summarize" ? "summary_queue" : "discarded"

    await Promise.all(ids.map((id) => updateLink(id, { status })))
    setNotice(`${cluster.label}: ${ids.length} links moved.`)
    await refreshLinks()
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Read-Later Regret</p>
          <h1>Information debt dashboard</h1>
          <p className="muted">You are not short on content. You are short on deleting courage.</p>
        </div>
        <button className="secondary-button" onClick={removeDiscarded} type="button">
          Clear discarded
        </button>
      </header>

      <section className="stats-grid">
        <div>
          <span>Total links</span>
          <strong>{stats.total}</strong>
        </div>
        <div>
          <span>This week</span>
          <strong>{stats.thisWeek}</strong>
        </div>
        <div>
          <span>High debt</span>
          <strong>{stats.highDebt}</strong>
        </div>
        <div>
          <span>Discarded</span>
          <strong>{stats.discarded}</strong>
        </div>
      </section>

      <section className="review-panel">
        <div className="review-panel-header">
          <div>
            <p className="eyebrow">Review Mode</p>
            <h2>One link at a time. Less queue, less guilt.</h2>
          </div>
          <button className="primary-button" onClick={resetReviewSession} type="button">
            {reviewModeOpen ? "Restart review" : "Start review"}
          </button>
        </div>

        {reviewModeOpen && currentReviewLink && (
          <article className="review-card">
            <div>
              <h3>{currentReviewLink.title}</h3>
              <p>{hostFromUrl(currentReviewLink.url)}</p>
              <div className="tag-row">
                <span>{currentReviewLink.type}</span>
                <span>{currentReviewLink.readingTimeMinutes} min</span>
                <span>{currentReviewLink.debtScore}/100 debt</span>
                <span>{statusLabels[currentReviewLink.status]}</span>
              </div>
            </div>
            <div className="review-actions">
              <button className="primary-button" onClick={() => applyReview("keep")} type="button">
                Keep this week
              </button>
              <button className="ghost-button" onClick={() => applyReview("summarize")} type="button">
                Summarize
              </button>
              <button className="ghost-button" onClick={() => applyReview("task")} type="button">
                Turn task
              </button>
              <button className="ghost-button" onClick={() => applyReview("later")} type="button">
                Later
              </button>
              <button className="danger-button" onClick={() => applyReview("discard")} type="button">
                Discard
              </button>
            </div>
          </article>
        )}

        {reviewModeOpen && !currentReviewLink && (
          <div className="review-complete">
            <strong>Review complete.</strong>
            <span>
              Reviewed {reviewSummary.reviewed}, discarded {reviewSummary.discarded}, summarized{" "}
              {reviewSummary.summarized}, tasked {reviewSummary.tasked}, debt reduced by{" "}
              {reviewSummary.debtReduced}.
            </span>
          </div>
        )}
      </section>

      {topicClusters.length > 0 && (
        <section className="topic-panel">
          <div className="topic-panel-header">
            <div>
              <p className="eyebrow">Topic Groups</p>
              <h2>You may not need every link in the pile.</h2>
            </div>
          </div>
          <div className="topic-grid">
            {topicClusters.map((cluster) => (
              <article className="topic-card" key={cluster.id}>
                <div>
                  <h3>{cluster.label}</h3>
                  <p>
                    {cluster.links.length} links. {cluster.recommendation}
                  </p>
                  <div className="topic-link-list">
                    {cluster.links.slice(0, 3).map((link) => (
                      <span key={link.id}>{link.title}</span>
                    ))}
                  </div>
                </div>
                <div className="topic-actions">
                  <button
                    className="primary-button"
                    disabled={cluster.suggestedReadIds.length === 0}
                    onClick={() => applyTopicAction(cluster, "read")}
                    type="button">
                    Read picks
                  </button>
                  <button
                    className="ghost-button"
                    disabled={cluster.suggestedSummaryIds.length === 0}
                    onClick={() => applyTopicAction(cluster, "summarize")}
                    type="button">
                    Summarize rest
                  </button>
                  <button
                    className="danger-button"
                    disabled={cluster.suggestedDiscardIds.length === 0}
                    onClick={() => applyTopicAction(cluster, "discard")}
                    type="button">
                    Discard rest
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="cleanup-panel">
        <div>
          <span>This week saved</span>
          <strong>{weeklyStats.savedThisWeek}</strong>
        </div>
        <div>
          <span>High debt</span>
          <strong>{weeklyStats.highDebt}</strong>
        </div>
        <div>
          <span>Suggest discard</span>
          <strong>{weeklyStats.suggestedDiscard}</strong>
        </div>
        <div>
          <span>Worth reading</span>
          <strong>{weeklyStats.worthReading}</strong>
        </div>
        <button
          className="cleanup-stat-button"
          onClick={() => setFilter("probably_not_important")}
          type="button">
          <span>Probably not important</span>
          <strong>{weeklyStats.probablyNotImportant}</strong>
        </button>
      </section>

      <section className="preferences-panel" aria-label="Decision preferences">
        <label>
          English WPM
          <input
            min={120}
            max={450}
            onBlur={(event) => updateSettings({ englishWordsPerMinute: Number(event.target.value) })}
            onChange={(event) => updateSettingsDraft({ englishWordsPerMinute: Number(event.target.value) })}
            type="number"
            value={settingsDraft.englishWordsPerMinute}
          />
        </label>
        <label>
          CJK chars/min
          <input
            min={200}
            max={900}
            onBlur={(event) => updateSettings({ cjkCharactersPerMinute: Number(event.target.value) })}
            onChange={(event) => updateSettingsDraft({ cjkCharactersPerMinute: Number(event.target.value) })}
            type="number"
            value={settingsDraft.cjkCharactersPerMinute}
          />
        </label>
        <label>
          Long article at
          <input
            min={3}
            max={30}
            onBlur={(event) => updateSettings({ longArticleMinutes: Number(event.target.value) })}
            onChange={(event) => updateSettingsDraft({ longArticleMinutes: Number(event.target.value) })}
            type="number"
            value={settingsDraft.longArticleMinutes}
          />
        </label>
        <label>
          Stale after days
          <input
            min={7}
            max={180}
            onBlur={(event) => updateSettings({ staleLinkDays: Number(event.target.value) })}
            onChange={(event) => updateSettingsDraft({ staleLinkDays: Number(event.target.value) })}
            type="number"
            value={settingsDraft.staleLinkDays}
          />
        </label>
      </section>

      <nav className="filter-row" aria-label="Link filters">
        {filters.map((item) => (
          <button
            className={filter === item ? "filter-active" : "filter-button"}
            key={item}
            onClick={() => setFilter(item)}
            type="button">
            {statusLabels[item]}
          </button>
        ))}
      </nav>

      <section className="toolbar">
        <input
          accept="application/json"
          className="visually-hidden"
          onChange={(event) => {
            importLinks(event.target.files?.[0])
            event.currentTarget.value = ""
          }}
          ref={fileInputRef}
          type="file"
        />
        <input
          aria-label="Search links"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, host, type, tag..."
          value={query}
        />
        <select aria-label="Sort links" onChange={(event) => setSort(event.target.value as DashboardSort)} value={sort}>
          <option value="debt">Sort by debt</option>
          <option value="created">Sort by saved time</option>
          <option value="readingTime">Sort by reading time</option>
        </select>
        <button className="ghost-button" disabled={selectedIds.length === 0} onClick={() => applyBatch("discarded")} type="button">
          Batch discard
        </button>
        <button className="ghost-button" disabled={selectedIds.length === 0} onClick={() => applyBatch("done")} type="button">
          Batch done
        </button>
        <button className="ghost-button" disabled={selectedIds.length === 0} onClick={() => applyBatch("summary_queue")} type="button">
          Batch summarize
        </button>
        <button className="ghost-button" onClick={exportLinks} type="button">
          Export
        </button>
        <button className="ghost-button" onClick={() => fileInputRef.current?.click()} type="button">
          Import
        </button>
      </section>

      {notice && <p className="notice">{notice}</p>}

      {visibleLinks.length === 0 ? (
        <section className="empty-state">
          <p>No links here. Suspiciously peaceful.</p>
          {process.env.NODE_ENV !== "production" && (
            <button className="secondary-button" onClick={seedDemoData} type="button">
              Add demo links
            </button>
          )}
        </section>
      ) : (
        <section className="link-list">
          {visibleLinks.map((link) => (
            <article className="link-row" key={link.id}>
              <label className="select-box">
                <input
                  checked={selectedIds.includes(link.id)}
                  onChange={() => toggleSelected(link.id)}
                  type="checkbox"
                />
              </label>
              <div className="link-main">
                <h2>{link.title}</h2>
                <p>{hostFromUrl(link.url)}</p>
                <div className="tag-row">
                  <span>{link.type}</span>
                  <span>{link.readingTimeMinutes} min</span>
                  <span>{link.debtScore}/100 debt</span>
                  {typeof link.confidence === "number" && <span>{link.confidence}% confidence</span>}
                  {link.extractionQuality && <span>{link.extractionQuality} extraction</span>}
                  <span>{statusLabels[link.status]}</span>
                </div>
                <div className="issue-row">
                  {link.debtScore >= 70 && <span className="issue-badge issue-high">High debt</span>}
                  {(link.confidence ?? 100) < 50 && <span className="issue-badge">Low confidence</span>}
                  {link.extractionQuality === "low" && <span className="issue-badge">Hard to read</span>}
                </div>
                <div className="inline-edit-grid">
                  <label>
                    Note
                    <input
                      defaultValue={link.note ?? ""}
                      onBlur={(event) => updateNote(link.id, event.target.value)}
                      placeholder="Why keep this?"
                    />
                  </label>
                  <label>
                    Tags
                    <input
                      defaultValue={link.tags.join(", ")}
                      onBlur={(event) => updateTags(link.id, event.target.value)}
                      placeholder="ai, tools"
                    />
                  </label>
                </div>
              </div>

              <div className="row-actions">
                <button className="ghost-button" onClick={() => chrome.tabs.create({ url: link.url })} type="button">
                  Open
                </button>
                <button className="ghost-button" onClick={() => setStatus(link.id, "done")} type="button">
                  Done
                </button>
                <button className="ghost-button" onClick={() => setStatus(link.id, "discarded")} type="button">
                  Discard
                </button>
                <button className="danger-button" onClick={() => removeLink(link.id)} type="button">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default Dashboard
