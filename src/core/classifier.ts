import type { AnalysisReason, LinkType, PagePayload } from "../types/link"

import { estimateReadingTime } from "./reading-time"
import { sanitizeSettings, type PartialUserSettings } from "./settings"

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle))
}

export interface ClassificationResult {
  type: LinkType
  confidence: number
  reasons: AnalysisReason[]
}

function reason(reasonCode: string, message: string, weight: number): AnalysisReason {
  return {
    reasonCode,
    message,
    weight
  }
}

function result(type: LinkType, confidence: number, reasons: AnalysisReason[]): ClassificationResult {
  return {
    type,
    confidence: Math.max(0, Math.min(100, confidence)),
    reasons
  }
}

export function classifyPage(
  page: PagePayload,
  settings: PartialUserSettings = {}
): ClassificationResult {
  const classificationSettings = sanitizeSettings(settings)
  const url = page.url.toLowerCase()
  const title = page.title.toLowerCase()
  const text = page.text.toLowerCase()
  const combined = `${url} ${title} ${text}`
  const readingTime = estimateReadingTime(page.text, classificationSettings)

  if (
    page.hasVideo ||
    includesAny(url, ["youtube.com", "youtu.be", "bilibili.com", "vimeo.com"]) ||
    includesAny(title, ["video", "watch"])
  ) {
    return result("Video", 94, [reason("video_signal", "Video platform or player detected.", 40)])
  }

  if (
    includesAny(url, ["shop.", "/shop", "/product", "/cart", "amazon.", "taobao.", "jd.com"]) ||
    includesAny(combined, ["buy now", "add to cart", "price", "checkout"])
  ) {
    return result("Shopping", 88, [
      reason("shopping_signal", "Shopping or checkout signals are present.", 36)
    ])
  }

  if (
    includesAny(url, ["/docs", "documentation", "/api", "developer"]) ||
    includesAny(title, ["docs", "documentation", "api reference"])
  ) {
    return result("Docs", 86, [
      reason("docs_signal", "Documentation or API-reference language is present.", 34)
    ])
  }

  if (
    includesAny(url, ["arxiv.org", "doi.org", "pubmed", "scholar.google"]) ||
    includesAny(combined, ["abstract", "references", "citation"])
  ) {
    return result("Paper", 90, [
      reason("paper_signal", "Academic paper signals such as abstract or references were found.", 38)
    ])
  }

  if (
    includesAny(url, ["news.", "/news", "reuters.com", "apnews.com", "nytimes.com", "bbc.com"]) ||
    includesAny(title, ["breaking", "latest", "today", "news", "just in"])
  ) {
    return result("News", 82, [
      reason("news_signal", "Timely news wording or news-site URL patterns are present.", 32)
    ])
  }

  if (
    includesAny(combined, [" tool", "generator", "converter", "template", "calculator"]) ||
    ((page.interactiveElementCount ?? 0) > 30 &&
      includesAny(combined, ["paste", "upload", "download", "input", "output"]))
  ) {
    return result("Tool", 78, [
      reason("tool_signal", "Utility wording suggests this belongs in a resource shelf.", 30)
    ])
  }

  if (!page.text.trim()) {
    return result("Unknown", 20, [reason("empty_text", "There was not enough readable text.", 10)])
  }

  if (readingTime.minutes >= classificationSettings.longArticleMinutes) {
    return result("Long Article", 72, [
      reason("long_reading_time", "Reading time is long enough to require scheduling.", 28)
    ])
  }

  return result("Short Article", 64, [
    reason("short_reading_time", "Reading time is short enough for quick handling.", 22)
  ])
}
