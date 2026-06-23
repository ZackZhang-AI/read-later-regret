import type { LinkType, PagePayload } from "../types/link"

import { estimateReadingTime } from "./reading-time"

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle))
}

export function classifyPage(page: PagePayload): LinkType {
  const url = page.url.toLowerCase()
  const title = page.title.toLowerCase()
  const text = page.text.toLowerCase()
  const combined = `${url} ${title} ${text}`
  const readingTime = estimateReadingTime(page.text)

  if (
    page.hasVideo ||
    includesAny(url, ["youtube.com", "youtu.be", "bilibili.com", "vimeo.com"]) ||
    includesAny(title, ["video", "watch"])
  ) {
    return "Video"
  }

  if (
    includesAny(url, ["shop.", "/shop", "/product", "/cart", "amazon.", "taobao.", "jd.com"]) ||
    includesAny(combined, ["buy now", "add to cart", "price", "checkout"])
  ) {
    return "Shopping"
  }

  if (
    includesAny(url, ["/docs", "documentation", "/api", "developer"]) ||
    includesAny(title, ["docs", "documentation", "api reference"])
  ) {
    return "Docs"
  }

  if (
    includesAny(url, ["arxiv.org", "doi.org", "pubmed", "scholar.google"]) ||
    includesAny(combined, ["abstract", "references", "citation"])
  ) {
    return "Paper"
  }

  if (
    includesAny(url, ["news.", "/news", "reuters.com", "apnews.com", "nytimes.com"]) ||
    includesAny(title, ["breaking", "latest", "today", "news"])
  ) {
    return "News"
  }

  if (
    includesAny(combined, [" tool", "generator", "converter", "template", "calculator"]) ||
    (page.interactiveElementCount ?? 0) > 20
  ) {
    return "Tool"
  }

  if (!page.text.trim()) {
    return "Unknown"
  }

  if (readingTime.minutes >= 8) {
    return "Long Article"
  }

  return "Short Article"
}
