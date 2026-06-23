# Read-Later Regret Agent Brief

## Product Definition

Read-Later Regret is a Chrome browser extension that helps users reduce information debt. It does not assume every saved link deserves to be read later. Instead, it evaluates the current page, estimates reading effort, classifies the content, suggests a handling action, and saves the user's decision.

## MVP Goal

Build a Plasmo + React + TypeScript extension with:

- Popup entrypoint for evaluating the current tab.
- Content script for extracting URL, title, and readable text.
- Rule-based reading time, page type classification, recommendation, and information debt score.
- Local persistence through `chrome.storage.local`.
- Dashboard page for reviewing and managing saved links.
- Lightweight UI voice: an information decluttering assistant with a little dry humor.

## Core User Flow

1. User opens a webpage.
2. User clicks the extension button.
3. Popup extracts the current page data.
4. Popup shows title, URL, type, reading time, suggested action, debt score, and reasons.
5. User chooses an action.
6. Extension saves the link locally with a derived status.
7. User opens dashboard to filter, update, open, delete, or clear links.

## Page Types

- `Long Article`
- `Short Article`
- `Tool`
- `Docs`
- `Video`
- `Shopping`
- `News`
- `Paper`
- `Unknown`

## Suggested Actions

- `Read Now`
- `Save for Later`
- `Summarize`
- `Turn into Task`
- `Add to Toolbox`
- `Discard`

## Link Statuses

- `inbox`
- `reading_this_week`
- `summary_queue`
- `task`
- `toolbox`
- `discarded`
- `done`

## Architecture

- `src/popup.tsx`: popup UI and current page analysis flow.
- `src/background.ts`: extension lifecycle placeholder and future message hub.
- `src/contents/extract.ts`: page text extraction content script.
- `src/tabs/dashboard.tsx`: dashboard page.
- `src/types/link.ts`: shared data model.
- `src/core/reading-time.ts`: reading time estimation.
- `src/core/classifier.ts`: page type rules.
- `src/core/debt-score.ts`: information debt scoring.
- `src/core/recommendation.ts`: suggested action and status mapping.
- `src/core/analyze.ts`: orchestration for analysis result.
- `src/storage/links.ts`: `chrome.storage.local` wrapper.
- `src/styles.css`: shared extension UI styling.

## Rule Defaults

Reading time:

- English: roughly 220 words per minute.
- Chinese: roughly 450 CJK characters per minute.
- Mixed content: use the larger estimate.
- Empty or very short pages default to 1 minute when text exists, 0 when empty.

Classification:

- Video domains or video elements classify as `Video`.
- Shopping URL/title keywords classify as `Shopping`.
- Docs URL/title keywords classify as `Docs`.
- arXiv, DOI, PubMed, abstract/reference signals classify as `Paper`.
- News URL/title keywords classify as `News`.
- Tool/generator/converter/template/calculator signals classify as `Tool`.
- Reading time >= 8 minutes classifies as `Long Article`.
- Reading time < 8 minutes classifies as `Short Article`.
- Empty or unclear content classifies as `Unknown`.

Recommendation:

- Short articles up to 3 minutes: `Read Now`.
- Long articles: `Save for Later`.
- News: `Summarize`, or effectively discard later.
- Tools: `Add to Toolbox`.
- Docs: `Turn into Task` when task-oriented, otherwise `Save for Later`.
- Shopping: `Discard`.
- Unknown: `Summarize`.

Information debt:

- Score is `0-100`.
- Longer reading time increases score.
- Long, paper, docs, and hype-guide signals increase score.
- Many unresolved same-type links increase score.
- Older unread links increase score.
- Tool pages reduce score.
- Discarded links have score `0`.

## Execution Plan

1. Initialize Plasmo project files and package scripts.
2. Write unit tests for rule engine behavior before production code.
3. Implement shared types and core rule modules.
4. Implement local storage API.
5. Implement content extraction.
6. Implement popup UI and save actions.
7. Implement dashboard UI and link management.
8. Run tests, typecheck, and build.

## Acceptance Criteria

- `npm.cmd test` passes.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` succeeds.
- Popup can analyze a readable page.
- User action saves a link to local storage.
- Dashboard can show, filter, update, delete, and clear records.
- No AI API is required.
