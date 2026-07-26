# AGAPP Flowcharts (draw.io)

Generated 2026-07-26 from the current code, superseding `../01-`, `../02-`, `../03-*.md`.
Those Mermaid versions are **stale** — they still show LGU Personnel being redirected
away from `/lgu/*` and include charts for `/personnel/dashboard` and
`/personnel/reports`, both of which are now redirects.

| File | Pages | Covers |
|---|---|---|
| `01-Citizen-App.drawio` | 17 | Mobile app — guest, sign-up, tabs, services, reports, forum, profile, verification, moderation |
| `02-LGU-Admin.drawio` | 15 | Admin panel for an LGU Admin / Personnel, per-module |
| `03-Super-Admin.drawio` | 6 | Cross-LGU console and LGU onboarding |

Every page is **850 × 1100 px = 8.5in × 11in (short bond, portrait)**, one chart per
page, so File → Export as → PDF gives one chart per sheet.

## Symbols

| Symbol | Meaning |
|---|---|
| Rounded rectangle | Start / End terminator |
| Rectangle | Process / action |
| Parallelogram | Input / output — a screen, form or report |
| Diamond | Decision |
| Circle | **On-page** connector (`A`, `AA`, `1A`) |
| Inverted pentagon | **Off-page** connector (`1`, `2`, `3` …) |

Black on white, no fills or accent colours.

Numbered off-page connectors point at the page whose title starts with that number —
e.g. `4` on the main flow continues on the page titled `4 — Report an Issue`. `AA`
returns to the main interface. Every connector is checked against an existing page at
build time.

## Editing

Charts are generated, so **edit the spec, not the .drawio** — a hand edit is lost on
the next build.

```bash
cd _build
python spec_citizen.py      # -> ../01-Citizen-App.drawio
python spec_lgu_admin.py    # -> ../02-LGU-Admin.drawio
python spec_super_admin.py  # -> ../03-Super-Admin.drawio
```

`gen.py` holds the layout engine and enforces two rules that a hand-drawn chart
silently breaks:

1. **Page box** — a chart that would run past the printable area is a build error,
   not something you find out about in print.
2. **Column collision** — a branch box that would overlap the next spine column is
   rejected. In a two-column chart only narrow connectors fit beside the spine; wide
   boxes must go on the spine or the chart must be split.

Both fired during this build (the Citizens & Moderation and Main Interface pages were
split as a result), which is the point of generating rather than hand-drawing.

For long bond (8.5in × 13in) set `PAGE_H = 1300` in `gen.py` and rebuild all three.

## Known gap recorded in the charts

`/super/analytics` exists as a page but has **no inbound link anywhere** in the admin
app — reachable only by typing the URL. `03-Super-Admin.drawio` page `1` states this
rather than implying a menu entry that does not exist. Either link it from the Super
Admin dashboard or drop the page.
