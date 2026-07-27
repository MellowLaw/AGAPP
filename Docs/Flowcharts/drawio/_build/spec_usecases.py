"""
Use case diagrams per actor — one per page, short-bond portrait.

Derived from the current code, so the boundaries are the ones the system actually
enforces, not intended ones:
  * Guest / Unverified / Verified differ by users.verification_status, enforced by
    the insert-guard triggers on reports, service_requests, forum_posts and
    forum_comments.
  * Liking a forum post deliberately sits with the Unverified Citizen: the
    forum_post_likes guard blocks banned and restricted accounts but does NOT
    require verification, and the client only requires a session.
  * The assistant is NOT a Guest use case — an unauthenticated user hitting it
    gets the sign-in gate (AppNavigator wraps it in AuthGate for guests).
  * LGU Personnel use cases are each gated on a granted section
    (users.module_permissions, enforced by staff_can() in RLS), so a given
    personnel account sees a subset.
"""
from gen_usecase import UseCaseDiagram as UC, ActorHierarchy, write_usecases

SYSTEM_MOBILE = "AGAPP Citizen Application"
SYSTEM_ADMIN = "AGAPP Administrative Panel"
SYSTEM_CONSOLE = "AGAPP Platform Console"

hierarchy = ActorHierarchy(
    uid="UC0",
    title="Figure — Actors and Inheritance",
    actors={
        "Guest": (100, 880),
        "Unverified Citizen": (100, 690),
        "Verified Citizen": (100, 500),
        "LGU Personnel": (430, 690),
        "LGU Administrator": (430, 500),
        "Super Administrator": (690, 500),
    },
    generalizations=[
        ("Unverified Citizen", "Guest"),
        ("Verified Citizen", "Unverified Citizen"),
        ("LGU Administrator", "LGU Personnel"),
    ],
    note=("A hollow triangle points from the specialised actor to the one it inherits. "
          "An Unverified Citizen performs every Guest use case in addition to its own, "
          "and a Verified Citizen performs every Unverified Citizen use case. An LGU "
          "Administrator performs every LGU Personnel use case, since it implicitly holds "
          "all sections. The Super Administrator inherits from no one — its scope is the "
          "platform rather than a single municipality."),
)

guest = UC(
    uid="UC1",
    title="Figure — Use Case Diagram: Guest",
    actor="Guest",
    system=SYSTEM_MOBILE,
    cases=[
        "Select or detect a municipality",
        "Browse news and announcements",
        "Read the community forum",
        "View the citizen guide directory",
        "View the facilities map",
        "View emergency contacts",
        "Register an account",
        "Sign in",
    ],
    note=("A Guest is an unauthenticated visitor. Reading is unrestricted; every "
          "contributing action prompts sign-in or registration."),
)

unverified = UC(
    uid="UC2",
    title="Figure — Use Case Diagram: Unverified Citizen",
    actor="Unverified Citizen",
    system=SYSTEM_MOBILE,
    cases=[
        "Submit identity verification",
        "Provide consent for ID processing",
        "View own verification status",
        "Manage own profile photo and email",
        "Set notification preferences",
        "Receive notifications",
        "Ask the assistant",
        "Like a forum post",
        "Submit a moderation appeal",
        "Delete own account",
    ],
    includes=[("Submit identity verification", "Provide consent for ID processing")],
    note=("Inherits all Guest use cases. Reporting, applying for a service and posting "
          "to the forum remain unavailable until verification is approved. A moderation "
          "appeal applies only while the account is restricted or banned."),
)

verified = UC(
    uid="UC3",
    title="Figure — Use Case Diagram: Verified Citizen",
    actor="Verified Citizen",
    system=SYSTEM_MOBILE,
    cases=[
        "Report a community issue",
        "Capture a photograph and location",
        "Track a submitted report",
        "Rate a resolved report",
        "Apply for a municipal service",
        "Upload required documents",
        "Track and claim a service request",
        "Post in the community forum",
        "Comment on a forum post",
        "Withdraw own report or request",
    ],
    includes=[
        ("Report a community issue", "Capture a photograph and location"),
        ("Apply for a municipal service", "Upload required documents"),
    ],
    note=("Inherits all Unverified Citizen and Guest use cases. A submission cooldown "
          "limits repeat reports, and forum contributions are published only after "
          "moderator approval."),
)

personnel = UC(
    uid="UC4",
    title="Figure — Use Case Diagram: LGU Personnel",
    actor="LGU Personnel",
    system=SYSTEM_ADMIN,
    cols=2,
    cases=[
        "Sign in to the admin panel",
        "Manage own profile and preferences",
        "View the LGU dashboard",
        "Triage community issue reports",
        "Assign a report to an office",
        "Process service requests",
        "Issue a claim code",
        "Release a claimed document",
        "Publish news and advisories",
        "Moderate forum posts and comments",
        "Manage the facilities map",
        "Manage the citizen guide",
        "Manage the eServices catalogue",
        "Review identity verifications",
        "Moderate citizen accounts",
        "Review a citizen appeal",
    ],
    note=("Each use case above the first two is available only if the corresponding "
          "section has been granted to the account, so a given personnel member "
          "performs a subset. Configuring the municipality and managing staff are "
          "never available to this actor."),
)

lgu_admin = UC(
    uid="UC5",
    title="Figure — Use Case Diagram: LGU Administrator",
    actor="LGU Administrator",
    system=SYSTEM_ADMIN,
    cases=[
        "Configure municipality branding",
        "Set municipality contact details",
        "Create a staff account",
        "Grant sections to a personnel account",
        "Promote a staff member to administrator",
        "Deactivate a staff account",
        "Set own notification preferences",
    ],
    includes=[("Create a staff account", "Grant sections to a personnel account")],
    note=("Inherits every LGU Personnel use case, holding all sections implicitly. "
          "The use cases shown here are those exclusive to the administrator and are "
          "confined to the administrator's own municipality."),
)

super_admin = UC(
    uid="UC6",
    title="Figure — Use Case Diagram: Super Administrator",
    actor="Super Administrator",
    system=SYSTEM_CONSOLE,
    cases=[
        "View the cross-LGU dashboard",
        "Export platform figures",
        "View platform analytics",
        "Onboard a new municipality",
        "Configure branding and feature flags",
        "Create the first LGU administrator",
        "Activate or deactivate a municipality",
        "Manage own account settings",
    ],
    includes=[
        ("Onboard a new municipality", "Configure branding and feature flags"),
        ("Onboard a new municipality", "Create the first LGU administrator"),
    ],
    note=("Scope is every onboarded municipality. The Super Administrator does not "
          "triage reports, process service requests or moderate citizens — those "
          "remain with the municipality's own staff."),
)

if __name__ == "__main__":
    write_usecases("../04-Use-Case-Diagrams.drawio",
                   [hierarchy, guest, unverified, verified, personnel, lgu_admin, super_admin])
