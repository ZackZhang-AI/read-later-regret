import { describe, expect, it } from "vitest"

import type { SavedLink } from "../types/link"

import { createExportPayload, parseImportPayload } from "./import-export"

const existingLink: SavedLink = {
  id: "existing",
  url: "https://example.com/guide",
  title: "Existing Guide",
  textSample: "sample",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  readingTimeMinutes: 10,
  type: "Long Article",
  suggestedAction: "Save for Later",
  chosenAction: "Save for Later",
  status: "reading_this_week",
  debtScore: 80,
  reasons: [],
  tags: ["ai"]
}

const importedLink: SavedLink = {
  ...existingLink,
  id: "imported",
  title: "Imported Guide",
  updatedAt: "2026-06-10T00:00:00.000Z",
  tags: ["ai", "agents"]
}

describe("import/export helpers", () => {
  it("creates a versioned export payload with links", () => {
    const payload = JSON.parse(createExportPayload([existingLink], "2026-06-24T00:00:00.000Z"))

    expect(payload.schemaVersion).toBe(1)
    expect(payload.exportedAt).toBe("2026-06-24T00:00:00.000Z")
    expect(payload.links).toHaveLength(1)
  })

  it("imports valid links and deduplicates by URL while preserving existing identity", () => {
    const result = parseImportPayload(
      JSON.stringify({
        schemaVersion: 1,
        exportedAt: "2026-06-24T00:00:00.000Z",
        links: [importedLink]
      }),
      [existingLink]
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.links).toHaveLength(1)
    expect(result.links[0]).toMatchObject({
      id: "existing",
      createdAt: "2026-06-01T00:00:00.000Z",
      title: "Imported Guide",
      tags: ["ai", "agents"]
    })
  })

  it("rejects invalid JSON payloads without changing data", () => {
    const result = parseImportPayload("{not json", [existingLink])

    expect(result).toEqual({
      ok: false,
      error: "Import file is not valid JSON."
    })
  })
})

