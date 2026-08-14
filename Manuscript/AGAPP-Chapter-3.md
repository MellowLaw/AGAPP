# CHAPTER III

## METHODOLOGY

### Project Design

The Automated Governance and Public Service Platform (AGAPP) will be designed as a centralized, multi-LGU electronic governance architecture. The system will provide a unified digital infrastructure serving four primary user classes: Citizens, LGU Personnel, LGU Administrators, and a platform-level Super Administrator.

**[Figure 2. Agile Development Model of AGAPP]**

Figure 2 presents the Agile development framework that will be adopted for the project. Software development will proceed through an iterative, non-linear progression across six core phases: Requirements Analysis, Architectural Design, Module Development, System Integration, Verification & Testing, and Deployment & Evaluation. Feedback loops will connect testing and evaluation back to architectural and module design, ensuring that user feedback, security considerations, and empirical test results guide continuous refinement.

**[Figure 3. System Architecture Diagram of AGAPP]**

Figure 3 illustrates the multi-tier system architecture of AGAPP. The Client Tier will comprise the Citizen Mobile Application built using React Native with Expo for cross-platform deployment on Android and iOS, alongside the Web Administrative Dashboards built using Next.js 14 with Tailwind CSS for LGU Administrators, LGU Personnel, and the Super Administrator. The Application Tier will consist of a Node.js runtime hosting a NestJS REST API server, which will orchestrate business logic, automated image confidence evaluation, facial comparison algorithms, push notification dispatching, and chatbot query processing. The Data & Storage Tier will utilize a PostgreSQL database extended with the PostGIS spatial engine for geospatial indexing. Separation of records across municipalities and access control across user roles will be enforced directly within PostgreSQL using Row-Level Security (RLS) policies. Unstructured media, including citizen report photographs, identification document uploads, generated PDF clearance forms, and official announcement attachments, will be stored within Supabase Storage. External integration services will include MapLibre GL and Leaflet mapping engines powered by OpenStreetMap tiles, together with a generative Large Language Model (LLM) fallback (Mistral AI) for conversational chatbot support.

---

### Flowcharts

**[Figure 4. Flowchart of Citizen App: Entry & Onboarding]**

Figure 4 illustrates the entry sequence of the citizen mobile application. Upon opening the app, a decision point will determine whether onboarding slides have been viewed previously; first-time users will view the slides, while returning users will bypass them. A second decision will confirm authentication status. Unauthenticated users will be routed to guest browsing and registration. For signed-in users, the system will check whether the account is suspended, directing affected users to the restricted or banned account flow. A final decision will verify whether an LGU municipality has been selected, prompting selection if absent, before reaching the main interface.

**[Figure 5. Flowchart of Guest Browsing and Sign Up]**

Figure 5 presents the guest browsing and registration flow. The municipality will be detected automatically or selected manually, enabling visitors to browse news, community discussions, service guides, and facilities maps. Tapping a members-only feature will prompt sign-in or registration. Registration will require a full name, email address, and password, followed by a six-digit email verification code. Correct code entry will complete account creation and launch the welcome interface.

**[Figure 6. Flowchart of Citizen Main Interface]**

Figure 6 depicts the primary navigation hub of the citizen application. Upon launch, a pending welcome animation will play once if armed. The home screen will present navigation paths to document applications, geotagged issue reporting, the community forum, chatbot assistant, town map, emergency hotlines, news advisories, and profile settings.

**[Figure 7. Flowchart of Applying for a Municipal Service]**

Figure 7 presents the document application workflow. The citizen will select an item from the municipal service catalog. The system will verify whether the citizen's identity is verified; unverified users will be directed to complete identity verification. The user will fill out the required form fields and attach supporting documents. Upon submission, the system will generate a pre-filled application PDF and an encrypted Claim QR Code, which the citizen will present at the municipal hall payment counter to complete in-person payment and claim the released document.

**[Figure 8. Flowchart of Tracking and Claiming a Service Request]**

Figure 8 details the lifecycle of a submitted service request. The citizen will track submission progress across defined stages: Submitted, In Progress, Ready for Pickup, and Completed. Push notifications will alert the user to status transitions. When status reaches Ready for Pickup, the app will display the Claim QR Code for verification by municipal treasury staff.

**[Figure 9. Flowchart of Submitting a Geotagged Issue Report]**

Figure 9 illustrates the community issue reporting pipeline. The citizen will capture a photo using the device camera and confirm GPS location coordinates. For categories such as road damage or stray animals, the photo will be processed by server-side automated image checking, which will attach an advisory confidence rating. The citizen will review the location, add a description, and submit the report, generating a unique tracking reference number.

**[Figure 10. Flowchart of Issue Report Tracking & AI Photo Triage]**

Figure 10 depicts report tracking and post-resolution feedback. The citizen will monitor the report through Acknowledged, In Progress, and Resolved stages. Upon resolution, the citizen will receive a push notification with a photo of the completed work and will be invited to submit a rating and feedback using the System Usability Scale instrument, updating municipal satisfaction metrics.

**[Figure 11. Flowchart of Moderated Community Forum]**

Figure 11 presents the community discussion workflow. Submitted posts will undergo automated text screening for prohibited language. Clean posts will be published immediately, while flagged posts will enter the LGU moderation queue. Citizens will be able to view published posts, submit comments, add reactions, or report inappropriate content.

**[Figure 12. Flowchart of Citizen Profile & Account Settings]**

Figure 12 presents account configuration options, enabling citizens to update personal details, change security credentials, toggle notification channels, switch language preferences (English/Filipino), and select dark or light theme modes.

**[Figure 13. Flowchart of Account Deletion & Data Privacy]**

Figure 13 details the account deletion and data privacy removal workflow under Republic Act No. 10173, purging personal data while anonymizing historical public submissions.

**[Figure 14. Flowchart of News & Public Advisories]**

Figure 14 presents the news consumption flow, enabling citizens to filter announcements by barangay or municipal category and view attached documents.

**[Figure 15. Flowchart of Conversational AI Chatbot]**

Figure 15 details the dual-tier chatbot architecture. A citizen's query will be first evaluated against the LGU's curated FAQ knowledge base using exact and semantic search. If a matching entry exists, the authoritative municipal response will be returned with source document citations. If no curated entry matches, the query will fall back to a generative language model (Mistral AI), explicitly labeled as an AI-generated advisory response.

**[Figure 16. Flowchart of Restricted or Banned Account Appeals]**

Figure 16 illustrates the workflow for restricted or banned citizen accounts. Suspended users attempting to log in will be directed to a restricted state notice displaying the moderation reason and timestamp. The citizen will be able to submit a formal appeal stating their justification. The appeal will enter the LGU Administrator review queue for approval or denial.

**[Figure 17. Flowchart of Citizen Identity Verification]**

Figure 17 depicts the identity verification workflow. The citizen will upload an official government ID card alongside a real-time selfie. The server will execute facial comparison analysis, calculating a similarity confidence score. LGU staff will review the submitted document, selfie, and advisory similarity score to grant or deny Verified Citizen status.

**[Figure 18. Flowchart of LGU Admin Main Operational Flow]**

Figure 18 presents the master operational flowchart for the LGU Administrator dashboard.

**[Figure 19. Flowchart of LGU Admin Dashboard Overview]**

Figure 19 depicts the municipal dashboard overview. LGU Administrators will view real-time key performance indicators, including total submissions, average resolution turnaround times, pending document applications, active geotagged reports, and interactive report density heatmaps.

**[Figure 20. Flowchart of Geotagged Issue Reports Management]**

Figure 20 details report management by LGU staff. Incoming geotagged reports will be automatically assigned to municipal offices based on category and barangay routing rules. Staff will review photo evidence, automated image confidence ratings, and GPS coordinates; acknowledge reports; reassign misplaced items; dispatch field units; and upload resolution photos upon completion.

**[Figure 21. Flowchart of Service Requests Queue]**

Figure 21 presents the LGU Admin service request management process. Staff will filter applications by office, date, or status; inspect submitted attachments; transition request stages (In Progress, Approved, Ready for Pickup, Released); attach generated clearance documents; or reject invalid applications with written justifications.

**[Figure 22. Flowchart of eServices Catalog Setup]**

Figure 22 presents the service catalog setup workflow. LGU Administrators will define municipal services, required applicant documents, processing fee schedules, responsible offices, and Citizen's Charter instructions.

**[Figure 23. Flowchart of Community News & Advisories Publishing]**

Figure 23 depicts the announcement publishing workflow. LGU Administrators will compose news posts using a rich-text editor, attach images or PDF documents, specify target barangays or municipal-wide audiences, and publish advisories immediately or on a scheduled timer, triggering push notifications to mobile users.

**[Figure 24. Flowchart of Forum Moderation Queue]**

Figure 24 illustrates forum moderation by LGU Administrators. Staff will inspect posts flagged by automated filters, review reported user comments, approve or remove content, apply account restrictions, and evaluate formal citizen moderation appeals.

**[Figure 25. Flowchart of Municipal Facilities & Map Management]**

Figure 25 depicts the municipal landmark and facility management flow. LGU Administrators will maintain map markers, office locations, operating schedules, contact details, and floor plan navigation layers.

**[Figure 26. Flowchart of Citizen Guide Setup]**

Figure 26 depicts the citizen guide catalog management workflow.

**[Figure 27. Flowchart of Citizens & Account Moderation]**

Figure 27 details the citizen roster and moderation control panel.

**[Figure 28. Flowchart of Reviewing a Citizen Appeal]**

Figure 28 details the administrative appeals review process. LGU Administrators will review appeals submitted by restricted citizens, inspect moderation history and submitted justifications, and approve appeals to lift account restrictions or reject them with final decision notes.

**[Figure 29. Flowchart of Identity Verification Review Queue]**

Figure 29 presents the administrative identity verification workflow. LGU staff will inspect submitted government IDs, citizen selfies, and facial comparison similarity scores, approving or rejecting verification requests to grant verified citizen privileges.

**[Figure 30. Flowchart of Settings and Staff Management]**

Figure 30 depicts staff account management and LGU operational settings.

**[Figure 31. Flowchart of Administrative Logout]**

Figure 31 illustrates the secure logout sequence for LGU Administrators.

**[Figure 32. Flowchart of Super Admin Main Operational Flow]**

Figure 32 presents the master operational flowchart for the platform-level Super Administrator.

**[Figure 33. Flowchart of Cross-LGU Dashboard]**

Figure 33 presents platform-wide analytics monitoring. The Super Administrator will inspect cross-municipal submission volumes, compare resolution turnaround times across LGUs, and review platform usage statistics.

**[Figure 34. Flowchart of LGU Directory Management]**

Figure 34 details the directory of onboarded municipal LGUs.

**[Figure 35. Flowchart of Full-Screen LGU Onboarding Wizard]**

Figure 35 illustrates the step-by-step onboarding wizard for new LGU municipalities: selecting Philippine geographical region/province/city hierarchy, configuring initial branding colors, setting feature flags, and creating the initial LGU Administrator account with a generated strong password.

**[Figure 36. Flowchart of Platform Analytics]**

Figure 36 details deep-dive cross-municipal analytical reporting.

**[Figure 37. Flowchart of Super Admin System Settings]**

Figure 37 presents global configuration management, covering database connection parameters, storage vault policies, push notification service keys, and system-wide maintenance modes.

**[Figure 38. Flowchart of Super Admin Logout]**

Figure 38 illustrates the platform Super Admin session termination flow.

---

### Wireframes and Interface Layouts

**[Figure 39. Wireframe for Citizen Select LGU Screen]**

Figure 39 illustrates the municipality selection screen presented to citizens upon first launch. The interface will display an alphabetical directory of onboarded LGUs alongside an interactive region selector, allowing citizens to set their active municipal portal.

**[Figure 40. Wireframe for Citizen Login & Welcome Screen]**

Figure 40 depicts the citizen authentication screen, incorporating email-and-password inputs, a passwordless one-time passcode button, registration links, and opt-in consent toggles for location services and push notifications.

**[Figure 41. Wireframe for Citizen Mobile Home Screen]**

Figure 41 presents the primary dashboard of the citizen mobile app. The top header will display the active municipality name and seal alongside an LGU switcher. The main body will feature quick-action carousels for E-Services, Issue Reporting, Community Forum, Emergency Hotlines, and Recent Advisories, anchored by a five-tab bottom navigation bar.

**[Figure 42. Wireframe for Citizen E-Services Directory Screen]**

Figure 42 illustrates the electronic service catalog screen, categorizing available municipal documents and permits into expandable cards showing required documents, processing fees, and SLA timelines.

**[Figure 43. Wireframe for Citizen Issue Reporting Screen]**

Figure 43 presents the geotagged issue reporting form. The screen will incorporate category selection chips (Road Damage, Clogged Drainage, Stray Animals), an in-app camera capture preview, an advisory AI confidence indicator, interactive map GPS coordinate positioning, and a description input field.

**[Figure 44. Wireframe for Citizen Submission Tracking & Status Screen]**

Figure 44 depicts the submission tracking view, displaying a visual progress tracker across processing stages (Submitted, In Progress, Ready for Pickup) alongside historical activity timestamps and assigned municipal office details.

**[Figure 45. Wireframe for Citizen Interactive Map & Landmark Screen]**

Figure 45 presents the interactive town map interface, displaying custom markers for municipal offices, health centers, schools, and landmarks with search filters and location routing overlays.

**[Figure 46. Wireframe for Citizen Community Forum Screen]**

Figure 46 illustrates the public community discussion feed, displaying user posts, topic tags, comment threads, reaction buttons, and moderation status badges.

**[Figure 47. Wireframe for Citizen Moderated Forum Post Creation]**

Figure 47 presents the forum composition interface, featuring text formatting controls, photo attachments, category tag selectors, and real-time content screening alerts.

**[Figure 48. Wireframe for Citizen AI Assistant Chatbot Screen]**

Figure 48 depicts the conversational chatbot interface, displaying structured chat bubbles, source citations for curated FAQ answers, and explicit labeling for generative AI advisory fallbacks.

**[Figure 49. Wireframe for Citizen Profile & Account Screen]**

Figure 49 illustrates the citizen profile layout, detailing account verification badges, personal details, notification settings, language options, theme toggles, and verification application shortcuts.

**[Figure 50. Wireframe for Citizen Identity Verification Submission Screen]**

Figure 50 presents the identity verification upload screen, incorporating government ID type selection, ID card photo capture, real-time selfie capture, and submission confirmation controls.

**[Figure 51. Wireframe for LGU Admin Dashboard Overview Page]**

Figure 51 depicts the primary LGU Admin web dashboard, featuring a left sidebar navigation, top metric summary cards, submission trend line charts, category distribution pie charts, and a municipal issue density map.

**[Figure 52. Wireframe for LGU Admin Service Requests Page]**

Figure 52 presents the document application management table, displaying filtering controls by office/status, applicant details, attached documents, stage transition dropdowns, and release document upload modal buttons.

**[Figure 53. Wireframe for LGU Admin Issue Reports Page]**

Figure 53 illustrates the geotagged report management page, pairing an interactive municipal report map with a split queue showing report photos, advisory AI confidence scores, GPS coordinates, auto-routed office assignments, and resolution photo upload controls.

**[Figure 54. Wireframe for LGU Admin Citizens & Moderation Page]**

Figure 54 presents the citizen moderation console, detailing registered user rosters, account status filters (Active, Restricted, Banned), moderation action modals with predefined reason dropdowns, and an appeals review tab.

**[Figure 55. Wireframe for LGU Admin Citizen Guide Directory Page]**

Figure 55 depicts the citizen guide management page, allowing LGU staff to add, edit, and organize municipal service guidelines, required documents, fee schedules, and Citizen's Charter procedures.

**[Figure 56. Wireframe for LGU Admin Community Forum Moderation Page]**

Figure 56 presents the forum moderation review queue, displaying posts flagged by automated filters, user reports, approve/reject action buttons, and reason entry fields.

**[Figure 57. Wireframe for LGU Admin Forum Appeals Queue Page]**

Figure 57 illustrates the moderation appeals review interface, showing suspended user appeals, original moderation notes, citizen justifications, and lift-restriction/deny action controls.

**[Figure 58. Wireframe for LGU Admin Facilities & Offices Map Page]**

Figure 58 depicts the map marker and facility management interface, allowing administrators to position municipal office pins, define floor plan layers, update operating schedules, and edit contact information.

**[Figure 59. Wireframe for LGU Admin eServices Catalog Page]**

Figure 59 presents the eServices catalog configuration page, providing form builders to create custom municipal document application templates and document upload requirements.

**[Figure 60. Wireframe for LGU Admin Settings & Office Routing Page]**

Figure 60 illustrates the automated routing rules configuration page, featuring matrix controls to map report categories and barangays to municipal offices alongside Republic Act No. 11032 SLA tier assignments.

**[Figure 61. Wireframe for Super Admin LGU Directory Page]**

Figure 61 presents the platform-level LGU management interface, displaying an active LGU grid, status toggles, branding preview cards, and a button to launch the full-screen LGU onboarding wizard.

**[Figure 62. Wireframe for Super Admin System Settings & Feature Flags Page]**

Figure 62 depicts the Super Admin global configuration dashboard, incorporating per-LGU module feature flag toggle matrices, database policy monitors, and global platform configuration panels.

---

### Use Case Diagrams

**[Figure 63. Use Case Diagram for Super Administrator]**

Figure 63 illustrates the high-level use cases associated with the Super Administrator actor. The Super Administrator will oversee platform-wide operations, including provisioning and onboarding new LGU municipalities, configuring per-LGU feature flags, monitoring cross-LGU analytics and performance leaderboards, auditing security and compliance logs under Republic Act No. 10173, and managing global system settings.

**[Figure 64. Use Case Diagram for LGU Administrator]**

Figure 64 depicts the interactions between the LGU Administrator actor and the system. The LGU Administrator will manage municipal configurations, including defining service catalog items, creating automated office routing rules for citizen reports based on barangay and category, publishing official news and advisories, moderating community forum posts and appeals, managing LGU staff accounts and module permissions, reviewing citizen identity verification requests, and inspecting municipal workload analytics.

**[Figure 65. Use Case Diagram for LGU Personnel]**

Figure 65 delineates the operational use cases for LGU Personnel. Front-line staff members will view their assigned queues of service requests and issue reports, update submission processing stages, attach released official documents or completion photographs, append internal administrative notes, and record resolution logs.

**[Figure 66. Use Case Diagram for Citizen]**

Figure 66 presents the use cases available to Citizen users through the mobile application. Guests will be able to select an active municipality, browse public advisories, search the citizen service guide, view the interactive town map, and access emergency hotlines. Registered and verified citizens will be able to submit document applications, generate pre-filled clearance PDFs with claim QR codes, log geotagged community issue reports with photo evidence, track submission statuses in real time, participate in the moderated community forum, submit account appeals, interact with the AI chatbot, and complete identity verification.

---

### Project Development

The project will be developed using the **Agile Development Model**, applied across eight organized sprint phases labeled Sprint 0 through Sprint 7. The outcome of each sprint will act as the input for the next, incorporating stakeholder feedback before the team proceeds to subsequent milestones.

#### Phase 1: Sprint 0 — Project Initiation & Technical Blueprinting
In this opening sprint, the developers will conduct interviews with municipal officials in the pilot municipality of Liliw, Laguna, including the Office of the Mayor, the Municipal ICT Officer, and department heads from the Civil Registrar, Assessor, BPLO, Engineering, PESO, and MDRRMO. The discussion will focus on existing service delivery workflows, manual bottlenecks, and operational requirements. A prioritized product backlog of user stories will be produced. The continuous-integration pipeline, Git version-control repository, and staging environments will be established. Draft Privacy Notices and Privacy Impact Assessments (PIA) under Republic Act No. 10173 and NPC Circular 16-01 will be initiated. High-fidelity wireframes will be created before writing production code, and the database schema covering PostGIS geospatial entities and knowledge-base tables will be finalized.

#### Phase 2: Sprint 1 — Authentication & Core Data Foundation
The second sprint will build the system's foundational data architecture. The developers will implement email-and-password login with one-time passcode (OTP) support for passwordless authentication and password recovery. Role-Based Access Control (RBAC) will be enforced across all four user roles. The `lgu_id` column will be established alongside PostgreSQL Row-Level Security (RLS) policies to enforce strict data isolation between municipalities. First-launch LGU selection will be built into the mobile application, and a test LGU dataset will be seeded. Unit tests for authentication services and integration tests for database RLS policies will be written before the sprint closes.

#### Phase 3: Sprint 2 — Service Directory & E-Services Portal
The third sprint will deliver the document application and citizen guide modules. Administrative content management screens will be built for LGU staff to maintain municipal service catalogs, required document checklists, and processing schedules. Form generation engines will be constructed to capture citizen inputs, generate pre-filled clearance application PDFs, and assign unique Claim QR Codes for in-person payment verification. The citizen mobile application will fetch and cache service guidelines so that directory entries remain accessible during intermittent network connectivity.

#### Phase 4: Sprint 3 — Geotagged Issue Reporting & Automated Photo Triage
The fourth sprint will deliver the geotagged reporting pipeline and automated photo verification engine. The citizen mobile application will capture photographs and GPS coordinates, uploading media through presigned URLs to Supabase Storage while recording PostGIS spatial points in PostgreSQL. Status state machines, submission tracking screens, and LGU Admin queue views with interactive maps will be constructed. Server-side automated image checking will be integrated to evaluate confidence ratings for road damage and stray animal reports before dispatching reports to municipal department queues.

#### Phase 5: Sprint 4 — News, Notifications, Interactive Maps, Forum, & Chatbot
The fifth sprint will implement citizen engagement and communication features. The LGU Administrator will be equipped with a rich-text announcement editor supporting targeted barangay broadcasts and push notification dispatches via Expo Push services. The interactive town map will be rendered using MapLibre GL and Leaflet with OpenStreetMap tiles, highlighting government offices, health centers, schools, and landmarks. The moderated community forum will be wired to automated text screening filters and moderation queues. The dual-tier chatbot will execute PostgreSQL full-text searches against curated FAQ knowledge bases, falling back to a generative language model (Mistral AI) for unmatched queries.

#### Phase 6: Sprint 5 — Web Administrative Dashboards & Multi-LGU Feature Flags
The sixth sprint will complete the web management interfaces using Next.js 14. The LGU Admin Dashboard will gain its automated office routing rule editor, Republic Act No. 11032 service-level agreement (SLA) trackers, compliance audit log viewer, and forum moderation console. The Super Admin Dashboard will gain its full-screen LGU onboarding wizard, per-LGU feature flag toggle matrix, cross-LGU performance analytics, and global audit logging capabilities. Both dashboards will be verified to ensure real-time metrics reconcile against backend database records.

#### Phase 7: Sprint 6 — System Hardening, Security Review, & Data Privacy Artifacts
The seventh sprint will prepare the system for evaluation and defense. Static code analysis will be performed using Semgrep, dynamic vulnerability scans will be executed using OWASP ZAP, and dependency vulnerability scans will be completed via `npm audit`. Manual penetration tests will be conducted to verify that database Row-Level Security policies prevent cross-LGU data leakage. Performance load testing will be conducted using k6 against critical API endpoints. As part of documentation deliverables, draft Privacy Notices, Privacy Impact Assessments, and Data Subject Access Request (DSAR) workflows modeled after Republic Act No. 10173 will be finalized and turned over to the pilot municipality.

#### Phase 8: Sprint 7 — User Acceptance Testing, ISO/IEC 25010 & SUS Evaluation, & Deployment
The final sprint will transition AGAPP to a public staging environment. User Acceptance Testing (UAT) will be conducted with citizen respondents and municipal LGU personnel in Liliw, Laguna using the System Usability Scale (SUS) instrument and an ISO/IEC 25010 evaluation questionnaire. Mobile builds will be distributed for evaluation via Expo Application Services internal distribution and downloadable Android APKs. Web administrative dashboards will be deployed to cloud hosting infrastructure (Vercel/Render) connected to managed Supabase PostgreSQL databases. Demonstration sessions will be conducted with LGU officials, and UAT feedback will be compiled to document evaluation outcomes.

---

### Project Testing and Evaluation Procedures

The system will be tested for functionality, browser compatibility, and mobile device compatibility, and will be evaluated using the System Usability Scale (SUS) and ISO/IEC 25010 to assess software product quality.

### Project Testing

#### Functionality Testing

According to ISO/IEC 25010 (2011), functional suitability is the degree to which a product or system provides functions that meet stated and implied needs when used under specified conditions; the standard decomposes this characteristic into functional completeness, functional correctness, and functional appropriateness. Functionality testing is therefore the activity that verifies, against user-facing specifications, whether each declared function performs the task it is supposed to perform and produces the correct result.

During this process, the developers will perform tests to ensure the system meets its objectives, focusing on the user interface and confirming that all functions are working correctly. By using a testing table, the developers will track the test sequence, expected result, function, action, actual result, and status (passed or failed) for every interactive element.

**Table 1. Functionality Testing in Super Administrator Page**

| Test Sequence | Expected Result | Function | Action | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Sign in button | Redirects to Super Admin dashboard | Authenticates Super Admin login | Click | (To be tested) | Passed / Failed |
| Register LGU button | Show LGU registration form wizard | Allows the Super Admin to register a new LGU municipality | Click | (To be tested) | Passed / Failed |
| Generate Strong Password button | Populates temporary password with 16-char secure string | Generates secure administrative password | Click | (To be tested) | Passed / Failed |
| Edit LGU button | Show Edit LGU form | Allows the Super Admin to edit LGU details | Click | (To be tested) | Passed / Failed |
| Deactivate LGU button | Show confirmation dialog | Deactivates an existing LGU | Click | (To be tested) | Passed / Failed |
| Feature Flag toggle | Enable or disable a module per LGU | Controls which AGAPP modules are visible to each LGU | Click | (To be tested) | Passed / Failed |
| Cross-LGU Analytics button | Show aggregated metrics across all LGUs | Loads the cross-LGU performance dashboard | Click | (To be tested) | Passed / Failed |
| Compliance button | Show compliance page | Loads audit logs, DPO status, and DPA compliance artifacts | Click | (To be tested) | Passed / Failed |
| Configure Settings button | Show global settings page | Allows the Super Admin to configure authentication, notification, and storage settings | Click | (To be tested) | Passed / Failed |
| Export button | Show export options | Initiates platform data export | Click | (To be tested) | Passed / Failed |
| Add user button | Show Add User form | Allows the Super Admin to add a new user | Click | (To be tested) | Passed / Failed |
| Edit user button | Show Edit User form | Allows the Super Admin to edit user details | Click | (To be tested) | Passed / Failed |
| Archive user button | Archive user account | Allows the Super Admin to archive a user | Click | (To be tested) | Passed / Failed |
| View button | Display user information | Allows the Super Admin to view user information | Click | (To be tested) | Passed / Failed |
| Logout button | Redirect to login page | Logs out the Super Admin | Click | (To be tested) | Passed / Failed |

**Table 2. Functionality Testing in LGU Administrator Page**

| Test Sequence | Expected Result | Function | Action | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Sign in button | Redirects to LGU Admin dashboard | Authenticates LGU Admin login | Click | (To be tested) | Passed / Failed |
| Service Requests button | Show service-request queue | Loads the page of pending citizen document applications | Click | (To be tested) | Passed / Failed |
| Update status button | Update request status | Moves a request from Submitted to In Progress, Ready for Pickup, or Resolved | Click | (To be tested) | Passed / Failed |
| Attach document button | Open file upload window | Allows LGU staff to attach released clearance PDF | Click | (To be tested) | Passed / Failed |
| Issue Reports button | Show issue-report queue and heatmap | Loads the page of pending GPS-based citizen reports | Click | (To be tested) | Passed / Failed |
| Acknowledge button | Acknowledge a report | Marks a report as Under Review and notifies the citizen | Click | (To be tested) | Passed / Failed |
| Reassign button | Show reassignment dialog | Allows the LGU Admin to reroute a report to another office | Click | (To be tested) | Passed / Failed |
| Reject button | Show rejection dialog | Allows the LGU Admin to reject a report with a stated reason | Click | (To be tested) | Passed / Failed |
| Restrict / Ban User dropdown | Show preset reason dropdown and custom input | Applies moderation restriction to citizen account | Select | (To be tested) | Passed / Failed |
| Approve & Lift Appeal button | Execute resolve_citizen_appeal RPC | Lifts account restriction and restores citizen active status | Click | (To be tested) | Passed / Failed |
| Deny Appeal button | Execute resolve_citizen_appeal RPC | Confirms account restriction with final decision note | Click | (To be tested) | Passed / Failed |
| Compose Post button | Show News editor | Allows the LGU Admin to publish an announcement | Click | (To be tested) | Passed / Failed |
| Publish button | Publish the post | Makes the post visible in the citizen mobile application | Click | (To be tested) | Passed / Failed |
| Approve forum post button | Approve queued post | Releases a moderated post to the public forum | Click | (To be tested) | Passed / Failed |
| Reject forum post button | Reject queued post | Removes the post and notifies the citizen | Click | (To be tested) | Passed / Failed |
| Add Office Assignment button | Show rule editor | Allows the LGU Admin to map a category and barangay to an office per RA 11032 SLA | Click | (To be tested) | Passed / Failed |
| Add Knowledge-Base entry button | Show knowledge-base editor | Allows the LGU Admin to add a chatbot source document | Click | (To be tested) | Passed / Failed |
| Export button | Show export options | Initiates data export | Click | (To be tested) | Passed / Failed |
| Add user button | Show Add User form | Allows the LGU Admin to add a new staff account | Click | (To be tested) | Passed / Failed |
| Edit user button | Show Edit User form | Allows the LGU Admin to edit staff details | Click | (To be tested) | Passed / Failed |
| Archive user button | Archive user account | Allows the LGU Admin to archive a staff account | Click | (To be tested) | Passed / Failed |
| Logout button | Redirect to login page | Logs out the LGU Admin | Click | (To be tested) | Passed / Failed |

**Table 3. Functionality Testing in LGU Personnel Page**

| Test Sequence | Expected Result | Function | Action | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Sign in button | Redirects to LGU Personnel queue | Authenticates LGU Personnel login | Click | (To be tested) | Passed / Failed |
| View assigned button | Show items assigned to the user | Loads the personal queue of reports and requests | Click | (To be tested) | Passed / Failed |
| Update status button | Update item status | Moves an item to the next status stage | Click | (To be tested) | Passed / Failed |
| Add internal note button | Show internal note editor | Allows the LGU Personnel to add a note visible only to LGU staff | Click | (To be tested) | Passed / Failed |
| Attach document button | Open file upload window | Allows the LGU Personnel to attach the released document or resolution photo | Click | (To be tested) | Passed / Failed |
| Logout button | Redirect to login page | Logs out the LGU Personnel | Click | (To be tested) | Passed / Failed |

**Table 4. Functionality Testing in Citizen Mobile Application**

| Test Sequence | Expected Result | Function | Action | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Select LGU option | Save active LGU context | Sets municipal theme and loads local data | Tap | (To be tested) | Passed / Failed |
| Send Passcode button | Send one-time passcode to citizen's email | Triggers email passcode delivery for passwordless sign-in | Click | (To be tested) | Passed / Failed |
| Enter Passcode field | Accept six-digit passcode | Allows citizen to type passcode received by email | Type | (To be tested) | Passed / Failed |
| Login button | Authenticate citizen | Verifies passcode and proceeds to Main Interface | Click | (To be tested) | Passed / Failed |
| Service Directory button | Show list of LGU services | Opens the service catalog | Click | (To be tested) | Passed / Failed |
| Apply for service button | Show guided application form | Begins a document application | Click | (To be tested) | Passed / Failed |
| Submit application button | Save application and generate reference number and QR code | Records application in database and generates claim QR code | Click | (To be tested) | Passed / Failed |
| Track Request button | Show tracking timeline and Claim QR Code | Displays status stages and claim QR code when ready | Click | (To be tested) | Passed / Failed |
| Submit Report button | Show report submission flow | Begins a GPS-based issue report | Click | (To be tested) | Passed / Failed |
| Capture photo button | Open in-app camera | Allows citizen to capture photograph of issue | Click | (To be tested) | Passed / Failed |
| Confirm Location button | Capture GPS coordinates | Auto-tags report with latitude and longitude | Click | (To be tested) | Passed / Failed |
| Town Map button | Open interactive map | Renders MapLibre GL map with landmark pins | Click | (To be tested) | Passed / Failed |
| Emergency Hotline button | Direct call emergency contact | Initiates phone call and sends GPS payload to MDRRMO | Click | (To be tested) | Passed / Failed |
| Ask Chatbot field | Return FAQ answer or LLM response | Searches FAQ knowledge base, falling back to Mistral AI | Type / Send | (To be tested) | Passed / Failed |
| Submit Forum Post button | Run profanity filter and queue post | Publishes clean post or routes to moderation queue | Click | (To be tested) | Passed / Failed |
| Upload ID Verification button | Upload ID card and selfie | Submits verification payload for face comparison review | Click | (To be tested) | Passed / Failed |
| Logout button | Redirect to welcome screen | Logs out citizen | Click | (To be tested) | Passed / Failed |

---

#### Compatibility Testing

Compatibility testing will verify that the system operates consistently across different web browsers and mobile hardware devices.

**Table 5. Browser Compatibility Testing in Super Administrator & LGU Administrator Pages**

| Test Sequence | Browser Name | Expected Result | Action | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Google Chrome | Chrome (v122+) | Displays web dashboards cleanly with 100% script functionality | Load & Navigate | (To be tested) | Passed / Failed |
| Microsoft Edge | Edge (v122+) | Displays web dashboards cleanly with 100% script functionality | Load & Navigate | (To be tested) | Passed / Failed |
| Mozilla Firefox | Firefox (v123+) | Displays web dashboards cleanly with 100% script functionality | Load & Navigate | (To be tested) | Passed / Failed |
| Apple Safari | Safari (v17+) | Displays web dashboards cleanly with 100% script functionality | Load & Navigate | (To be tested) | Passed / Failed |

**Table 6. Device Compatibility Testing in Citizen Mobile Application**

| Devices | Resolutions | Expected Result | Actual Result | Recommended |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop** | 1920 x 1080 (Full HD)<br>2560 x 1440 (QHD) | The LGU Admin and Super Admin dashboards display correctly and all features are fully compatible. | Pass / Fail | Yes / No |
| **Laptop** | 1366 x 768 (HD)<br>1440 x 900<br>1600 x 900<br>1920 x 1080 (Full HD) | The LGU Admin and Super Admin dashboards display correctly and all features are fully compatible. | Pass / Fail | Yes / No |
| **Tablet** | 1280 x 800<br>1536 x 2048<br>1920 x 1200 | The citizen mobile application displays correctly and all features are fully compatible. | Pass / Fail | Yes / No |
| **Mobile Phone** | 1280 x 720 (HD)<br>1920 x 1080 (Full HD)<br>2340 x 1080 (FHD+) | The citizen mobile application displays correctly and all features are fully compatible. | Pass / Fail | Yes / No |

---

### Project Evaluation Procedure

To assess the usability and user satisfaction of the system, the developers will conduct an evaluation using the System Usability Scale (SUS). SUS is a standardized questionnaire designed to measure users' perceived ease of use and overall experience. The system will be evaluated by twenty-five (25) citizens of the partner municipality and five (5) representatives from the LGU Administrator and LGU Personnel roles, which is equivalent to thirty (30) non-IT respondents, representing the overall end users of the system. In addition, the system's technical quality will be evaluated using ISO/IEC 25010, which assesses attributes such as functional suitability, performance efficiency, compatibility, usability, reliability, security, maintainability, and portability. This evaluation will be conducted with ten (10) IT experts, providing professional insights into the system's performance and robustness.

#### System Usability Scale (SUS)

The System Usability Scale (SUS), developed by Brooke (1996), is one of the most widely used tools for measuring the usability of a system or product. It is a ten-item questionnaire scored on a five-point Likert scale; respondents indicate their level of agreement with five positively worded items and five negatively worded items, and the alternating-item formula is applied so that contributions from positive and negative items align before the result is multiplied by 2.5 to yield a single composite score on a 0-to-100 scale.

Lewis (2018), in a retrospective review of more than two decades of SUS use, confirmed its enduring reliability and reported that SUS scores remain comparable across products, populations, and contexts of use. SUS will therefore be used in this study because it is standardized, widely validated, and produces a single comparable number that can be benchmarked against published norms.

**Table 7. Likert Scale of SUS**

| Scale | Interpretation |
| :--- | :--- |
| **1** | Strongly Disagree |
| **2** | Disagree |
| **3** | Neutral |
| **4** | Agree |
| **5** | Strongly Agree |

**Table 8. Numerical Scale of the SUS**

| Scale Range | Interpretation |
| :--- | :--- |
| **80.30 – 100.00** | Excellent |
| **68.00 – 80.29** | Good |
| **68.00** | Okay |
| **51.00 – 67.99** | Poor |
| **1.00 – 50.99** | Awful |

---

#### ISO/IEC 25010

ISO/IEC 25010:2011 is an international standard for evaluating software quality. It assesses key attributes such as functional suitability, performance efficiency, compatibility, usability, reliability, security, maintainability, and portability. This standard provides a structured framework for analyzing a system's technical quality and ensuring it meets both user and industry requirements.

The evaluation will focus on the following eight key aspects:

- **Functional Suitability:** Used to test whether the core features of AGAPP, such as service requests, GPS-based issue reporting, automated image confidence triage, news and announcements, the moderated community forum, and the chatbot, work as intended and meet user requirements under Republic Act No. 11032.
- **Performance Efficiency:** Used to test the system's response time, image-processing speed, and overall performance to ensure that it can handle concurrent citizen submissions and large volumes of LGU reports efficiently.
- **Compatibility:** Used to test AGAPP on multiple devices, browsers, and operating systems to ensure a consistent user experience for citizens, LGU Personnel, LGU Administrators, and Super Administrators.
- **Usability:** Used to test the system's user interface, navigation, and ease of use. Feedback from citizens, LGU staff, and non-IT respondents will be gathered to ensure the platform is intuitive and accessible for all users.
- **Reliability:** Used to test the stability and fault tolerance of AGAPP under different conditions, ensuring minimal system downtime and continuous availability of the citizen mobile application and the LGU dashboards.
- **Security:** Used to test data privacy and protection measures, ensuring that sensitive citizen and LGU data are safeguarded against unauthorized access and cyber threats, in line with Republic Act No. 10173 (the Data Privacy Act of 2012) and NPC Circular 16-01.
- **Maintainability:** Used to test the system's architecture, code quality, and ease of updates, ensuring long-term maintainability and scalability across additional LGUs.
- **Portability:** Used to test AGAPP's ability to be deployed across different LGU IT infrastructures and to integrate with other government systems, ensuring smooth implementation when additional municipalities are onboarded.

---

### Statistical Treatment of Data

The Likert scale used in this study is a psychometric instrument widely employed in social-science and educational research for measuring respondents' attitudes, opinions, and impressions toward a given statement. Joshi, Kale, Chandel, and Pal (2015), in their methodological review, explained that the Likert scale offers several response options — typically five or seven — that capture varying levels of agreement, and that the scale is most reliable when the wording of items is precise and the analysis treats the resulting data appropriately. Sullivan and Artino (2013) likewise recommended that ordinal Likert-type data be summarized using descriptive statistics such as the mean and the standard deviation, and that interpretation be made through a verbal scale linked to predefined ranges, rather than treating individual integer responses as a true interval measure.

The data collected from the respondents will be organized, counted, analyzed, and interpreted. The following statistical method will be used to interpret the gathered data:

**Mean** – This will be used to calculate the average response of the respondents to the Survey Questionnaire. It is determined by adding the number of respondents who selected each particular choice for each question and then dividing the total sum by the overall number of respondents. The formula used is as follows:

$$\bar{x} = \frac{\sum (f \cdot x)}{N}$$

Where:
- $\bar{x}$ — the calculated mean score
- $f$ — the frequency of respondents selecting a particular choice
- $x$ — the weight or numerical score assigned to that choice
- $N$ — the total number of respondents

To assess the reliability of the collected data, the developers will refer to a numerical table that contains the scale used to evaluate the system.

**Table 9. Numerical Scale of the ISO/IEC 25010**

| Scale Range | Interpretation |
| :--- | :--- |
| **4.51 – 5.00** | Excellent |
| **3.51 – 4.50** | Very Good |
| **2.51 – 3.50** | Good |
| **1.51 – 2.50** | Fair |
| **1.00 – 1.50** | Poor |
