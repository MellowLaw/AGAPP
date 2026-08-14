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

3. To test the functionality, browser compatibility, and mobile device compatibility of the platform;

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


---

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
