import { describe, expect, it } from "vitest"

import type { SavedLink } from "../types/link"

import { getTopicClusters } from "./topics"

const baseLink: SavedLink = {
  id: "base",
  url: "https://example.com/base",
  title: "Base",
  textSample: "sample",
  createdAt: "2026-06-20T00:00:00.000Z",
  updatedAt: "2026-06-20T00:00:00.000Z",
  readingTimeMinutes: 5,
  type: "Long Article",
  suggestedAction: "Save for Later",
  chosenAction: "Save for Later",
  status: "reading_this_week",
  debtScore: 50,
  reasons: [],
  tags: []
}

const links: SavedLink[] = [
  {
    ...baseLink,
    id: "agent-guide",
    title: "Complete Guide to AI Agents",
    url: "https://research.example.com/agents-guide",
    debtScore: 95,
    tags: ["ai", "agents"]
  },
  {
    ...baseLink,
    id: "agent-patterns",
    title: "AI Agents Design Patterns",
    url: "https://research.example.com/agent-patterns",
    debtScore: 80,
    tags: ["ai", "agents"]
  },
  {
    ...baseLink,
    id: "agent-news",
    title: "Latest AI Agent News",
    url: "https://news.example.com/agent-news",
    debtScore: 35,
    tags: ["ai"]
  },
  {
    ...baseLink,
    id: "portfolio",
    title: "Internship Portfolio Advice",
    url: "https://jobs.example.com/portfolio",
    tags: ["job search"],
    debtScore: 65
  },
  {
    ...baseLink,
    id: "interview",
    title: "Frontend Interview Practice",
    url: "https://jobs.example.com/interview",
    tags: ["job search"],
    debtScore: 45
  },
  {
    ...baseLink,
    id: "discarded",
    title: "Discarded AI Agents Link",
    status: "discarded",
    tags: ["ai", "agents"],
    debtScore: 100
  }
]

describe("topic clusters", () => {
  it("groups unresolved links by local topic signals", () => {
    const clusters = getTopicClusters(links)

    expect(clusters.map((cluster) => cluster.label)).toContain("AI Agents")
    expect(clusters.map((cluster) => cluster.label)).toContain("Job Search")
    expect(clusters.find((cluster) => cluster.label === "AI Agents")?.links.map((link) => link.id)).toEqual([
      "agent-guide",
      "agent-patterns",
      "agent-news"
    ])
  })

  it("recommends one or two links to read and routes the rest", () => {
    const aiCluster = getTopicClusters(links).find((cluster) => cluster.label === "AI Agents")

    expect(aiCluster).toMatchObject({
      suggestedReadIds: ["agent-guide", "agent-patterns"],
      suggestedSummaryIds: [],
      suggestedDiscardIds: ["agent-news"]
    })
    expect(aiCluster?.recommendation).toBe("Read 2, discard 1.")
  })
})
