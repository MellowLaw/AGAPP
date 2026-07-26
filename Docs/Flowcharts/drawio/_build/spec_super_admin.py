"""
Super Admin flowcharts — one chart per page, short-bond portrait.

Derived from apps/admin/src/app/super/* and middleware.ts.

NOTE: /super/analytics exists as a page but has NO inbound link anywhere in the
admin app (verified by grep) — it is reachable only by typing the URL. Charted
that way rather than inventing a menu entry that isn't there.
"""
from gen import Chart, Node as N, write_file

main = Chart("S0", "Super Admin — Main Flow", nodes=[
    N("start", "term", "Start"),
    N("login", "io",   "Log In&#10;Email / Password"),
    N("chk",   "dec",  "Is email and&#10;password correct?"),
    N("bad",   "on",   "1A", side=True, at="chk"),
    N("role",  "dec",  "Is the account&#10;a Super Admin?"),
    N("wrong", "proc", "Redirected to that&#10;role's own home", side=True, at="role", w=170),
    N("main",  "io",   "Main Interface —&#10;all LGUs in scope"),
    N("d1",    "dec",  "If Dashboard?"),
    N("o1",    "off",  "1", side=True, at="d1"),
    N("d2",    "dec",  "If LGU Directory?"),
    N("o2",    "off",  "2", side=True, at="d2"),
    N("d3",    "dec",  "If Settings?"),
    N("o3",    "off",  "3", side=True, at="d3"),
    N("d4",    "dec",  "If Logout?"),
    N("o4",    "off",  "4", side=True, at="d4"),
    N("back",  "on",   "AA"),
], edges=[
    ("start", "login", ""), ("login", "chk", ""),
    ("chk", "bad", "No"), ("bad", "login", ""),
    ("chk", "role", "Yes"),
    ("role", "wrong", "No"),
    ("role", "main", "Yes"),
    ("main", "d1", ""),
    ("d1", "o1", "Yes"), ("d1", "d2", "No"),
    ("d2", "o2", "Yes"), ("d2", "d3", "No"),
    ("d3", "o3", "Yes"), ("d3", "d4", "No"),
    ("d4", "o4", "Yes"), ("d4", "back", "No"),
])

s1 = Chart("S1", "1 — Cross-LGU Dashboard", nodes=[
    N("i",  "on",   "1"),
    N("ld", "proc", "Load totals for every LGU:&#10;reports, requests, users"),
    N("sh", "io",   "Platform overview and&#10;LGU comparison table"),
    N("q",  "dec",  "Export the figures?"),
    N("csv", "proc", "Download CSV", side=True, at="q", w=150),
    N("an", "dec",  "Open Analytics?"),
    N("note", "proc", "Only by typing the URL —&#10;no menu link exists", side=True, at="an", w=190),
    N("o",  "on",   "AA"),
], edges=[
    ("i", "ld", ""), ("ld", "sh", ""), ("sh", "q", ""),
    ("q", "csv", "Yes"), ("csv", "an", ""),
    ("q", "an", "No"),
    ("an", "note", "Yes"), ("note", "o", ""),
    ("an", "o", "No"),
])

s2 = Chart("S2", "2 — LGU Directory", nodes=[
    N("i",  "on",   "2"),
    N("ld", "io",   "List of onboarded LGUs"),
    N("q",  "dec",  "Which action?"),
    N("tog", "proc", "Activate or deactivate&#10;an LGU", side=True, at="q", w=170),
    N("add", "dec", "Onboard a new LGU?"),
    N("wiz", "off", "2A", side=True, at="add"),
    N("cfg", "dec", "Edit branding or&#10;feature flags?"),
    N("save", "proc", "Save changes to&#10;that LGU", side=True, at="cfg", w=170),
    N("o",  "on",   "AA"),
], edges=[
    ("i", "ld", ""), ("ld", "q", ""),
    ("q", "tog", "Toggle"), ("tog", "o", ""),
    ("q", "add", "Other"),
    ("add", "wiz", "Yes"),
    ("add", "cfg", "No"),
    ("cfg", "save", "Yes"), ("save", "o", ""),
    ("cfg", "o", "No"),
])

s2a = Chart("S2A", "2A — Onboarding a New LGU (Wizard)", nodes=[
    N("i",   "on",   "2A"),
    N("st1", "io",   "Step 1 — Location:&#10;region, province, city"),
    N("dup", "dec",  "Already onboarded?"),
    N("stop", "proc", "Blocked as a duplicate", side=True, at="dup", w=170),
    N("st2", "io",   "Step 2 — Branding:&#10;colours, logo, feature flags"),
    N("st3", "dec",  "Create the first&#10;LGU Admin now?"),
    N("acct", "io",  "Step 3 — Name, email,&#10;temporary password"),
    N("st4", "io",   "Step 4 — Review"),
    N("save", "proc", "Create the LGU record,&#10;then the admin account"),
    N("o",   "on",   "AA"),
], edges=[
    ("i", "st1", ""), ("st1", "dup", ""),
    ("dup", "stop", "Yes"), ("stop", "o", ""),
    ("dup", "st2", "No"), ("st2", "st3", ""),
    ("st3", "acct", "Yes"), ("acct", "st4", ""),
    ("st3", "st4", "Skip"),
    ("st4", "save", ""), ("save", "o", ""),
])

s3 = Chart("S3", "3 — Super Admin Settings", nodes=[
    N("i",  "on",   "3"),
    N("sh", "io",   "Own profile and&#10;notification preferences"),
    N("q",  "dec",  "Change the password?"),
    N("re", "proc", "Re-enter the current&#10;password to confirm", side=True, at="q", w=180),
    N("np", "dec",  "Update notification&#10;preferences?"),
    N("sv", "proc", "Save preferences", side=True, at="np", w=150),
    N("o",  "on",   "AA"),
], edges=[
    ("i", "sh", ""), ("sh", "q", ""),
    ("q", "re", "Yes"), ("re", "np", ""),
    ("q", "np", "No"),
    ("np", "sv", "Yes"), ("sv", "o", ""),
    ("np", "o", "No"),
])

s4 = Chart("S4", "4 — Logout", nodes=[
    N("i",  "on",   "4"),
    N("q",  "dec",  "Confirm logout?"),
    N("no", "on",   "AA", side=True, at="q"),
    N("cl", "proc", "End the session and&#10;clear the cookie"),
    N("end", "term", "End"),
], edges=[
    ("i", "q", ""), ("q", "no", "No"),
    ("q", "cl", "Yes"), ("cl", "end", ""),
])

if __name__ == "__main__":
    write_file("../03-Super-Admin.drawio", [main, s1, s2, s2a, s3, s4])
