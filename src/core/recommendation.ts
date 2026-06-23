import type { LinkAction, LinkStatus, LinkType } from "../types/link"

export interface RecommendationInput {
  type: LinkType
  readingTimeMinutes: number
  title: string
}

export interface RecommendationResult {
  action: LinkAction
  reasons: string[]
}

export function recommendAction(input: RecommendationInput): RecommendationResult {
  const title = input.title.toLowerCase()

  if (input.type === "Shopping") {
    return {
      action: "Discard",
      reasons: ["Shopping pages age quickly and rarely need a reading queue."]
    }
  }

  if (input.type === "Tool") {
    return {
      action: "Add to Toolbox",
      reasons: ["This looks more useful as a reusable resource than as reading material."]
    }
  }

  if (input.type === "Docs") {
    return {
      action: title.includes("api") || title.includes("reference") ? "Turn into Task" : "Save for Later",
      reasons: ["Documentation is easiest to use when tied to a concrete task."]
    }
  }

  if (input.type === "Video" || input.type === "News" || input.type === "Unknown") {
    return {
      action: "Summarize",
      reasons: ["A quick summary may be enough before this becomes another open loop."]
    }
  }

  if (input.type === "Paper" || input.type === "Long Article" || input.readingTimeMinutes >= 8) {
    return {
      action: "Save for Later",
      reasons: ["This needs a real reading slot, not a guilt-shaped bookmark."]
    }
  }

  if (input.readingTimeMinutes <= 3) {
    return {
      action: "Read Now",
      reasons: ["This is short enough to finish now instead of feeding the queue."]
    }
  }

  return {
    action: "Summarize",
    reasons: ["This looks skimmable; capture the gist and move on."]
  }
}

export function actionToStatus(action: LinkAction): LinkStatus {
  const statuses: Record<LinkAction, LinkStatus> = {
    "Read Now": "inbox",
    "Save for Later": "reading_this_week",
    Summarize: "summary_queue",
    "Turn into Task": "task",
    "Add to Toolbox": "toolbox",
    Discard: "discarded"
  }

  return statuses[action]
}

