import { describe, expect, it } from "vitest"

import type { SavedLink } from "../types/link"

import {
  applyReviewDecision,
  createReviewSummary,
  getReviewQueue,
  type ReviewDecision
} from "./review"

const baseLink: SavedLink = {
  id: "base",
  url: "https://example.com/base",
  title: "Base",
  textSample: "sample",
  createdAt: "2026-06-20T00:00:00.000Z",
  updatedAt: "2026-06-20T00:00:00.000Z",
  readingTimeMinutes: 3,
  type: "Short Article",
  suggestedAction: "Read Now",
  chosenAction: "Read Now",
  status: "inbox",
  debtScore: 10,
  reasons: [],
  tags: []
}

const links: SavedLink[] = [
  baseLink,
  {
    ...baseLink,
    id: "high-debt",
    title: "High debt guide",
    createdAt: "2026-06-20T00:00:00.000Z",
    readingTimeMinutes: 18,
    debtScore: 92,
    suggestedAction: "Save for Later",
    status: "reading_this_week"
  },
  {
    ...baseLink,
    id: "old-link",
    title: "Old unresolved link",
    createdAt: "2026-04-01T00:00:00.000Z",
    debtScore: 35,
    suggestedAction: "Discard"
  },
  {
    ...baseLink,
    id: "done",
    title: "Already done",
    status: "done",
    debtScore: 99
  },
  {
    ...baseLink,
    id: "discarded",
    title: "Already discarded",
    status: "discarded",
    debtScore: 99
  }
]

describe("review mode helpers", () => {
  it("builds a review queue from unresolved links, prioritizing high debt then stale links", () => {
    expect(
      getReviewQueue(links, new Date("2026-06-29T00:00:00.000Z")).map((link) => link.id)
    ).toEqual(["high-debt", "old-link", "base"])
  })

  it("removes links already handled in the current review session", () => {
    expect(
      getReviewQueue(links, new Date("2026-06-29T00:00:00.000Z"), {}, ["high-debt"]).map(
        (link) => link.id
      )
    ).toEqual(["old-link", "base"])
  })

  it("maps review decisions to link statuses and notes", () => {
    const decisions: Array<[ReviewDecision, string]> = [
      ["keep", "reading_this_week"],
      ["summarize", "summary_queue"],
      ["task", "task"],
      ["discard", "discarded"],
      ["later", "inbox"]
    ]

    for (const [decision, status] of decisions) {
      expect(applyReviewDecision(baseLink, decision, "2026-06-29T00:00:00.000Z")).toMatchObject({
        status,
        updatedAt: "2026-06-29T00:00:00.000Z"
      })
    }
  })

  it("summarizes review session impact", () => {
    const summary = createReviewSummary([
      { linkId: "a", decision: "discard", previousDebtScore: 90 },
      { linkId: "b", decision: "summarize", previousDebtScore: 40 },
      { linkId: "c", decision: "task", previousDebtScore: 60 },
      { linkId: "d", decision: "keep", previousDebtScore: 30 }
    ])

    expect(summary).toEqual({
      reviewed: 4,
      discarded: 1,
      summarized: 1,
      tasked: 1,
      kept: 1,
      postponed: 0,
      debtReduced: 90
    })
  })
})
