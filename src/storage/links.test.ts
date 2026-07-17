import { beforeEach, describe, expect, it, vi } from "vitest"

import type { SavedLink } from "../types/link"

import { clearDiscarded, deleteLink, getLinks, markLinkOpened, saveLink, updateLink } from "./links"

const sampleLink: SavedLink = {
  id: "one",
  url: "https://example.com/a",
  title: "Example",
  textSample: "Example text",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  readingTimeMinutes: 2,
  type: "Short Article",
  suggestedAction: "Read Now",
  chosenAction: "Read Now",
  status: "inbox",
  debtScore: 10,
  reasons: [
    {
      reasonCode: "short_reading_time",
      message: "Short enough to read now.",
      weight: 10
    }
  ],
  tags: []
}

describe("links storage", () => {
  let storedLinks: SavedLink[]

  beforeEach(() => {
    storedLinks = []

    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async () => ({ readLaterRegretLinks: storedLinks })),
          set: vi.fn(async (value: { readLaterRegretLinks: SavedLink[] }) => {
            storedLinks = value.readLaterRegretLinks
          })
        }
      }
    })
  })

  it("saves links and deduplicates by URL", async () => {
    await saveLink(sampleLink)
    await saveLink({
      ...sampleLink,
      id: "two",
      title: "Updated title",
      status: "summary_queue",
      updatedAt: "2026-01-02T00:00:00.000Z"
    })

    expect(await getLinks()).toHaveLength(1)
    expect((await getLinks())[0]).toMatchObject({
      id: "one",
      title: "Updated title",
      status: "summary_queue"
    })
  })

  it("updates and deletes links", async () => {
    await saveLink(sampleLink)
    await updateLink("one", { status: "done" })

    expect((await getLinks())[0].status).toBe("done")

    await deleteLink("one")

    expect(await getLinks()).toEqual([])
  })

  it("clears discarded links only", async () => {
    await saveLink(sampleLink)
    await saveLink({
      ...sampleLink,
      id: "discarded",
      url: "https://example.com/b",
      status: "discarded"
    })

    await clearDiscarded()

    expect(await getLinks()).toEqual([sampleLink])
  })

  it("records when a saved link is opened", async () => {
    await saveLink(sampleLink)

    await markLinkOpened("one", "2026-06-30T00:00:00.000Z")

    expect((await getLinks())[0]).toMatchObject({
      id: "one",
      lastOpenedAt: "2026-06-30T00:00:00.000Z"
    })
  })
})
