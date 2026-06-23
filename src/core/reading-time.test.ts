import { describe, expect, it } from "vitest"

import { estimateReadingTime } from "./reading-time"

describe("estimateReadingTime", () => {
  it("returns zero minutes for empty text", () => {
    expect(estimateReadingTime("")).toEqual({
      minutes: 0,
      wordCount: 0,
      cjkCharacterCount: 0
    })
  })

  it("estimates English reading time from words", () => {
    const text = Array.from({ length: 440 }, (_, index) => `word${index}`).join(" ")

    expect(estimateReadingTime(text).minutes).toBe(2)
  })

  it("estimates Chinese reading time from CJK characters", () => {
    const text = "信息".repeat(450)

    expect(estimateReadingTime(text).minutes).toBe(2)
  })
})

