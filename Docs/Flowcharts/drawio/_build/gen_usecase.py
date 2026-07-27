"""
Generate UML use case diagrams as multi-page .drawio, one diagram per page.

Separate from gen.py because the geometry is different: a flowchart is a vertical
spine, a use case diagram is an actor beside a system-boundary box holding ovals.
The page-box enforcement is the same idea — an overflowing diagram is a build
error, not something discovered in print.

UML symbols (no colour):
    stick figure ......... actor
    oval ................. use case
    rectangle (label top)  system boundary
    solid line ........... association (actor takes part in the use case)
    dashed open arrow .... «include» dependency
    hollow triangle ...... actor generalization (inherits)

Shape names follow draw.io's own style reference (jgraph/drawio-mcp
shared/style-reference.md): shape=umlActor for the figure, ellipse for the use
case. Generalization uses endArrow=block;endFill=0, the UML hollow triangle.
"""
from __future__ import annotations

import xml.etree.ElementTree as ET
from dataclasses import dataclass, field

PAGE_W, PAGE_H = 850, 1100
MARGIN = 40
TITLE_H = 40

ACTOR_X, ACTOR_W, ACTOR_H = 56, 46, 78
BOX_X = 190                     # system boundary left edge
BOX_R = PAGE_W - MARGIN         # system boundary right edge
BOX_TOP = MARGIN + TITLE_H

UC_W, UC_H = 250, 58
UC_GAP = 16
COL_X = [BOX_X + 26, BOX_X + 26 + UC_W + 30]

_BW = "fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;"
S_ACTOR = ("shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;"
           "outlineConnect=0;" + _BW + "fontSize=11;")
S_UC = "ellipse;whiteSpace=wrap;html=1;" + _BW + "fontSize=11;"
S_BOX = ("rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fillColor=none;"
         "strokeColor=#000000;fontColor=#000000;fontSize=12;fontStyle=1;")
S_ASSOC = "endArrow=none;html=1;strokeColor=#000000;edgeStyle=none;"
S_INCLUDE = ("endArrow=open;endSize=10;dashed=1;html=1;strokeColor=#000000;"
             "fontColor=#000000;fontSize=10;edgeStyle=none;")
S_GEN = ("endArrow=block;endFill=0;endSize=12;html=1;strokeColor=#000000;"
         "edgeStyle=orthogonalEdgeStyle;")
S_TITLE = ("text;html=1;align=left;verticalAlign=middle;strokeColor=none;"
           "fillColor=none;fontSize=13;fontStyle=1;fontColor=#000000;")
S_NOTE = ("text;html=1;align=left;verticalAlign=top;strokeColor=none;"
          "fillColor=none;fontSize=10;fontColor=#000000;")


@dataclass
class UseCaseDiagram:
    uid: str
    title: str
    actor: str
    system: str
    cases: list[str]
    includes: list[tuple[str, str]] = field(default_factory=list)
    note: str | None = None
    cols: int = 1


def _render(d: UseCaseDiagram) -> ET.Element:
    n = len(d.cases)
    cols = d.cols if d.cols in (1, 2) else 1
    rows = (n + cols - 1) // cols

    note_h = 46 if d.note else 0
    box_h = rows * UC_H + (rows - 1) * UC_GAP + 60
    box_bottom = BOX_TOP + box_h
    if box_bottom + note_h > PAGE_H - MARGIN:
        raise ValueError(
            f"{d.uid}: {n} use cases in {cols} column(s) need {box_bottom + note_h}px, "
            f"page allows {PAGE_H - MARGIN}. Use cols=2 or split the diagram."
        )

    diagram = ET.Element("diagram", {"id": d.uid, "name": d.title})
    model = ET.SubElement(diagram, "mxGraphModel", {
        "dx": "1100", "dy": "900", "grid": "1", "gridSize": "10", "guides": "1",
        "tooltips": "1", "connect": "1", "arrows": "1", "fold": "1",
        "page": "1", "pageScale": "1",
        "pageWidth": str(PAGE_W), "pageHeight": str(PAGE_H), "math": "0", "shadow": "0",
    })
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    def vertex(cid, value, style, x, y, w, h):
        c = ET.SubElement(root, "mxCell", {
            "id": cid, "value": value, "style": style, "vertex": "1", "parent": "1"})
        g = ET.SubElement(c, "mxGeometry", {
            "x": f"{x:.0f}", "y": f"{y:.0f}", "width": f"{w:.0f}", "height": f"{h:.0f}"})
        g.set("as", "geometry")

    def edge(cid, style, src, dst, value=""):
        c = ET.SubElement(root, "mxCell", {
            "id": cid, "value": value, "style": style, "edge": "1", "parent": "1",
            "source": src, "target": dst})
        g = ET.SubElement(c, "mxGeometry", {"relative": "1"})
        g.set("as", "geometry")

    vertex(f"{d.uid}-t", d.title, S_TITLE, MARGIN, MARGIN - 12, 700, 26)
    vertex(f"{d.uid}-box", d.system, S_BOX, BOX_X, BOX_TOP, BOX_R - BOX_X, box_h)

    actor_y = BOX_TOP + box_h / 2 - ACTOR_H / 2
    vertex(f"{d.uid}-actor", d.actor, S_ACTOR, ACTOR_X, actor_y, ACTOR_W, ACTOR_H)

    ids: dict[str, str] = {}
    for i, label in enumerate(d.cases):
        col, row = (i % cols, i // cols) if cols == 2 else (0, i)
        x = COL_X[col] if cols == 2 else BOX_X + (BOX_R - BOX_X - UC_W) / 2
        y = BOX_TOP + 42 + row * (UC_H + UC_GAP)
        cid = f"{d.uid}-uc{i}"
        ids[label] = cid
        vertex(cid, label, S_UC, x, y, UC_W, UC_H)
        edge(f"{d.uid}-a{i}", S_ASSOC, f"{d.uid}-actor", cid)

    for j, (src, dst) in enumerate(d.includes):
        for e in (src, dst):
            if e not in ids:
                raise ValueError(f"{d.uid}: «include» references unknown use case {e!r}")
        edge(f"{d.uid}-i{j}", S_INCLUDE, ids[src], ids[dst], "&laquo;include&raquo;")

    if d.note:
        vertex(f"{d.uid}-note", d.note, S_NOTE, MARGIN, box_bottom + 12,
               PAGE_W - 2 * MARGIN, 40)
    return diagram


@dataclass
class ActorHierarchy:
    """A page showing only actors and their generalization arrows."""
    uid: str
    title: str
    actors: dict[str, tuple[int, int]]          # name -> (x, y)
    generalizations: list[tuple[str, str]]      # (child, parent)
    note: str | None = None


def _render_hierarchy(h: ActorHierarchy) -> ET.Element:
    diagram = ET.Element("diagram", {"id": h.uid, "name": h.title})
    model = ET.SubElement(diagram, "mxGraphModel", {
        "dx": "1100", "dy": "900", "grid": "1", "gridSize": "10", "guides": "1",
        "tooltips": "1", "connect": "1", "arrows": "1", "fold": "1",
        "page": "1", "pageScale": "1",
        "pageWidth": str(PAGE_W), "pageHeight": str(PAGE_H), "math": "0", "shadow": "0",
    })
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    c = ET.SubElement(root, "mxCell", {
        "id": f"{h.uid}-t", "value": h.title, "style": S_TITLE, "vertex": "1", "parent": "1"})
    g = ET.SubElement(c, "mxGeometry", {"x": str(MARGIN), "y": str(MARGIN - 12),
                                        "width": "700", "height": "26"})
    g.set("as", "geometry")

    ids = {}
    for name, (x, y) in h.actors.items():
        cid = f"{h.uid}-{abs(hash(name)) % 100000}"
        ids[name] = cid
        cc = ET.SubElement(root, "mxCell", {
            "id": cid, "value": name, "style": S_ACTOR, "vertex": "1", "parent": "1"})
        gg = ET.SubElement(cc, "mxGeometry", {"x": str(x), "y": str(y),
                                             "width": str(ACTOR_W), "height": str(ACTOR_H)})
        gg.set("as", "geometry")
        if y + ACTOR_H + 30 > PAGE_H - MARGIN:
            raise ValueError(f"{h.uid}: actor {name!r} overflows the page")

    for i, (child, parent) in enumerate(h.generalizations):
        for e in (child, parent):
            if e not in ids:
                raise ValueError(f"{h.uid}: generalization references unknown actor {e!r}")
        cc = ET.SubElement(root, "mxCell", {
            "id": f"{h.uid}-g{i}", "value": "", "style": S_GEN, "edge": "1", "parent": "1",
            "source": ids[child], "target": ids[parent]})
        gg = ET.SubElement(cc, "mxGeometry", {"relative": "1"})
        gg.set("as", "geometry")

    if h.note:
        cc = ET.SubElement(root, "mxCell", {
            "id": f"{h.uid}-note", "value": h.note, "style": S_NOTE,
            "vertex": "1", "parent": "1"})
        gg = ET.SubElement(cc, "mxGeometry", {"x": str(MARGIN), "y": str(PAGE_H - MARGIN - 70),
                                             "width": str(PAGE_W - 2 * MARGIN), "height": "60"})
        gg.set("as", "geometry")
    return diagram


def write_usecases(path: str, pages: list) -> None:
    mxfile = ET.Element("mxfile", {"host": "app.diagrams.net", "type": "device"})
    for p in pages:
        mxfile.append(_render_hierarchy(p) if isinstance(p, ActorHierarchy) else _render(p))
    ET.indent(mxfile, space="  ")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(ET.tostring(mxfile, encoding="unicode") + "\n")
    print(f"wrote {path}  ({len(pages)} pages)")
