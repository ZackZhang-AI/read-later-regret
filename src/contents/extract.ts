import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

function pickReadableRoot(): HTMLElement {
  return (
    document.querySelector<HTMLElement>("article") ??
    document.querySelector<HTMLElement>("main") ??
    document.querySelector<HTMLElement>("[role='main']") ??
    document.body
  )
}

function extractPageText(): string {
  const root = pickReadableRoot()
  const text = root?.innerText ?? ""

  return text.replace(/\s+/g, " ").trim()
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "READ_LATER_REGRET_EXTRACT") {
    return false
  }

  const interactiveElementCount = document.querySelectorAll(
    "button,input,select,textarea,a[href]"
  ).length

  sendResponse({
    url: location.href,
    title: document.title,
    text: extractPageText(),
    hasVideo: Boolean(document.querySelector("video")),
    interactiveElementCount
  })

  return true
})

