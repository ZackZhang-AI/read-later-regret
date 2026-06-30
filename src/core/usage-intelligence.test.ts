import { describe, expect, it } from "vitest"

import type { PagePayload, SavedLink } from "../types/link"

import {
  getDuplicateSaveWarning,
  getLinkUsageSignals,
  getUsageStats,
  type DuplicateSaveWarning
} from "./usage-intelligence"

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
  {
    ...baseLink,
    id: "opened-recently",
    url: "https://example.com/recent",
    title: "Recently opened",
    lastOpenedAt: "2026-06-29T00:00:00.000Z",
    debtScore: 20
  },
  {
    ...baseLink,
    id: "high-debt-never-opened",
    url: "https://research.example.com/ai-agent-guide",
    title: "Complete AI Agent Guide",
    createdAt: "2026-06-22T00:00:00.000Z",
    readingTimeMinutes: 18,
    type: "Long Article",
    debtScore: 92,
    tags: ["ai", "agents"]
  },
  {
    ...baseLink,
    id: "old-never-opened",
    url: "https://news.example.com/old-ai-agent-news",
    title: "Old AI Agent News",
    createdAt: "2026-05-01T00:00:00.000Z",
    type: "News",
    debtScore: 40,
    tags: ["ai"]
  },
  {
    ...baseLink,
    id: "done",
    url: "https://example.com/done",
    title: "Already done",
    status: "done",
    lastOpenedAt: "2026-06-28T00:00:00.000Z"
  }
]

describe("usage intelligence", () => {
  it("summarizes actual open behavior for the current week", () => {
    expect(getUsageStats(links, new Date("2026-06-30T00:00:00.000Z"))).toEqual({
      openedThisWeek: 2,
      neverOpened: 2,
      highDebtNeverOpened: 1,
      staleNeverOpened: 1,
      recentlyOpened: 2
    })
  })

  it("flags never-opened, recently opened, and stale links", () => {
    expect(getLinkUsageSignals(links[0], new Date("2026-06-30T00:00:00.000Z"))).toEqual({
      neverOpened: false,
      openedRecently: true,
      staleNeverOpened: false,
      highDebtNeverOpened: false
    })
    expect(getLinkUsageSignals(links[2], new Date("2026-06-30T00:00:00.000Z"))).toEqual({
      neverOpened: true,
      openedRecently: false,
      staleNeverOpened: true,
      highDebtNeverOpened: false
    })
  })

  it("warns before saving a page that resembles existing unresolved links", () => {
    const page: PagePayload = {
      url: "https://another.example.com/agent-memory",
      title: "AI Agent Memory Guide",
      text: "A short article about agent memory and evaluation."
    }

    const warning: DuplicateSaveWarning | null = getDuplicateSaveWarning(page, links, "Long Article")

    expect(warning).toMatchObject({
      count: 2,
      matchingIds: ["high-debt-never-opened", "old-never-opened"],
      topicLabel: "AI Agents"
    })
    expect(warning?.message).toContain("already saved 2 AI Agents links")
  })

  it("does not warn just because unrelated pages are both unknown topics", () => {
    const page: PagePayload = {
      url: "https://fresh.example.com/quiet-reading",
      title: "Quiet Reading Habit",
      text: "A reflective essay about attention."
    }
    const unrelatedLinks: SavedLink[] = [
      {
        ...baseLink,
        id: "cooking",
        url: "https://cooking.example.com/soup",
        title: "Soup Notes"
      },
      {
        ...baseLink,
        id: "travel",
        url: "https://travel.example.com/weekend",
        title: "Weekend Map"
      }
    ]

    expect(getDuplicateSaveWarning(page, unrelatedLinks, "Short Article")).toBeNull()
  })
})
