import type { SavedLink } from "../types/link"

export interface TopicCluster {
  id: string
  label: string
  links: SavedLink[]
  suggestedReadIds: string[]
  suggestedSummaryIds: string[]
  suggestedDiscardIds: string[]
  recommendation: string
}

const topicRules: Array<{
  id: string
  label: string
  patterns: RegExp[]
}> = [
  {
    id: "ai-agents",
    label: "AI Agents",
    patterns: [/\bai\b/i, /\bagents?\b/i, /llm/i]
  },
  {
    id: "job-search",
    label: "Job Search",
    patterns: [/job/i, /internship/i, /resume/i, /portfolio/i, /interview/i]
  },
  {
    id: "tools",
    label: "Tools",
    patterns: [/tool/i, /converter/i, /generator/i, /template/i, /calculator/i]
  }
]

export function getTopicClusters(links: SavedLink[]): TopicCluster[] {
  const unresolvedLinks = links.filter((link) => link.status !== "done" && link.status !== "discarded")
  const groupedLinks = new Map<string, { label: string; links: SavedLink[] }>()

  for (const link of unresolvedLinks) {
    const topic = inferTopic(link)
    const existing = groupedLinks.get(topic.id)

    if (existing) {
      existing.links.push(link)
    } else {
      groupedLinks.set(topic.id, {
        label: topic.label,
        links: [link]
      })
    }
  }

  return [...groupedLinks.entries()]
    .map(([id, group]) => createTopicCluster(id, group.label, group.links))
    .filter((cluster) => cluster.links.length >= 2)
    .sort((a, b) => b.links.length - a.links.length || a.label.localeCompare(b.label))
}

function inferTopic(link: SavedLink): { id: string; label: string } {
  const haystack = [link.title, link.url, link.type, link.note ?? "", ...link.tags].join(" ")

  for (const rule of topicRules) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return {
        id: rule.id,
        label: rule.label
      }
    }
  }

  const primaryTag = link.tags[0]
  if (primaryTag) {
    return {
      id: `tag-${slugify(primaryTag)}`,
      label: titleCase(primaryTag)
    }
  }

  return {
    id: `host-${slugify(hostFromUrl(link.url))}`,
    label: hostFromUrl(link.url)
  }
}

function createTopicCluster(id: string, label: string, links: SavedLink[]): TopicCluster {
  const sortedLinks = [...links].sort((a, b) => b.debtScore - a.debtScore)
  const suggestedReadIds = sortedLinks.slice(0, 2).map((link) => link.id)
  const remainingLinks = sortedLinks.slice(2)
  const suggestedSummaryIds = remainingLinks
    .filter((link) => link.debtScore >= 45)
    .map((link) => link.id)
  const suggestedDiscardIds = remainingLinks
    .filter((link) => link.debtScore < 45)
    .map((link) => link.id)
  const recommendationParts = [`Read ${suggestedReadIds.length}`]

  if (suggestedSummaryIds.length > 0) {
    recommendationParts.push(`summarize ${suggestedSummaryIds.length}`)
  }

  if (suggestedDiscardIds.length > 0) {
    recommendationParts.push(`discard ${suggestedDiscardIds.length}`)
  }

  return {
    id,
    label,
    links: sortedLinks,
    suggestedReadIds,
    suggestedSummaryIds,
    suggestedDiscardIds,
    recommendation: `${recommendationParts.join(", ")}.`
  }
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ")
}

