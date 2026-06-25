import { sanitizeSettings, type PartialUserSettings } from "./settings"

export interface ReadingTimeEstimate {
  minutes: number
  wordCount: number
  cjkCharacterCount: number
}

export function estimateReadingTime(
  text: string,
  settings: PartialUserSettings = {}
): ReadingTimeEstimate {
  const readingSettings = sanitizeSettings(settings)
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      minutes: 0,
      wordCount: 0,
      cjkCharacterCount: 0
    }
  }

  const cjkMatches = trimmed.match(/[\u3400-\u9fff]/g) ?? []
  const cjkCharacterCount = cjkMatches.length
  const latinText = trimmed.replace(/[\u3400-\u9fff]/g, " ")
  const words = latinText.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)?/g) ?? []
  const wordCount = words.length
  const englishMinutes = wordCount / readingSettings.englishWordsPerMinute
  const cjkMinutes = cjkCharacterCount / readingSettings.cjkCharactersPerMinute
  const minutes = Math.max(1, Math.ceil(Math.max(englishMinutes, cjkMinutes)))

  return {
    minutes,
    wordCount,
    cjkCharacterCount
  }
}
