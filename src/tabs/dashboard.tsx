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
import { clearDiscarded, deleteLink, getLinks, replaceLinks, saveLink, updateLink } from "../storage/links"
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function refreshLinks() {
    setLinks(await getLinks())
  }

  useEffect(() => {
    refreshLinks()
  }, [])

  const visibleLinks = useMemo(() => {
    const probablyNotImportantLinks = getProbablyNotImportantLinks(links)
    const statusFilteredLinks =
      filter === "all"
        ? links
        : filter === "probably_not_important"
          ? probablyNotImportantLinks
          : links.filter((link) => link.status === filter)
    return sortLinks(filterLinks(statusFilteredLinks, query), sort)
  }, [filter, links, query, sort])

  const stats = useMemo(() => {
    return {
      total: links.length,
      highDebt: links.filter((link) => link.debtScore >= 70 && link.status !== "discarded").length,
      discarded: links.filter((link) => link.status === "discarded").length,
      thisWeek: links.filter((link) => link.status === "reading_this_week").length
    }
  }, [links])
  const weeklyStats = useMemo(() => getWeeklyCleanupStats(links), [links])

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
