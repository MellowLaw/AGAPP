# CHAPTER I
## THE PROJECT AND ITS BACKGROUND

### Introduction

Local governance is where the state becomes tangible to ordinary people. A citizen may never transact with a national agency in a given year, but will almost certainly visit the municipal hall to secure a barangay clearance, follow up on a business permit, request a certified copy of a civil registry document, or report a hazard along a road. The quality of these encounters shapes public trust more directly than any national policy pronouncement. Services such as permit processing, document requests, emergency assistance, public advisories, and community issue reporting must therefore be accessible, organized, and responsive (Palma et al., 2023).

Despite the steady expansion of digital systems in Philippine governance, many local government units (LGUs) continue to rely on manual or fragmented processes. Citizens are often required to visit several offices in sequence, search for requirements that are posted inconsistently or not at all, wait without any indication of progress, and use separate and informal channels such as personal messaging to follow up. The result is delay, confusion, uneven communication, and limited transparency (Sigwejo & Pather, 2016). These conditions point to the need for a centralized platform that allows citizens to reach local government services conveniently while giving the LGU an organized means of managing the requests and reports it receives (Sabani et al., 2023).

The problem is not merely one of convenience. Republic Act No. 11032, the Ease of Doing Business and Efficient Government Service Delivery Act of 2018, obliges every government office to publish a Citizen's Charter and to act on simple transactions within three working days, complex transactions within seven working days, and highly technical transactions within twenty working days. An application left unacted upon beyond these periods is deemed automatically approved. Compliance with such a statute presupposes that an office can determine, at any moment, how long a particular request has been pending and at which stage it currently sits. Where records are kept on paper and in logbooks, that determination is difficult to make and harder still to prove.

The Automated Governance and Public Service Platform (AGAPP) is proposed in response to these conditions. AGAPP is a multi-LGU electronic governance platform composed of a citizen mobile application and a web-based administrative dashboard serving LGU personnel, LGU administrators, and a platform-level super administrator. It will bring together an electronic services portal, a citizen guide system, emergency contact access, official news and advisories, geotagged issue reporting with automated photograph checking, request and report tracking, push notifications, an interactive municipal and town map, a moderated community forum, an assisted identity verification workflow, and a chatbot for frequently asked questions.

Through AGAPP, citizens will be able to submit applications and reports, follow their progress, receive announcements, and locate government offices and landmarks from a single application. The local government, for its part, will receive those submissions in an organized queue, assign them to the appropriate personnel, record the actions taken, and communicate status changes back to the citizen automatically. The platform will be built so that each participating LGU sees only its own records, allowing municipalities beyond the pilot site to be provisioned without any change to the underlying system.

### Project Context

Local government units carry the constitutional and statutory responsibility for delivering basic public services within their territorial jurisdictions, a mandate established by Republic Act No. 7160, the Local Government Code of 1991. These services include processing permits and clearances, issuing civil registry and other official documents, responding to emergencies, addressing community concerns, and disseminating public information. When they are handled manually or through disconnected systems, citizens experience inconvenience and delay (Bales et al., 2024), and often struggle to determine the correct procedure, requirement, schedule, or contact person for a particular transaction (Mascara, 2025).

Citizens frequently must appear in person simply to inquire, to submit documents, or to follow up on a request already filed (Aminah & Saksono, 2021). Community concerns such as damaged utility poles, clogged drainage, potholes, stray animals, and lost or found property are reported inconsistently, if at all, because no single channel exists to receive them. Reports made through unofficial channels leave no auditable record, cannot be assigned or tracked, and are easily lost. The consequence is slower response and diminished public satisfaction (Sagarik et al., 2018).

For this capstone project, the Municipality of Liliw in the Province of Laguna has been identified as the pilot local government unit. Liliw is a fourth-class municipality composed of thirty-three barangays, all of them classified as rural, with a population of 39,491 as of the 2020 Census of Population and Housing (Philippine Statistics Authority, 2021). Its profile is representative of the great majority of Philippine LGUs: populous enough that manual processing imposes a real administrative burden, yet without the revenue base that allows first-class cities to commission bespoke information systems or to maintain dedicated information technology departments. A municipality of this class is precisely the case that generic, enterprise-oriented government software serves least well, and it is the case AGAPP is designed to address.

The choice of a pilot site does not confine the system to it. AGAPP is designed from the outset as a multi-LGU platform. Each participating LGU is provisioned as a separate entity within the same deployment, and separation of records is enforced in the database itself rather than in application code, so that data belonging to one municipality is not reachable from another. A platform-level Super Administrator role provisions new LGUs, monitors activity across all of them, and oversees the artifacts required under the Data Privacy Act of 2012 (Republic Act No. 10173). This arrangement allows the platform to be adopted by additional municipalities without modification to the core system, consistent with the direction set by the Department of Information and Communications Technology in the Philippine E-Government Masterplan.

The main problem this study addresses is therefore stated as follows: **How can a centralized digital platform improve service delivery, citizen engagement, and response time in Philippine local government units, particularly in lower-income municipalities where manual processing remains the norm?**

### Project Purpose

The purpose of this project is to design, develop, and evaluate the Automated Governance and Public Service Platform, a centralized digital system intended to improve the efficiency, accessibility, and transparency of public service delivery in local government units. The project addresses fragmented service systems, slow and unverifiable processing, uneven access to information, and inefficient communication between citizens and government offices.

AGAPP will integrate an electronic services portal, geotagged issue reporting with photograph verification, request and report tracking, emergency contact access, a notification system, a moderated community forum, chatbot support, identity verification, and interactive maps. Together these will give citizens a more convenient route to government services and give the LGU a more orderly means of managing public concerns.

The following are the beneficiaries of the proposed project:

**To the Citizens and Residents.** Citizens are the primary beneficiaries. Through the platform they will be able to apply for permits and documents, report community issues with photographic and location evidence, follow the status of every submission, read official announcements, and reach emergency contacts, without repeated trips to the municipal hall. This will save time, effort, and transportation cost, which matters disproportionately in a municipality whose barangays are entirely rural. The platform will also give citizens a more active role in community development by allowing them to raise concerns and take part in moderated public discussion.

**To the LGU Administrator.** The LGU Administrator will gain a consolidated view of everything the municipality has received: reports by category and status, service requests in queue, verification requests awaiting review, and forum content flagged for moderation. The Administrator will provision personnel accounts, determine which modules each staff member may access, configure the municipality's service catalogue and offices, and publish news and advisories. Because status changes will be recorded with their author and timestamp, the Administrator will be able to substantiate compliance with the processing periods required under Republic Act No. 11032.

**To the LGU Personnel.** Personnel will receive work already sorted into the modules they are responsible for, rather than an undifferentiated pile. A clerk assigned to electronic services will see the service request queue; a staff member assigned to issue reporting will see incoming reports. Each action taken will be attributed, which will protect staff by creating a record of what was done and when.

**To the Local Government Unit as an Institution.** The LGU will benefit from improved service management and operational efficiency. Reports carrying photographs and satellite positioning will allow administrators to locate a concern precisely, supporting faster dispatch and better allocation of limited resources. Because every submission and status change will be retained, the LGU will acquire a body of operational data — which barangays report the most road damage, which services are most requested, how long each stage actually takes — that is not available to it today.

**To the Community.** The community will benefit from faster reporting of concerns, better access to local government information, and a public channel for discussion. Features such as emergency contact access, advisories, issue reporting, and interactive maps will contribute to community safety, cleanliness, awareness, and participation.

**To Future Researchers and Developers.** The proposed project will serve as a reference for studies in electronic governance, public service automation, and community-based digital platforms, particularly those addressing lower-income municipalities. Its treatment of database-enforced access control, server-side image verification, and privacy-preserving identity checking may be built upon, evaluated, or extended in subsequent work.

### Project Objectives

#### General Objective

The general objective of this project is to design, develop, and evaluate the Automated Governance and Public Service Platform (AGAPP), a centralized multi-LGU digital platform for public service delivery, piloted at the Municipality of Liliw, Laguna.

#### Specific Objectives

The study specifically aims:

1. To design a centralized and accessible platform interface, consisting of a citizen mobile application and a web-based administrative dashboard, that allows users to navigate and reach available government services with minimal instruction.

2. To develop a platform that:

   a) Enables citizens to submit applications for permits and official documents, and generates a pre-filled application document and a reference code that the citizen presents at the municipal hall to complete payment and claim the released document;

   b) Records community issue reports with photographic evidence and satellite location tagging, and applies automated image checking to assist personnel in assessing report validity;

   c) Allows citizens and personnel to track the status of submitted requests and reports through defined stages, with status changes recorded and communicated automatically;

   d) Delivers official news, advisories, and status updates to citizens through push notifications;

   e) Provides a moderated community forum with automated screening of prohibited content, together with moderation and appeal procedures;

   f) Verifies citizen identity through submitted identification documents and automated facial comparison performed within the system;

   g) Answers frequently asked questions through a chatbot supported by a curated knowledge base and a language-model fallback;

   h) Presents interactive maps of municipal offices and key town landmarks; and

   i) Restricts each LGU to its own records, and each staff member to the modules assigned to them, through access control enforced in the database.

3. To test the project using functionality testing, browser compatibility testing, and device compatibility testing;

4. To evaluate the project using ISO/IEC 25010 and the System Usability Scale; and

5. To document the project.

### Project Scope and Limitation

#### Project Scope

The proposed project will provide a multi-LGU electronic governance platform for Philippine local government units, piloted at the Municipality of Liliw, Laguna. The platform will consist of a citizen mobile application and a web-based administrative dashboard serving LGU Personnel, LGU Administrators, and a platform-level Super Administrator.

The platform will include an **Electronic Services Portal**, through which citizens apply for permits and request official documents. On approval the system will generate a pre-filled application document and a reference code; the citizen will present this at the municipal hall to complete payment and claim the released document. A **Service Directory and Citizen Guide System** will provide the available services together with their procedures, requirements, schedules, locations, and contact details, organized into categories such as identification and licensing, benefits and contributions, financial assistance, specialized assistance, and government offices.

An **Issue Reporting System** will allow citizens to report community concerns with a photograph and satellite location. Reports in the road-damage and stray-animal categories will be submitted for automated image checking, which will return a confidence value recorded alongside the report to assist personnel in triage. A **Request and Report Tracking System** will expose the progress of every submission through defined stages, so that both citizen and office see the same state at the same time.

The platform will include a **News and Advisories module** for official announcements, an **Emergency Contact module** giving direct access to police, fire, medical, and other emergency numbers, and a **Notification System** delivering announcements and status changes by push notification. A **Moderated Community Forum** will allow citizens to post, comment, and react, with automated screening of prohibited language applied at the point of submission and with moderation and appeal procedures available to administrators and citizens respectively. An **Identity Verification module** will allow a citizen to submit an identification document and a photograph of themselves; the system will perform automated facial comparison and present the result to LGU staff, who will make the final decision. A **Chatbot** will answer frequently asked questions from a curated knowledge base, falling back to a language model where no curated answer applies. **Interactive Maps** will display municipal offices, facilities, and key town landmarks.

The platform will support five classes of user. **Guests** may browse public information without an account. **Registered citizens** may additionally submit reports, request services, and participate in the forum, subject to verification status. **Verified citizens** hold full citizen privileges following identity verification. **LGU Personnel** access only the administrative modules their LGU Administrator has granted them. **LGU Administrators** hold full authority within their own municipality, including provisioning personnel and configuring the service catalogue. The **Super Administrator** provisions LGUs and monitors the platform as a whole.

Separation between LGUs, and between roles, will be enforced by Row-Level Security policies in the database rather than by application code alone, so that a request carrying valid credentials for one LGU or role cannot retrieve another's records even if the client application is bypassed. The scope will also include testing and evaluation of the platform's functionality, usability, and performance.

#### Project Limitations

The project will have the following limitations.

**Payment remains offline.** The platform will not process payments. It will generate the application document and reference code, and payment will be completed in person at the municipal hall. This reflects a deliberate decision: online payment collection for an LGU requires accreditation and financial controls beyond the scope of a capstone project, and the municipal treasury's existing counter procedure remains the authoritative point of collection.

**Integration with national government systems is not included.** The platform will not connect to the Philippine Identification System, national civil registry databases, or other agency platforms. Identity verification will be performed on documents submitted by the citizen and reviewed by LGU staff, not against any authoritative national register. Where such integration is desirable, it is identified as future work rather than implemented.

**Notifications are delivered by push only.** Although the platform stores per-user preferences for short message service and electronic mail, only push notification delivery will be implemented. Citizens without a compatible device, or who decline notification permissions, receive updates only on opening the application.

**Automated image checking is limited in coverage and is advisory.** Automated checking will apply only to the road-damage and stray-animal report categories, for which models are available. Its output will be recorded as a confidence value shown to personnel; it will not approve, reject, or close a report. The final determination will be made by a person.

**The platform requires connectivity.** Submitting requests and reports, receiving notifications, and updating status all require an internet connection. Offline access will be limited to read-only content already cached on the device from a previous session.

**Accuracy depends on the citizen's device.** The precision of location tagging and the quality of submitted photographs depend on the device, its location settings, and network conditions. Poor images or imprecise coordinates reduce the usefulness of a report and the reliability of automated checking.

**Evaluation is limited in scale.** Testing will be conducted with a limited number of respondents owing to time and resource constraints, and the results may not represent the full population of prospective users.

**Deployment is limited to the pilot.** Long-term maintenance, full-scale rollout across multiple municipalities, continuous monitoring, and subsequent upgrades lie beyond this study.

### Conceptual Model of the Project

The conceptual model presents the structure and flow of the project. It follows the Input–Process–Output model with an added evaluation stage, identifying the resources required, the activities undertaken, the resulting system, and the means by which that system will be assessed.

**[Figure 1. Conceptual Model of the Automated Governance and Public Service Platform]**

The **input** stage comprises the knowledge, software, and hardware requirements that will establish the development environment. The knowledge requirements include local government service delivery procedures and the statutory framework governing them, electronic governance concepts, mobile and web application development, relational database design, database-level access control, authentication, satellite location tagging and geospatial data handling, image classification, conversational systems, and usability evaluation methods. The software requirements include TypeScript as the common language, React Native with Expo for the mobile application, Next.js for the administrative dashboard, NestJS for the application service, PostgreSQL with the PostGIS extension for the database, Supabase for managed data access, authentication, file storage, and live updates, React Native Maps and Leaflet for map presentation, hosted inference for image checking, a face-comparison library executed within the application service, Visual Studio Code as the editor, and Git with GitHub for version control. The hardware requirements include a development computer with at least 8 GB of memory, a stable internet connection, and an Android device with satellite positioning for field testing.

The **process** stage describes the development flow from planning to completion: requirements gathering to establish the needs of citizens and the LGU, system design covering architecture, database structure, and access control, iterative development of the modules, testing for functionality and compatibility, evaluation through user feedback, and revision in response to findings.

The **output** stage will be the developed AGAPP platform: a citizen mobile application and an administrative dashboard supported by a shared database and application service, providing electronic services, service directory and citizen guide, issue reporting with automated image checking, request and report tracking, news and advisories, emergency contacts, push notifications, a moderated community forum, identity verification, chatbot support, and interactive maps, with separation between LGUs and between roles enforced in the database.

The **evaluation** stage will assess the developed platform's functionality, usability, and performance in order to determine whether it meets its objectives and whether it improves accessibility, transparency, communication, and efficiency in local government service delivery.

### Operational Definition of Terms

The following terms will be operationally used in the proposed project:

**AGAPP** – refers to the Automated Governance and Public Service Platform, the multi-LGU electronic governance platform to be developed in this project, composed of a citizen mobile application and a web-based administrative dashboard.

**Administrative Dashboard** – refers to the web-based interface through which LGU Personnel, LGU Administrators, and the Super Administrator manage submissions, content, accounts, and configuration.

**Appeal** – refers to the procedure by which a citizen whose account has been restricted or whose forum content has been removed may formally contest that action for review by an LGU Administrator.

**Automated Image Checking** – refers to the process in which a photograph attached to a report is submitted to a trained image-classification model, which returns a confidence value recorded with the report to assist personnel in assessment. It is advisory and does not determine the outcome of a report.

**Chatbot** – refers to the conversational feature that answers frequently asked questions from a curated knowledge base maintained by the LGU, falling back to a language model where no curated answer applies.

**Citizen** – refers to a resident who uses the mobile application to access services, submit requests and reports, follow their progress, and take part in the community forum.

**Citizen Guide System** – refers to the module presenting structured information about government processes, including requirements, procedures, schedules, locations, and contact details.

**Claim Code** – refers to the reference code issued with an approved service request, which the citizen presents at the municipal hall to complete payment and claim the released document.

**Community Forum** – refers to the moderated module in which citizens post, comment, and react to community matters, subject to automated screening of prohibited content.

**Electronic Services Portal** – refers to the module through which citizens apply for permits and request official documents, and which generates a pre-filled application document and a claim code.

**Emergency Contact Access** – refers to the module providing direct access to emergency telephone numbers, including police, fire protection, and medical services.

**Guest** – refers to a person using the mobile application without an account, able to browse public information but not to submit requests, reports, or forum content.

**Identity Verification** – refers to the workflow in which a citizen submits an identification document and a photograph of themselves, the system performs automated facial comparison, and LGU staff make the final determination.

**Interactive Map** – refers to the map feature displaying municipal offices, facilities, service areas, and key town landmarks.

**Issue Reporting System** – refers to the module through which citizens report community concerns such as road damage, damaged utility poles, clogged drainage, stray animals, missing pets, and lost or found property, with photographic evidence and location tagging.

**LGU Administrator** – refers to the user holding full administrative authority within a single local government unit, including provisioning personnel accounts, granting module access, configuring services and offices, and publishing announcements.

**LGU Personnel** – refers to a staff member of a local government unit whose access to the administrative dashboard is limited to the modules granted by their LGU Administrator.

**Local Government Unit (LGU)** – refers to the municipal or city government responsible for delivering public services within its territorial jurisdiction.

**Location Tagging** – refers to the recording of satellite-derived geographic coordinates with a submitted report in order to identify the location of the concern.

**Module Permission** – refers to the specific administrative area, such as issue reports or electronic services, that an LGU Administrator grants to a staff member, and which is enforced by the database when that staff member's requests are evaluated.

**Notification** – refers to a message delivered to a user announcing an official advisory or a change in the status of a submission.

**Row-Level Security** – refers to the database mechanism that evaluates each request against the identity and role of the requesting user and returns only the rows that user is permitted to see, thereby enforcing separation between LGUs and between roles within the database itself.

**Service Directory** – refers to the listing of available government services with their procedures, requirements, schedules, contact details, and office locations.

**Super Administrator** – refers to the platform-level user who provisions local government units, monitors activity across all of them, and oversees platform-wide configuration.

**Tracking** – refers to the facility by which a citizen and the LGU observe the progress of a submitted request or report through its defined stages.

**Verified Citizen** – refers to a citizen whose submitted identification has been reviewed and approved by LGU staff, and who consequently holds full citizen privileges within the platform.

---

# CHAPTER II
## REVIEW OF RELATED LITERATURE AND STUDIES

This chapter presents the related literature and studies gathered from various sources. The collected material helps the developers in familiarizing themselves with concepts, standards, and prior systems relevant and similar to the study, and serves as a guide in developing the Automated Governance and Public Service Platform. The review begins with the institutional and statutory setting in which the platform operates, proceeds through the body of literature corresponding to each of the platform's major modules, examines the tools used in its construction, and closes with a synthesis identifying the gap the project addresses.

### The Municipality of Liliw, Laguna

The Municipality of Liliw is a fourth-class municipality in the Province of Laguna composed of thirty-three barangays, all classified as rural, with a population of 39,491 recorded in the 2020 Census of Population and Housing (Philippine Statistics Authority, 2021). It is known nationally for its footwear industry and as a destination for local tourism, both of which generate a steady volume of business permit and clearance transactions alongside the ordinary civil registry and certification workload of a municipal government.

Liliw's profile is significant for this study in a specific way. A fourth-class municipality has neither the internal revenue allotment nor the staffing structure to maintain a dedicated information technology office, and consequently is unlikely to procure or sustain a commercially licensed government information system. At the same time, a population approaching forty thousand distributed across thirty-three rural barangays generates enough transaction volume, and imposes enough travel burden on residents, that manual processing carries a real cost on both sides of the counter. This combination — sufficient need, insufficient means — describes the majority of Philippine LGUs and defines the design constraints under which AGAPP will be built.

### Local Government Service Delivery in the Philippines

Republic Act No. 7160, the Local Government Code of 1991, devolved substantial responsibility for basic services to local government units and established the municipal government as the primary point of contact between the citizen and the state for a wide range of transactions. The Code assigns to municipalities responsibility for civil registration, business permitting and licensing, local infrastructure, and the delivery of basic health, social welfare, and environmental services, among others.

Republic Act No. 11032, the Ease of Doing Business and Efficient Government Service Delivery Act of 2018, imposes procedural obligations on how those services must be delivered. Every government office is required to publish a Citizen's Charter setting out its services, the requirements for each, the responsible officer, and the applicable processing time. The Act prescribes maximum periods of three working days for simple transactions, seven working days for complex transactions, and twenty working days for highly technical transactions, and provides that an application not acted upon within the prescribed period is deemed automatically approved where all requirements have been submitted. The Act also established the Anti-Red Tape Authority to monitor compliance.

These provisions have a direct bearing on system design. A statutory processing deadline is only enforceable if elapsed time can be measured, and automatic approval is only administrable if the office can demonstrate when an application was received and what was done with it. A paper-based queue satisfies neither condition reliably. The obligation to measure and evidence processing time is, in effect, an obligation to maintain a timestamped and attributable record of every transaction — which is what a request tracking system provides. AGAPP's tracking module, in which each status change is recorded with its author and time, is designed with this requirement in view.

Complementing these statutes, the Anti-Red Tape Authority issued Memorandum Circular No. 2022-05, establishing a harmonized Client Satisfaction Measurement framework applicable across government. The framework prescribes a standardized instrument combining Citizen's Charter awareness questions with eight Service Quality Dimensions rated on a five-point Likert scale, and requires agencies, including LGUs, to embed feedback mechanisms for each service and to report results annually. Because AGAPP is an LGU-facing system, this framework is directly relevant both as an evaluation instrument and as a design consideration.

At the national policy level, the Department of Information and Communications Technology has pursued the integration of government digital services through the Philippine E-Government Masterplan, and Republic Act No. 11927, the Philippine Digital Workforce Competitiveness Act of 2022, articulates the State's policy of building digital capability across the workforce. Together these establish that local digitalization efforts such as AGAPP operate within, rather than apart from, a national direction.

### Digital Government and the Public Value of Electronic Governance

Contemporary research frames digital government as a continuing transformation rather than a finished destination. Mergel et al. (2019), reporting in Government Information Quarterly on interviews with digital transformation experts, distinguished digitization, digitalization, and digital transformation, concluding that genuine transformation changes how public services are designed rather than merely automating existing paper forms. The distinction is directly applicable to AGAPP, which will not reproduce the municipal hall's counter procedure on a screen but will reorganize the citizen's experience around a single mobile entry point, a map-based reporting flow, and a transparent status tracker.

At the policy and benchmarking level, the OECD Digital Government Policy Framework (OECD, 2020) sets out six dimensions characterizing a mature digital government: digital by design, data-driven, government as a platform, open by default, user-driven, and proactive. The United Nations Department of Economic and Social Affairs (2022, 2024), through successive editions of the E-Government Survey, reports country-level evidence that integrated portals, mobile-first delivery, and inclusion have become the global standard rather than the exception.

Sigwejo and Pather (2016) developed an e-government citizen satisfaction framework grounded in a study of Tanzania and found that evaluation metrics designed for developed nations assume a uniform approach that disregards contextual, cultural, and environmental factors. Their argument that citizen-centric evaluation must incorporate both government and citizen imperatives supports AGAPP's orientation toward the particular realities of a lower-income municipality rather than the deployment of a generic solution.

Aminah and Saksono (2021) studied Indonesia's digital government transformation and identified five persistent barriers: insufficient regulatory frameworks, weak data integration across agencies, uneven information and communications technology infrastructure between regions, limited technical competence among government personnel, and a bureaucratic culture resistant to change. These conditions closely parallel the Philippine municipal context. AGAPP will address several of them directly: a single database will eliminate the data silos that arise when each office maintains its own records, and an administrative interface organized around ordinary tasks will reduce the training burden on personnel with limited technical background.

Sagarik et al. (2018) examined Thailand's e-government initiatives and documented the problem of siloization, in which agencies operate fragmented and non-interoperable systems, emphasizing the need for interoperable architecture and central coordination. AGAPP's consolidation of service requests, issue reporting, announcements, forum, and chatbot into one platform will counteract this fragmentation at the municipal level.

Furtado et al. (2023) presented a framework for digital transformation toward smart governance in Ceará, Brazil, demonstrating that digital tools developed with attention to vulnerable citizens can simultaneously advance several Sustainable Development Goals, and arguing for context-appropriate solutions rather than the importation of models developed elsewhere. This aligns with AGAPP's deliberate acceptance of an offline payment step and its targeting of mid-range Android devices — adaptations to Philippine municipal reality rather than deficiencies of design.

### Integrated and Mobile Government Platforms

Mobile government extends electronic government by using widespread smartphone ownership to deliver services directly to citizens, particularly in rural areas where fixed internet access is limited. Alqaralleh et al. (2020) proposed an integrated model of mobile government acceptance in Jordan and found that trust in the mobile channel, trust in government, perceived usefulness, perceived ease of use, and service quality significantly influence behavioral intention to use such applications. These findings support the decision to make a mobile application, rather than a web-only portal, the citizen's primary interface in a municipality whose barangays are entirely rural.

Dar (2023) studied mobile governance in Jammu and Kashmir, India, reporting that it enhances citizen engagement and participation while increasing transparency and accountability, but identifying limited infrastructure, low digital literacy, and concerns over data privacy as persistent barriers. AGAPP will respond to these through simplified navigation, light and dark presentation modes for readability, guest browsing that allows citizens to explore the platform before committing to registration, and access control enforced at the database level.

Kanaan et al. (2019) reviewed mobile government implementation across several contexts and concluded that mobile technology enables communication between government and citizens regardless of time and location, with adoption depending on perceived usefulness and ease of access. AGAPP's push notifications, defined tracking stages, and direct-dial emergency contacts will embody this anywhere-and-anytime delivery.

Rahmadany and Ahmad (2021) analyzed the role of mobile government in democratic participation and found that mobile platforms open channels for citizen deliberation on public matters. AGAPP's moderated community forum, with automated screening of prohibited content and a defined appeal procedure, will provide such a channel at municipal scale while managing the risks that unmoderated public posting entails.

### Citizen-Sourced Issue Reporting and Volunteered Geographic Information

The practice of citizens contributing geographic observations to public datasets was characterized by Goodchild (2007) as volunteered geographic information, in which members of the public act as sensors reporting conditions in their immediate environment. The concept underlies municipal issue reporting: a resident who photographs a pothole and submits its coordinates is producing geographic data that the LGU could not economically gather through its own inspection staff.

Two problems recur in the literature on such systems. The first is data quality: submissions vary in accuracy, completeness, and relevance, and unlike professionally surveyed data they carry no assurance of correctness. The second is disposition: reports that citizens submit but that produce no visible response erode the willingness to report again, converting a participation mechanism into a source of grievance. AGAPP will address the first through automated image checking, which gives personnel an additional signal when triaging a report, and through mandatory photographic and location capture, which constrains what can be submitted. It will address the second through the tracking module, which makes the disposition of every report visible to the citizen who filed it, and through push notification of status changes.

### Machine Learning for Automated Image Verification

Automated detection of road damage from photographs has become an established application of convolutional neural networks, motivated by the cost of manual road inspection and the availability of camera-equipped mobile devices. The research direction is well established, and pre-trained object detection architectures have made such models practical to deploy without the computational resources required to train from scratch.

Two design questions arise for a municipal deployment. The first is where inference should run. On-device inference avoids transmitting images and works without connectivity, but constrains model size and drains battery on the mid-range devices typical of the target population. Server-side inference permits larger models and centralized updating at the cost of requiring connectivity and incurring a per-request charge. AGAPP will employ hosted server-side inference, a decision that also confines the machine learning dependency to a single boundary in the application service, so that the model or provider may be replaced without changes to the mobile application.

The second question is the authority granted to the model's output. A classifier that automatically closed reports it judged invalid would convert an imperfect statistical estimate into an administrative decision, and would silently discard valid reports the model failed to recognize. AGAPP will therefore treat the model's output as advisory: the confidence value will be recorded and displayed to personnel as one input among several, and the disposition of the report will remain a human decision. The interface will distinguish explicitly between a model that ran and detected the subject, a model that ran and did not, and a report for which no model was applicable, so that absence of detection is not mistaken for absence of analysis.

### Identity Verification and Facial Comparison in Public Service

Establishing that a person transacting online is who they claim to be is a precondition for delivering services of consequence, and the difficulty of doing so without an authoritative identity register is a recognized constraint on electronic government in developing contexts. Where integration with a national identity system is unavailable, systems commonly fall back on document-based verification, in which the applicant submits an identification document and a photograph of themselves, and the two are compared.

Automated facial comparison assists this process by computing a similarity measure between the photograph on the submitted document and a photograph taken at the time of application. The literature on facial recognition, however, documents well-established concerns: differential accuracy across demographic groups, sensitivity to lighting and pose, and the privacy implications of transmitting and retaining biometric data. These concerns bear directly on a government system handling citizens' identification documents.

AGAPP's design responds on two points. First, facial comparison will be performed within the application service itself rather than by an external provider, so that citizens' identification photographs are not transmitted to a third party. Second, as with image checking for reports, the comparison result will be advisory: it will be presented to LGU staff, who make the verification decision. This preserves the efficiency benefit of automation while keeping a person accountable for a determination that affects a citizen's access to services.

### Conversational Artificial Intelligence in Public Service

Chatbots have been widely adopted in public service delivery to handle the high volume of repetitive enquiries that would otherwise occupy staff time. The literature distinguishes between retrieval-based systems, which return answers from a curated set, and generative systems, which compose responses using a language model. Each carries a characteristic failure mode: retrieval systems fail by returning nothing useful when a question falls outside the curated set, while generative systems fail by producing fluent but incorrect answers — a particularly serious risk in a government context, where an incorrect statement about requirements or fees may cause a citizen to make a wasted trip or miss a deadline.

AGAPP will adopt a two-tier arrangement that reflects this trade-off. Questions will first be matched against a knowledge base curated by the LGU itself, ensuring that answers concerning local requirements, schedules, and fees are those the municipality has authored. Only where no curated answer applies will the question be passed to a language model, and the response will be attributed to that model so that the user can distinguish an official answer from a generated one. This keeps authoritative content under LGU control while retaining the coverage a generative model provides for unanticipated phrasing.

### Online Community Forums and Content Moderation

Public discussion channels operated by government carry a tension between openness and responsibility. A forum increases participation and surfaces concerns that formal reporting channels miss, but an LGU-operated forum also carries institutional responsibility for what appears on it. The moderation literature identifies the limits of both extremes: purely manual moderation does not scale and imposes delay, while purely automated filtering produces false positives that suppress legitimate speech and generate grievance.

AGAPP will apply automated screening for prohibited language at the point of submission, implemented as a database trigger so that the check cannot be bypassed by a client that does not call it, and will pair this with an appeal procedure through which a citizen whose content was removed or whose account was restricted may contest the action for administrator review. The combination reflects the literature's conclusion that automated moderation is defensible when accompanied by an accessible route to human reconsideration.

### Geospatial Technologies and Interactive Mapping in Government

Interactive mapping serves two distinct functions in AGAPP. For the citizen, a map is a means of orientation: locating the municipal hall, a specific office within it, a health facility, or a landmark. For the LGU, a map is an analytical instrument: plotting reports by location reveals concentrations of road damage or recurring drainage problems that a list of individual records does not.

The platform will store spatial data using the PostGIS extension to PostgreSQL, which provides geographic types and spatial indexing within the relational database rather than in a separate system. Presentation will differ by client, with the mobile application and the administrative dashboard each using the mapping library appropriate to its runtime while drawing on the same underlying data. This arrangement keeps the authoritative spatial record in one place while allowing each interface to use the tools native to its platform.

### Data Privacy and Access Control in Government Systems

Republic Act No. 10173, the Data Privacy Act of 2012, governs the processing of personal information in the Philippines and establishes the rights of data subjects together with the obligations of personal information controllers. A municipal platform holding citizens' names, contact details, addresses, identification documents, facial photographs, and location histories is squarely within its scope.

The literature on access control in multi-organization systems consistently identifies the same failure mode: where separation between organizations is enforced only in application code, any defect in that code, or any request that bypasses it, exposes records across the boundary. The recommended alternative is to enforce separation in the data layer, so that the guarantee holds regardless of which client issues the request.

AGAPP will follow this approach. Separation between LGUs, between roles, and between the modules granted to individual staff members will be enforced by Row-Level Security policies evaluated by PostgreSQL against the identity of the requesting user. A request bearing valid credentials for one municipality will return no rows belonging to another, and a staff member holding permission for one module will receive no rows from a module they have not been granted, irrespective of the interface through which the request arrives. Placing the guarantee in the database rather than in the client is what allows the mobile application and the dashboard to communicate with the data layer directly while preserving separation.

### Technology Acceptance and User Adoption

The Technology Acceptance Model proposed by Davis (1989) holds that perceived usefulness and perceived ease of use determine a user's intention to adopt an information system, and remains the most widely applied framework for explaining adoption. Venkatesh et al. (2003) extended this into the Unified Theory of Acceptance and Use of Technology, adding performance expectancy, effort expectancy, social influence, and facilitating conditions as determinants of behavioral intention.

These frameworks carry a practical implication for a government platform whose use is voluntary. A citizen who finds the application difficult will resume travelling to the municipal hall, and the platform's benefits will not be realized however complete its functionality. This consideration motivates several design decisions: guest access allowing citizens to browse before registering, a small number of primary navigation destinations, and the deferral of identity verification until a citizen attempts an action that requires it, rather than imposing it at registration.

For usability measurement, the System Usability Scale developed by Brooke (1996) provides a ten-item instrument yielding a single score, widely used because it is short enough to administer reliably and has accumulated comparative data across many systems. For product quality, ISO/IEC 25010 defines a model comprising functional suitability, performance efficiency, compatibility, usability, reliability, security, maintainability, and portability, and is commonly adopted in capstone evaluation as a structured basis for assessing a developed system.

### Development Tools

**TypeScript.** TypeScript is a strongly typed programming language that builds on JavaScript by adding static type definitions, allowing errors to be detected during development rather than at runtime (Microsoft, 2025). The developers will use TypeScript as the common language across the mobile application, the administrative dashboard, and the application service, so that data structures shared between them are checked consistently.

**React Native and Expo.** React Native is a framework for building native mobile applications using React, producing applications that run on both Android and iOS from a single codebase (Meta Platforms, 2025). Expo provides a managed toolchain and a library of device modules for React Native projects (Expo, 2025). The developers will use React Native with Expo to build the citizen mobile application, together with Expo's modules for camera access, location, image handling, secure storage, and push notifications.

**Next.js.** Next.js is a React framework providing server-side rendering, file-based routing, and server-side execution of privileged operations (Vercel, 2025). The developers will use Next.js to build the administrative dashboard, and its server-side capabilities to perform operations requiring elevated database credentials without exposing those credentials to the browser.

**NestJS.** NestJS is a framework for building server-side applications in Node.js, organized around modules, controllers, and providers (NestJS, 2025). The developers will use NestJS for the application service, which handles the chatbot, automated image checking, facial comparison, and push notification delivery.

**PostgreSQL and PostGIS.** PostgreSQL is an open-source object-relational database system known for reliability and standards compliance (PostgreSQL Global Development Group, 2025). PostGIS extends it with geographic object types and spatial indexing (PostGIS Project, 2025). The developers will use PostgreSQL as the platform's database and PostGIS to store and query the locations attached to reports and facilities.

**Row-Level Security.** Row-Level Security is a PostgreSQL feature by which policies attached to a table restrict which rows a given user may access, evaluated by the database on every query (PostgreSQL Global Development Group, 2025). The developers will use Row-Level Security as the platform's authorization boundary, enforcing separation between LGUs, between roles, and between granted modules.

**Supabase.** Supabase is an open-source backend platform providing a managed PostgreSQL database together with authentication, file storage, automatically generated data access interfaces, and live update subscriptions (Supabase, 2025). The developers will use Supabase for managed data access, citizen and staff authentication, storage of report photographs and identification documents, and live updates driving notifications and the forum.

**React Native Maps and Leaflet.** React Native Maps provides map components for React Native applications using the platform's native mapping services, while Leaflet is an open-source JavaScript library for interactive maps in the browser (Leaflet, 2025). The developers will use React Native Maps for the mobile map interface and Leaflet for the administrative dashboard's map views.

**Hosted Inference for Image Checking.** Hosted inference services expose trained computer vision models through a network interface, returning predictions without requiring the client to host the model itself. The developers will use a hosted inference service for automated checking of report photographs in the road-damage and stray-animal categories, keeping the machine learning dependency behind a single boundary in the application service so that the model or provider can be replaced without changes elsewhere.

**Face Comparison Library.** The developers will use an open-source facial analysis library executing on the application service host, in combination with a JavaScript machine learning runtime, to compare the photograph on a submitted identification document with a photograph taken at the time of application. Executing this comparison within the system, rather than through an external service, will keep citizens' identification photographs inside the platform.

**Visual Studio Code.** Visual Studio Code is a free source code editor with support for debugging, syntax highlighting, intelligent code completion, and version control integration (Microsoft, 2025). The developers will use Visual Studio Code as the primary development environment.

**Git and GitHub.** Git is a distributed version control system, and GitHub is a hosted platform for Git repositories providing collaboration and change tracking (GitHub, 2025). The developers will use Git and GitHub for version control, change history, and coordination among the members of the development team.

### Synthesis of Related Literature and Studies

The literature reviewed establishes several convergent points. Digital government is understood as a redesign of service delivery rather than the automation of existing paper procedures (Mergel et al., 2019; OECD, 2020). Mobile delivery is the appropriate channel where fixed internet access is limited, and adoption depends on perceived usefulness and ease of use (Alqaralleh et al., 2020; Kanaan et al., 2019; Davis, 1989). Citizen-sourced reporting produces geographic data that governments could not otherwise gather, but its value depends on visible disposition of what citizens submit (Goodchild, 2007). Automated image analysis and facial comparison can materially reduce administrative effort, but carry accuracy and privacy risks that argue for treating their outputs as advisory rather than determinative. Moderated public discussion increases participation but requires both automated screening and an accessible route to human reconsideration. Separation of records in systems serving multiple organizations is reliable only when enforced in the data layer.

Several gaps remain. First, the electronic government literature concentrates on national portals and on large cities; the lower-income municipality, which describes the majority of Philippine LGUs and which lacks both the budget and the technical staffing that such studies assume, is comparatively neglected. Second, studies of citizen reporting systems generally treat reporting in isolation from the other transactions a citizen has with the same office, whereas in practice a resident who reports a pothole is the same person who requests a certification and reads the municipality's advisories; the literature offers little on integrating these into one channel. Third, work on machine learning for municipal applications tends to report model accuracy without addressing how an imperfect model should be positioned relative to human decision-making in an administrative process that affects citizens' entitlements. Fourth, discussions of platforms serving several government units seldom examine how separation of records is actually enforced, leaving the guarantee to unexamined application logic.

AGAPP will address these gaps in combination. It will target a fourth-class municipality explicitly, and will accept the constraints that follow — offline payment, mid-range devices, personnel without technical background — as design parameters rather than deficiencies. It will integrate reporting, service requests, information, notification, and public discussion into a single citizen-facing application backed by one administrative dashboard. It will position its machine learning components as advisory inputs to human decisions, and will distinguish in its interface between a negative result and an absent one. And it will enforce separation between LGUs, between roles, and between granted modules in the database itself, so that the guarantee does not depend on the correctness of any client. The present study therefore aims to contribute a documented, working instance of a multi-LGU electronic governance platform designed for the conditions that most Philippine municipalities actually face.
