# Figure Descriptions — AGAPP Flowcharts

Manuscript-ready caption text for every page of the three `.drawio` files, in file
and page order.

**Renumbering:** figures are numbered 1–40 here, one per chart page. Your manuscript
almost certainly starts the flowcharts at a higher number (the reference example used
"Figure 3" for the administrator's main interface). Apply a single offset — if your
first flowchart is Figure 12, add 11 throughout. The order below matches the page order
inside each file, so the offset stays constant.

**Connector vocabulary used in the prose**

| Label | Meaning |
|---|---|
| `1`, `2`, `3` … | Off-page connector to the page whose title starts with that number |
| `1A` | Login failed — returns to the login form on the same page |
| `A`, `B` | The same flow continues on the following page |
| `AA` | Returns to the main interface |

---

## 01-Citizen-App.drawio

### Figure 1 — Citizen App: Entry

Figure 1 illustrates the entry sequence of the citizen mobile application. Upon opening
the app, a decision point determines whether the onboarding slides have been viewed
before; first-time users are shown the slides, while returning users bypass them. A
second decision confirms whether the user is signed in. Unauthenticated users are routed
to (1) guest browsing and sign up. For signed-in users, the system checks whether the
account has been suspended, directing affected users to (9) the restricted or banned
account flow. A final decision verifies that a municipality has been selected, prompting
the user to choose one if it has not, before reaching (2) the main interface. This
sequence ensures that every user arrives at a screen appropriate to their account state.

### Figure 2 — Guest Browsing and Sign Up

Figure 2 presents the guest browsing and registration flow. The municipality is either
detected automatically or chosen manually, after which the visitor may browse news, the
community forum, the citizen guide, and the facilities map without an account. A decision
point is reached when the visitor attempts a members-only action, which prompts a sign-in
or registration invitation. If registering, the visitor supplies a name, email address,
and password, and a six-digit verification code is sent to the email provided. A decision
confirms whether the code is correct; an incorrect code returns the visitor to the code
entry step. On success the account is created, the one-time welcome animation is armed,
and the flow continues to (2) the main interface.

### Figure 3 — Main Interface (Tabs)

Figure 3 illustrates the main interface of the citizen application. A decision point first
determines whether the one-time welcome animation is pending; if so, it plays once and the
flag is cleared, ensuring the animation is never shown again. The Home tab is then
displayed. From this interface the citizen may navigate to (3) applying for a service, (4)
reporting an issue, (5) the community forum, and (6) the profile and account screen. Where
none of these is selected, on-page continuation `A` carries the remaining options onto the
following figure. This interface consolidates the citizen-facing services of the platform
into a single navigational hub.

### Figure 4 — Main Interface (continued)

Figure 4 continues the main interface options from the preceding figure, entered through
connector `A`. The citizen may navigate to (7) news and announcements, or (8) the
assistant chatbot. Two further decisions provide direct access to the emergency
directory, citizen guide, and facilities map, and to the notification list, from which
tapping an entry opens the item it refers to. Where no option is selected, connector `AA`
returns the citizen to the main interface. Together with the preceding figure, this
completes the set of functions reachable from the citizen's home screen.

### Figure 5 — Apply for a Service

Figure 5 depicts the process of applying for a municipal service. The service catalogue
for the citizen's municipality is loaded, after which a decision point confirms whether
the citizen's identity has been verified; unverified citizens are routed to (10) identity
verification. A second decision checks whether the account is restricted or banned,
directing affected users to (9) the restricted or banned account flow. Eligible citizens
select a service and review its fees and requirements, complete the application form, and
attach the required documents. On submission a reference number is issued and the flow
continues to (3A) tracking and claiming.

### Figure 6 — Tracking and Claiming a Service Request

Figure 6 illustrates how a citizen tracks and claims a submitted service request. The
citizen's requests are listed with their current status. A decision point determines
whether a request is ready for pickup; if it is not, the citizen waits, with a push
notification issued on each status change. Once ready, a claim code and its accompanying
QR code are displayed. The citizen presents this at the municipal hall, where staff verify
the code and release the document. Connector `AA` returns the citizen to the main
interface. This flow closes the loop between an online application and its physical
release.

### Figure 7 — Report an Issue

Figure 7 presents the community issue reporting process. A decision point confirms that
the citizen's identity has been verified, routing unverified citizens to (10) identity
verification, and a second decision checks whether the account is restricted or banned,
routing affected users to (9). The citizen then selects a category, describes the issue,
captures a photograph, and confirms the location. A further decision enforces a submission
cooldown, asking the citizen to wait if a report was submitted within the preceding ninety
seconds. Accepted reports are submitted for review and the flow continues to (4A) the
photo check. The cooldown and verification gates together limit duplicate and
illegitimate submissions.

### Figure 8 — Photo Check and Follow-up

Figure 8 illustrates the automated photo check applied to a submitted report and the
citizen's subsequent follow-up. A decision point determines whether the selected category
has an associated detection model; categories without one proceed to staff review only.
Where a model exists, a second decision records whether the expected subject was found in
the photograph. If it was not, the report is flagged for the reviewer as showing no
detected subject; if it was, the confidence value is recorded alongside the report. The
citizen may then track the report's status, receiving a push notification on every change,
and once resolved may rate the resolution. The automated check assists the reviewer
without ever rejecting a report outright.

### Figure 9 — Community Forum

Figure 9 depicts the community forum. Approved posts are loaded first, after which the
authors' display names and profile photographs are retrieved in a separate lookup, and the
post list is presented with replies and likes. A decision point is reached when the user
attempts to post, reply, or like. Unauthenticated users are routed to (1) guest browsing
and sign up. For signed-in users, a decision checks whether the account is restricted or
banned, routing affected users to (9), followed by a verification check routing unverified
citizens to (10). Eligible citizens continue to (5A) posting to the forum. Reading the
forum requires no account; contributing requires a verified one.

### Figure 10 — Posting to the Forum

Figure 10 illustrates the submission of a forum post or reply. The citizen composes the
content, after which a decision point determines whether it contains blocked language;
such content is held back and the citizen is asked to revise the wording. Accepted content
is saved and awaits moderator approval. A further decision records the moderator's
outcome: approved content becomes visible to everyone, including guests, while unapproved
content remains hidden and visible only to its author. Connector `AA` returns the citizen
to the main interface. This two-stage filter combines automated language screening with
human moderation.

### Figure 11 — Profile and Account

Figure 11 presents the citizen's profile and account screen, showing the registered name,
verification status, and municipality. A decision point directs the citizen to the
available actions: changing the profile photograph or email address, updating notification
preferences, beginning (10) identity verification, or proceeding to (6A) account deletion.
Where no action is taken, connector `AA` returns the citizen to the main interface. The
registered name is not editable here, as it is the identity confirmed against the
citizen's government-issued identification during verification.

### Figure 12 — Deleting the Account

Figure 12 illustrates the account deletion flow. A warning screen sets out what will be
removed, after which a decision point requires explicit confirmation. Declining returns
the citizen to the main interface through connector `AA`. On confirmation the account and
its associated personal data are removed and the citizen is signed out, terminating the
session. This flow satisfies the requirement that a data subject be able to withdraw
their information from the platform.

### Figure 13 — News and Announcements

Figure 13 depicts access to municipal news and announcements. Published announcements for
the citizen's municipality are listed, and a decision point determines whether an item is
opened. Opening an item displays the full article. A further decision records whether the
citizen arrived from an advisory push notification, in which case the application opens
directly to the referenced article rather than the list. Connector `AA` returns the citizen
to the main interface. The deep-link path allows an urgent advisory to reach its content in
a single tap.

### Figure 14 — Assistant (Chatbot)

Figure 14 illustrates the assistant available to citizens. The chat screen is displayed
and the citizen types a question. A decision point determines whether the question matches
a known entry; matching questions return the stored answer, while unmatched questions are
passed to the language model for a generated response. A further decision allows the
citizen to ask another question, looping back to the input step, or to leave through
connector `AA`. Routing known questions to stored answers keeps common enquiries fast and
consistent.

### Figure 15 — Restricted or Banned Account

Figure 15 presents the flow for a moderated account. A decision point distinguishes
between a banned and a restricted account. A banned account is shown the reason for the
suspension and can reach nothing else in the application; a restricted account retains
read access. In both cases a decision point offers the submission of an appeal. Two
further decisions enforce the appeal rules: only one appeal may be open at a time, and a
new appeal cannot be submitted within three days of a denial, in which case the citizen is
directed to appeal in person at the municipal hall. Accepted appeals are sent for review
before connector `AA` returns the citizen to the main interface.

### Figure 16 — Identity Verification

Figure 16 illustrates the identity verification process. A decision point evaluates the
citizen's current status; an account with a submission already awaiting review is informed
and proceeds no further. Citizens who have not yet applied, or whose previous submission
was rejected, give consent to the processing of their identification document and
photograph. The citizen then completes three steps: photographing the front of the
identification document, supplying the address, and capturing a selfie. Region, province,
city, and barangay are selected from controlled lists rather than typed, which prevents a
mistyped locality from invalidating the submission. The flow continues to (10A) the face
check and review.

### Figure 17 — Face Check and Review

Figure 17 depicts the automated face check and the reviewer's decision. The selfie is
compared against the photograph on the identification document. A decision point
determines whether the two faces are clearly different or no face could be found, in which
case the citizen is warned and offered a retake. The submission is then forwarded with the
comparison score attached. A further decision records the reviewer's outcome: an approved
citizen is marked verified and shown a confirmation screen once, while a rejected citizen
is shown the reason. Connector `AA` returns the citizen to the main interface. The
automated score assists the reviewer but never decides the outcome alone.

---

## 02-LGU-Admin.drawio

### Figure 18 — LGU Admin: Main Flow

Figure 18 illustrates the main interface for the LGU administrator and personnel. Upon
opening the administrative panel, the user is prompted to log in with an email address and
password. A decision point follows, confirming whether the credentials are correct; an
incorrect entry returns to the login form through on-page connector `1A`. On success the
user is directed to the main interface, from which they may navigate to (1) the dashboard,
(2) issue reports, (3) service requests, and (4) the eServices catalogue. Where none is
selected, connector `A` carries the remaining menu options onto the following figure.
Connector `AA` marks the point at which every module returns to this interface.

### Figure 19 — LGU Admin: Main Flow (continued)

Figure 19 continues the administrative menu from the preceding figure, entered through
connector `A`. The user may navigate to (5) community and news, (6) forum moderation, (7)
facilities, (8) the citizen guide, and (9) citizens and moderation, after which connector
`B` carries the remainder onto the next figure. There the user may reach (10) identity
verifications and (11) settings; settings is preceded by a decision confirming that the
account is an LGU administrator, as personnel are redirected away from it. A final decision
offers (12) logout, and connector `AA` returns to the main interface. Which of these
options a personnel account can see is determined by the sections granted to it.

### Figure 20 — Dashboard

Figure 20 presents the LGU dashboard. A decision point first confirms that the account
holds the dashboard section; accounts without it are redirected to a section they do hold.
Totals for the municipality are then loaded, covering reports, service requests, and
verification requests, and are displayed alongside the municipal map. A further decision
allows the user to open a summary card, which jumps to the corresponding module's list.
Connector `AA` returns to the main interface. This screen gives an at-a-glance view of
outstanding work across the municipality.

### Figure 21 — Issue Reports

Figure 21 illustrates the handling of citizen issue reports. After the section check, the
municipality's reports are loaded and presented as a list, map, and detail panel. A
decision point is reached when the user changes a status or assigns an office. The write is
applied only if the report's status is still the value that was read when the panel was
opened. A further decision determines whether a colleague changed the record first; if so
the write is refused, the user is warned, and the list is refreshed. Otherwise the change
is applied and the citizen is notified. This compare-and-set step prevents one reviewer's
decision from silently overwriting another's.

### Figure 22 — Service Requests

Figure 22 depicts the service request queue. After the section check, the queue and detail
panel are displayed. A decision point directs the user to the available actions. Advancing
the status applies the same guarded write used for issue reports. A further decision marks
a request ready for pickup, which generates a claim code and notifies the citizen. A final
decision releases the document, verifying the claim code presented by the citizen and
recording the release. Connector `AA` returns to the main interface. The claim code links
the online request to the counter transaction that completes it.

### Figure 23 — eServices Catalogue

Figure 23 presents management of the eServices catalogue. After the section check, the
existing catalogue is listed. A decision point allows the user to add a service, edit an
existing one, or toggle its active state. The service form captures the name, fee, and
requirements, and the record is saved. Only services marked active are visible to citizens
in the mobile application. Connector `AA` returns to the main interface. This screen
determines which services citizens are able to apply for.

### Figure 24 — Community and News

Figure 24 illustrates the publication of municipal announcements. After the section check,
existing announcements are listed and a decision point allows the user to create or edit an
entry. The editor captures the title, body, attachments, and type. A further decision
determines whether the item is published as an advisory, in which case a single batched
push notification is sent to the municipality's citizens; otherwise the item is saved as a
draft or as a plain announcement. Connector `AA` returns to the main interface. Batching
the advisory into one send keeps delivery efficient as the citizen base grows.

### Figure 25 — Forum Moderation

Figure 25 depicts moderation of the community forum. After the section check, posts and
comments are loaded, including those not yet approved. A decision point records the
moderator's judgement of each item: approved content becomes publicly visible, while
unacceptable content is hidden or deleted. Connector `AA` returns to the main interface.
Because content remains hidden until approved, this screen is the gate through which all
citizen contributions pass.

### Figure 26 — Facilities

Figure 26 presents management of the municipal facilities map. After the section check, the
existing facilities are listed alongside the map. A decision point allows the user to add or
edit a facility, capturing its name, type, pinned location, and photograph. The saved record
appears on the citizen-facing map. Connector `AA` returns to the main interface. This screen
maintains the directory of public facilities that citizens consult in the mobile
application.

### Figure 27 — Citizen Guide

Figure 27 illustrates management of the citizen guide directory. After the section check,
the existing guide cards are listed. A decision point allows the user to add or edit an
entry, capturing the office, contact details, and operating hours. The saved record is
publicly readable. Connector `AA` returns to the main interface. This directory answers
routine enquiries without requiring a citizen to contact the municipality directly.

### Figure 28 — Citizens and Moderation

Figure 28 depicts moderation of citizen accounts. After the section check, the
municipality's citizens are listed in read-only form. A decision point allows the user to
moderate an account, followed by a decision selecting whether the account is banned,
restricted, or reactivated. A reason is required for a ban or a restriction. The change is
applied through a dedicated database routine that also notifies the affected citizen, after
which the flow continues to (9A) the review of appeals. Confining the change to that
routine ensures no account status can be altered without an accompanying reason and
notification.

### Figure 29 — Reviewing a Citizen Appeal

Figure 29 illustrates the review of an appeal submitted by a moderated citizen. Pending
appeals for the municipality are listed, and a decision point determines whether one is
opened. A further decision confirms that the appeal is still pending; an appeal already
decided by another reviewer is reported as such rather than being decided twice. The
reviewer then approves or denies the appeal. An approved appeal lifts the account's
restrictions and notifies the citizen, while a denial is recorded with a note and starts a
three-day interval before another appeal may be submitted. Connector `AA` returns to the
main interface.

### Figure 30 — Identity Verifications

Figure 30 presents the review of citizen identity verification requests. After the section
check, pending requests are displayed together with the identification photograph, the
selfie, and the automated face-match score. A decision point confirms that the request is
still pending, reporting any request already decided by another reviewer. The reviewer then
approves or rejects the identity. An approved citizen is marked verified and gains full
access to reporting, services, and the forum; a rejection is recorded with a reason that the
citizen can see. Connector `AA` returns to the main interface.

### Figure 31 — Settings and Staff

Figure 31 illustrates the settings available to an LGU administrator. A decision point
selects the tab. The branding tab captures the municipality's colours, logo, and contact
details. The staff tab allows the addition or editing of a staff account, followed by a
decision on the role assigned. Where the role is LGU Personnel, the administrator ticks the
sections that staff member may use; where the role is LGU Administrator, all sections are
implied. The record is saved through a dedicated routine that is the only permitted means of
writing section permissions. Connector `AA` returns to the main interface.

### Figure 32 — Logout

Figure 32 illustrates the logout sequence for administrative users. A decision point
requires confirmation; declining returns the user to the main interface through connector
`AA`. On confirmation the session is ended and the authentication cookie cleared,
terminating access to the administrative panel.

---

## 03-Super-Admin.drawio

### Figure 33 — Super Admin: Main Flow

Figure 33 illustrates the main interface for the platform super administrator. Upon
opening the administrative panel, the user is prompted to log in with an email address and
password. A decision point confirms whether the credentials are correct, returning to the
login form through on-page connector `1A` if they are not. A second decision confirms that
the account is a super administrator, redirecting other roles to their own home page. The
main interface is then displayed with every municipality in scope, from which the user may
navigate to (1) the cross-LGU dashboard and (2) the LGU directory. Connector `A` carries
the remaining menu options onto the following figure.

### Figure 34 — Super Admin: Main Flow (continued)

Figure 34 continues the super administrator's menu from the preceding figure, entered
through connector `A`. The user may navigate to (3) analytics, (4) settings, and (5)
logout. Where no option is selected, connector `AA` returns to the main interface. Unlike
the LGU administrator, whose view is limited to a single municipality, every option here
operates across all onboarded municipalities.

### Figure 35 — Cross-LGU Dashboard

Figure 35 presents the platform-wide dashboard. Totals are loaded for every onboarded
municipality, covering reports, service requests, and registered users, and are displayed
as a platform overview with a comparison table. A decision point allows the figures to be
exported as a CSV file. A further decision allows the user to open a single municipality and
drill into its figures. Connector `AA` returns to the main interface. This screen supports
comparison of performance between municipalities on the platform.

### Figure 36 — LGU Directory

Figure 36 illustrates management of the municipalities onboarded to the platform. The
existing directory is listed and a decision point directs the user to the available
actions. One branch activates or deactivates a municipality. A second decision begins the
onboarding of a new municipality, continuing to (2A) the onboarding wizard. A third
decision allows the branding or feature flags of an existing municipality to be edited and
saved. Connector `AA` returns to the main interface. This screen is the point at which the
platform's multi-tenant scope is administered.

### Figure 37 — Onboarding a New LGU (Wizard)

Figure 37 depicts the guided onboarding of a new municipality. Step one captures the
location by region, province, and city. A decision point rejects a municipality that has
already been onboarded, preventing a duplicate tenant. Step two captures branding, covering
colours, logo, and feature flags. A further decision offers the immediate creation of the
municipality's first LGU administrator, whose name, email address, and temporary password
are captured in step three; this step may be skipped. Step four presents a review, after
which the municipality record is created and the administrator account follows. Connector
`AA` returns to the main interface.

### Figure 38 — Analytics

Figure 38 illustrates the platform analytics screen. Reports and service requests are
aggregated for each municipality by month and presented first as a time series comparing
reports against requests, then as a cross-LGU metrics table. A decision point allows the
period or metric to be changed, which recomputes the totals. Connector `AA` returns to the
main interface. This screen supports the longitudinal comparison used to evaluate platform
adoption.

### Figure 39 — Super Admin Settings

Figure 39 presents the settings available to the super administrator, showing the account's
own profile and notification preferences. A decision point allows the password to be
changed, which requires the current password to be re-entered as confirmation. A further
decision allows notification preferences to be updated and saved. Connector `AA` returns to
the main interface. Unlike the LGU administrator's settings, this screen governs only the
super administrator's own account and not the configuration of any municipality.

### Figure 40 — Logout

Figure 40 illustrates the logout sequence for the super administrator. A decision point
requires confirmation; declining returns the user to the main interface through connector
`AA`. On confirmation the session is ended and the authentication cookie cleared,
terminating access to the platform console.
