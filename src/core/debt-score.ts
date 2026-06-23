import type { LinkAction, LinkType } from "../types/link"

export interface DebtScoreInput {
  type: LinkType
  readingTimeMinutes: number
  title: string
  existingSameTypeOpenCount?: number
  ageDays?: number
  chosenAction?: LinkAction
}

export interface DebtScoreResult {
  score: number
  reasons: string[]
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score))
}

export function scoreInformationDebt(input: DebtScoreInput): DebtScoreResult {
  if (input.chosenAction === "Discard") {
    return {
      score: 0,
      reasons: ["Discarded links do not become information debt."]
    }
  }

  let score = 0
  const reasons: string[] = []

  if (input.readingTimeMinutes <= 2) {
    score += 10
    reasons.push("Short reading time keeps the debt low.")
  } else if (input.readingTimeMinutes <= 7) {
    score += 25
    reasons.push("Medium reading time can still pile up.")
  } else if (input.readingTimeMinutes <= 15) {
    score += 45
    reasons.push("Long enough to require an actual reading slot.")
  } else {
    score += 60
    reasons.push("Very long content is prime information-debt material.")
  }

  if (["Long Article", "Paper", "Docs"].includes(input.type)) {
    score += 10
    reasons.push(`${input.type} usually requires focused attention.`)
  }

  if (/complete guide|ultimate|完整指南|必看/i.test(input.title)) {
    score += 10
    reasons.push("The title has guide-style gravity.")
  }

  if ((input.existingSameTypeOpenCount ?? 0) > 5) {
    score += 10
    reasons.push("You already have several unresolved links like this.")
  }

  if ((input.ageDays ?? 0) > 7) {
    score += 10
    reasons.push("It has been waiting for more than a week.")
  }

  if ((input.ageDays ?? 0) > 30) {
    score += 15
    reasons.push("After 30 days, importance starts looking suspicious.")
  }

  if (input.type === "Tool") {
    score -= 15
    reasons.push("Tools can be stored as resources instead of reading debt.")
  }

  return {
    score: clampScore(score),
    reasons
  }
}

