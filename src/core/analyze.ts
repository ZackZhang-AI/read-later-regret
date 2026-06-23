import type { AnalysisResult, PagePayload } from "../types/link"

import { classifyPage } from "./classifier"
import { scoreInformationDebt } from "./debt-score"
import { estimateReadingTime } from "./reading-time"
import { recommendAction } from "./recommendation"

export interface AnalyzeOptions {
  existingSameTypeOpenCount?: number
  ageDays?: number
}

export function analyzePage(page: PagePayload, options: AnalyzeOptions = {}): AnalysisResult {
  const readingTime = estimateReadingTime(page.text)
  const type = classifyPage(page)
  const recommendation = recommendAction({
    type,
    readingTimeMinutes: readingTime.minutes,
    title: page.title
  })
  const debt = scoreInformationDebt({
    type,
    readingTimeMinutes: readingTime.minutes,
    title: page.title,
    existingSameTypeOpenCount: options.existingSameTypeOpenCount,
    ageDays: options.ageDays
  })

  return {
    type,
    readingTimeMinutes: readingTime.minutes,
    suggestedAction: recommendation.action,
    debtScore: debt.score,
    reasons: [...recommendation.reasons, ...debt.reasons]
  }
}

