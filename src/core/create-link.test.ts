import { describe, expect, it, vi } from "vitest"

import { createSavedLink } from "./create-link"

describe("createSavedLink", () => {
  it("uses corrected type, note, tags, extraction quality, and confidence when saving", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000000")

    const link = createSavedLink(
      {
        url: "https://example.com/json-converter",
        title: "Maybe a tool",
        text: "JSON converter generator",
        extractionQuality: "medium",
        textLength: 24,
        selectedRoot: "main"
      },
      "Add to Toolbox",
      {
        note: "Use this when I need JSON converted.",
        tags: ["dev", "json"],
        userCorrectedType: "Tool"
      }
    )

    expect(link.id).toBe("00000000-0000-4000-8000-000000000000")
    expect(link.type).toBe("Tool")
    expect(link.userCorrectedType).toBe("Tool")
    expect(link.note).toBe("Use this when I need JSON converted.")
    expect(link.tags).toEqual(["dev", "json"])
    expect(link.extractionQuality).toBe("medium")
    expect(link.confidence).toBeGreaterThan(0)
  })
})
