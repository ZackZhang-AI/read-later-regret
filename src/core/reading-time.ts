const ENGLISH_WORDS_PER_MINUTE = 220
const CJK_CHARACTERS_PER_MINUTE = 450

export interface ReadingTimeEstimate {
  minutes: number
  wordCount: number
  cjkCharacterCount: number
}

export function estimateReadingTime(text: string): ReadingTimeEstimate {
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
  const englishMinutes = wordCount / ENGLISH_WORDS_PER_MINUTE
  const cjkMinutes = cjkCharacterCount / CJK_CHARACTERS_PER_MINUTE
  const minutes = Math.max(1, Math.ceil(Math.max(englishMinutes, cjkMinutes)))

  return {
    minutes,
    wordCount,
    cjkCharacterCount
  }
}

