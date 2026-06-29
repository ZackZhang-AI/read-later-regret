import type { LinkStatus, SavedLink } from "../types/link"

import { getProbablyNotImportantLinks } from "./dashboard"
import type { PartialUserSettings } from "./settings"

export type ReviewDecision = "keep" | "summarize" | "task" | "discard" | "later"

export interface ReviewEvent {
  linkId: string
  decision: ReviewDecision
  previousDebtScore: number
}

export interface ReviewSummary {
  reviewed: number
  discarded: number
  summarized: number
  tasked: number
  kept: number
  postponed: number
  debtReduced: number
}

const decisionStatuses: Record<ReviewDecision, LinkStatus> = {
  keep: "reading_this_week",
  summarize: "summary_queue",
  task: "task",
  discard: "discarded",
  later: "inbox"
}

export function getReviewQueue(
  links: SavedLink[],
  now: Date = new Date(),
  settings: PartialUserSettings = {},
  reviewedLinkIds: string[] = []
): SavedLink[] {
  const staleIds = new Set(
    getProbablyNotImportantLinks(links, now, settings).map((link) => link.id)
  )
  const reviewedIds = new Set(reviewedLinkIds)

  return links
    .filter((link) => link.status !== "done" && link.status !== "discarded" && !reviewedIds.has(link.id))
    .sort((a, b) => {
      const debtDelta = b.debtScore - a.debtScore
      if (debtDelta !== 0) return debtDelta

      const staleDelta = Number(staleIds.has(b.id)) - Number(staleIds.has(a.id))
      if (staleDelta !== 0) return staleDelta

      return Date.parse(a.createdAt) - Date.parse(b.createdAt)
    })
}

export function applyReviewDecision(
  link: SavedLink,
  decision: ReviewDecision,
  updatedAt = new Date().toISOString()
): SavedLink {
  return {
    ...link,
    status: decisionStatuses[decision],
    updatedAt
  }
}

export function createReviewSummary(events: ReviewEvent[]): ReviewSummary {
  return {
    reviewed: events.length,
    discarded: events.filter((event) => event.decision === "discard").length,
    summarized: events.filter((event) => event.decision === "summarize").length,
    tasked: events.filter((event) => event.decision === "task").length,
    kept: events.filter((event) => event.decision === "keep").length,
    postponed: events.filter((event) => event.decision === "later").length,
    debtReduced: events
      .filter((event) => event.decision === "discard")
      .reduce((total, event) => total + event.previousDebtScore, 0)
  }
}
