import { describe, expect, it } from "vitest"

import { analyzePage } from "./analyze"
import { classifyPage } from "./classifier"
import { scoreInformationDebt } from "./debt-score"
import { actionToStatus, recommendAction } from "./recommendation"

describe("analyzePage", () => {
  it("classifies long articles and recommends saving for later", () => {
    const result = analyzePage({
      url: "https://example.com/complete-guide-to-agents",
      title: "The Complete Guide to AI Agents",
      text: Array.from({ length: 2200 }, (_, index) => `word${index}`).join(" ")
    })

    expect(result.type).toBe("Long Article")
    expect(result.readingTimeMinutes).toBe(10)
    expect(result.suggestedAction).toBe("Save for Later")
    expect(result.debtScore).toBeGreaterThanOrEqual(60)
  })

  it("classifies quick articles and recommends reading now", () => {
    const result = analyzePage({
      url: "https://example.com/post",
      title: "A tiny update",
      text: Array.from({ length: 220 }, (_, index) => `word${index}`).join(" ")
    })

    expect(result.type).toBe("Short Article")
    expect(result.suggestedAction).toBe("Read Now")
  })

  it("classifies tools and sends them to the toolbox", () => {
    const result = analyzePage({
      url: "https://example.com/json-converter",
      title: "JSON Converter Tool",
      text: "Paste JSON here and convert it into TypeScript types."
    })

    expect(result.type).toBe("Tool")
    expect(result.suggestedAction).toBe("Add to Toolbox")
  })

  it("classifies video, shopping, docs, paper, and news pages", () => {
    expect(
      analyzePage({
        url: "https://www.youtube.com/watch?v=abc",
        title: "Demo",
        text: "Video page"
      }).type
    ).toBe("Video")

    expect(
      analyzePage({
        url: "https://shop.example.com/product/desk",
        title: "Buy Standing Desk",
        text: "Price and cart"
      }).type
    ).toBe("Shopping")

    expect(
      analyzePage({
        url: "https://example.com/docs/api",
        title: "API Reference",
        text: "Developer documentation"
      }).type
    ).toBe("Docs")

    expect(
      analyzePage({
        url: "https://arxiv.org/abs/1234.5678",
        title: "A Research Paper",
        text: "Abstract references citation"
      }).type
    ).toBe("Paper")

    expect(
      analyzePage({
        url: "https://news.example.com/latest",
        title: "Breaking latest market news",
        text: "Today something happened."
      }).type
    ).toBe("News")
  })
})

describe("recommendAction", () => {
  it("maps recommendations to dashboard statuses", () => {
    expect(actionToStatus("Read Now")).toBe("inbox")
    expect(actionToStatus("Save for Later")).toBe("reading_this_week")
    expect(actionToStatus("Summarize")).toBe("summary_queue")
    expect(actionToStatus("Turn into Task")).toBe("task")
    expect(actionToStatus("Add to Toolbox")).toBe("toolbox")
    expect(actionToStatus("Discard")).toBe("discarded")
  })

  it("recommends discard for shopping pages", () => {
    expect(recommendAction({ type: "Shopping", readingTimeMinutes: 2, title: "Buy now" }).action).toBe(
      "Discard"
    )
  })
})

describe("classifyPage", () => {
  it("returns stronger confidence for high-signal pages than unknown pages", () => {
    const video = classifyPage({
      url: "https://www.youtube.com/watch?v=abc",
      title: "Watch this",
      text: "Video"
    })
    const unknown = classifyPage({
      url: "https://example.com/blank",
      title: "",
      text: ""
    })

    expect(video.confidence).toBeGreaterThan(unknown.confidence)
    expect(video.reasons[0]).toMatchObject({
      reasonCode: "video_signal",
      weight: 40
    })
  })
})

describe("scoreInformationDebt", () => {
  it("returns zero for discarded links", () => {
    expect(
      scoreInformationDebt({
        type: "Long Article",
        readingTimeMinutes: 20,
        title: "Complete Guide",
        existingSameTypeOpenCount: 10,
        ageDays: 40,
        chosenAction: "Discard"
      }).score
    ).toBe(0)
  })

  it("increases score for long, old, repetitive guide content", () => {
    const result = scoreInformationDebt({
      type: "Long Article",
      readingTimeMinutes: 18,
      title: "Ultimate Complete Guide",
      existingSameTypeOpenCount: 8,
      ageDays: 31
    })

    expect(result.score).toBe(100)
    expect(result.reasons.length).toBeGreaterThan(3)
  })
})
