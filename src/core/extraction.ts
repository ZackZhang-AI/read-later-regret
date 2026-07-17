import type { ExtractionQuality } from "../types/link"

const NOISY_BLOCK_PATTERN =
  /<(script|style|nav|footer|aside|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi

const NOISY_CLASS_OR_ID_PATTERN =
  /<([a-z0-9-]+)\b[^>]*(?:class|id)=["'][^"']*(?:comment|comments|advert|ad-|ads|promo|sidebar|related)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi

export interface ExtractionQualityInput {
  selectedRoot: string
  textLength: number
}

export function cleanReadableText(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

export function htmlToReadableText(html: string): string {
  const withoutNoisyBlocks = html
    .replace(NOISY_BLOCK_PATTERN, " ")
    .replace(NOISY_CLASS_OR_ID_PATTERN, " ")
  const withoutTags = withoutNoisyBlocks.replace(/<[^>]+>/g, " ")

  return cleanReadableText(withoutTags)
}

export function estimateExtractionQuality(input: ExtractionQualityInput): ExtractionQuality {
  if (input.textLength >= 800 && input.selectedRoot !== "body") {
    return "high"
  }

  if (input.textLength >= 240) {
    return "medium"
  }

  return "low"
}

