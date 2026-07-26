"""
Generate multi-page .drawio flowcharts from a compact spec.

Why a generator instead of hand-written XML: there are ~130 charts across three
roles. Writing mxGraph XML by hand drifts in styling and, more importantly, in
SIZE — the whole requirement is that every chart prints readably on one bond
page. Here the page box is enforced: layout() raises if a chart overflows, so an
oversized chart is a build error rather than something you discover in print.

Conventions (ANSI/ISO flowchart symbols, no colour — black on white):
    term  rounded rectangle .... Start / End terminator
    proc  rectangle .............. process / action
    io    parallelogram .......... input / output (a screen, a form, a report)
    dec   diamond ................ decision
    on    circle ................. ON-page connector   (A, AA, 1A ...)
    off   inverted pentagon ...... OFF-page connector  (1, 2, 3 ...)

Off-page shape name is `offPageConnector`, per draw.io's own style reference
(shared/style-reference.md in jgraph/drawio-mcp). The `mxgraph.flowchart.*`
prefix some sources suggest is NOT needed and renders as a plain box.
"""
from __future__ import annotations

import html
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field

# ── Page geometry ───────────────────────────────────────────────────────────
# 850x1100 @100dpi == 8.5in x 11in, i.e. short bond / US Letter portrait.
# For long bond (8.5x13) set PAGE_H = 1300.
PAGE_W, PAGE_H = 850, 1100
MARGIN = 40
TITLE_H = 34            # room for the chart caption at the top

SPINE_X = [120, 470]    # left edge of the decision spine, per column
SIDE_DX = 250           # how far right of the spine a branch target sits
V_GAP = 34              # vertical gap between spine nodes

# ── Shape styles ────────────────────────────────────────────────────────────
_BW = "fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;"
SHAPES = {
    "term": (dict(w=150, h=42), "rounded=1;arcSize=50;whiteSpace=wrap;html=1;" + _BW + "fontSize=11;"),
    "proc": (dict(w=190, h=50), "rounded=0;whiteSpace=wrap;html=1;" + _BW + "fontSize=11;"),
    "io":   (dict(w=190, h=48), "shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;"
                                "whiteSpace=wrap;html=1;" + _BW + "fontSize=11;"),
    "dec":  (dict(w=190, h=80), "rhombus;whiteSpace=wrap;html=1;" + _BW + "fontSize=11;"),
    "on":   (dict(w=44,  h=44), "ellipse;whiteSpace=wrap;html=1;aspect=fixed;" + _BW + "fontSize=11;"),
    "off":  (dict(w=64,  h=54), "shape=offPageConnector;whiteSpace=wrap;html=1;size=0.5;" + _BW + "fontSize=11;"),
}
EDGE_STYLE = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#000000;endArrow=classic;fontSize=10;"
TITLE_STYLE = "text;html=1;align=left;verticalAlign=middle;strokeColor=none;fillColor=none;fontSize=13;fontStyle=1;fontColor=#000000;"


@dataclass
class Node:
    nid: str
    kind: str
    label: str
    col: int = 0            # which spine column
    side: bool = False      # sits to the RIGHT of the spine (a branch exit)
    at: str | None = None   # align vertically with this spine node (side only)
    w: int | None = None    # narrow a side node so it clears the next column


@dataclass
class Chart:
    cid: str
    title: str
    nodes: list[Node]
    edges: list[tuple] = field(default_factory=list)   # (src, dst, label)


def layout(chart: Chart) -> dict[str, dict]:
    """Assign x/y to every node. Raises if the result overflows the page."""
    pos: dict[str, dict] = {}
    y = {0: MARGIN + TITLE_H, 1: MARGIN + TITLE_H}

    # Spine nodes first, top to bottom within each column.
    for n in chart.nodes:
        if n.side:
            continue
        w, h = SHAPES[n.kind][0]["w"], SHAPES[n.kind][0]["h"]
        spine_left = SPINE_X[n.col]
        cx = spine_left + SHAPES["dec"][0]["w"] / 2      # centre on the widest shape
        pos[n.nid] = dict(x=cx - w / 2, y=y[n.col], w=w, h=h)
        y[n.col] += h + V_GAP

    used_cols = {n.col for n in chart.nodes}

    # Branch targets, vertically centred on the node they exit from.
    for n in chart.nodes:
        if not n.side:
            continue
        w = n.w or SHAPES[n.kind][0]["w"]
        h = SHAPES[n.kind][0]["h"]
        anchor = pos.get(n.at or "")
        if anchor is None:
            raise ValueError(f"{chart.cid}: side node {n.nid!r} needs a valid at=")
        x = SPINE_X[n.col] + SIDE_DX
        # A branch box must not run into the next spine column. Caught here
        # rather than visually, because an overlap is invisible in raw XML.
        if n.col + 1 in used_cols and x + w > SPINE_X[n.col + 1] - 10:
            raise ValueError(
                f"{chart.cid}: side node {n.nid!r} (width {w}) collides with column "
                f"{n.col + 1} at x={SPINE_X[n.col + 1]}. Narrow it with w=, put it on "
                f"the spine, or split the chart."
            )
        pos[n.nid] = dict(x=x, y=anchor["y"] + anchor["h"] / 2 - h / 2, w=w, h=h)

    # Enforce the page box — this is the whole point of generating.
    for nid, p in pos.items():
        if p["y"] + p["h"] > PAGE_H - MARGIN:
            raise ValueError(
                f"{chart.cid}: overflows page height at {nid!r} "
                f"(bottom {p['y'] + p['h']:.0f} > {PAGE_H - MARGIN}). Split the chart."
            )
        if p["x"] + p["w"] > PAGE_W - MARGIN:
            raise ValueError(
                f"{chart.cid}: overflows page width at {nid!r} "
                f"(right {p['x'] + p['w']:.0f} > {PAGE_W - MARGIN})."
            )
    return pos


def render_page(chart: Chart) -> ET.Element:
    pos = layout(chart)
    diagram = ET.Element("diagram", {"id": chart.cid, "name": chart.title})
    model = ET.SubElement(diagram, "mxGraphModel", {
        "dx": "1100", "dy": "900", "grid": "1", "gridSize": "10", "guides": "1",
        "tooltips": "1", "connect": "1", "arrows": "1", "fold": "1",
        "page": "1", "pageScale": "1",
        "pageWidth": str(PAGE_W), "pageHeight": str(PAGE_H),
        "math": "0", "shadow": "0",
    })
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    def cell(cid, value, style, geo=None, **kw):
        attrs = {"id": cid, "value": value, "style": style, "parent": "1"}
        attrs.update(kw)
        c = ET.SubElement(root, "mxCell", attrs)
        g = ET.SubElement(c, "mxGeometry", geo or {})
        g.set("as", "geometry")
        return c

    cell(f"{chart.cid}-title", chart.title, TITLE_STYLE,
         {"x": str(MARGIN), "y": str(MARGIN - 10), "width": "700", "height": "26"}, vertex="1")

    for n in chart.nodes:
        p = pos[n.nid]
        cell(f"{chart.cid}-{n.nid}", n.label, SHAPES[n.kind][1],
             {"x": f"{p['x']:.0f}", "y": f"{p['y']:.0f}",
              "width": f"{p['w']:.0f}", "height": f"{p['h']:.0f}"}, vertex="1")

    known = {n.nid for n in chart.nodes}
    for i, (src, dst, lbl) in enumerate(chart.edges):
        for e in (src, dst):
            if e not in known:
                raise ValueError(f"{chart.cid}: edge references unknown node {e!r}")
        c = ET.SubElement(root, "mxCell", {
            "id": f"{chart.cid}-e{i}", "value": lbl, "style": EDGE_STYLE,
            "edge": "1", "parent": "1",
            "source": f"{chart.cid}-{src}", "target": f"{chart.cid}-{dst}",
        })
        g = ET.SubElement(c, "mxGeometry", {"relative": "1"})
        g.set("as", "geometry")
    return diagram


def write_file(path: str, charts: list[Chart]) -> None:
    mxfile = ET.Element("mxfile", {"host": "app.diagrams.net", "type": "device"})
    for ch in charts:
        mxfile.append(render_page(ch))
    ET.indent(mxfile, space="  ")
    xml = ET.tostring(mxfile, encoding="unicode")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(xml + "\n")
    print(f"wrote {path}  ({len(charts)} pages)")
