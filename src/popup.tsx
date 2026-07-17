import { useEffect, useMemo, useState } from "react"

import "./styles.css"

import { analyzePage } from "./core/analyze"
import { createSavedLink } from "./core/create-link"
import { DEFAULT_SETTINGS, type UserSettings } from "./core/settings"
import { getDuplicateSaveWarning, type DuplicateSaveWarning } from "./core/usage-intelligence"
import { deleteLink, getLinks, saveLink } from "./storage/links"
import { getSettings } from "./storage/settings"
import type { AnalysisResult, LinkAction, LinkType, PagePayload } from "./types/link"

const actions: LinkAction[] = [
  "Read Now",
  "Save for Later",
  "Summarize",
  "Turn into Task",
  "Add to Toolbox",
  "Discard"
]

const linkTypes: LinkType[] = [
  "Long Article",
  "Short Article",
  "Tool",
  "Docs",
  "Video",
  "Shopping",
  "News",
  "Paper",
  "Unknown"
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
  const [correctedType, setCorrectedType] = useState<LinkType | "">("")
  const [note, setNote] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [savedLinkId, setSavedLinkId] = useState("")
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateSaveWarning | null>(null)

  useEffect(() => {
    Promise.all([extractCurrentPage(), getSettings(), getLinks()])
      .then(([page, storedSettings, storedLinks]) => {
        setSettings(storedSettings)
        setState({ status: "ready", page })
        setDuplicateWarning(getDuplicateSaveWarning(page, storedLinks, "Unknown"))
      })
      .catch(() =>
        setState({
          status: "error",
          message: "Could not read this page. Some pages keep their secrets."
        })
      )
  }, [])

  const analysis: AnalysisResult | null = useMemo(() => {
    if (state.status !== "ready") return null
    return analyzePage(state.page, {
      userCorrectedType: correctedType || undefined,
      settings
    })
  }, [correctedType, settings, state])

  useEffect(() => {
    if (!analysis || state.status !== "ready") return

    getLinks().then((storedLinks) => {
      setDuplicateWarning(getDuplicateSaveWarning(state.page, storedLinks, analysis.type))
    })
  }, [analysis, state])

  useEffect(() => {
    if (!analysis || note) return

    if (analysis.type === "Tool") {
      setNote(`Use this when I need ${state.status === "ready" ? state.page.title : "this tool"}.`)
    }
  }, [analysis, note, state])

  async function handleAction(action: LinkAction) {
    if (state.status !== "ready") return

    setSavingAction(action)
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
    const link = createSavedLink(state.page, action, {
      note: note.trim() || undefined,
      tags,
      userCorrectedType: correctedType || undefined,
      settings
    })
    const savedLink = await saveLink(link)
    setSavedLinkId(savedLink.id)
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

  async function undoSave() {
    if (!savedLinkId) return

    await deleteLink(savedLinkId)
    setSavedLinkId("")
    setNotice("Undone. The future has one fewer obligation.")
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
              <span>Confidence</span>
              <strong>{analysis.confidence}%</strong>
            </div>
            <div>
              <span>Debt score</span>
              <strong>
                {analysis.debtScore}/100 <small>{scoreLabel(analysis.debtScore)}</small>
              </strong>
            </div>
          </div>

          {state.page.extractionQuality === "low" && (
            <p className="warning-box">This page was hard to read. The judgment may be fuzzy.</p>
          )}

          <div className="decision-banner">
            <span>Suggested</span>
            <strong>{analysis.suggestedAction}</strong>
            <small>{analysis.reasons[0]?.message}</small>
          </div>

          {duplicateWarning && (
            <p className="warning-box">{duplicateWarning.message}</p>
          )}

          <label className="field-label">
            Correct type if needed
            <select
              value={correctedType || analysis.type}
              onChange={(event) => setCorrectedType(event.target.value as LinkType)}>
              {linkTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Use note
            <textarea
              onChange={(event) => setNote(event.target.value)}
              placeholder="One sentence about why this link matters"
              rows={2}
              value={note}
            />
          </label>

          <label className="field-label">
            Tags
            <input
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="ai, tools, research"
              value={tagsInput}
            />
          </label>

          <ul className="reason-list">
            {analysis.reasons.slice(0, 4).map((reason) => (
              <li key={reason.reasonCode}>{reason.message}</li>
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

          {notice && (
            <div className="post-save-panel">
              <p className="notice">{notice}</p>
              {savedLinkId && (
                <div className="post-save-actions">
                  <button className="primary-button" onClick={openDashboard} type="button">
                    Open dashboard
                  </button>
                  <button className="ghost-button" onClick={undoSave} type="button">
                    Undo
                  </button>
                  <button className="ghost-button" onClick={() => setNotice("")} type="button">
                    Keep browsing
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default App
