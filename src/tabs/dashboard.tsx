import { useEffect, useMemo, useState } from "react"

import "../styles.css"

import { clearDiscarded, deleteLink, getLinks, updateLink } from "../storage/links"
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

const statusLabels: Record<LinkStatus | "all", string> = {
  all: "All",
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
  const [filter, setFilter] = useState<LinkStatus | "all">("all")

  async function refreshLinks() {
    setLinks(await getLinks())
  }

  useEffect(() => {
    refreshLinks()
  }, [])

  const visibleLinks = useMemo(() => {
    if (filter === "all") return links
    return links.filter((link) => link.status === filter)
  }, [filter, links])

  const stats = useMemo(() => {
    return {
      total: links.length,
      highDebt: links.filter((link) => link.debtScore >= 70 && link.status !== "discarded").length,
      discarded: links.filter((link) => link.status === "discarded").length,
      thisWeek: links.filter((link) => link.status === "reading_this_week").length
    }
  }, [links])

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

      {visibleLinks.length === 0 ? (
        <section className="empty-state">No links here. Suspiciously peaceful.</section>
      ) : (
        <section className="link-list">
          {visibleLinks.map((link) => (
            <article className="link-row" key={link.id}>
              <div className="link-main">
                <h2>{link.title}</h2>
                <p>{hostFromUrl(link.url)}</p>
                <div className="tag-row">
                  <span>{link.type}</span>
                  <span>{link.readingTimeMinutes} min</span>
                  <span>{link.debtScore}/100 debt</span>
                  <span>{statusLabels[link.status]}</span>
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

