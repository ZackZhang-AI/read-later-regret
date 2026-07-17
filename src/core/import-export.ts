import type { LinkAction, LinkStatus, LinkType, SavedLink } from "../types/link"

const LINK_TYPES: LinkType[] = [
  "Long Article",
  "Short Article",
  "Tool",
  "Docs",
  "Video",
  "Shopping",
  "News",
  "Paper",
  "Unknown"
]

const LINK_ACTIONS: LinkAction[] = [
  "Read Now",
  "Save for Later",
  "Summarize",
  "Turn into Task",
  "Add to Toolbox",
  "Discard"
]

const LINK_STATUSES: LinkStatus[] = [
  "inbox",
  "reading_this_week",
  "summary_queue",
  "task",
  "toolbox",
  "discarded",
  "done"
]

export interface ExportPayload {
  schemaVersion: 1
  exportedAt: string
  links: SavedLink[]
}

export type ImportResult =
  | {
      ok: true
      links: SavedLink[]
    }
  | {
      ok: false
      error: string
    }

export function createExportPayload(
  links: SavedLink[],
  exportedAt = new Date().toISOString()
): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      exportedAt,
      links
    } satisfies ExportPayload,
    null,
    2
  )
}

export function parseImportPayload(raw: string, existingLinks: SavedLink[]): ImportResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      ok: false,
      error: "Import file is not valid JSON."
    }
  }

  if (!isExportPayload(parsed)) {
    return {
      ok: false,
      error: "Import file does not look like a Read-Later Regret export."
    }
  }

  const mergedLinks = [...existingLinks]

  for (const importedLink of parsed.links) {
    const existingIndex = mergedLinks.findIndex((link) => link.url === importedLink.url)

    if (existingIndex >= 0) {
      const existing = mergedLinks[existingIndex]
      mergedLinks[existingIndex] = {
        ...existing,
        ...importedLink,
        id: existing.id,
        createdAt: existing.createdAt
      }
    } else {
      mergedLinks.unshift(importedLink)
    }
  }

  return {
    ok: true,
    links: mergedLinks
  }
}

function isExportPayload(value: unknown): value is ExportPayload {
  if (!value || typeof value !== "object") {
    return false
  }

  const payload = value as Partial<ExportPayload>

  return payload.schemaVersion === 1 && Array.isArray(payload.links) && payload.links.every(isSavedLink)
}

function isSavedLink(value: unknown): value is SavedLink {
  if (!value || typeof value !== "object") {
    return false
  }

  const link = value as Partial<SavedLink>

  return (
    typeof link.id === "string" &&
    typeof link.url === "string" &&
    typeof link.title === "string" &&
    typeof link.textSample === "string" &&
    typeof link.createdAt === "string" &&
    typeof link.updatedAt === "string" &&
    typeof link.readingTimeMinutes === "number" &&
    typeof link.debtScore === "number" &&
    Boolean(link.type && LINK_TYPES.includes(link.type)) &&
    Boolean(link.suggestedAction && LINK_ACTIONS.includes(link.suggestedAction)) &&
    Boolean(link.chosenAction && LINK_ACTIONS.includes(link.chosenAction)) &&
    Boolean(link.status && LINK_STATUSES.includes(link.status)) &&
    Array.isArray(link.reasons) &&
    Array.isArray(link.tags)
  )
}

