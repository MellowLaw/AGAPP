"""
LGU Admin & Personnel flowcharts — one chart per page, short-bond portrait.

Derived from the current code in agapp-system/apps/admin/src, NOT from the older
Docs/Flowcharts/*.md charts, which are stale: they still show personnel being
redirected away from /lgu/* and include pages for /personnel/dashboard and
/personnel/reports, both of which are now redirects. Access is per-module
(users.module_permissions, enforced by staff_can() in RLS).
"""
from gen import Chart, Node as N, write_file

# ── Page 1: main flow (mirrors the reference: login -> menu -> off-page exits) ─
main = Chart("L0", "LGU Admin — Main Flow", nodes=[
    N("start", "term", "Start"),
    N("login", "io",   "Log In&#10;Email / Password"),
    N("chk",   "dec",  "Is email and&#10;password correct?"),
    N("bad",   "on",   "1A", side=True, at="chk"),
    # Arrival point for AA — every module page returns here.
    N("aaIn",  "off",  "AA", side=True, at="main"),
    N("main",  "io",   "Main Interface"),
    N("d1",    "dec",  "If Dashboard?"),
    N("o1",    "off",  "1", side=True, at="d1"),
    N("d2",    "dec",  "If Issue Reports?"),
    N("o2",    "off",  "2", side=True, at="d2"),
    N("d3",    "dec",  "If Service&#10;Requests?"),
    N("o3",    "off",  "3", side=True, at="d3"),
    N("d4",    "dec",  "If eServices&#10;Catalog?"),
    N("o4",    "off",  "4", side=True, at="d4"),
    N("toA",   "off",   "A"),
    # column 2
    N("fromA", "off",   "A", col=1),
    N("d5",    "dec",  "If Community&#10;and News?", col=1),
    N("o5",    "off",  "5", col=1, side=True, at="d5"),
    N("d6",    "dec",  "If Forum?", col=1),
    N("o6",    "off",  "6", col=1, side=True, at="d6"),
    N("d7",    "dec",  "If Facilities?", col=1),
    N("o7",    "off",  "7", col=1, side=True, at="d7"),
    N("d8",    "dec",  "If Citizen Guide?", col=1),
    N("o8",    "off",  "8", col=1, side=True, at="d8"),
    N("d9",    "dec",  "If Citizens and&#10;Moderation?", col=1),
    N("o9",    "off",  "9", col=1, side=True, at="d9"),
    N("toB",   "off",   "B", col=1),
], edges=[
    ("start", "login", ""), ("login", "chk", ""),
    ("chk", "bad", "No"), ("bad", "login", ""),
    ("chk", "main", "Yes"),
    ("aaIn", "main", ""),
    ("main", "d1", ""),
    ("d1", "o1", "Yes"), ("d1", "d2", "No"),
    ("d2", "o2", "Yes"), ("d2", "d3", "No"),
    ("d3", "o3", "Yes"), ("d3", "d4", "No"),
    ("d4", "o4", "Yes"), ("d4", "toA", "No"),
    ("fromA", "d5", ""),
    ("d5", "o5", "Yes"), ("d5", "d6", "No"),
    ("d6", "o6", "Yes"), ("d6", "d7", "No"),
    ("d7", "o7", "Yes"), ("d7", "d8", "No"),
    ("d8", "o8", "Yes"), ("d8", "d9", "No"),
    ("d9", "o9", "Yes"), ("d9", "toB", "No"),
])

# ── Page 2: rest of the menu ─────────────────────────────────────────────────
main2 = Chart("L0b", "LGU Admin — Main Flow (continued)", nodes=[
    N("fromB", "off",  "B"),
    N("d10",   "dec", "If Verifications?"),
    N("o10",   "off", "10", side=True, at="d10"),
    N("d11",   "dec", "If Settings?"),
    N("o11",   "off", "11", side=True, at="d11"),
    N("adm",   "dec", "Is the account&#10;an LGU Admin?"),
    N("deny",  "proc", "Redirected —&#10;Settings is admin only"),
    N("d12",   "dec", "If Logout?"),
    N("o12",   "off", "12", side=True, at="d12"),
    N("back",  "off",  "AA"),
], edges=[
    ("fromB", "d10", ""),
    ("d10", "o10", "Yes"), ("d10", "d11", "No"),
    ("d11", "adm", "Yes"), ("d11", "d12", "No"),
    ("adm", "o11", "Yes"), ("adm", "deny", "No"),
    ("deny", "d12", ""),
    ("d12", "o12", "Yes"), ("d12", "back", "No"),
])

# ── Module pages (the off-page targets) ──────────────────────────────────────
p1 = Chart("L1", "1 — Dashboard", nodes=[
    N("i",  "off",   "1"),
    N("g",  "dec",  "Holds the&#10;dashboard module?"),
    N("no", "proc", "Redirected to a&#10;granted module"),
    N("ld", "proc", "Load counts for this LGU:&#10;reports, requests, verifications"),
    N("sh", "io",   "Dashboard —&#10;totals and map"),
    N("q",  "dec",  "Opens a&#10;summary card?"),
    N("jump", "proc", "Jump to that module's list"),
    N("o",  "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "sh", ""), ("sh", "q", ""),
    ("q", "jump", "Yes"), ("jump", "o", ""), ("q", "o", "No"),
])

p2 = Chart("L2", "2 — Issue Reports", nodes=[
    N("i",   "off",   "2"),
    N("g",   "dec",  "Holds the&#10;reports module?"),
    N("no",  "proc", "Redirected"),
    N("ld",  "proc", "Load this LGU's reports&#10;(RLS scoped)"),
    N("sh",  "io",   "Report list, map&#10;and detail panel"),
    N("q",   "dec",  "Change status or&#10;assign an office?"),
    N("cas", "proc", "Write only if the status&#10;is still what was read"),
    N("cf",  "dec",  "Was it changed by&#10;someone else first?"),
    N("warn", "proc", "Refuse the write, warn,&#10;and refresh the list", side=True, at="cf"),
    N("ok",  "proc", "Apply and notify the citizen"),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "sh", ""), ("sh", "q", ""),
    ("q", "cas", "Yes"), ("q", "o", "No"),
    ("cas", "cf", ""), ("cf", "warn", "Yes"), ("warn", "o", ""),
    ("cf", "ok", "No"), ("ok", "o", ""),
])

p3 = Chart("L3", "3 — Service Requests", nodes=[
    N("i",   "off",   "3"),
    N("g",   "dec",  "Holds the&#10;services module?"),
    N("no",  "proc", "Redirected"),
    N("ld",  "io",   "Request queue&#10;and detail panel"),
    N("q",   "dec",  "Which action?"),
    N("st",  "proc", "Advance status&#10;(guarded write)", side=True, at="q"),
    N("rdy", "dec",  "Mark ready&#10;for pickup?"),
    N("code", "proc", "Generate claim code&#10;and notify the citizen", side=True, at="rdy"),
    N("rel", "dec",  "Release the document?"),
    N("done", "proc", "Verify claim code,&#10;record release", side=True, at="rel"),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "q", ""),
    ("q", "st", "Status"), ("st", "o", ""),
    ("q", "rdy", "Other"),
    ("rdy", "code", "Yes"), ("code", "o", ""),
    ("rdy", "rel", "No"),
    ("rel", "done", "Yes"), ("done", "o", ""), ("rel", "o", "No"),
])

p4 = Chart("L4", "4 — eServices Catalog", nodes=[
    N("i",  "off",   "4"),
    N("g",  "dec",  "Holds the eServices&#10;catalog module?"),
    N("no", "proc", "Redirected"),
    N("ld", "io",   "Service catalogue list"),
    N("q",  "dec",  "Add, edit, or&#10;toggle active?"),
    N("frm", "io",  "Service form —&#10;name, fee, requirements"),
    N("sv", "proc", "Save; citizens see only&#10;active services"),
    N("o",  "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "q", ""),
    ("q", "frm", "Yes"), ("frm", "sv", ""), ("sv", "o", ""),
    ("q", "o", "No"),
])

p5 = Chart("L5", "5 — Community and News", nodes=[
    N("i",  "off",   "5"),
    N("g",  "dec",  "Holds the&#10;news module?"),
    N("no", "proc", "Redirected"),
    N("ld", "io",   "Announcement list"),
    N("q",  "dec",  "Create or edit?"),
    N("frm", "io",  "Editor — title, body,&#10;attachments, type"),
    N("pub", "dec", "Publish as an advisory?"),
    N("push", "proc", "One batched push to&#10;this LGU's citizens", side=True, at="pub"),
    N("save", "proc", "Save as draft or&#10;plain announcement"),
    N("o",  "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "q", ""),
    ("q", "frm", "Yes"), ("q", "o", "No"),
    ("frm", "pub", ""),
    ("pub", "push", "Yes"), ("push", "o", ""),
    ("pub", "save", "No"), ("save", "o", ""),
])

p6 = Chart("L6", "6 — Forum Moderation", nodes=[
    N("i",  "off",   "6"),
    N("g",  "dec",  "Holds the&#10;forum module?"),
    N("no", "proc", "Redirected"),
    N("ld", "io",   "Posts and comments,&#10;including unapproved"),
    N("q",  "dec",  "Post acceptable?"),
    N("ap", "proc", "Approve — becomes&#10;publicly visible", side=True, at="q"),
    N("hd", "proc", "Hide or delete"),
    N("o",  "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "q", ""),
    ("q", "ap", "Yes"), ("ap", "o", ""),
    ("q", "hd", "No"), ("hd", "o", ""),
])

p7 = Chart("L7", "7 — Facilities", nodes=[
    N("i",  "off",   "7"),
    N("g",  "dec",  "Holds the&#10;facilities module?"),
    N("no", "proc", "Redirected"),
    N("ld", "io",   "Facility list and map"),
    N("q",  "dec",  "Add or edit&#10;a facility?"),
    N("frm", "io",  "Form — name, type,&#10;pin location, photo"),
    N("sv", "proc", "Save; appears on the&#10;citizen map"),
    N("o",  "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "q", ""),
    ("q", "frm", "Yes"), ("frm", "sv", ""), ("sv", "o", ""),
    ("q", "o", "No"),
])

p8 = Chart("L8", "8 — Citizen Guide", nodes=[
    N("i",  "off",   "8"),
    N("g",  "dec",  "Holds the citizen&#10;guide module?"),
    N("no", "proc", "Redirected"),
    N("ld", "io",   "Guide directory cards"),
    N("q",  "dec",  "Add or edit&#10;a guide?"),
    N("frm", "io",  "Form — office, contact,&#10;operating hours"),
    N("sv", "proc", "Save; publicly readable"),
    N("o",  "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "q", ""),
    ("q", "frm", "Yes"), ("frm", "sv", ""), ("sv", "o", ""),
    ("q", "o", "No"),
])

p9 = Chart("L9", "9 — Citizens and Moderation", nodes=[
    N("i",   "off",   "9"),
    N("g",   "dec",  "Holds the&#10;citizens module?"),
    N("no",  "proc", "Redirected", side=True, at="g", w=140),
    N("ld",  "io",   "Citizens of this LGU,&#10;read-only"),
    N("q",   "dec",  "Moderate an account?"),
    N("act", "dec",  "Ban, restrict,&#10;or reactivate?"),
    N("rsn", "io",   "Reason is required&#10;for ban and restrict"),
    N("rpc", "proc", "moderate_citizen RPC —&#10;citizen is notified"),
    N("ap",  "off",  "9A", side=True, at="rpc"),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "q", ""),
    ("q", "act", "Yes"), ("q", "o", "No"),
    ("act", "rsn", ""), ("rsn", "rpc", ""), ("rpc", "ap", ""),
])

p9a = Chart("L9A", "9A — Reviewing a Citizen Appeal", nodes=[
    N("i",    "off",   "9A"),
    N("ld",   "io",   "Pending appeals&#10;for this LGU"),
    N("q",    "dec",  "Open an appeal?"),
    N("pend", "dec",  "Still pending?"),
    N("taken", "proc", "Already decided by&#10;another reviewer", side=True, at="pend", w=170),
    N("dec2", "dec",  "Approve the appeal?"),
    N("lift", "proc", "Restrictions lifted;&#10;citizen notified", side=True, at="dec2", w=170),
    N("keep", "proc", "Denied with a note —&#10;3-day cooldown before&#10;the next appeal"),
    N("o",    "off",   "AA"),
], edges=[
    ("i", "ld", ""), ("ld", "q", ""),
    ("q", "pend", "Yes"), ("q", "o", "No"),
    ("pend", "taken", "No"), ("taken", "o", ""),
    ("pend", "dec2", "Yes"),
    ("dec2", "lift", "Yes"), ("lift", "o", ""),
    ("dec2", "keep", "No"), ("keep", "o", ""),
])

p10 = Chart("L10", "10 — ID Verifications", nodes=[
    N("i",   "off",   "10"),
    N("g",   "dec",  "Holds the&#10;verifications module?"),
    N("no",  "proc", "Redirected"),
    N("ld",  "io",   "Pending requests, ID photo,&#10;selfie and AI match score"),
    N("q",   "dec",  "Still pending?"),
    N("taken", "proc", "Already decided by&#10;another reviewer", side=True, at="q"),
    N("dec2", "dec", "Approve the identity?"),
    N("ok",  "proc", "Marked verified —&#10;citizen gains full access", side=True, at="dec2"),
    N("rj",  "io",   "Reject with a reason&#10;the citizen can see"),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "g", ""), ("g", "no", "No"), ("no", "o", ""),
    ("g", "ld", "Yes"), ("ld", "q", ""),
    ("q", "taken", "No"), ("taken", "o", ""),
    ("q", "dec2", "Yes"),
    ("dec2", "ok", "Yes"), ("ok", "o", ""),
    ("dec2", "rj", "No"), ("rj", "o", ""),
])

p11 = Chart("L11", "11 — Settings and Staff", nodes=[
    N("i",   "off",   "11"),
    N("q",   "dec",  "Which tab?"),
    N("br",  "io",   "Branding — colours,&#10;logo, contact details", side=True, at="q"),
    N("stf", "dec",  "Add or edit staff?"),
    N("role", "dec", "Role is LGU Personnel?"),
    N("mods", "io",  "Tick the sections&#10;this staff member may use"),
    N("full", "proc", "LGU Admin —&#10;all sections implied", side=True, at="role"),
    N("save", "proc", "Save; set_staff_modules&#10;is the only write path"),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "q", ""),
    ("q", "br", "Branding"), ("br", "o", ""),
    ("q", "stf", "Staff"),
    ("stf", "role", "Yes"), ("stf", "o", "No"),
    ("role", "mods", "Yes"), ("mods", "save", ""),
    ("role", "full", "No"), ("full", "save", ""),
    ("save", "o", ""),
])

p12 = Chart("L12", "12 — Logout", nodes=[
    N("i",  "off",   "12"),
    N("q",  "dec",  "Confirm logout?"),
    N("no", "off",   "AA", side=True, at="q"),
    N("cl", "proc", "End the session and&#10;clear the cookie"),
    N("end", "term", "End"),
], edges=[
    ("i", "q", ""), ("q", "no", "No"),
    ("q", "cl", "Yes"), ("cl", "end", ""),
])

if __name__ == "__main__":
    write_file(
        "../02-LGU-Admin.drawio",
        [main, main2, p1, p2, p3, p4, p5, p6, p7, p8, p9, p9a, p10, p11, p12],
    )
