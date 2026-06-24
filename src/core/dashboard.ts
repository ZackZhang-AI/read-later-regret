import type { LinkStatus, SavedLink } from "../types/link"

export type DashboardSort = "debt" | "created" | "readingTime"

export interface WeeklyCleanupStats {
  savedThisWeek: number
  highDebt: number
  suggestedDiscard: number
  worthReading: number
  probablyNotImportant: number
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export function filterLinks(links: SavedLink[], query: string): SavedLink[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return links
  }

  return links.filter((link) => {
    const haystack = [
      link.title,
      link.url,
      hostFromUrl(link.url),
      link.type,
      link.status,
      link.note ?? "",
      ...link.tags
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

export function sortLinks(links: SavedLink[], sort: DashboardSort): SavedLink[] {
  const sorted = [...links]

  if (sort === "debt") {
    return sorted.sort((a, b) => b.debtScore - a.debtScore)
  }

  if (sort === "readingTime") {
    return sorted.sort((a, b) => b.readingTimeMinutes - a.readingTimeMinutes)
  }

  return sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export function applyBatchStatus(
  links: SavedLink[],
  ids: string[],
  status: LinkStatus
): SavedLink[] {
  const selectedIds = new Set(ids)
  const now = new Date().toISOString()

  return links.map((link) =>
    selectedIds.has(link.id)
      ? {
          ...link,
          status,
          updatedAt: now
        }
      : link
  )
}

export function getWeeklyCleanupStats(
  links: SavedLink[],
  now: Date = new Date()
): WeeklyCleanupStats {
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)

  return {
    savedThisWeek: links.filter((link) => Date.parse(link.createdAt) >= weekStart.getTime()).length,
    highDebt: links.filter((link) => link.debtScore >= 70 && link.status !== "discarded").length,
    suggestedDiscard: links.filter((link) => link.suggestedAction === "Discard").length,
    worthReading: links.filter(
      (link) =>
        link.suggestedAction === "Save for Later" &&
        link.debtScore >= 50 &&
        link.status !== "discarded"
    ).length,
    probablyNotImportant: getProbablyNotImportantLinks(links, now).length
  }
}

export function getProbablyNotImportantLinks(
  links: SavedLink[],
  now: Date = new Date()
): SavedLink[] {
  const staleCutoff = new Date(now)
  staleCutoff.setDate(now.getDate() - 30)

  return links.filter(
    (link) =>
      Date.parse(link.createdAt) < staleCutoff.getTime() &&
      link.status !== "discarded" &&
      link.status !== "done"
  )
}
