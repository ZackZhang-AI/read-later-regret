export type LinkType =
  | "Long Article"
  | "Short Article"
  | "Tool"
  | "Docs"
  | "Video"
  | "Shopping"
  | "News"
  | "Paper"
  | "Unknown"

export type LinkAction =
  | "Read Now"
  | "Save for Later"
  | "Summarize"
  | "Turn into Task"
  | "Add to Toolbox"
  | "Discard"

export type LinkStatus =
  | "inbox"
  | "reading_this_week"
  | "summary_queue"
  | "task"
  | "toolbox"
  | "discarded"
  | "done"

export interface PagePayload {
  url: string
  title: string
  text: string
  hasVideo?: boolean
  interactiveElementCount?: number
}

export interface AnalysisResult {
  type: LinkType
  readingTimeMinutes: number
  suggestedAction: LinkAction
  debtScore: number
  reasons: string[]
}

export interface SavedLink {
  id: string
  url: string
  title: string
  textSample: string
  createdAt: string
  updatedAt: string
  lastOpenedAt?: string
  readingTimeMinutes: number
  type: LinkType
  suggestedAction: LinkAction
  chosenAction: LinkAction
  status: LinkStatus
  debtScore: number
  reasons: string[]
  tags: string[]
  note?: string
}

