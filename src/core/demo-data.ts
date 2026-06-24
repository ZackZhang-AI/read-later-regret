import type { SavedLink } from "../types/link"

const now = "2026-06-24T00:00:00.000Z"

function reason(message: string) {
  return {
    reasonCode: "demo_reason",
    message,
    weight: 10
  }
}

export function createDemoLinks(): SavedLink[] {
  return [
    {
      id: crypto.randomUUID(),
      url: "https://example.com/complete-guide-to-ai-agents",
      title: "The Complete Guide to AI Agents",
      textSample: "A long guide about AI agents, orchestration, memory, and evaluation.",
      createdAt: now,
      updatedAt: now,
      readingTimeMinutes: 18,
      type: "Long Article",
      suggestedAction: "Save for Later",
      chosenAction: "Save for Later",
      status: "reading_this_week",
      debtScore: 88,
      reasons: [reason("Long guide-style content should be scheduled, not casually hoarded.")],
      tags: ["ai", "agents"],
      note: "Read this only if it helps the agent project.",
      extractionQuality: "high",
      confidence: 72
    },
    {
      id: crypto.randomUUID(),
      url: "https://tools.example.com/json-to-ts",
      title: "JSON to TypeScript Converter",
      textSample: "Paste JSON and generate TypeScript types.",
      createdAt: now,
      updatedAt: now,
      readingTimeMinutes: 1,
      type: "Tool",
      suggestedAction: "Add to Toolbox",
      chosenAction: "Add to Toolbox",
      status: "toolbox",
      debtScore: 8,
      reasons: [reason("Utility pages belong in the toolbox.")],
      tags: ["dev", "json"],
      note: "Use this when I need JSON converted into TypeScript types.",
      extractionQuality: "medium",
      confidence: 78
    },
    {
      id: crypto.randomUUID(),
      url: "https://arxiv.org/abs/2401.00001",
      title: "Evaluating Long-Horizon Agents",
      textSample: "Abstract references citation benchmark agent evaluation.",
      createdAt: now,
      updatedAt: now,
      readingTimeMinutes: 22,
      type: "Paper",
      suggestedAction: "Save for Later",
      chosenAction: "Save for Later",
      status: "summary_queue",
      debtScore: 92,
      reasons: [reason("Papers need a focused reading slot or a summary pass.")],
      tags: ["research"],
      note: "Summarize before deciding whether to read.",
      extractionQuality: "high",
      confidence: 90
    },
    {
      id: crypto.randomUUID(),
      url: "https://news.example.com/latest-ai-update",
      title: "Latest AI Funding News",
      textSample: "Today a company announced something newsworthy.",
      createdAt: now,
      updatedAt: now,
      readingTimeMinutes: 2,
      type: "News",
      suggestedAction: "Discard",
      chosenAction: "Discard",
      status: "discarded",
      debtScore: 0,
      reasons: [reason("Short-lived news can usually leave after the gist.")],
      tags: ["news"],
      extractionQuality: "medium",
      confidence: 82
    }
  ]
}

