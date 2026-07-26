"""
Citizen mobile app flowcharts — one chart per page, short-bond portrait.

Derived from apps/mobile/src (AppNavigator, screens/*), not from the older
Docs/Flowcharts/01-*.md. Reflects current behaviour, including changes made
2026-07-25/26:
  * the welcome ("pagbati") animation now fires once, at account creation only
  * OCR autofill was removed from verification — address fields are typed
  * forum author names/avatars come from the get_forum_author_profiles RPC
  * banned accounts are confined to the Banned screen; restricted accounts keep
    read access but are pushed to the Restricted screen on status change
"""
from gen import Chart, Node as N, write_file

# ── Entry ────────────────────────────────────────────────────────────────────
c0 = Chart("C0", "Citizen App — Entry", nodes=[
    N("start", "term", "Opens the app"),
    N("onb",   "dec",  "Seen onboarding&#10;before?"),
    N("show",  "io",   "Onboarding slides", side=True, at="onb", w=170),
    N("ses",   "dec",  "Signed in?"),
    N("guest", "off",  "1", side=True, at="ses"),
    N("ban",   "dec",  "Account banned?"),
    N("bansc", "off",  "9", side=True, at="ban"),
    N("lgu",   "dec",  "Municipality&#10;chosen?"),
    N("pick",  "io",   "Choose municipality", side=True, at="lgu", w=170),
    N("main",  "off",  "2"),
], edges=[
    ("start", "onb", ""),
    ("onb", "show", "No"), ("show", "ses", ""),
    ("onb", "ses", "Yes"),
    ("ses", "guest", "No"),
    ("ses", "ban", "Yes"),
    ("ban", "bansc", "Yes"),
    ("ban", "lgu", "No"),
    ("lgu", "pick", "No"), ("pick", "main", ""),
    ("lgu", "main", "Yes"),
])

c1 = Chart("C1", "1 — Guest Browsing and Sign Up", nodes=[
    N("i",   "off",   "1"),
    N("det", "io",   "Detect or choose&#10;a municipality"),
    N("brw", "io",   "Browse news, forum,&#10;guide and map"),
    N("act", "dec",  "Tries a members-only&#10;action?"),
    N("gate", "io",  "Prompt to sign in&#10;or register"),
    N("reg", "dec",  "Registering?"),
    N("form", "io",  "Name, email, password"),
    N("otp", "io",   "6-digit code sent&#10;to the email"),
    N("ok",  "dec",  "Code correct?"),
    N("retry", "proc", "Re-enter the code", side=True, at="ok", w=150),
    N("mk",  "proc", "Account created —&#10;arm the welcome animation"),
    N("in",  "off",  "2"),
], edges=[
    ("i", "det", ""), ("det", "brw", ""), ("brw", "act", ""),
    ("act", "gate", "Yes"), ("act", "brw", "No"),
    ("gate", "reg", ""),
    ("reg", "form", "Yes"), ("form", "otp", ""), ("otp", "ok", ""),
    ("ok", "retry", "No"), ("retry", "otp", ""),
    ("ok", "mk", "Yes"), ("mk", "in", ""),
    ("reg", "in", "No — sign in"),
])

c2 = Chart("C2", "2 — Main Interface (Tabs)", nodes=[
    N("i",  "off",   "2"),
    N("wel", "dec", "Welcome animation&#10;pending?"),
    N("play", "io", "Play once, then&#10;clear the flag"),
    # Arrival point for AA — every feature page returns to the tabs.
    N("aaIn", "off", "AA", side=True, at="home"),
    N("home", "io", "Home tab"),
    N("d1",  "dec", "If Services?"),
    N("o1",  "off", "3", side=True, at="d1"),
    N("d2",  "dec", "If Report an Issue?"),
    N("o2",  "off", "4", side=True, at="d2"),
    N("d3",  "dec", "If Forum?"),
    N("o3",  "off", "5", side=True, at="d3"),
    N("d4",  "dec", "If Profile?"),
    N("o4",  "off", "6", side=True, at="d4"),
    N("toA", "off",  "A"),
], edges=[
    ("i", "wel", ""),
    ("wel", "play", "Yes"), ("play", "home", ""),
    ("wel", "home", "No"),
    ("aaIn", "home", ""),
    ("home", "d1", ""),
    ("d1", "o1", "Yes"), ("d1", "d2", "No"),
    ("d2", "o2", "Yes"), ("d2", "d3", "No"),
    ("d3", "o3", "Yes"), ("d3", "d4", "No"),
    ("d4", "o4", "Yes"), ("d4", "toA", "No"),
])

c2b = Chart("C2B", "2 — Main Interface (continued)", nodes=[
    N("fromA", "off", "A"),
    N("d5",  "dec", "If News or&#10;Announcements?"),
    N("o5",  "off", "7", side=True, at="d5"),
    N("d6",  "dec", "If Assistant&#10;(chatbot)?"),
    N("o6",  "off", "8", side=True, at="d6"),
    N("d7",  "dec", "If Emergency, Guide,&#10;or Map?"),
    N("o7",  "io",  "Open that screen", side=True, at="d7", w=180),
    N("d8",  "dec", "If Notifications?"),
    N("o8",  "io",  "Notification list —&#10;tap to open the item", side=True, at="d8", w=180),
    N("back", "off", "AA"),
], edges=[
    ("fromA", "d5", ""),
    ("d5", "o5", "Yes"), ("d5", "d6", "No"),
    ("d6", "o6", "Yes"), ("d6", "d7", "No"),
    ("d7", "o7", "Yes"), ("o7", "back", ""), ("d7", "d8", "No"),
    ("d8", "o8", "Yes"), ("o8", "back", ""), ("d8", "back", "No"),
])

c3 = Chart("C3", "3 — Apply for a Service", nodes=[
    N("i",   "off",   "3"),
    N("ld",  "io",   "Service catalogue&#10;for this municipality"),
    N("ver", "dec",  "Identity verified?"),
    N("nv",  "off",  "10", side=True, at="ver"),
    N("mod", "dec",  "Account restricted&#10;or banned?"),
    N("blk", "off",  "9", side=True, at="mod"),
    N("pick", "io",  "Choose a service;&#10;see fees and requirements"),
    N("form", "io",  "Fill the form and&#10;attach documents"),
    N("sub", "proc", "Submitted — reference&#10;number issued"),
    N("trk", "off",  "3A"),
], edges=[
    ("i", "ld", ""), ("ld", "ver", ""),
    ("ver", "nv", "No"),
    ("ver", "mod", "Yes"),
    ("mod", "blk", "Yes"),
    ("mod", "pick", "No"),
    ("pick", "form", ""), ("form", "sub", ""), ("sub", "trk", ""),
])

c3a = Chart("C3A", "3A — Tracking and Claiming", nodes=[
    N("i",   "off",   "3A"),
    N("ld",  "io",   "My requests and&#10;their status"),
    N("st",  "dec",  "Ready for pickup?"),
    N("wait", "proc", "Wait — push sent on&#10;each status change", side=True, at="st", w=180),
    N("code", "io",  "Claim code and&#10;QR shown"),
    N("go",  "proc", "Present it at the&#10;municipal hall"),
    N("rel", "proc", "Staff releases the&#10;document"),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "ld", ""), ("ld", "st", ""),
    ("st", "wait", "No"), ("wait", "o", ""),
    ("st", "code", "Yes"), ("code", "go", ""), ("go", "rel", ""), ("rel", "o", ""),
])

c4 = Chart("C4", "4 — Report an Issue", nodes=[
    N("i",   "off",   "4"),
    N("ver", "dec",  "Identity verified?"),
    N("nv",  "off",  "10", side=True, at="ver"),
    N("mod", "dec",  "Account restricted&#10;or banned?"),
    N("blk", "off",  "9", side=True, at="mod"),
    N("cat", "io",   "Choose a category&#10;and describe the issue"),
    N("pho", "io",   "Take a photo and&#10;confirm the location"),
    N("cd",  "dec",  "Submitted one in the&#10;last 90 seconds?"),
    N("slow", "proc", "Asked to wait", side=True, at="cd", w=150),
    N("sub", "proc", "Submitted for review"),
    N("ml",  "off",  "4A"),
], edges=[
    ("i", "ver", ""),
    ("ver", "nv", "No"),
    ("ver", "mod", "Yes"),
    ("mod", "blk", "Yes"),
    ("mod", "cat", "No"),
    ("cat", "pho", ""), ("pho", "cd", ""),
    ("cd", "slow", "Yes"), ("slow", "ml", ""),
    ("cd", "sub", "No"), ("sub", "ml", ""),
])

c4a = Chart("C4A", "4A — Photo Check and Follow-up", nodes=[
    N("i",   "off",   "4A"),
    N("run", "dec",  "Category has a&#10;detection model?"),
    N("none", "proc", "No automatic check —&#10;staff review only", side=True, at="run", w=180),
    N("det", "dec",  "Subject found in&#10;the photo?"),
    N("flag", "proc", "Flagged for the reviewer:&#10;nothing detected", side=True, at="det", w=180),
    N("okd", "proc", "Confidence recorded&#10;with the report"),
    N("trk", "io",   "Track status; push sent&#10;on every change"),
    N("res", "dec",  "Resolved?"),
    N("rate", "io",  "Rate the resolution", side=True, at="res", w=150),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "run", ""),
    ("run", "none", "No"), ("none", "trk", ""),
    ("run", "det", "Yes"),
    ("det", "flag", "No"), ("flag", "trk", ""),
    ("det", "okd", "Yes"), ("okd", "trk", ""),
    ("trk", "res", ""),
    ("res", "rate", "Yes"), ("rate", "o", ""),
    ("res", "o", "No"),
])

c5 = Chart("C5", "5 — Community Forum", nodes=[
    N("i",   "off",   "5"),
    N("ld",  "proc", "Load approved posts, then&#10;look up author names&#10;and photos"),
    N("sh",  "io",   "Post list with authors,&#10;replies and likes"),
    N("act", "dec",  "Post, reply, or like?"),
    N("ses", "dec",  "Signed in?"),
    N("gate", "off", "1", side=True, at="ses"),
    N("mod", "dec",  "Account restricted&#10;or banned?"),
    N("blk", "off",  "9", side=True, at="mod"),
    N("ver", "dec",  "Identity verified?"),
    N("nv",  "off",  "10", side=True, at="ver"),
    N("wr",  "off",  "5A"),
], edges=[
    ("i", "ld", ""), ("ld", "sh", ""), ("sh", "act", ""),
    ("act", "ses", "Yes"), ("act", "sh", "No"),
    ("ses", "gate", "No"),
    ("ses", "mod", "Yes"),
    ("mod", "blk", "Yes"),
    ("mod", "ver", "No"),
    ("ver", "nv", "No"),
    ("ver", "wr", "Yes"),
])

c5a = Chart("C5A", "5A — Posting to the Forum", nodes=[
    N("i",   "off",   "5A"),
    N("wr",  "io",   "Write the post&#10;or reply"),
    N("pf",  "dec",  "Contains blocked&#10;language?"),
    N("rej", "proc", "Held back — the wording&#10;must be changed", side=True, at="pf", w=180),
    N("hold", "proc", "Saved, awaiting&#10;moderator approval"),
    N("appr", "dec", "Approved by a&#10;moderator?"),
    N("live", "proc", "Visible to everyone,&#10;including guests", side=True, at="appr", w=180),
    N("hid", "proc", "Stays hidden; only the&#10;author can see it"),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "wr", ""), ("wr", "pf", ""),
    ("pf", "rej", "Yes"), ("rej", "o", ""),
    ("pf", "hold", "No"), ("hold", "appr", ""),
    ("appr", "live", "Yes"), ("live", "o", ""),
    ("appr", "hid", "No"), ("hid", "o", ""),
])

c6 = Chart("C6", "6 — Profile and Account", nodes=[
    N("i",  "off",   "6"),
    N("sh", "io",   "Profile — name, status,&#10;municipality"),
    N("q",  "dec",  "Which action?"),
    N("ph", "io",   "Change profile photo&#10;or email", side=True, at="q", w=170),
    N("np", "dec",  "Notification&#10;preferences?"),
    N("sv", "proc", "Save preferences", side=True, at="np", w=150),
    N("vf", "dec",  "Start verification?"),
    N("go", "off",  "10", side=True, at="vf"),
    N("dl", "dec",  "Delete account?"),
    N("cf", "off",  "6A", side=True, at="dl"),
    N("o",  "off",   "AA"),
], edges=[
    ("i", "sh", ""), ("sh", "q", ""),
    ("q", "ph", "Photo / email"), ("ph", "o", ""),
    ("q", "np", "Other"),
    ("np", "sv", "Yes"), ("sv", "o", ""),
    ("np", "vf", "No"),
    ("vf", "go", "Yes"),
    ("vf", "dl", "No"),
    ("dl", "cf", "Yes"),
    ("dl", "o", "No"),
])

c6a = Chart("C6A", "6A — Deleting the Account", nodes=[
    N("i",  "off",   "6A"),
    N("w",  "io",   "Warning — what will&#10;be removed"),
    N("cf", "dec",  "Confirmed?"),
    N("no", "off",   "AA", side=True, at="cf"),
    N("del", "proc", "Account and personal&#10;data removed"),
    N("out", "proc", "Signed out"),
    N("end", "term", "End"),
], edges=[
    ("i", "w", ""), ("w", "cf", ""),
    ("cf", "no", "No"),
    ("cf", "del", "Yes"), ("del", "out", ""), ("out", "end", ""),
])

c7 = Chart("C7", "7 — News and Announcements", nodes=[
    N("i",  "off",   "7"),
    N("ld", "io",   "Published announcements&#10;for this municipality"),
    N("q",  "dec",  "Open one?"),
    N("rd", "io",   "Full article"),
    N("adv", "dec", "Arrived from an&#10;advisory push?"),
    N("deep", "proc", "Opened straight to&#10;that article", side=True, at="adv", w=180),
    N("o",  "off",   "AA"),
], edges=[
    ("i", "ld", ""), ("ld", "q", ""),
    ("q", "rd", "Yes"), ("q", "o", "No"),
    ("rd", "adv", ""),
    ("adv", "deep", "Yes"), ("deep", "o", ""),
    ("adv", "o", "No"),
])

c8 = Chart("C8", "8 — Assistant (Chatbot)", nodes=[
    N("i",  "off",   "8"),
    N("sh", "io",   "Assistant chat"),
    N("ask", "io",  "Types a question"),
    N("kw", "dec",  "Matches a known&#10;question?"),
    N("faq", "proc", "Stored answer returned", side=True, at="kw", w=170),
    N("ai", "proc", "Passed to the language&#10;model for an answer"),
    N("more", "dec", "Another question?"),
    N("o",  "off",   "AA"),
], edges=[
    ("i", "sh", ""), ("sh", "ask", ""), ("ask", "kw", ""),
    ("kw", "faq", "Yes"), ("faq", "more", ""),
    ("kw", "ai", "No"), ("ai", "more", ""),
    ("more", "ask", "Yes"), ("more", "o", "No"),
])

c9 = Chart("C9", "9 — Restricted or Banned Account", nodes=[
    N("i",   "off",   "9"),
    N("k",   "dec",  "Banned or&#10;restricted?"),
    N("bs",  "io",   "Banned screen — reason&#10;shown; nothing else&#10;reachable", side=True, at="k", w=180),
    N("rs",  "io",   "Restricted screen —&#10;reading still allowed"),
    N("ap",  "dec",  "Submit an appeal?"),
    N("pend", "dec", "Appeal already&#10;pending?"),
    N("one", "proc", "Only one open appeal&#10;at a time", side=True, at="pend", w=180),
    N("cool", "dec", "Denied within the&#10;last 3 days?"),
    N("wait", "proc", "Must wait, or appeal in&#10;person at the hall", side=True, at="cool", w=180),
    N("sub", "proc", "Appeal sent for review"),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "k", ""),
    ("k", "bs", "Banned"), ("bs", "ap", ""),
    ("k", "rs", "Restricted"), ("rs", "ap", ""),
    ("ap", "pend", "Yes"), ("ap", "o", "No"),
    ("pend", "one", "Yes"), ("one", "o", ""),
    ("pend", "cool", "No"),
    ("cool", "wait", "Yes"), ("wait", "o", ""),
    ("cool", "sub", "No"), ("sub", "o", ""),
])

c10 = Chart("C10", "10 — Identity Verification", nodes=[
    N("i",   "off",   "10"),
    N("st",  "dec",  "Current status?"),
    N("pend", "proc", "Already submitted —&#10;awaiting review", side=True, at="st", w=180),
    N("con", "io",   "Consent to ID and&#10;photo processing"),
    N("s1",  "io",   "Step 1 — Photograph&#10;the front of the ID"),
    N("s2",  "io",   "Step 2 — Address:&#10;region, province, city and&#10;barangay chosen from lists"),
    N("s3",  "io",   "Step 3 — Selfie"),
    N("chk", "off",  "10A"),
], edges=[
    ("i", "st", ""),
    ("st", "pend", "Pending"),
    ("st", "con", "Not started&#10;or rejected"),
    ("con", "s1", ""), ("s1", "s2", ""), ("s2", "s3", ""), ("s3", "chk", ""),
])

c10a = Chart("C10A", "10A — Face Check and Review", nodes=[
    N("i",   "off",   "10A"),
    N("ai",  "proc", "Compare the selfie with&#10;the photo on the ID"),
    N("low", "dec",  "Faces clearly&#10;different, or none found?"),
    N("warn", "io",  "Warned, and offered&#10;a retake", side=True, at="low", w=170),
    N("sub", "proc", "Submitted with the&#10;score attached"),
    N("rev", "dec",  "Approved by the&#10;LGU reviewer?"),
    N("ok",  "io",   "Verified — welcome&#10;screen shown once", side=True, at="rev", w=170),
    N("rj",  "io",   "Rejected, with the&#10;reason shown"),
    N("o",   "off",   "AA"),
], edges=[
    ("i", "ai", ""), ("ai", "low", ""),
    ("low", "warn", "Yes"), ("warn", "sub", ""),
    ("low", "sub", "No"),
    ("sub", "rev", ""),
    ("rev", "ok", "Yes"), ("ok", "o", ""),
    ("rev", "rj", "No"), ("rj", "o", ""),
])

if __name__ == "__main__":
    write_file("../01-Citizen-App.drawio", [
        c0, c1, c2, c2b, c3, c3a, c4, c4a, c5, c5a,
        c6, c6a, c7, c8, c9, c10, c10a,
    ])
