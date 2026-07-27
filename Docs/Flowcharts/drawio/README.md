# AGAPP Flowcharts (draw.io)

Generated 2026-07-26 from the current code, superseding `../01-`, `../02-`, `../03-*.md`.
Those Mermaid versions are **stale** — they still show LGU Personnel being redirected
away from `/lgu/*` and include charts for `/personnel/dashboard` and
`/personnel/reports`, both of which are now redirects.

| File | Pages | Covers |
|---|---|---|
| `01-Citizen-App.drawio` | 17 | Mobile app — guest, sign-up, tabs, services, reports, forum, profile, verification, moderation |
| `02-LGU-Admin.drawio` | 15 | Admin panel for an LGU Admin / Personnel, per-module |
| `03-Super-Admin.drawio` | 8 | Cross-LGU console, analytics and LGU onboarding |
| `04-Use-Case-Diagrams.drawio` | 7 | UML use case diagram per actor, plus the actor inheritance overview |
| `05-System-Architecture.drawio` | 1 | Four-layer system architecture with verified integration paths |

Caption text for every page of all five files is in `FIGURE-DESCRIPTIONS.md`.

Every page is **850 × 1100 px = 8.5in × 11in (short bond, portrait)**, one chart per
page, so File → Export as → PDF gives one chart per sheet.

## Symbols

| Symbol | Meaning |
|---|---|
| Rounded rectangle | Start / End terminator |
| Rectangle | Process / action |
| Parallelogram | Input / output — a screen, form or report |
| Diamond | Decision |
| Circle | **On-page** connector — jump within the same page (only `1A`, the login retry) |
| Inverted pentagon | **Off-page** connector — flow continues on a different page |

Black on white, no fills or accent colours.

**Both ends of a jump use the same symbol.** Because each chart is its own page,
almost every jump here crosses pages and so is a pentagon at the exit *and* at the
arrival. The one true on-page connector is `1A` (failed login → back to the form,
same page), drawn as a circle.

| Label | Meaning |
|---|---|
| `1`, `2`, `3` … | Jump to the page whose title starts with that number |
| `1A` | Login failed — back to the login form (same page) |
| `A`, `B` | This same flow continues on the next page |
| `AA` | Return to the main interface / tabs |

Every connector is validated at build time: numbered ones must match a real page, and
**every label must have both an exit and an arrival**. The first build shipped an `AA`
that 35 pages returned to and no page received — that check now makes it a build error.

## Editing

Charts are generated, so **edit the spec, not the .drawio** — a hand edit is lost on
the next build.

```bash
cd _build
python spec_usecases.py     # -> ../04-Use-Case-Diagrams.drawio
python spec_architecture.py # -> ../05-System-Architecture.drawio
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

## Gap found while charting, since fixed

`/super/analytics` existed as a page but had **no inbound link anywhere** in the admin
app — reachable only by typing the URL. Fixed by adding it to `SUPER_ADMIN_NAV` in
`components/layout/Sidebar.tsx`, so it is now a normal menu entry between LGU Directory
and Settings. The Super Admin menu charts renumbered accordingly
(3 = Analytics, 4 = Settings, 5 = Logout).
