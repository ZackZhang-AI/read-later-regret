import { describe, expect, it } from "vitest"

import { DEFAULT_SETTINGS, sanitizeSettings } from "./settings"

describe("settings", () => {
  it("keeps sensible defaults for analysis and cleanup", () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      englishWordsPerMinute: 220,
      cjkCharactersPerMinute: 450,
      longArticleMinutes: 8,
      staleLinkDays: 30
    })
  })

  it("sanitizes user settings into safe ranges", () => {
    expect(
      sanitizeSettings({
        englishWordsPerMinute: 40,
        cjkCharactersPerMinute: 5000,
        longArticleMinutes: 1,
        staleLinkDays: 400
      })
    ).toEqual({
      englishWordsPerMinute: 120,
      cjkCharactersPerMinute: 900,
      longArticleMinutes: 3,
      staleLinkDays: 180
    })
  })
})

