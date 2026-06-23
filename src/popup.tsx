import { useEffect, useMemo, useState } from "react"

import "./styles.css"

import { analyzePage } from "./core/analyze"
import { createSavedLink } from "./core/create-link"
import { saveLink } from "./storage/links"
import type { AnalysisResult, LinkAction, PagePayload } from "./types/link"

const actions: LinkAction[] = [
  "Read Now",
  "Save for Later",
  "Summarize",
  "Turn into Task",
  "Add to Toolbox",
  "Discard"
]

type LoadState =
  | { status: "loading" }
  | { status: "ready"; page: PagePayload }
  | { status: "error"; message: string }

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

async function extractCurrentPage(): Promise<PagePayload> {
  const tab = await getActiveTab()

  if (!tab?.id || !tab.url || tab.url.startsWith("chrome://")) {
    throw new Error("This page cannot be read by the extension.")
  }

  return chrome.tabs.sendMessage(tab.id, { type: "READ_LATER_REGRET_EXTRACT" })
}

function scoreLabel(score: number): string {
  if (score >= 70) return "High debt"
  if (score >= 35) return "Manageable"
  return "Low debt"
}

function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [savingAction, setSavingAction] = useState<LinkAction | null>(null)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    extractCurrentPage()
      .then((page) => setState({ status: "ready", page }))
      .catch(() =>
        setState({
          status: "error",
          message: "Could not read this page. Some pages keep their secrets."
        })
      )
  }, [])

  const analysis: AnalysisResult | null = useMemo(() => {
    if (state.status !== "ready") return null
    return analyzePage(state.page)
  }, [state])

  async function handleAction(action: LinkAction) {
    if (state.status !== "ready") return

    setSavingAction(action)
    const link = createSavedLink(state.page, action)
    await saveLink(link)
    setSavingAction(null)

    if (action === "Discard") {
      setNotice("Discarded. Tiny act of freedom.")
    } else if (action === "Add to Toolbox") {
      setNotice("Added to toolbox. Useful things deserve a shelf.")
    } else {
      setNotice("Saved. Future you has been warned.")
    }
  }

  function openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL("tabs/dashboard.html") })
  }

  return (
    <main className="popup-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Read-Later Regret</p>
          <h1>Should I save this?</h1>
        </div>
        <button className="ghost-button" type="button" onClick={openDashboard}>
          Dashboard
        </button>
      </header>

      {state.status === "loading" && <p className="muted">Reading the room...</p>}

      {state.status === "error" && <p className="error-box">{state.message}</p>}

      {state.status === "ready" && analysis && (
        <section className="analysis-card">
          <h2>{state.page.title || "Untitled page"}</h2>
          <p className="url-line">{state.page.url}</p>

          <div className="metric-grid">
            <div>
              <span>Type</span>
              <strong>{analysis.type}</strong>
            </div>
            <div>
              <span>Reading time</span>
              <strong>{analysis.readingTimeMinutes} min</strong>
            </div>
            <div>
              <span>Debt score</span>
              <strong>
                {analysis.debtScore}/100 <small>{scoreLabel(analysis.debtScore)}</small>
              </strong>
            </div>
          </div>

          <div className="recommendation">
            <span>Suggested</span>
            <strong>{analysis.suggestedAction}</strong>
          </div>

          <ul className="reason-list">
            {analysis.reasons.slice(0, 4).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>

          <div className="action-grid">
            {actions.map((action) => (
              <button
                className={action === analysis.suggestedAction ? "primary-button" : "secondary-button"}
                disabled={savingAction !== null}
                key={action}
                onClick={() => handleAction(action)}
                type="button">
                {savingAction === action ? "Saving..." : action}
              </button>
            ))}
          </div>

          {notice && <p className="notice">{notice}</p>}
        </section>
      )}
    </main>
  )
}

export default App

