# Read-Later Regret

Read-Later Regret is a Chrome extension for reducing information debt. It is not another endless read-later bucket. When you click the extension, it evaluates the current page and asks the more honest question: should this be read now, scheduled, summarized, turned into a task, kept as a resource, or discarded?

## Why It Exists

Traditional read-later tools assume saved means useful. In practice, many saved links become a quiet backlog. Read-Later Regret routes links by intent:

- Long articles become scheduled reading candidates.
- Short posts are nudged toward reading now.
- Tools go to a toolbox.
- Docs can become tasks.
- News and low-value pages can be summarized or discarded.

The product voice is lightweight and a little candid: you are not short on content, you are short on deleting courage.

## Tech Stack

- Plasmo
- React
- TypeScript
- Chrome Extension Manifest V3
- `chrome.storage.local`
- Vitest

## Features

- Popup analysis of the current page.
- Multi-strategy page text extraction with extraction quality metadata.
- Reading time estimate for English, Chinese, and mixed content.
- Rule-based content classification with confidence score.
- Structured reasons for classifications, recommendations, and debt scoring.
- Information debt score from `0-100`.
- Manual type correction before saving.
- Quick note and tags from the popup.
- Dashboard search, sort, filtering, batch actions, tags, notes, and weekly cleanup stats.
- Dashboard "Probably Not Important" view for old unresolved links.
- JSON export/import for local backups and demos, with URL dedupe on import.
- User preferences for reading speed, long-article threshold, and stale-link age.
- Development-only demo seed data from the dashboard empty state.
- No AI API required.

## Project Structure

- `src/popup.tsx`: popup UI and current-page save flow.
- `src/contents/extract.ts`: content script for readable text and extraction metadata.
- `src/tabs/dashboard.tsx`: dashboard management UI.
- `src/core/`: pure rule, extraction, analysis, dashboard, import/export, and demo-data helpers.
- `src/storage/settings.ts`: local settings persistence for user decision preferences.
- `src/storage/links.ts`: local storage wrapper.
- `src/types/link.ts`: shared data model.
- `agent.md`: durable agent brief for future implementation sessions.

## Local Development

Install dependencies:

```bash
npm.cmd install
```

Run the extension in development:

```bash
npm.cmd run dev
```

Build the Chrome extension:

```bash
npm.cmd run build
```

Load the built extension in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click "Load unpacked".
4. Select `build/chrome-mv3-prod`.

## Verification

Run all tests:

```bash
npm.cmd test
```

Run TypeScript checks:

```bash
npm.cmd run typecheck
```

Run production build:

```bash
npm.cmd run build
```

## Manual Demo Checklist

- Open a long article and confirm it recommends scheduled reading.
- Open a short post and confirm it nudges toward reading now.
- Open a tool page and confirm it can be saved to toolbox with a usage note.
- Open docs and confirm it can become a task.
- Open a video, shopping page, paper, and news page to verify type classification.
- Save several links, then use dashboard search, sort, filter, batch discard, batch done, and batch summarize.
- Export saved links, then import the JSON and confirm URL dedupe keeps one record per URL.
- Click the "Probably not important" cleanup stat after seeding or importing old links.
- Change decision preferences in the dashboard and confirm long-article/stale-link behavior updates.
- Edit tags and notes in the dashboard.
- Test a hard-to-read page and confirm low extraction quality warning appears.

## Screenshots

Add screenshots here after loading the extension locally:

- Popup analysis state.
- Popup low-confidence or low-extraction-quality state.
- Dashboard with sample links.
- Dashboard batch cleanup workflow.
