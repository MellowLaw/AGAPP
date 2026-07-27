"""
System architecture diagram — one page, short-bond portrait.

LAYOUT NOTE (why the columns are ordered the way they are)
The external services sit in a column on the RIGHT, and the mobile app + API are
placed in the RIGHT column of the main area so that every API-to-external arrow
is a short horizontal hop. The first version put the API on the left with the
external services in a bottom row, which forced those arrows to cut straight
through the dashboard column and the whole data layer. Column order here is
deliberate: admin/dashboard left, mobile/API right, external further right.

Explicit exit/entry points are set on every edge. draw.io's default router does
not avoid obstacles, so without them the client-to-database arrows run through
whatever box happens to be between them.

WORDING: say "each LGU sees only its own records". Avoid the SaaS vocabulary for
this idea (the "multi-t*nant" / "t*nancy" family, spelled around here so a
find-and-replace sweep cannot reintroduce it) — it reads as though the platform
were a paid subscription product, which it is not.

Verified against the code (not assumed):
  * Both clients talk DIRECTLY to Supabase with the public anon key; Row-Level
    Security is the authorisation boundary, so the API is not a gateway.
  * The dashboard never calls the NestJS API — no API URL exists anywhere in
    apps/admin. Its privileged work runs in its own server-side handlers.
  * Chatbot fallback is Mistral (mistral-small-latest), NOT Gemini.
  * Face comparison runs in-process on the API host — no external call.
  * OCR.space is still wired but no client calls it since the address autofill
    was removed. Drawn dashed and labelled, not silently dropped.
"""
from __future__ import annotations

import xml.etree.ElementTree as ET

PAGE_W, PAGE_H = 850, 1100
MARGIN = 40

_BW = "fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;"
S_TIER = ("rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;align=left;spacingLeft=8;"
          "fillColor=none;strokeColor=#000000;dashed=1;dashPattern=6 4;"
          "fontColor=#000000;fontSize=10;fontStyle=1;")
S_NODE = "rounded=0;whiteSpace=wrap;html=1;" + _BW + "fontSize=11;"
S_EXT = "rounded=0;whiteSpace=wrap;html=1;" + _BW + "fontSize=10;"
S_STORE = ("shape=cylinder3;boundedLbl=1;whiteSpace=wrap;html=1;size=10;" + _BW +
           "fontSize=11;")
S_TITLE = ("text;html=1;align=left;verticalAlign=middle;strokeColor=none;fillColor=none;"
           "fontSize=13;fontStyle=1;fontColor=#000000;")
S_NOTE = ("text;html=1;align=left;verticalAlign=top;strokeColor=none;fillColor=none;"
          "fontSize=9;fontColor=#000000;")


def edge_style(exit_xy, entry_xy, dashed=False):
    ex, ey = exit_xy
    nx, ny = entry_xy
    s = ("edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#000000;"
         "endArrow=classic;fontSize=9;fontColor=#000000;labelBackgroundColor=#FFFFFF;"
         f"exitX={ex};exitY={ey};exitDx=0;exitDy=0;"
         f"entryX={nx};entryY={ny};entryDx=0;entryDy=0;")
    return s + "dashed=1;" if dashed else s


cells: list[tuple] = []
edges: list[tuple] = []


def box(cid, label, style, x, y, w, h):
    if x + w > PAGE_W - MARGIN or y + h > PAGE_H - MARGIN:
        raise ValueError(f"{cid}: overflows the page ({x + w}, {y + h})")
    cells.append((cid, label, style, x, y, w, h))


def link(cid, src, dst, label, exit_xy, entry_xy, dashed=False):
    edges.append((cid, src, dst, label, edge_style(exit_xy, entry_xy, dashed)))


box("title", "Figure — System Architecture", S_TITLE, MARGIN, 22, 700, 24)

# ── Client layer ────────────────────────────────────────────────────────────
box("t1", "USERS' APPLICATIONS", S_TIER, 40, 60, 560, 100)
box("admin", "LGU &amp; Super Admin&#10;Web Dashboard", S_NODE, 56, 90, 250, 58)
box("mobile", "Citizen Mobile App", S_NODE, 334, 90, 250, 58)

# ── Application layer ───────────────────────────────────────────────────────
box("t2", "APPLICATION SERVICES", S_TIER, 40, 182, 560, 130)
box("routes", "Dashboard server-side actions&#10;staff accounts · logo upload",
    S_NODE, 72, 212, 218, 86)
box("api", "AGAPP API&#10;chatbot · photo check&#10;face check · notifications",
    S_NODE, 350, 212, 218, 86)

# ── Data layer ──────────────────────────────────────────────────────────────
box("t3", "DATA AND ACCOUNTS", S_TIER, 40, 334, 560, 212)
box("supa", "Supabase — managed backend&#10;data access · sign-in · file storage · live updates",
    S_NODE, 56, 366, 528, 74)
box("pg", "PostgreSQL + PostGIS&#10;each LGU sees only its own records",
    S_STORE, 56, 464, 528, 72)

# ── External services (right column, beside the API that calls them) ────────
box("t4", "OUTSIDE SERVICES", S_TIER, 620, 60, 190, 486)
box("psgc", "Address lists&#10;(PSGC)", S_EXT, 634, 90, 162, 54)
box("rf", "Roboflow&#10;photo detection", S_EXT, 634, 164, 162, 54)
box("mi", "Mistral AI&#10;chatbot fallback", S_EXT, 634, 238, 162, 54)
box("push", "Expo push&#10;notifications", S_EXT, 634, 312, 162, 54)
box("ocr", "OCR.space&#10;(not in use)", S_EXT, 634, 386, 162, 54)

# ── Connections ─────────────────────────────────────────────────────────────
link("e1", "admin", "routes", "", (0.5, 1), (0.5, 0))
link("e2", "mobile", "api", "", (0.5, 1), (0.5, 0))
link("e3", "admin", "supa", "own LGU only", (0.05, 1), (0.05, 0))
link("e4", "mobile", "supa", "own data only", (1, 1), (0.95, 0))
link("e5", "routes", "supa", "service key", (0.5, 1), (0.3, 0))
link("e6", "api", "supa", "service key", (0.5, 1), (0.72, 0))
link("e7", "supa", "pg", "", (0.5, 1), (0.5, 0))
link("e8", "mobile", "psgc", "", (1, 0.5), (0, 0.5))
link("e9", "api", "rf", "", (1, 0.25), (0, 0.5))
link("e10", "api", "mi", "", (1, 0.5), (0, 0.5))
link("e11", "api", "push", "", (1, 0.75), (0, 0.5))
link("e12", "api", "ocr", "", (1, 0.95), (0, 0.5), dashed=True)

box("note",
    "How access is controlled. Both applications read and write the database directly "
    "using a public key, and PostgreSQL Row-Level Security limits every request to the "
    "records belonging to the signed-in person's own LGU and role — so the database, not "
    "the API, is where access is enforced.\n\n"
    "What the API is for. It is not a gateway in front of the database. It handles only "
    "the four jobs that cannot be expressed as a database query: the chatbot, the report "
    "photo check, the face comparison used in ID verification, and sending push "
    "notifications. The web dashboard does not use it at all — its privileged actions run "
    "on its own server side, where the administrative key is never exposed to the browser. "
    "Face comparison runs on the API host itself and sends nothing outside, keeping "
    "citizens' ID photographs within the system. The dashed line marks a text-reading "
    "service that is still connected but no longer used.",
    S_NOTE, MARGIN, 566, PAGE_W - 2 * MARGIN, 200)


def build(path: str) -> None:
    mxfile = ET.Element("mxfile", {"host": "app.diagrams.net", "type": "device"})
    diagram = ET.SubElement(mxfile, "diagram",
                            {"id": "ARCH", "name": "System Architecture"})
    model = ET.SubElement(diagram, "mxGraphModel", {
        "dx": "1100", "dy": "900", "grid": "1", "gridSize": "10", "guides": "1",
        "tooltips": "1", "connect": "1", "arrows": "1", "fold": "1",
        "page": "1", "pageScale": "1", "pageWidth": str(PAGE_W),
        "pageHeight": str(PAGE_H), "math": "0", "shadow": "0",
    })
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    ids = set()
    for cid, label, style, x, y, w, h in cells:
        ids.add(cid)
        c = ET.SubElement(root, "mxCell", {
            "id": cid, "value": label, "style": style, "vertex": "1", "parent": "1"})
        g = ET.SubElement(c, "mxGeometry", {
            "x": str(x), "y": str(y), "width": str(w), "height": str(h)})
        g.set("as", "geometry")

    for cid, src, dst, label, style in edges:
        for e in (src, dst):
            if e not in ids:
                raise ValueError(f"{cid}: unknown node {e!r}")
        c = ET.SubElement(root, "mxCell", {
            "id": cid, "value": label, "style": style, "edge": "1", "parent": "1",
            "source": src, "target": dst})
        g = ET.SubElement(c, "mxGeometry", {"relative": "1"})
        g.set("as", "geometry")

    ET.indent(mxfile, space="  ")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(ET.tostring(mxfile, encoding="unicode") + "\n")
    print(f"wrote {path}  (1 page, {len(cells)} nodes, {len(edges)} connections)")


if __name__ == "__main__":
    build("../05-System-Architecture.drawio")
