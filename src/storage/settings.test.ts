import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_SETTINGS } from "../core/settings"

import { getSettings, saveSettings } from "./settings"

describe("settings storage", () => {
  let stored: Record<string, unknown>

  beforeEach(() => {
    stored = {}

    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: stored[key] })),
          set: vi.fn(async (value: Record<string, unknown>) => {
            stored = {
              ...stored,
              ...value
            }
          })
        }
      }
    })
  })

  it("returns default settings when storage is empty", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it("sanitizes saved settings before persistence", async () => {
    await saveSettings({
      englishWordsPerMinute: 10,
      staleLinkDays: 999
    })

    expect(await getSettings()).toMatchObject({
      englishWordsPerMinute: 120,
      staleLinkDays: 180
    })
  })
})

