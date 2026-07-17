import type { LinkAction, LinkType, PagePayload, SavedLink } from "../types/link"

import { analyzePage } from "./analyze"
import { actionToStatus } from "./recommendation"
import type { PartialUserSettings } from "./settings"

export interface CreateSavedLinkOptions {
  note?: string
  tags?: string[]
  userCorrectedType?: LinkType
  settings?: PartialUserSettings
}

export function createSavedLink(
  page: PagePayload,
  chosenAction: LinkAction,
  options: CreateSavedLinkOptions = {}
): SavedLink {
  const analysis = analyzePage(page, {
    userCorrectedType: options.userCorrectedType,
    settings: options.settings
  })
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
    tags: options.tags ?? [],
    note: options.note,
    extractionQuality: page.extractionQuality,
    confidence: analysis.confidence,
    userCorrectedType: options.userCorrectedType
  }
}
