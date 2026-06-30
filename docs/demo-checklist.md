# Demo Checklist

Use this checklist before recording a walkthrough, taking screenshots, or sharing the project.

## Prepare The Extension

1. Run `npm.cmd install` if dependencies are missing.
2. Run `npm.cmd test`.
3. Run `npm.cmd run typecheck`.
4. Run `npm.cmd run build`.
5. Open `chrome://extensions`, enable Developer Mode, and load `build/chrome-mv3-prod`.

## Seed A Walkthrough Dataset

1. Open the dashboard.
2. Click `Add demo links` in the Demo readiness panel.
3. Confirm every Demo readiness check is green:
   - Content type coverage.
   - Workflow status coverage.
   - Review Mode material.
   - Topic Group material.
   - Usage Intelligence material.
   - Issue badge examples.

## Capture The Core Story

1. Popup analyzes a long article and recommends scheduling it.
2. Popup shows confidence, reasons, reading time, and debt score.
3. Popup lets the user add tags, add a note, correct type, save, undo, or open the dashboard.
4. Dashboard shows weekly cleanup stats and the Demo readiness panel.
5. Review Mode processes one link at a time and ends with a cleanup summary.
6. Topic Groups recommend reading only the strongest links and routing the rest.
7. Usage Intelligence shows opened-this-week, never-opened, stale unopened, and high-debt unopened counts.
8. Opening a link from the dashboard updates `lastOpenedAt` and the opened-recently badge.
9. Popup warns before saving another page similar to an existing unresolved topic.
10. Search, sort, batch actions, tags, notes, import, and export all remain available.

## Screenshot List

- Popup analysis state.
- Popup post-save action state.
- Dashboard with demo data and readiness checks.
- Review Mode active card.
- Review Mode completion summary.
- Topic Groups recommendations.
- Usage Intelligence stats and behavior filters.
- Link list with high debt, low confidence, and hard-to-read badges.
