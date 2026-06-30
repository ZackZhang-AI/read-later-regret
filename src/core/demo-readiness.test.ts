import { describe, expect, it } from "vitest"

import { createDemoLinks } from "./demo-data"
import { getDemoReadiness } from "./demo-readiness"

describe("demo readiness", () => {
  it("reports a ready demo when seed data covers the showcase flows", () => {
    const readiness = getDemoReadiness(createDemoLinks())

    expect(readiness.ready).toBe(true)
    expect(readiness.missing).toEqual([])
    expect(readiness.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "content-types", passed: true }),
        expect.objectContaining({ id: "workflow-statuses", passed: true }),
        expect.objectContaining({ id: "review-queue", passed: true }),
        expect.objectContaining({ id: "topic-clusters", passed: true }),
        expect.objectContaining({ id: "usage-intelligence", passed: true }),
        expect.objectContaining({ id: "issue-badges", passed: true })
      ])
    )
  })

  it("explains what is missing when demo data is too thin", () => {
    const readiness = getDemoReadiness(createDemoLinks().slice(0, 2))

    expect(readiness.ready).toBe(false)
    expect(readiness.missing.length).toBeGreaterThan(0)
    expect(readiness.missing.join(" ")).toContain("content")
  })
})
