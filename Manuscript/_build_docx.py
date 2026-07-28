"""
Render AGAPP-Chapter-1-2-REVISED.md to a formatted .docx.

Format follows the reference capstone (MANUSCRIPT CHAP 1-3 OSAS):
  * letter paper, 1.5in left margin (binding edge), 1in elsewhere
  * double-spaced, justified body with a 0.5in first-line indent
  * chapter titles centred, bold, all caps
  * section headings bold, flush left, not indented
  * page number in the top-right header

FONT is a single constant below. Arial, per the user, matching the reference paper's
rendered face (its fonts are outlined, so the face cannot be read back from the file
itself -- this was confirmed by eye against the rendered pages).
"""
import re
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

FONT = "Arial"
SIZE = Pt(12)
SRC = "AGAPP-Chapter-1-2-REVISED.md"
OUT = "AGAPP-Chapter-1-2-REVISED.docx"


def add_page_number_header(section):
    """Right-aligned live page-number field in the header."""
    p = section.header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = p.add_run()
    for instr, kind in (("begin", "fldCharType"), (None, "instrText"), ("end", "fldCharType")):
        if kind == "instrText":
            el = OxmlElement("w:instrText")
            el.set(qn("xml:space"), "preserve")
            el.text = "PAGE"
        else:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), instr)
        run._r.append(el)
    run.font.name = FONT
    run.font.size = SIZE


def style_doc(doc):
    st = doc.styles["Normal"]
    st.font.name = FONT
    st.font.size = SIZE
    st.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    pf = st.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    pf.space_after = Pt(0)
    pf.space_before = Pt(0)

    for s in doc.sections:
        s.left_margin = Inches(1.5)
        s.right_margin = Inches(1.0)
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        add_page_number_header(s)


BOLD_RE = re.compile(r"\*\*(.+?)\*\*")


def emit_runs(par, text):
    """Write text into a paragraph, honouring **bold** spans."""
    pos = 0
    for m in BOLD_RE.finditer(text):
        if m.start() > pos:
            par.add_run(text[pos:m.start()])
        par.add_run(m.group(1)).bold = True
        pos = m.end()
    if pos < len(text):
        par.add_run(text[pos:])


def para(doc, text, *, align=None, indent=None, left=None, bold=False, caps=False):
    p = doc.add_paragraph()
    if align is not None:
        p.alignment = align
    pf = p.paragraph_format
    if indent is not None:
        pf.first_line_indent = indent
    if left is not None:
        pf.left_indent = left
    if bold:
        r = p.add_run(text.upper() if caps else text)
        r.bold = True
    else:
        emit_runs(p, text)
    return p


NUM_RE = re.compile(r"^(\d+)\.\s+(.*)$")
LET_RE = re.compile(r"^([a-z])\)\s+(.*)$")

def build():
    lines = open(SRC, encoding="utf-8").read().split("\n")
    doc = Document()
    style_doc(doc)

    for raw in lines:
        line = raw.rstrip()
        s = line.strip()

        if not s:
            continue

        if s == "---":                                   # chapter break
            doc.add_page_break()
            continue

        if s.startswith("#### "):                        # sub-section heading
            para(doc, s[5:], bold=True)
            continue
        if s.startswith("### "):                         # section heading
            para(doc, s[4:], bold=True)
            continue
        if s.startswith("## "):                          # chapter subtitle
            para(doc, s[3:], align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, caps=True)
            continue
        if s.startswith("# "):                           # chapter title
            para(doc, s[2:], align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, caps=True)
            continue

        if s.startswith("**[Figure") or s.startswith("[Figure"):
            para(doc, s.strip("*"), align=WD_ALIGN_PARAGRAPH.CENTER, bold=True)
            continue

        m = NUM_RE.match(s)                              # "1. ..."
        if m:
            para(doc, f"{m.group(1)}. {m.group(2)}",
                 align=WD_ALIGN_PARAGRAPH.JUSTIFY,
                 left=Inches(0.5), indent=Inches(-0.25))
            continue

        m = LET_RE.match(s)                              # "a) ..."
        if m:
            para(doc, f"{m.group(1)}) {m.group(2)}",
                 align=WD_ALIGN_PARAGRAPH.JUSTIFY,
                 left=Inches(1.0), indent=Inches(-0.25))
            continue

        # ordinary body paragraph
        para(doc, s, align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=Inches(0.5))

    doc.save(OUT)
    print("wrote", OUT)


if __name__ == "__main__":
    build()
