import { describe, expect, it } from "vitest"

import { cleanReadableText, estimateExtractionQuality, htmlToReadableText } from "./extraction"

describe("extraction helpers", () => {
  it("removes noisy navigation, script, style, footer, and comments blocks from html", () => {
    const html = `
      <nav>Home Pricing Login</nav>
      <main>
        <h1>Useful article</h1>
        <p>This paragraph is the content users actually care about.</p>
        <aside>Related links</aside>
        <script>console.log("noise")</script>
        <style>body { color: red; }</style>
        <section class="comments">Great post</section>
      </main>
      <footer>Copyright</footer>
    `

    const text = htmlToReadableText(html)

    expect(text).toContain("Useful article")
    expect(text).toContain("actually care about")
    expect(text).not.toContain("Pricing")
    expect(text).not.toContain("console.log")
    expect(text).not.toContain("Copyright")
    expect(text).not.toContain("Great post")
  })

  it("normalizes whitespace in extracted text", () => {
    expect(cleanReadableText("  one\n\n two\t three  ")).toBe("one two three")
  })

  it("estimates extraction quality from selected root and text length", () => {
    expect(estimateExtractionQuality({ selectedRoot: "article", textLength: 1200 })).toBe("high")
    expect(estimateExtractionQuality({ selectedRoot: "body", textLength: 500 })).toBe("medium")
    expect(estimateExtractionQuality({ selectedRoot: "body", textLength: 80 })).toBe("low")
  })
})

