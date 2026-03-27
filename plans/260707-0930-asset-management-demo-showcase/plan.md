---
title: Asset Management Demo Showcase (show-off)
status: in-progress
priority: P2
effort: medium
branch: master
tags: [showcase, demo, html, bilingual]
created: 2026-07-07
---

# Show-off Mission: asset-management-demo

Standalone bilingual (VI/EN) demo HTML page showcasing the Asset & Office Supplies Management app for stakeholder review.

## Invocation Args

- Mission name: `asset-management-demo`
- Assets root: `assets/showoff/asset-management-demo/`
- Context sources: `docs/` + running app UI at `http://localhost:3000/`
- Target sections (2–6 incl. hero): hero, product overview + personas, features + use cases, UI walkthrough (screenshots), architecture, demo script + outcomes/limitations
- Languages: Vietnamese & English (toggle)
- Output: single self-contained HTML, inline CSS/JS, theme toggle (system/light/dark)
- Purpose: showcase, social posting, article illustration images

## Checklist

- [x] 1. Request analysis + read docs (project-overview-pdr, system-architecture, design-guidelines)
- [x] 2. Capture running app UI screenshots from http://localhost:3000/ (6 pages, seed admin login)
- [x] 3. Fact-check / supporting research (4 citations: Sage ×2, AssetCues, Wasp Barcode)
- [x] 4. Write showcase content at `assets/showoff/asset-management-demo/content.md` (VI/EN, citations)
- [x] 5. Build showcase HTML via `frontend-design` skill (6 sections, parallax, theme toggle, bilingual; verified 16:9 + 9:16 + VI mode)
- [x] 6. Capture section images via `capture-sections.js` → 18 images (6 sections × 3 ratios; needed `--executable-path` to agent-browser Chrome)
- [ ] 7. Publish via `agentwiki` CLI — **BLOCKED: agentwiki not installed on PATH**
- [x] 8. Open resulting HTML page (`open` CLI)

## Notes

- Do not invent unsupported product details; mark assumptions.
- Each section fits viewport; responsive 16:9 / 9:16 / 1:1.
