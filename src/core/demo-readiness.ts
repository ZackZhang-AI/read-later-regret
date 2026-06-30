import type { LinkStatus, LinkType, SavedLink } from "../types/link"

import { getReviewQueue } from "./review"
import { getTopicClusters } from "./topics"
import { getUsageStats } from "./usage-intelligence"

export interface DemoReadinessCheck {
  id: string
  label: string
  passed: boolean
  detail: string
}

export interface DemoReadiness {
  ready: boolean
  checks: DemoReadinessCheck[]
  missing: string[]
}

const showcaseTypes: LinkType[] = [
  "Long Article",
  "Short Article",
  "Tool",
  "Docs",
  "Video",
  "Shopping",
  "News",
  "Paper"
]

const showcaseStatuses: LinkStatus[] = [
  "inbox",
  "reading_this_week",
  "summary_queue",
  "task",
  "toolbox",
  "discarded",
  "done"
]

export function getDemoReadiness(links: SavedLink[]): DemoReadiness {
  const typeSet = new Set(links.map((link) => link.type))
  const statusSet = new Set(links.map((link) => link.status))
  const missingTypes = showcaseTypes.filter((type) => !typeSet.has(type))
  const missingStatuses = showcaseStatuses.filter((status) => !statusSet.has(status))
  const reviewQueueCount = getReviewQueue(links).length
  const topicClusterCount = getTopicClusters(links).length
  const usageStats = getUsageStats(links)
  const hasHighDebt = links.some((link) => link.debtScore >= 70 && link.status !== "discarded")
  const hasLowConfidence = links.some((link) => (link.confidence ?? 100) < 50)
  const hasLowExtraction = links.some((link) => link.extractionQuality === "low")

  const checks: DemoReadinessCheck[] = [
    {
      id: "content-types",
      label: "Content type coverage",
      passed: missingTypes.length === 0,
      detail:
        missingTypes.length === 0
          ? "All showcase content types are represented."
          : `Missing content types: ${missingTypes.join(", ")}.`
    },
    {
      id: "workflow-statuses",
      label: "Workflow status coverage",
      passed: missingStatuses.length === 0,
      detail:
        missingStatuses.length === 0
          ? "All major dashboard statuses are represented."
          : `Missing statuses: ${missingStatuses.join(", ")}.`
    },
    {
      id: "review-queue",
      label: "Review Mode material",
      passed: reviewQueueCount >= 5,
      detail: `${reviewQueueCount} unresolved links available for one-by-one cleanup.`
    },
    {
      id: "topic-clusters",
      label: "Topic Group material",
      passed: topicClusterCount >= 2,
      detail: `${topicClusterCount} local clusters detected.`
    },
    {
      id: "usage-intelligence",
      label: "Usage Intelligence material",
      passed:
        usageStats.openedThisWeek > 0 &&
        usageStats.neverOpened > 0 &&
        usageStats.highDebtNeverOpened > 0,
      detail:
        usageStats.openedThisWeek > 0 &&
        usageStats.neverOpened > 0 &&
        usageStats.highDebtNeverOpened > 0
          ? "Opened, never-opened, and high-debt unopened examples are present."
          : "Needs opened, never-opened, and high-debt unopened examples."
    },
    {
      id: "issue-badges",
      label: "Issue badge examples",
      passed: hasHighDebt && hasLowConfidence && hasLowExtraction,
      detail:
        hasHighDebt && hasLowConfidence && hasLowExtraction
          ? "High debt, low confidence, and hard-to-read examples are present."
          : "Needs high debt, low confidence, and hard-to-read examples."
    }
  ]
  const missing = checks.filter((check) => !check.passed).map((check) => check.detail)

  return {
    ready: missing.length === 0,
    checks,
    missing
  }
}
