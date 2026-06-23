import type { LinkAction, PagePayload, SavedLink } from "../types/link"

import { analyzePage } from "./analyze"
import { actionToStatus } from "./recommendation"

export function createSavedLink(page: PagePayload, chosenAction: LinkAction): SavedLink {
  const analysis = analyzePage(page)
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    url: page.url,
    title: page.title || page.url,
    textSample: page.text.trim().slice(0, 500),
    createdAt: now,
    updatedAt: now,
    readingTimeMinutes: analysis.readingTimeMinutes,
    type: analysis.type,
    suggestedAction: analysis.suggestedAction,
    chosenAction,
    status: actionToStatus(chosenAction),
    debtScore: chosenAction === "Discard" ? 0 : analysis.debtScore,
    reasons: analysis.reasons,
    tags: []
  }
}

