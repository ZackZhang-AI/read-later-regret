import type { AnalysisResult, LinkType, PagePayload } from "../types/link"

import { classifyPage } from "./classifier"
import { scoreInformationDebt } from "./debt-score"
import { estimateReadingTime } from "./reading-time"
import { recommendAction } from "./recommendation"
import type { PartialUserSettings } from "./settings"

export interface AnalyzeOptions {
  existingSameTypeOpenCount?: number
  ageDays?: number
  userCorrectedType?: LinkType
  settings?: PartialUserSettings
}

export function analyzePage(page: PagePayload, options: AnalyzeOptions = {}): AnalysisResult {
  const readingTime = estimateReadingTime(page.text, options.settings)
  const classification = classifyPage(page, options.settings)
  const type = options.userCorrectedType ?? classification.type
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
    confidence: classification.confidence,
    readingTimeMinutes: readingTime.minutes,
    suggestedAction: recommendation.action,
    debtScore: debt.score,
    reasons: [
      ...classification.reasons,
      ...recommendation.reasons.map((message, index) => ({
        reasonCode: `recommendation_${index + 1}`,
        message,
        weight: 20
      })),
      ...debt.reasons.map((message, index) => ({
        reasonCode: `debt_${index + 1}`,
        message,
        weight: 10
      }))
    ]
  }
}
