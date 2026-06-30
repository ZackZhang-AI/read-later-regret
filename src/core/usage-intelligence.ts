import type { LinkType, PagePayload, SavedLink } from "../types/link"

export interface UsageStats {
  openedThisWeek: number
  neverOpened: number
  highDebtNeverOpened: number
  staleNeverOpened: number
  recentlyOpened: number
}

export interface LinkUsageSignals {
  neverOpened: boolean
  openedRecently: boolean
  staleNeverOpened: boolean
  highDebtNeverOpened: boolean
}

export interface DuplicateSaveWarning {
  count: number
  matchingIds: string[]
  topicLabel: string
  message: string
}

const recentOpenDays = 7
const staleUnopenedDays = 30

const topicRules: Array<{
  label: string
  patterns: RegExp[]
}> = [
  {
    label: "AI Agents",
    patterns: [/\bai\b/i, /\bagents?\b/i, /llm/i]
  },
  {
    label: "Job Search",
    patterns: [/job/i, /internship/i, /resume/i, /portfolio/i, /interview/i]
  },
  {
    label: "Tools",
    patterns: [/tool/i, /converter/i, /generator/i, /template/i, /calculator/i]
  }
]

export function getUsageStats(links: SavedLink[], now: Date = new Date()): UsageStats {
  const signals = links.map((link) => getLinkUsageSignals(link, now))

  return {
    openedThisWeek: signals.filter((signal) => signal.openedRecently).length,
    neverOpened: signals.filter((signal) => signal.neverOpened).length,
    highDebtNeverOpened: signals.filter((signal) => signal.highDebtNeverOpened).length,
    staleNeverOpened: signals.filter((signal) => signal.staleNeverOpened).length,
    recentlyOpened: signals.filter((signal) => signal.openedRecently).length
  }
}

export function getLinkUsageSignals(link: SavedLink, now: Date = new Date()): LinkUsageSignals {
  const resolved = link.status === "done" || link.status === "discarded"
  const neverOpened = !link.lastOpenedAt && !resolved
  const openedRecently = Boolean(
    link.lastOpenedAt && daysBetween(new Date(link.lastOpenedAt), now) <= recentOpenDays
  )
  const staleNeverOpened = neverOpened && daysBetween(new Date(link.createdAt), now) > staleUnopenedDays
  const highDebtNeverOpened = neverOpened && link.debtScore >= 70

  return {
    neverOpened,
    openedRecently,
    staleNeverOpened,
    highDebtNeverOpened
  }
}

export function getDuplicateSaveWarning(
  page: PagePayload,
  links: SavedLink[],
  pageType: LinkType
): DuplicateSaveWarning | null {
  const pageTopic = inferTopicLabel([page.title, page.url, page.text, pageType].join(" "))
  const matchingLinks = links.filter((link) => {
    if (link.status === "done" || link.status === "discarded") return false
    if (link.url === page.url) return true

    const linkTopic = inferTopicLabel([link.title, link.url, link.type, link.note ?? "", ...link.tags].join(" "))
    const sameKnownTopic = pageTopic !== "similar" && pageTopic === linkTopic
    const sameHost = hostFromUrl(link.url) === hostFromUrl(page.url)

    return sameKnownTopic || sameHost
  })

  if (matchingLinks.length < 2) {
    return null
  }

  return {
    count: matchingLinks.length,
    matchingIds: matchingLinks.map((link) => link.id),
    topicLabel: pageTopic,
    message: `You already saved ${matchingLinks.length} ${pageTopic} links. Maybe this one should fight for its place.`
  }
}

function inferTopicLabel(value: string): string {
  for (const rule of topicRules) {
    if (rule.patterns.some((pattern) => pattern.test(value))) {
      return rule.label
    }
  }

  return "similar"
}

function daysBetween(earlier: Date, later: Date): number {
  return (later.getTime() - earlier.getTime()) / 86_400_000
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
