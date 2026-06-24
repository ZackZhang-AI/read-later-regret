import type { PlasmoCSConfig } from "plasmo"

import { cleanReadableText, estimateExtractionQuality } from "../core/extraction"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const NOISY_SELECTOR = [
  "script",
  "style",
  "nav",
  "footer",
  "aside",
  "noscript",
  "[class*='comment']",
  "[id*='comment']",
  "[class*='advert']",
  "[id*='advert']",
  "[class*='sidebar']",
  "[id*='sidebar']",
  "[class*='related']",
  "[id*='related']"
].join(",")

interface RootCandidate {
  element: HTMLElement
  selectedRoot: string
}

function pickReadableRoot(): RootCandidate {
  const candidates: Array<[string, HTMLElement | null]> = [
    ["article", document.querySelector<HTMLElement>("article")],
    ["main", document.querySelector<HTMLElement>("main")],
    ["role-main", document.querySelector<HTMLElement>("[role='main']")]
  ]

  const bestCandidate = candidates.find(([, element]) => cleanElementText(element).length > 240)

  if (bestCandidate?.[1]) {
    return {
      element: bestCandidate[1],
      selectedRoot: bestCandidate[0]
    }
  }

  return {
    element: document.body,
    selectedRoot: "body"
  }
}

function cleanElementText(element: HTMLElement | null): string {
  if (!element) {
    return ""
  }

  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll(NOISY_SELECTOR).forEach((node) => node.remove())

  return cleanReadableText(clone.innerText ?? clone.textContent ?? "")
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "READ_LATER_REGRET_EXTRACT") {
    return false
  }

  const root = pickReadableRoot()
  const text = cleanElementText(root.element)
  const interactiveElementCount = document.querySelectorAll("button,input,select,textarea,a[href]").length
  const textLength = text.length

  sendResponse({
    url: location.href,
    title: document.title,
    text,
    hasVideo: Boolean(document.querySelector("video")),
    interactiveElementCount,
    extractionQuality: estimateExtractionQuality({
      selectedRoot: root.selectedRoot,
      textLength
    }),
    textLength,
    selectedRoot: root.selectedRoot
  })

  return true
})
