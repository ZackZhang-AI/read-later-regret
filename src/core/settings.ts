export interface UserSettings {
  englishWordsPerMinute: number
  cjkCharactersPerMinute: number
  longArticleMinutes: number
  staleLinkDays: number
}

export type PartialUserSettings = Partial<UserSettings>

export const DEFAULT_SETTINGS: UserSettings = {
  englishWordsPerMinute: 220,
  cjkCharactersPerMinute: 450,
  longArticleMinutes: 8,
  staleLinkDays: 30
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

export function sanitizeSettings(settings: PartialUserSettings = {}): UserSettings {
  return {
    englishWordsPerMinute: clamp(
      Math.round(numberOrDefault(settings.englishWordsPerMinute, DEFAULT_SETTINGS.englishWordsPerMinute)),
      120,
      450
    ),
    cjkCharactersPerMinute: clamp(
      Math.round(numberOrDefault(settings.cjkCharactersPerMinute, DEFAULT_SETTINGS.cjkCharactersPerMinute)),
      200,
      900
    ),
    longArticleMinutes: clamp(
      Math.round(numberOrDefault(settings.longArticleMinutes, DEFAULT_SETTINGS.longArticleMinutes)),
      3,
      30
    ),
    staleLinkDays: clamp(
      Math.round(numberOrDefault(settings.staleLinkDays, DEFAULT_SETTINGS.staleLinkDays)),
      7,
      180
    )
  }
}

