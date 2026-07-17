import { describe, expect, it } from "vitest"

import type { SavedLink } from "../types/link"

import {
  applyBatchStatus,
  filterLinks,
  getProbablyNotImportantLinks,
  getWeeklyCleanupStats,
  sortLinks
} from "./dashboard"

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
    id: "article",
    url: "https://writing.example.com/guide",
    title: "Long AI Agent Guide",
    type: "Long Article",
    readingTimeMinutes: 18,
    debtScore: 88,
    tags: ["ai", "agents"],
    suggestedAction: "Save for Later"
  },
  {
    ...baseLink,
    id: "tool",
    url: "https://tools.example.com/json",
    title: "JSON Converter",
    type: "Tool",
    status: "toolbox",
    debtScore: 8,
    tags: ["dev"]
  },
  {
    ...baseLink,
    id: "old-news",
    url: "https://news.example.com/latest",
    title: "Latest market news",
    type: "News",
    createdAt: "2026-05-01T00:00:00.000Z",
    debtScore: 55,
    suggestedAction: "Discard"
  }
]

describe("dashboard helpers", () => {
  it("filters by title, url host, type, and tags", () => {
    expect(filterLinks(links, "agent").map((link) => link.id)).toEqual(["article"])
    expect(filterLinks(links, "tools.example").map((link) => link.id)).toEqual(["tool"])
    expect(filterLinks(links, "tool").map((link) => link.id)).toEqual(["tool"])
    expect(filterLinks(links, "dev").map((link) => link.id)).toEqual(["tool"])
  })

  it("sorts links by debt, created date, and reading time", () => {
    expect(sortLinks(links, "debt").map((link) => link.id)).toEqual(["article", "old-news", "tool"])
    expect(sortLinks(links, "created").map((link) => link.id)).toEqual(["article", "tool", "old-news"])
    expect(sortLinks(links, "readingTime").map((link) => link.id)).toEqual(["article", "tool", "old-news"])
  })

  it("applies batch status updates without mutating untouched links", () => {
    const updated = applyBatchStatus(links, ["article", "tool"], "discarded")

    expect(updated.find((link) => link.id === "article")?.status).toBe("discarded")
    expect(updated.find((link) => link.id === "tool")?.status).toBe("discarded")
    expect(updated.find((link) => link.id === "old-news")?.status).toBe("inbox")
  })

  it("calculates weekly cleanup stats", () => {
    const stats = getWeeklyCleanupStats(links, new Date("2026-06-24T00:00:00.000Z"))

    expect(stats.savedThisWeek).toBe(2)
    expect(stats.highDebt).toBe(1)
    expect(stats.suggestedDiscard).toBe(1)
    expect(stats.worthReading).toBe(1)
    expect(stats.probablyNotImportant).toBe(1)
  })

  it("finds old unresolved links that are probably not important", () => {
    expect(
      getProbablyNotImportantLinks(links, new Date("2026-06-24T00:00:00.000Z")).map(
        (link) => link.id
      )
    ).toEqual(["old-news"])
  })

  it("uses custom stale-day settings for probably-not-important links", () => {
    expect(
      getProbablyNotImportantLinks(links, new Date("2026-06-24T00:00:00.000Z"), {
        staleLinkDays: 10
      }).map((link) => link.id)
    ).toEqual(["old-news"])
  })
})
