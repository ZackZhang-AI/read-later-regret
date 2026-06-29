# Read-Later Regret Agent Brief

## Product Definition

Read-Later Regret is a Chrome browser extension that helps users reduce information debt. It does not assume every saved link deserves to be read later. Instead, it evaluates the current page, estimates reading effort, classifies the content, suggests a handling action, and saves the user's decision.

## MVP Goal

Build a Plasmo + React + TypeScript extension with:

- Popup entrypoint for evaluating the current tab.
- Content script for extracting URL, title, and readable text.
- Rule-based reading time, page type classification, recommendation, and information debt score.
- Extraction metadata and classification confidence so users can see how reliable the judgment is.
- Manual type correction, tags, and one-sentence notes before saving.
- Post-save popup actions for opening dashboard, undoing the save, or continuing.
- Local persistence through `chrome.storage.local`.
- Dashboard page for reviewing, searching, sorting, batch-managing, and annotating saved links.
- Dashboard Review Mode for processing the queue one link at a time.
- Topic Groups for local clustering by title, tags, host, and keywords.
- JSON import/export for backups and demos.
- User preferences for reading speed, long-article threshold, and stale-link age.
- Lightweight UI voice: an information decluttering assistant with a little dry humor.

## Core User Flow

1. User opens a webpage.
2. User clicks the extension button.
3. Popup extracts the current page data.
4. Popup shows title, URL, type, reading time, suggested action, debt score, and reasons.
5. User can correct the type, add a note, and add tags.
6. User chooses an action.
7. Extension saves the link locally with a derived status.
8. User can open the dashboard, undo the save, or continue browsing.
9. User opens dashboard to filter, search, sort, batch update, annotate, open, delete, or clear links.
10. User can run Review Mode to process one link at a time.
11. User can use Topic Groups to read 1-2 strong links and summarize or discard the rest.
12. User can export local links to JSON and import them back with URL dedupe.
13. User can tune decision preferences from the dashboard.

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
- `src/core/extraction.ts`: pure text cleanup and extraction-quality helpers.
- `src/core/reading-time.ts`: reading time estimation.
- `src/core/classifier.ts`: page type rules.
- `src/core/debt-score.ts`: information debt scoring.
- `src/core/recommendation.ts`: suggested action and status mapping.
- `src/core/analyze.ts`: orchestration for analysis result.
- `src/core/dashboard.ts`: search, sort, batch update, and weekly cleanup helpers.
- `src/core/demo-data.ts`: development seed links.
- `src/core/import-export.ts`: versioned JSON export/import parsing and dedupe helpers.
- `src/core/review.ts`: Review Mode queue, decision mapping, and session summary helpers.
- `src/core/topics.ts`: local topic clustering and read/summarize/discard suggestions.
- `src/core/settings.ts`: default and sanitized user decision preferences.
- `src/storage/links.ts`: `chrome.storage.local` wrapper.
- `src/storage/settings.ts`: `chrome.storage.local` wrapper for preferences.
- `src/styles.css`: shared extension UI styling.

## Rule Defaults

Reading time:

- English: roughly 220 words per minute.
- Chinese: roughly 450 CJK characters per minute.
- Mixed content: use the larger estimate.
- Empty or very short pages default to 1 minute when text exists, 0 when empty.

Extraction:

- Content script prefers `article`, `main`, then `[role="main"]`, then body fallback.
- Noisy blocks such as navigation, footer, sidebar, related links, comments, scripts, and styles are removed before text analysis.
- Saved payload can include `extractionQuality`, `textLength`, and `selectedRoot`.

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
- Classification returns `confidence` and structured reasons with `reasonCode`, `message`, and `weight`.
- Popup allows user-corrected type before saving; this does not train or mutate the rule engine.

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

Dashboard:

- Search covers title, URL, host, type, status, note, and tags.
- Sort options are debt score, saved time, and reading time.
- Batch actions support discard, done, and summary queue.
- Review Mode prioritizes unresolved links by debt, stale status, and age.
- Review decisions map to this week, summary queue, task, inbox, or discarded.
- Review session summary reports reviewed count and reduced debt.
- Link issue badges surface high debt, low confidence, and hard-to-read pages.
- Topic Groups cluster unresolved links by known topic rules, tags, and host fallback.
- Topic recommendations choose up to 2 high-value links to read and route the rest to summary or discard.
- Weekly cleanup stats include saved this week, high debt, suggested discard, worth reading, and probably not important.
- Probably Not Important means unresolved links older than 30 days.
- Import/export uses schema version `1` and deduplicates imported links by URL while preserving existing local identity.

Settings:

- Settings are stored locally under `readLaterRegretSettings`.
- `englishWordsPerMinute` and `cjkCharactersPerMinute` affect reading-time estimates.
- `longArticleMinutes` affects long-vs-short article classification.
- `staleLinkDays` affects Probably Not Important cleanup.
- Settings are sanitized to safe ranges before storage or analysis.

## Execution Plan

1. Initialize Plasmo project files and package scripts.
2. Write unit tests for rule engine behavior before production code.
3. Implement shared types and core rule modules.
4. Implement local storage API.
5. Implement content extraction.
6. Implement popup UI and save actions.
7. Implement dashboard UI and link management.
8. Add extraction quality and classification confidence.
9. Add popup type correction, note, and tags.
10. Add dashboard search, sort, batch actions, notes, tags, weekly cleanup, and demo seed data.
11. Run tests, typecheck, and build.

## Acceptance Criteria

- `npm.cmd test` passes.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` succeeds.
- Popup can analyze a readable page.
- User action saves a link to local storage.
- Dashboard can show, filter, update, delete, and clear records.
- Dashboard can search, sort, batch update, and edit notes/tags.
- Dashboard can export/import JSON and surface old unresolved links.
- Dashboard can tune decision preferences and popup analysis uses the same settings.
- Dashboard can run Review Mode and summarize the cleanup session.
- Dashboard can show Topic Groups and apply read, summarize, or discard actions to suggested links.
- Popup can undo a just-saved link.
- Popup can warn when extraction quality is low.
- Popup can save corrected type, confidence, extraction quality, note, and tags.
- No AI API is required.
