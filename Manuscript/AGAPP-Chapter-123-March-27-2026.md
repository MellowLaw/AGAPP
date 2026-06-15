## **TABLE OF CONTENTS** 

## **CHAPTER I - THE PROJECT AND ITS BACKGROUND** 

Introduction...................................................................................................... 1 Project Context................................................................................................ 2 Project Purpose............................................................................................... 4 Project Objectives ............................................................................................6 Project Scope and Limitation...........................................................................8 Operational Definition of Terms..................................................................... 15 **CHAPTER II – REVIEW OF RELATED LITERATURE AND STUDIES** Review of Related Literatures and Studies......................................................... 19 **CHAPTER III - METHODOLOGY** Project Design................................................................................................46 Project Development....................................................................................102 Project Testing and Evaluation Procedures.................................................109 

1 

## **CHAPTER I** 

## **INTRODUCTION** 

Public service delivery is one of the most important responsibilities of local government units (LGUs), as it directly affects the daily lives of citizens. Services such as permit processing, document requests, emergency assistance, public advisories, and community issue reporting must be accessible, organized, and responsive (Palma et al., 2023). Despite the increasing use of digital systems, many LGUs still rely on manual or fragmented processes. Citizens often need to visit different offices, search for service requirements, wait for updates, or use separate communication channels to complete government transactions. This can result in delays, confusion, inefficient communication, and limited transparency (Sigwejo & Pather, 2016). These challenges show the need for a centralized platform that can help citizens access local government services more conveniently while helping LGUs manage requests and reports more efficiently (Sabani et al., 2023). 

The Automated Governance and Public Service Platform (AGAPP) is a proposed digital solution designed to modernize and streamline the delivery of government services within local government units. The system includes major features such as an e-services portal, citizen guide system, emergency assistance access, news and updates, issue reporting, request tracking, community forum, chatbot customer support, and interactive maps. 

2 

Through AGAPP, citizens will be able to access government services, submit reports, track requests, receive announcements, and locate important offices and landmarks using a single platform. On the other hand, LGUs will be able to organize reports, monitor concerns, provide updates, and respond more effectively to community needs. 

## **Project Context** 

Local government units are responsible for providing essential public services to citizens. These services include processing permits, issuing official documents, responding to emergencies, addressing community concerns, and providing public information. However, when these services are handled manually or through disconnected systems, citizens may experience inconvenience and delays (Bales et al., 2024). They may also find it difficult to know the correct procedures, requirements, schedules, or contact information for specific government services (Mascara, 2025). 

At present, many local government services are still limited by traditional processes and fragmented communication channels. Citizens may need to physically visit municipal offices to inquire, submit documents, or follow up on requests (Aminah & Saksono, 2021). In some cases, public concerns such as damaged utility poles, clogged drainage systems, potholes, stray animals, and lost or found items may not be reported efficiently because there is no centralized reporting platform. These issues may lead to slower response times and reduced public satisfaction (Sagarik et al., 2018). 

3 

The AGAPP project addresses these problems by proposing a centralized platform that integrates multiple government services into one system. Based on the project reference, AGAPP is designed to provide centralized access to e- services, complete service directories, emergency hotlines, official announcements, service requests, issue reports, request tracking, community discussions, chatbot support, and digital maps (Organisation for Economic Cooperation and Development [OECD], 2020). 

For the purposes of this capstone project, the Municipality of Liliw, Province of Laguna has been identified as the pilot local government unit through which AGAPP will be developed and evaluated. While the pilot is conducted in a single municipality, the platform is designed from the start to be multi-LGU capable: each participating LGU is provisioned in the system with strict data isolation. A platform-level Super Admin role is responsible for provisioning new LGUs, monitoring cross-LGU analytics, and supervising compliance artifacts under the Data Privacy Act (Republic of the Philippines, 2018). This design allows AGAPP to be adopted by other municipalities in future deployments without changes to the core system (Department of Information and Communications Technology [DICT], 2022). 

The main problem addressed by this study is: How can a centralized digital platform improve service delivery, citizen engagement, and response time in local government units? 

4 

To answer this problem, AGAPP will be developed as a prototype system that brings together different public service functions into one accessible platform. The project aims to reduce the need for physical visits, minimize delays, improve communication, and promote transparency in public service delivery (Rahmadany & Ahmad, 2021). This is aligned with the purpose of a capstone project, which focuses on solving real-world problems through practical and technology-based solutions. 

## **Project Purpose** 

The purpose of this study is to design and develop the Automated Governance and Public Service Platform (AGAPP), a centralized digital system that aims to improve the efficiency, accessibility, and transparency of public service delivery in local government units. The project seeks to address common problems such as fragmented service systems, slow processing times, limited access to information, and inefficient communication between citizens and government offices. 

AGAPP will integrate important features such as an e-services portal, issue reporting with image capture and GPS location tagging, real-time request tracking, emergency assistance, notification and update system, community forum, chatbot support, and interactive maps. These features are intended to provide citizens with a more convenient way to access services and allow LGUs to manage public concerns more effectively. 

The beneficiaries of the proposed project are the following: 

5 

**To the Citizens/Residents.** Citizens and residents are the primary beneficiaries of AGAPP. Through the platform, they will be able to access government services anytime and anywhere. They can process permits, request documents, report community issues, track the status of their requests, view announcements, and access emergency hotlines. This reduces the need for physical visits to government offices and helps save time, effort, and transportation costs. The system also gives citizens a more active role in community development by allowing them to report concerns and participate in discussions through the community forum. 

**To the Local Government Units (LGUs).** Local government units will benefit from AGAPP by improving their service management and operational efficiency. The system will help LGU personnel organize service requests, monitor reports, update citizens, and respond to concerns in a more systematic way. Reports with images and GPS location data can help administrators identify the exact location of community issues, allowing faster response and better decision-making. The platform also supports transparency because users can track the progress of their submitted requests and reports. 

**To the Community.** The community will benefit from improved public services, faster reporting of concerns, and better access to local government information. Features such as emergency assistance, news and updates, issue reporting, and interactive maps can contribute to community safety, cleanliness, awareness, and participation. The community forum also encourages citizens to share concerns, exchange information, and participate in local discussions. 

6 

**To Future Researchers and Developers.** Future researchers and developers may use AGAPP as a reference for studies related to e-governance, public service automation, smart city applications, system development, and community-based digital platforms. The project may also serve as a foundation for future improvements, such as full LGU deployment, database integration, advanced analytics, and mobile application development. 

## **Project Objectives** 

## **General Objective** 

The general objective of this project is to design, develop, and implement the Automated Governance and Public Service Platform (AGAPP), a centralized digital system that enhances the efficiency, accessibility, and transparency of public service delivery in local government units while improving citizen engagement and response time to community concerns. 

## **Specific Objectives** 

This study has the following specific objectives: 

1. To analyze the current challenges and limitations in existing public service delivery systems of local government units, particularly in terms of accessibility, processing time, and communication with citizens. 

2. To design a user-friendly and centralized platform interface that allows users to easily navigate and access available government services. 

7 

3. To develop an e-services portal that allows users to submit applications for permits and document requests online, generating a pre-filled PDF and a reference QR code that the citizen presents at the Municipal Hall payment counter in person to complete payment and claim the released document. 

4. To create an issue reporting system with image capture and GPS location tagging for reporting community concerns such as potholes, damaged utility poles, clogged drainage systems, stray animals, missing pets, and lost or found items. 

5. To develop a real-time tracking system that allows users to monitor the status of their submitted service requests and issue reports. 

6. To integrate emergency assistance features that provide quick access to important hotlines and services such as police, fire protection, hospitals, and other emergency contacts. 

7. To build a notification and update system for public announcements, advisories, alerts, and request status updates. 

8. To implement a community forum that allows citizens to share concerns, exchange information, and participate in community discussions. 

9. To develop interactive maps for municipal offices and key town landmarks to help users locate government offices, hospitals, schools, tourist spots, and other important destinations. 

- 10.To test and evaluate the system's functionality, usability, performance, and effectiveness through system testing and user feedback. 

8 

## **Project Scope and Limitation** 

## **Project Scope** 

The Automated Governance and Public Service Platform (AGAPP) covers the design, development, and testing of a centralized digital platform for local government service delivery, composed of a citizen mobile application and two web-based administrator dashboards (LGU Admin and Super Admin). The platform will serve as a unified digital system where citizens can access local government services, submit requests, report community issues, receive updates, and communicate with the local government. 

The system will include an E-Services Portal that allows users to submit applications for permits and request official documents online. The portal generates a pre-filled application PDF and a reference QR code. The citizen then visits the Municipal Hall payment counter in person, presents the QR code to complete the required payment, and claims the released document on-site. It will also include a Complete Service Directory that provides a list of available city or municipal services, including procedures, requirements, schedules, locations, and contact information. These features are intended to help citizens understand and access government services more efficiently. 

AGAPP will also provide a Citizen Guide System that contains structured information about government processes. This includes categories such as ID registration and licenses, benefits and contributions, financial support, 

9 

specialized assistance, and government offices. Each entry will include relevant details such as location, schedule, and contact information. 

The system will include an Emergency Assistance Access feature that allows users to quickly contact emergency services, including police, fire protection, and hospitals. This feature provides multiple contact numbers for emergency services, allowing citizens to access help more conveniently during urgent situations. 

Another major feature of the system is the News and Updates module, which provides centralized access to official announcements, public advisories, and local news. This feature will help citizens stay informed about important government activities and developments. 

The project will also include an Issue Reporting and Service Request System. This module allows users to report community concerns directly through the platform. Reports may include potholes, damaged or non-functioning utility poles, clogged drainage systems, stray animals, missing pets, and lost or found items. Some reports will include image capture and GPS location tagging to help administrators identify the exact location of the issue. This feature supports faster communication between citizens and local authorities. 

AGAPP will also include a Request and Report Tracking System. This feature allows users to monitor the status of their submitted requests and reports. The tracking system will show statuses such as Submitted, Under Review, In 

10 

Progress, Resolved, and Rejected. This promotes transparency and helps users stay updated on the progress of their concerns. 

The system will include User Personalization features such as light mode and dark mode to improve user experience. It will also provide External Links and Social Media Integration, allowing users to access official government pages such as Facebook and YouTube. 

A Community Forum will also be included in the platform. This will serve as a space where citizens can engage in discussions, share concerns, and exchange information relevant to their community. This feature promotes civic participation and open communication between citizens and the local government. 

The system will also include Customer Support through a chatbot that can answer frequently asked questions about the system or the municipality. This feature will help users get quick responses to common concerns. 

Lastly, AGAPP will provide a Municipal Hall Interactive Map and a Town Map with Key Landmarks. The municipal hall map will help citizens locate specific offices and service areas, while the town map will highlight important locations such as government offices, hospitals, schools, tourist spots, and other landmarks. 

The project scope also includes system testing and evaluation to assess the functionality, usability, performance, and effectiveness of AGAPP. The 

11 

project will be developed as a prototype and will focus on demonstrating the core functions of the proposed system. 

## **Project Limitations** 

Although AGAPP aims to provide a comprehensive digital platform for local government services, the project has several limitations. 

- Prototype Phase: The system will be limited to prototype development and simulation. It will not include full deployment across all local government units. The project will focus on demonstrating the system's core features and functionality rather than implementing it as a fully operational government system. 

- External Integrations: Integration with external government databases, national identification systems, and other third-party government platforms will be limited due to access restrictions, privacy concerns, and technical requirements. The system may include simulated data or prototype-level integration only. 

- Connectivity Requirement: The system will require internet connectivity for most features such as submitting service requests, submitting issue reports, receiving notifications, and updating tracking statuses. Limited offline access is supported only for read-only content that has been cached on the device during a previous session, such as the service directory. 

12 

- Hardware Dependency: The accuracy of GPS location tagging and image capture will depend on the user's device, internet connection, and location settings. Low-quality images or inaccurate location data may affect the quality of submitted reports. 

- User Testing Scale: Due to time and resource constraints, system testing will be conducted with a limited number of respondents. As a result, the testing results may not fully represent all possible users of the system. 

- Budget Limits: Budget limitations may restrict the use of premium APIs, cloud services, advanced cybersecurity tools, and other paid software resources. 

- Future Scope: Long-term maintenance, full-scale deployment, continuous system monitoring, and future upgrades are beyond the scope of this study. These may be considered for future development. 

## **Conceptual Model of the Project** 

The conceptual model of the project presents the overall structure and flow of the AGAPP system. It follows the Input-Process-Output (IPO) Model, which identifies the necessary inputs, the processes involved in system development, and the expected output of the project. The conceptual model helps explain how the system will be developed and how its components work together to achieve the project objectives. 

13 

**==> picture [320 x 10] intentionally omitted <==**

**----- Start of picture text -----**<br>
INPUT PROCESS OUTPUT<br>**----- End of picture text -----**<br>


## **Figure 1. Conceptual Model of AGAPP: Automated Governance and Public Service** 

## **Platform** 

14 

The conceptual model for the project serves as a guide for the researchers to help identify the requirements and processes needed for the development of AGAPP. It consists of four stages: input, process, output, and evaluation. The input stage consists of knowledge requirements, software requirements, and hardware requirements, all of which help set the right development environment for the developers of the project. The knowledge requirements include understanding local government service delivery, e- governance platforms, mobile and web application development, database management systems, user authentication, GPS location tagging, image capture, real-time tracking, chatbot systems, and usability testing. The software requirements include TypeScript as the programming language, React Native with Expo for the mobile app, Next.js 14 for the admin dashboards, Node.js with NestJS for the API server, PostgreSQL with PostGIS for the database, Supabase Storage for file storage, MapLibre GL for maps, Visual Studio Code as the editor, and GitHub for version control. The hardware requirements include a computer with at least 8GB RAM, stable internet connection, Android device for testing, and GPS-enabled device for location testing. 

The process stage shows the flow of the development of AGAPP from planning to completion. It includes requirements gathering to identify citizen and LGU needs, system design for architecture and database structure, development of all modules, testing for functionality and usability, evaluation through user feedback, and review and improvement based on results. 

15 

The output stage consists of the final AGAPP system with thirteen features: E-services portal, service directory, citizen guide system, emergency assistance access, news and updates module, issue reporting and service request system, request and report tracking system, notification and update system, community forum, chatbot customer support, municipal hall interactive map, town map with key landmarks, and user and administrator management. 

The last stage consists of the overall evaluation, feedback, and results of the project. The evaluation assesses the system's functionality, usability, performance, and effectiveness to determine if AGAPP meets its objectives and improves accessibility, transparency, communication, and efficiency in local government service delivery. 

The evaluation phase will assess the system's functionality, usability, performance, and effectiveness. This will help determine whether AGAPP meets its objectives and whether it improves accessibility, transparency, communication, and efficiency in local government service delivery. 

## **Operational Definition of Terms** 

**Administrator** – Refers to the authorized user responsible for managing system records, reviewing reports, updating service information, and monitoring requests submitted through AGAPP. 

**AGAPP** – Refers to the Automated Governance and Public Service Platform, the proposed centralized digital platform (composed of a citizen mobile application 

16 

and web-based administrator dashboards) designed to improve local government service delivery. 

**Automated Governance** – Refers to the use of digital tools and system features to organize, monitor, and improve public service processes. 

**Citizen Guide System** – Refers to the feature that provides structured information about government services, procedures, requirements, schedules, and office locations. 

**Citizens/Residents** – Refers to the users of the system who access services, submit requests, report issues, track concerns, and receive updates. 

**Community Forum** – Refers to the feature where users can post concerns, share information, and participate in discussions related to their community. 

**E-Services Portal** – Refers to the module that allows users to submit applications for permits and document requests online. It generates a pre-filled PDF and a reference QR code that the citizen presents at the Municipal Hall payment counter in person to complete payment and claim the released document. 

**Emergency Assistance Access** – Refers to the feature that provides quick access to emergency hotlines such as police, fire protection, hospitals, and other emergency services. 

17 

**GPS Location Tagging** – Refers to the use of geographic location data to identify the exact location of a reported issue or submitted request. 

**Interactive Map** – Refers to the digital map feature that displays municipal offices, service areas, key landmarks, and important town locations. 

**Issue Reporting System** – Refers to the module that allows users to submit reports about community concerns such as potholes, clogged drainage, damaged utility poles, stray animals, missing pets, and lost or found items. 

**Local Government Unit (LGU)** – Refers to the city or municipal government responsible for providing public services to citizens within a specific locality. 

**Notification System** – Refers to the feature that sends alerts, announcements, advisories, and status updates to users. 

**Prototype** – Refers to the preliminary version of AGAPP developed for demonstration, testing, and evaluation purposes. 

**Real-Time Tracking System** – Refers to the feature that allows users to monitor the progress of submitted requests and reports using statuses such as Submitted, Under Review, In Progress, Resolved, and Rejected. 

**Service Directory** – Refers to the list of available government services, including procedures, requirements, schedules, contact information, and office locations. 

**User Interface** – Refers to the visual layout and design of the system that allows users to interact with AGAPP. 

18 

**User Personalization** – Refers to system settings that allow users to customize their experience, such as choosing between light mode and dark mode. 

19 

## **CHAPTER II** 

## **REVIEW OF RELATED LITERATURE AND STUDIES** 

This chapter presents related literature and studies gathered from various sources. The collected literature and studies provide valuable insights that aid the proponents in understanding concepts and information relevant to the proposed study. These references serve as a foundation for the development of the Automated Governance and Public Service Platform (AGAPP), a centralized mobile and web platform for Philippine local government units (LGUs) that integrates local government services, GPS-based issue reporting, an on-device pothole detector, push notifications, an interactive town map, a moderated community forum, and an AI chatbot into a single application. All sources cited below were published between 2016 and 2024 (within the last five to ten years) and every source was verified by the proponents as existing at a live DOI or official URL with a freely viewable full text, preprint, or repository copy. 

## **Digital Government and the Public Value of E-Government** 

Contemporary research frames digital government as a continuing transformation rather than a finished destination. Mergel et al. (2019), in an openaccess article in Government Information Quarterly, interviewed digitaltransformation experts and distinguished digitization, digitalization, and digital transformation, concluding that genuine transformation changes how public services are designed rather than merely automating paper forms. Their view is directly relevant to AGAPP, because AGAPP does not simply digitize existing 

20 

service counters in the municipal hall; it redesigns the citizen experience around a single mobile front door, a map-based reporting flow, and a transparent status tracker. 

At the policy and benchmarking level, the OECD Digital Government Policy Framework (OECD, 2020) defines six dimensions that characterize a mature digital government: digital by design, data-driven, government as a platform, open by default, user-driven, and proactive. The United Nations Department of Economic and Social Affairs (2022, 2024), through the UN E- Government Survey 2022 and 2024, reports country-by-country evidence that integrated portals, mobile-first service delivery, and inclusion are now the global standard rather than the exception. These reports inform the evaluation framework discussed in Chapter III because they provide ready-made indicators against which AGAPP's design choices can be benchmarked. 

The evolution from electronic government (e-government) to digital government represents a fundamental shift from digitizing paper-based processes toward reimagining public service delivery through citizen-centric, integrated digital ecosystems. Sigwejo and Pather (2016) developed an e- government citizen satisfaction framework (ECSF) grounded in a study of Tanzania, a developing country context, and found that existing e-government metrics designed for developed nations assume a "one size fits all" approach that ignores contextual, cultural, and environmental factors. Their framework emphasizes that citizen-centric evaluation must incorporate both government and citizen imperatives to measure service effectiveness meaningfully. This finding 

21 

directly supports AGAPP's design philosophy: rather than deploying a generic digital solution, AGAPP targets the specific realities of third-class municipalities, integrating features such as the E-Services Portal and Citizen Guide System that respond to documented citizen needs for transparent, accessible services. 

Aminah and Saksono (2021) studied Indonesia's digital government transformation and identified five persistent barriers: insufficient regulatory frameworks, lack of data integration across agencies, gaps in ICT infrastructure between regions, limited ICT competence among government personnel, and bureaucratic culture resistant to change. These findings mirror the Philippine local government context, where municipal LGUs often face similar constraints. AGAPP addresses several of these barriers directly: its PostgreSQL-based architecture with a unified database eliminates data silos, while the LGU Admin Dashboard provides centralized service management with minimal training overhead. 

Sagarik et al. (2018) examined Thailand's e-government 4.0 initiatives and documented the challenge of "silo-ization" where government agencies operate fragmented, non-interoperable systems. They emphasized the need for central coordination agencies and interoperable architectures. AGAPP's design as a single platform consolidating multiple LGU functions (service requests, issue reporting, announcements, forums, chatbots) directly counteracts this fragmentation at the municipal level. 

22 

Furtado et al. (2023) presented a framework for digital transformation toward smart governance in Ceará, Brazil, demonstrating that digital tools developed with a focus on vulnerable citizens can simultaneously advance multiple Sustainable Development Goals. Their seven-component framework emphasizes context-appropriate solutions rather than importing Global North models. This aligns with AGAPP's approach: the platform intentionally avoids requiring online payments (citizens pay at the hall counter) and runs on midrange Android devices, accepting the offline-physical touchpoint as a pragmatic adaptation to Philippine municipal realities rather than a design limitation. AGAPP thus operationalizes a context-sensitive, citizen-first digital government model for a small Philippine LGU. 

## **Integrated and Mobile Government Platforms** 

Although AGAPP is a municipal-level application, several recent sources show that mobile, integrated government platforms are the mainstream direction of e-government research. The UN DESA (2024) survey documents that the majority of member states now operate at least one mobile-first service portal, and the OECD (2020) framework explicitly lists "government as a platform" as one of its six pillars. Mergel et al. (2019) likewise emphasize that successful digital-government projects treat the underlying platform as a reusable asset that different offices can share, rather than building a new system for every service. 

The design implication for AGAPP is direct. Instead of building one mobile application for each LGU department, the proponents build a single application 

23 

that serves citizens, LGU personnel, and a Super Admin role through the same codebase, with access controlled by Row-Level Security in the database and by feature flags in the admin dashboard. This decision aligns AGAPP with the reusable-platform principle highlighted in the reviewed sources. 

Mobile government (m-government) extends e-government by leveraging the near-universal penetration of smartphones to deliver public services directly to citizens, particularly in underserved and rural communities where desktop internet access remains limited. Alqaralleh et al. (2020) proposed an integrated conceptual model for m-government acceptance in Jordan and found that trust in the mobile channel, trust in government, perceived usefulness, perceived ease of use, and service quality significantly influence behavioral intention to use m- government applications. These findings validate AGAPP's investment in a React Native mobile application over a web-only portal, since the mobile channel is the primary interface through which citizens in Liliw will access government services. 

Dar (2023) conducted a comprehensive study of m-governance in Jammu and Kashmir, India, and reported that m-governance enhances citizen engagement and participation while increasing transparency and accountability. The study also identified key barriers: limited technological infrastructure, low digital literacy, and concerns over data privacy and security. AGAPP's design responds to these barriers by providing an English/Filipino language toggle to accommodate varying literacy levels, a simple navigation structure with light/dark mode for accessibility, and transparent privacy practices aligned with the Data Privacy Act of 2012. 

24 

Kanaan et al. (2019) reviewed m-government implementation across multiple contexts and concluded that mobile technology streamlines the governance framework by enabling communication between government and citizens regardless of time and location. Their review emphasized that citizen adoption depends on perceived usefulness and ease of access. AGAPP's push notification module, real-time request tracking with five defined statuses (Submitted, Under Review, In Progress, Resolved, Rejected), and one-tap emergency hotline calling directly embody the anywhere-anytime service delivery that Kanaan et al. identified as the core value proposition of m-government. 

Rahmadany and Ahmad (2021) analyzed the role of mobile government in increasing democratic participation and found that mobile platforms open forums for citizen deliberation on government issues, addressing low democratic participation and corruption risks. AGAPP's Moderated Community Forum, equipped with automated profanity filtering and image safety scanning, provides a structured, safe space for citizen deliberation at the municipal level, extending the democratic participation benefits identified in the literature. 

## **Citizen-Sourced Issue Reporting and Volunteered Geographic Information** 

The idea that ordinary citizens with smartphones can contribute useful geographic data is now well established. See et al. (2016), in an open-access article in the _ISPRS International Journal of Geo-Information_ , synthesized the fields of crowdsourcing, citizen science, and volunteered geographic information (VGI). They concluded that citizen-contributed geographic data can match the 

25 

quality of authoritative sources once the contribution pipeline controls for positional accuracy, attribute completeness, and contributor reliability. 

The implication for AGAPP is that a citizen-reporting pipeline cannot be treated as a free-text comment box. Every report in AGAPP therefore carries a GPS point captured by the device, a timestamp generated on the server, a photograph captured in the application, and a category drawn from a controlled vocabulary (pothole, damaged or non-functioning utility pole, clogged drainage, stray animal, missing pet, and lost or found item). The LGU Admin can verify, route, or reject each report through a moderation console, so that the VGI quality controls described by See et al. (2016) are preserved even as volume scales. 

Citizen-sourced issue reporting transforms residents from passive service recipients into active participants in urban and municipal governance. Hansen and Dahiya (2025) studied Traffy Fondue, a digital citizen reporting platform deployed in Bangkok, Thailand, and found that it achieved an 84% citizen satisfaction rate while generating annual cost savings of US$2.14 million for the public sector. The platform's success was attributed to structured feedback mechanisms, comprehensive data collection on urban issues, and transparent resolution tracking. AGAPP's GPS-based issue reporting module, which supports categorized reporting of potholes, damaged utility poles, clogged drainage, stray animals, missing pets, and lost or found items, adopts the same structured category approach that proved effective in the Traffy Fondue case. 

26 

Berntzen et al. (2018) examined the concept of "citizens as sensors" through two platforms: FixMyStreet and Sauberes Wiesbaden. They found that digital platforms leveraging citizen observations can effectively complement official monitoring systems, provided that reports include adequate contextual metadata and that government agencies demonstrate visible responsiveness. The study highlighted that platforms with photo evidence, GPS coordinates, and structured categories yield higher-quality reports. AGAPP's issue reporting pipeline incorporates GPS metadata, image capture, and predefined categories, directly implementing the design principles Berntzen et al. identified as critical for report quality. 

Haltofová (2017) conducted a state-of-the-art survey of geocrowdsourcing mobile applications in e-government across Visegrad countries and found that the proliferation of smartphones and ubiquitous internet connectivity has made citizens an increasingly important source of geographic information. The study noted that geo-crowdsourcing can complement or, in some cases, replace traditionally generated spatial data sources for public management. AGAPP extends this concept by integrating citizen reports with the LGU Admin Dashboard's routing rules engine, which automatically assigns reports to the appropriate office or barangay based on location and category, ensuring that citizen-contributed data triggers actionable government responses rather than accumulating in unprocessed databases. 

27 

## **Machine Learning for Road Damage Detection** 

AGAPP's on-device pothole verifier is grounded in an established subfield of deep-learning road-damage detection. Maeda et al. (2018) released the widely cited Road Damage Dataset of 9,053 smartphone-captured images from eight Japanese municipalities and trained convolutional neural networks that achieved practical classification accuracy; an open-access preprint of their paper is available on arXiv (Maeda et al., 2018). Arya et al. (2021), in an open-access data article in Data in Brief, then released RDD2020, a multi-country dataset of 26,336 images from India, Japan, and the Czech Republic covering longitudinal cracks, transverse cracks, alligator cracks, and potholes. RDD2020 is the official benchmark for the annual IEEE Big Data Global Road Damage Detection Challenge and it demonstrates that smartphone-based road-damage detection generalizes across road types, climates, and cameras. 

AGAPP implements an on-device pothole detection system using YOLOv8n, the nano variant of the YOLO object detector family optimized for resource-constrained environments. The detection model is trained using transfer learning on the RDD2020 dataset (Arya et al., 2021), which contains 26,336 annotated road damage images from India, Japan, and the Czech Republic. To adapt the model to Philippine road conditions, the proponents will capture approximately 100 to 200 pothole images from local roads in Liliw, Laguna, and fine-tune the pre-trained model using these domain-specific samples. The trained model is exported to TensorFlow Lite with INT8 post-training quantization, reducing the model size to under 5 MB for deployment on mid-range Android 

28 

devices. This on-device approach ensures the adopting LGU does not need additional server infrastructure to operate the detector. 

Deep learning-based road damage detection has emerged as a costeffective alternative to manual inspection, which is hazardous, labor-intensive, and difficult to scale. Pena-Caballero et al. (2020) developed a real-time road hazard information system using YOLO object detection and achieved 97.98% overall model accuracy across four classes: manhole, pothole, blurred crosswalk, and blurred street line. Critically, they observed that full-sized detectors perform poorly on embedded systems and opted for a smaller, less accurate detector that could run in real time on a Google Coral Dev Board. This trade-off directly informs AGAPP's choice of YOLOv8n, the nano variant of YOLOv8, which is specifically designed for resource-constrained deployment. 

Sami et al. (2023) improved YOLOv5 for road pavement damage detection on the RDD2022 dataset and achieved state-of-the-art performance through the integration of the Efficient Channel Attention module (ECA-Net), label smoothing, K-means++ anchor clustering, and Focal Loss. Their model outperformed YOLOv8s with 3 million fewer parameters and 12 fewer GFlops. This finding validates AGAPP's methodological choice: using a smaller, optimized detection model (YOLOv8n) rather than a larger variant, since parameter efficiency directly translates to faster inference on citizen-owned midrange Android devices. 

29 

Diao et al. (2023) proposed LE-YOLOv5, a lightweight and efficient road damage detection algorithm that reduced parameters by 52.6% and GFlops by 57.0% compared to YOLOv5s while improving mean average precision by 5.3%. Their approach of combining lightweight backbone networks with attention mechanisms and parameter-free fusion modules demonstrates that aggressive model compression does not necessarily sacrifice accuracy. AGAPP applies this same principle through INT8 quantization using TensorFlow Lite, which further reduces model size and latency beyond the architectural optimizations already present in YOLOv8n, making real-time inference feasible on devices with as little as 3 GB of RAM. 

## **Chatbots and Conversational Artificial Intelligence in Public Service** 

Two open-access sources provide the most useful recent guidance for AGAPP's chatbot. Følstad et al. (2021), in an open-access article in the journal Computing, published an interdisciplinary research agenda that identified reliability, transparency, and safe fallback behavior as the core design requirements for chatbots deployed in public-facing settings. The authors argued that chatbots which attempt to answer every question eventually mislead their users and that a well-designed chatbot should instead recognize the limits of its knowledge and redirect the user to a human operator or an official document. 

The second source, the Mergel et al. (2019) study discussed earlier, reinforces the same point from a governance angle: public-sector digital services are evaluated on trust and accountability, not on novelty. Taken together, these 

30 

two sources shape AGAPP's chatbot. The chatbot implements a keywordmatching algorithm against a curated FAQ database of common LGU service questions. When no keyword match is found, the system falls back to Google's Gemini API for general inquiries. The chatbot surfaces the source document for every predefined answer, and refuses to answer whenever no match is found, returning instead a safe fallback that offers to file a support ticket on behalf of the citizen. 

## **Technology Acceptance and User Adoption** 

Venkatesh et al. (2016), in an open-access article in the Journal of the Association for Information Systems, revisited the Unified Theory of Acceptance and Use of Technology (UTAUT) a decade after its original formulation and proposed a multi-level framework in which individual characteristics, organizational context, and environmental factors jointly shape whether a new technology is adopted. Their synthesis consolidated more than ten years of UTAUT studies and identified performance expectancy, effort expectancy, social influence, facilitating conditions, hedonic motivation, and habit as the enduring predictors of technology acceptance. 

The proponents adopt this framework as the backbone of AGAPP's evaluation instrument discussed in Chapter III. The System Usability Scale is administered to capture effort expectancy and usability, and a purpose-built questionnaire captures performance expectancy, social influence, facilitating conditions, and habit. Because AGAPP is introduced in a municipal setting rather 

31 

than a private enterprise, the social-influence construct is particularly relevant: adoption among citizens depends in part on whether barangay officials, the municipal hall, and respected community members actively use and endorse the platform. 

## **Philippine Policy Context** 

The Philippine policy environment strongly supports AGAPP's direction. Republic Act No. 11032 (2018), the Ease of Doing Business and Efficient Government Service Delivery Act, mandates the streamlining of government transactions, prescribes maximum processing times by service classification (simple, complex, and highly technical), and promotes the adoption of information and communication technology in frontline services. The full text of the law is freely available in the Official Gazette of the Philippines. 

The Department of Information and Communications Technology (2022), through the E-Government Masterplan 2022, sets national priorities including integrated portals, interoperability across national agencies and LGUs, digital service delivery, and the eGOVPH Superapp vision of consolidating national and local services behind a single mobile front door. The masterplan is freely available on the DICT website. AGAPP aligns with both instruments by enforcing the RA 11032 service-level categories in its auto-routing engine and by exposing machine-readable endpoints that permit future integration with DICT superapp initiatives as they mature. These two instruments also provide the legal basis for 

32 

AGAPP's Privacy Notice and for the designation of a Data Protection Officer, both of which are required before the system is released to the public. 

Government digital platforms handle sensitive personal information and must comply with statutory data protection frameworks while defending against evolving cybersecurity threats. Csontos and Heckl (2025) conducted a longitudinal evaluation of 25 Hungarian government websites measuring accessibility, usability, and security compliance with WCAG guidelines over five years. Their study found that while accessibility and usability improved incrementally, security vulnerabilities persisted across multiple assessment cycles, emphasizing the need for continuous security auditing rather than onetime compliance checks. AGAPP adopts this continuous approach through Sprint 6's dedicated security hardening, which includes manual code review and npm audit for dependency vulnerability scanning, conducted iteratively as new features are integrated. 

Kumar (2020) examined multi-tenant SaaS architectures and compared database partitioning strategies, concluding that Row-Level Security (RLS) provides the optimal balance between data isolation and operational efficiency for multi-tenant systems with varying tenant data volumes. RLS enforces tenantspecific data visibility at the database engine level, preventing accidental or malicious cross-tenant data access even if application-layer controls are bypassed. AGAPP implements PostgreSQL RLS precisely for this reason: as the platform scales to additional municipalities beyond Liliw, RLS guarantees that the data of each LGU remains strictly isolated while sharing a single database 

33 

instance, eliminating the operational overhead of managing separate database clusters per LGU. 

Kaur and Gupta (2025) proposed an AI-driven quality assurance framework for inclusive government and e-commerce web services that integrates WCAG 2.1 accessibility standards with functional and non-functional testing parameters. Their framework emphasizes that accessibility is not an optional enhancement but a legal and ethical requirement for government digital services. In the Philippine context, Batas Pambansa Bilang 344 mandates accessibility in public services, and the National Privacy Commission's Circular 16-01 requires privacy impact assessments for government ICT projects. AGAPP's compliance approach includes a documented Privacy Impact Assessment, Data Protection Officer designation, WCAG 2.1 AA compliance targets for both admin dashboards, and audit logging for all data-access events, embedding privacy and accessibility as foundational design constraints rather than post-implementation additions. 

## **Geospatial Technologies and Interactive Mapping in Government** 

## **Applications** 

Open-source geospatial technologies have matured to the point where they can replace commercial mapping providers in government applications, offering comparable functionality without per-API-call costs or data sovereignty concerns. While peer-reviewed studies specifically on MapLibre GL in government contexts remain limited, the broader literature on open-source 

34 

geospatial stacks in civic applications provides strong support. PostGIS, the geospatial extension for PostgreSQL, is extensively documented and validated in academic literature for spatial query processing, and OpenStreetMap has been successfully deployed in numerous government and humanitarian applications worldwide. AGAPP's architecture incorporates PostGIS for storing GPS-tagged citizen reports with spatial indexing, enabling the LGU Admin Dashboard to perform barangay-level auto-routing and proximity-based report assignment. 

The interactive town map in AGAPP's mobile application, rendered using MapLibre GL with OpenStreetMap data, serves a dual function. First, it provides citizens with a discoverable directory of public facilities (offices, hospitals, schools, tourist spots), reducing the information asymmetry that often burdens new residents or visitors. Second, the SOS GPS-share feature in the Emergency Hotlines module transmits the citizen's real-time location to pre-configured emergency contacts and LGU responders, leveraging the same geospatial infrastructure. By avoiding commercial map providers, AGAPP eliminates perrequest API costs that would become prohibitive at scale across multiple LGUs, and it retains full control over map styling and data layers. 

The PostGIS spatial database also enables future analytic capabilities: the Super Admin Dashboard can aggregate de-identified geospatial report data across LGUs to generate heat maps of common infrastructure issues, supporting evidence-based resource allocation by provincial or national oversight bodies. This geospatial architecture thus serves both immediate citizen-facing functions and downstream governance analytics. 

35 

## **Agile and Scrum Methodology in Software Development** 

The adoption of Agile and Scrum methodologies has been shown to improve software project outcomes, particularly in environments where requirements evolve throughout development. Baxter et al. (2023) examined agile adoption in a large UK defense sector IT program and found that while institutional tensions between agile practices and traditional government funding and governance models created challenges, the change mechanisms of "mission collaborator" and "one team culture" significantly improved project alignment with user needs. This finding supports AGAPP's 8-sprint Scrum model (Sprint 0 through Sprint 7), where each sprint delivers a demonstrable increment aligned with specific stakeholder priorities. 

Nuottila et al. (2022) identified and categorized the challenges of adopting agile methods in public organizations, including rigid procurement processes, cultural resistance to iterative change, and difficulties in aligning agile workflows with public sector accountability requirements. Their case study of a large governmental office found that these challenges, while significant, could be overcome through targeted training, leadership commitment, and phased adoption. AGAPP's development plan accounts for these challenges by conducting stakeholder sprint reviews at the conclusion of each sprint, inviting both LGU staff and citizen representatives to provide feedback that directly influences the next sprint's backlog, thereby building organizational buy-in incrementally. 

36 

Dingsøyr et al. (2022) conducted a longitudinal case study of a large-scale agile development program with 10 development teams and identified 27 coordination mechanisms in the first-generation method versus 14 in the secondgeneration method. Their findings emphasized that team coordination is one of the primary challenges in scaling agile, and that well-defined sprint cadences, daily stand-ups, and retrospective ceremonies are essential for maintaining alignment. While AGAPP is a single-team capstone project rather than a multiteam enterprise program, the Scrum ceremonies (sprint planning, daily stand-ups, sprint review, and retrospective) provide the structured coordination that Dingsøyr et al. identified as critical for maintaining development velocity, particularly given the project's technical breadth spanning mobile development, web dashboards, on-device machine learning, and database architecture. 

## **Philippine E-Governance Policy and Local Government Digitalization** 

The Philippines has established a comprehensive legislative and policy framework for e-governance, yet implementation at the municipal level remains uneven. Abales et al. (2024) assessed the e-government services of Valencia City, Bukidnon, and found that while the LGU demonstrated policy capacity and readiness for digital innovation, challenges persisted in citizen acceptance, interagency coordination, and sustainable capacity building. Their study identified essential competencies including human resources, data management, technical expertise, and training as critical success factors. AGAPP addresses these competency gaps by providing an intuitive LGU Admin Dashboard that minimizes 

37 

the technical expertise required for day-to-day operations, with features such as visual office assignment routing rules and a web-based knowledge base editor. 

Palma et al. (2023) conducted a critical review of e-government system features across six highly urbanized Philippine cities (Manila, Taguig, Pasay, Makati, Quezon, and Davao) and categorized available services into Government-to-Citizen (G2C), Government-to-Business (G2B), and Governmentto-Government (G2G) blocks. Their study found that the most common features across all cities were online permit applications, document request systems, and public information portals. AGAPP's feature set directly maps to these established categories while extending beyond them, incorporating novel capabilities such as on-device pothole detection using YOLOv8n and a keywordbased chatbot with Gemini API fallback that are absent from the systems analyzed by Palma et al. 

Francis Mark et al. (2025) assessed the AI readiness of Philippine LGUs and found generally low to moderate readiness, with critical bottlenecks including shortages of ICT and AI-related skills, limited last-mile internet connectivity, and minimal budget allocations for digital initiatives. They noted that LGUs face the challenge of balancing immediate public service delivery with longer-term digital transformation investments. AGAPP's design is sensitive to this resourceconstrained reality: the platform implements on-device pothole detection using YOLOv8n without requiring server-side GPU infrastructure, and the chatbot operates using keyword matching and Gemini API on the same PostgreSQL 

38 

database already required for core operations, eliminating the need for a separate AI infrastructure investment. 

Mascara (2025) evaluated e-government service delivery in selected municipalities of Lanao del Sur and identified significant gaps in existing governance strategies, including limited transparency mechanisms and inefficient service routing. The study recommended integrated digital platforms that connect citizen-facing interfaces with back-end administrative workflows. AGAPP's E- Services Portal, which generates pre-filled PDFs with reference QR codes and integrates with the LGU Admin Dashboard for routing and approval, directly addresses the integration gap that Mascara identified, connecting the citizen's application journey to the LGU staff's workflow in a seamless digital-physical hybrid process. 

## **Synthesis of Related Literature and Research Gaps** 

The reviewed literature consistently affirms that digital transformation in government is most effective when it is citizen-centric, context-appropriate, and integrated across service silos. Across all sections, three recurring themes emerge. First, adoption of government digital services depends on trust, perceived usefulness, and system quality, with trust being particularly salient in developing-country contexts where citizens may be skeptical of government digital initiatives. Second, the most successful government platforms are those that close the feedback loop between citizen input and government action, whether through transparent issue reporting, responsive chatbots, or real-time 

39 

service tracking. Third, technical architecture decisions such as data isolation, offline-capable design, and open-source technology stacks are not neutral implementation details but strategic choices that determine whether a platform can scale sustainably across resource-constrained environments. 

Three significant research gaps emerge from the literature that AGAPP directly addresses. First, the vast majority of e-government studies focus on national-level platforms or highly urbanized city governments, with very few examining the unique constraints and opportunities of small, rural municipalities. AGAPP's single-municipality pilot in Liliw and its multi-LGU capable architecture provide empirical evidence on how digital governance platforms can be designed for and scaled across municipalities with limited ICT budgets and personnel. Second, while on-device machine learning has been extensively studied in consumer applications, its application in civic engagement contexts, particularly in developing countries, is virtually absent from the peer-reviewed literature. AGAPP implements on-device pothole detection using YOLOv8n trained via transfer learning on the RDD2020 dataset, with fine-tuning on Philippine road images. Third, while knowledge-based chatbots have been studied in healthcare and legal domains, their application to Philippine LGU service delivery has not been previously reported. AGAPP's chatbot implements keyword matching against curated FAQs with Gemini API fallback, contributing empirical evidence on the design of conversational AI for Philippine municipal governance. 

AGAPP advances the existing body of literature by integrating these three contributions (municipal-scale multi-feature platform, on-device machine learning 

40 

for civic engagement, and keyword-based chatbot with LLM fallback) into a single, coherent system that respects the resource constraints and procedural realities of Philippine LGUs. 

## **Developer Tools** 

## **TypeScript** 

TypeScript is a free and open-source programming language made by Microsoft that builds on top of standard JavaScript by adding strict data types. This tool was chosen for the project instead of standard JavaScript because it helps developers find errors while they are writing code rather than after the system is already working and deployed. It is better than other strict programming languages like Java or C# because it works perfectly with modern web and mobile systems while providing excellent features like code autocompletion and clear structure definitions. In this study, TypeScript will serve as the main programming language for the whole platform. The developers will use it to write clean and error-free code for the mobile app, both of the web management dashboards, and the central backend server. 

## **React Native with Expo** 

React Native is an open-source framework created by Meta that allows developers to build mobile applications for both Android and iOS devices using just one single code repository. Expo is a set of tools built around React Native that makes development easier by offering ready-to-use phone features and an 

41 

online building system. This combination was chosen instead of native tools like Swift or Kotlin because it saves time and effort by removing the need to create and maintain two separate applications for different phone brands. It was also picked instead of standard React Native because it allows the developers to send instant updates to the application without making users download a new version from the app store every time. For this project, React Native with Expo will be used to create the mobile application that citizens use on their phones. It will control the design layouts, screen navigation, user settings, phone alerts, and the mobile camera for taking pictures. 

## **Next.js 14** 

Next.js 14 is a modern web development framework created by Vercel that is built on top of the React library, and it focuses on rendering web pages on the server instead of the user's web browser. This tool was selected over standard React tools because standard setups process everything inside the user's browser, which makes the website slow to load when dealing with huge amounts of information. Next.js 14 fixes this issue by preparing the data on the server first, making the website load much faster and work smoothly even on weaker computers or phones. The developers will use Next.js 14 to build the two web platforms for the system: the main LGU Administration Dashboard, where local government workers can see requests and manage citizen profiles, and the Super Admin Dashboard, which is used to manage the entire multi-town platform and view system analytics. 

42 

## **Node.js with NestJS** 

Node.js is a free and cross-platform runtime environment that runs JavaScript code on a server using an asynchronous system that handles multiple tasks at the same time. NestJS is a progressive server framework designed to build reliable and scalable backend systems using TypeScript, following a very organized structure. This backend combination was selected instead of traditional choices like PHP (Laravel) or Python (Django) because it can manage thousands of citizen data connections simultaneously without slowing down the server hardware. NestJS was specifically chosen over simpler tools like Express because it forces the programmers to divide the code into clear sections like Modules, Controllers, and Services, which makes the backend easy to update and maintain as the project grows. In this project, this stack will serve as the main API Server Engine, which is responsible for security check-ins, checking user data, running the chatbot system, and connecting the application to the database. 

## **PostgreSQL with PostGIS** 

PostgreSQL is a powerful and free relational database management system that makes sure all stored data is safe, accurate, and organized. PostGIS is an extra extension for PostgreSQL that allows the database to understand geographical and spatial information, such as map coordinates, using standard database commands. This database tool was chosen over standard options like MySQL or MongoDB because ordinary databases do not have native tools to 

43 

handle map data and location distance checks. PostgreSQL with PostGIS allows the platform to calculate map distances and location boundaries quickly without paying for expensive third-party online map services. For this study, it serves as the Central Relational and Geospatial Database. It will securely store user records, application histories, and forum posts, while using map locations to send citizen problem reports automatically to the correct local government office based on where the issue happened. 

## **Supabase Storage** 

Supabase Storage is an open-source cloud storage system built on safe internet infrastructure that gives developers an easy way to upload, manage, and deliver files like pictures and documents. This tool was chosen instead of putting files directly inside the main database, because saving large files like photos inside a database makes it slow and lowers its overall performance over time. It was picked over other services like Firebase or Google Cloud Storage because it is free to use, easy to connect to the code, and works perfectly with the project's PostgreSQL database system. In this study, Supabase Storage will act as the Unstructured Media Storage Vault. It will be used to store and protect user profile pictures, real-time photos uploaded by citizens when they report community issues, and the official PDF documents created by the system. 

## **MapLibre GL** 

MapLibre GL is a free, community-led programming library used to display fast and interactive maps on websites and mobile screens using smooth 

44 

computer graphics. This mapping library was chosen over popular alternatives like the Google Maps API or Mapbox GL because those commercial systems charge expensive and unpredictable fees based on how many times people look at the map, which is too costly for local government budgets. MapLibre GL is completely free to use, easy to customize, and displays detailed map graphics smoothly even on cheaper smartphones. Within this project, MapLibre GL will power all the Interactive Map Visualizations. It will be used to show the indoor floor maps of the municipal hall and the local landmark tracker inside the mobile app, as well as the map pins for citizen reports inside the LGU Admin Dashboard. 

## **Visual Studio Code (VS Code)** 

Visual Studio Code is a lightweight and free code editor created by Microsoft that includes helpful features like text color-coding, error tracking, and smart code suggestions. This program was chosen instead of heavy development software like WebStorm or Android Studio because heavy programs require a large amount of computer memory and slow down development workflows on ordinary laptops. VS Code is very lightweight but allows the developers to install helpful add-ons for TypeScript and React Native to make writing code much faster and cleaner. The developers will use Visual Studio Code as their main Integrated Development Environment (IDE) to write, arrange, test, and fix all parts of the code for the entire platform. 

45 

## **GitHub** 

GitHub is an online platform for hosting code and managing files using the Git version control system, allowing multiple programmers to work together on the same project smoothly. This tool was chosen instead of manual file sharing methods, such as copying code folders to flash drives or online cloud storage links, because manual sharing often causes files to be accidentally overwritten and ruins development progress. GitHub was selected over other options like GitLab or Bitbucket because it offers simpler tools for tracking changes, reviewing each other's work, and is widely used by developers worldwide. For this capstone project, GitHub will be used as the Version Control and Collaboration Platform. It will allow the team members to work on separate features safely in their own workspaces, track code history, and combine their work into one final, working copy of the system. 

46 

## **CHAPTER III** 

## **METHODOLOGY** 

## **Project Design** 

## **Figure 2. Project Design of the Automated Governance and Public Service** 

## **Platform** 

Figure 2 presents the project design of the Automated Governance and Public Service Platform (AGAPP). The diagram identifies four user roles that will interact with the platform: the Citizen, who will access the system through the AGAPP mobile application on Android and iOS devices, and the Super Administrator, the LGU Administrator, and the LGU Personnel, who will each access the system through a web browser. All four user clients will communicate with the AGAPP backend, implemented as a Node.js application built on the 

47 

NestJS framework, over HTTP/REST. The backend will in turn connect to two storage components: a PostgreSQL database extended with PostGIS, used over SQL for citizen accounts, service requests, geotagged issue reports, news posts, forum entries, chatbot knowledge-base entries, and audit logs; and Supabase Storage, used for uploading and downloading photos and other attachments submitted by citizens. The two-way arrows between the clients and the backend, and between the backend and each storage component, indicate that data will be both sent and received during normal operation, allowing personnel inside the Municipal Hall and citizens from any location to connect to the system, retrieve information, and save new submissions. Different groups will use the platform for different purposes, with separate levels of access and responsibilities based on their roles within the local government service-delivery process. 

## **Flowchart** 

Several flowcharts in this chapter are split into sub-figures connected by lettered off-page connectors (A through L). Each lettered circle on one sub-figure points to the matching circle on the continuation sub-figure, so that the workflow can be read across pages without losing continuity. 

48 

**Figure 3A. Flowchart of the Main Interface for Super Administrator —** 

## **Authentication** 

Figure 3A presents the authentication portion of the Super Administrator workflow. The process will begin when the Super Administrator opens the dashboard, enters an email address and a password, and is checked against the 

49 

authentication service. If the credentials are not valid, the form will be redisplayed for another attempt. If they are valid, the Super Administrator will be brought to the Main Interface, from which two off-page connectors, labeled A and 

B, will branch out to the next two sub-figures: A leads to Core Management (Figure 3B) and B leads to Admin Tools (Figure 3C). 

**Figure 3B. Flowchart of the Main Interface for Super Administrator — Core** 

## **Management** 

Figure 3B continues from off-page connector A and presents the three core-management modules of the Super Administrator dashboard. From the Main Interface, the Super Administrator will be able to enter LGU Management, where they will register a new LGU municipality, deactivate an existing LGU, or edit the details of an LGU; Cross-LGU Analytics, where they will view aggregated metrics and leaderboards of resolution time and citizen-satisfaction scores across all LGUs; and Feature Flags, where they will enable or disable individual modules on a per-LGU basis. Every branch terminates at the End node. 

50 

**Figure 3C. Flowchart of the Main Interface for Super Administrator —** 

## **Admin Tools** 

Figure 3C continues from off-page connector B and presents the administrative tools of the Super Administrator. From the Main Interface, the Super Administrator will be able to open Compliance, where they will monitor audit logs, check the Data Protection Officer designation status of each LGU, and review the data-privacy artifacts; configure global authentication, notification, and storage settings; oversee user accounts across all LGUs; or log out. The Compliance branch and the other tools all terminate at the End node. 

51 

**Figure 4A. Flowchart of the Main Interface for LGU Administrator —** 

## **Authentication** 

Figure 4A presents the authentication portion of the LGU Administrator workflow. The LGU Administrator will enter an email address and a password, which will be validated by the authentication service. If the credentials are not valid, the form will be shown again. If they are valid, the LGU Administrator will 

52 

reach the Main Interface, from which two off-page connectors, labeled C and D, will branch out: C leads to Core Operations (Figure 4B) and D leads to Admin Functions (Figure 4C). 

**Figure 4B. Flowchart of the Main Interface for LGU Administrator — Core** 

## **Operations** 

Figure 4B continues from off-page connector C and presents the day-today modules of the LGU Administrator. From the Main Interface, the LGU Administrator will be able to open the Dashboard to view real-time municipal metrics, enter Service Requests to access citizen document applications, enter Issue Reports to monitor GPS-based citizen reports, open News and Announcements to publish official advisories, or open Forum Moderation to review flagged posts. Each branch concludes at the End node. 

53 

**Figure 4C. Flowchart of the Main Interface for LGU Administrator — Admin** 

## **Functions** 

Figure 4C continues from off-page connector D and presents the administrative configuration tools of the LGU Administrator. From the Main Interface, the LGU Administrator will be able to configure report routing rules, maintain the source documents used by the chatbot's knowledge base, oversee LGU staff accounts, or log out. Every branch terminates at the End node. 

54 

**Figure 5. Flowchart of the Dashboard for Super Administrator and LGU** 

## **Administrator** 

55 

Figure 5 illustrates the dashboard reporting flow used by both the Super Administrator and the LGU Administrator. After opening the dashboard, the system will gather the key metrics and display them as graphs and a heatmap of the municipality. The administrator will then decide whether to apply filters; if so, the displayed metrics will be adjusted by date, barangay, category, or status before the report is generated, and otherwise the report will be generated directly. The final step will allow the administrator to print or export the report. 

56 

## **Figure 6. Flowchart of Service Requests for LGU Administrator** 

Figure 6 presents the workflow for handling citizen document applications. After the LGU Administrator opens the Service Requests page, the system will display the queue of incoming applications. The LGU Administrator will decide whether to apply filters; if so, the queue will be filtered by service type, status, or office. From the queue, the LGU Administrator will select an application and choose one of four actions: update its status to Submitted, In Progress, or Resolved; assign it to LGU staff; attach the released document; or reject it with a stated reason. Each of these actions will be recorded as a state transition in the audit log before the workflow ends. 

57 

**Figure 7. Flowchart of Issue Reports for LGU Administrator** 

58 

Figure 7 presents the workflow for handling GPS-based citizen reports. After the LGU Administrator opens the Issue Reports page, the system will provide a map view of all open reports as well as a queue grouped by category. The auto-routing engine will assign each new report to the responsible office. The LGU Administrator will then choose to acknowledge a report and verify it, reroute it to a different office, or reject it with a stated reason. Verified or rerouted reports will move into a status-update loop, and a push notification will be sent to the citizen on every transition. The loop will continue until the report is marked as resolved, at which point the system will generate a printable resolution log. Rejected reports will go directly to the End node. 

59 

60 

**Figure 8. Flowchart of News and Announcements for LGU Administrator** 

Figure 8 presents the publishing workflow for official LGU content. After opening the News and Announcements page, the LGU Administrator will see the 

61 

list of existing announcements and decide to either create a new post in the draft editor or edit an existing post. After attaching any images or PDFs, they will choose whether to schedule the post; if scheduling is selected, the system will wait for the configured publish date before publishing, and otherwise the post will be published immediately. Once published, the post will become visible in the citizen mobile application, and a push notification will be sent to subscribed citizens. 

62 

**Figure 9. Flowchart of Forum Moderation for LGU Administrator** 

63 

Figure 9 presents the workflow for moderating the community forum from the LGU Administrator's side. When a citizen submits a new post, the system will run an automated profanity filter and an image safety scan. Posts that pass will be published immediately, while those that fail will be placed in a moderation queue for the LGU Administrator to review. From the queue, the LGU Administrator will approve a post, edit its content before publishing, or reject it with a stated reason. The citizen will be notified of the outcome — either that the post has been published or that it has been rejected — and the action will be recorded in the audit log. 

64 

**Figure 10. Flowchart of Office Assignments for LGU Administrator** 

65 

Figure 10 presents the configuration workflow for the auto-routing engine. After opening the Office Assignments page, the LGU Administrator will view the current routing ruleset and choose to add a new rule, edit an existing rule, or archive an outdated rule. When adding or editing a rule, the LGU Administrator will map a combination of report category and barangay to a target LGU office and assign a service-level category as defined by Republic Act No. 11032. Once the rule is saved — whether newly created, edited, or archived — the system will apply it to all newly received reports. 

66 

**Figure 11A. Flowchart of User Management — Access and Filter** 

Figure 11A presents the access portion of the User Management workflow 

used by both the Super Administrator and the LGU Administrator. After opening the User Management page, the user list will be displayed. The administrator will then decide whether to apply filters; if so, the list will be filtered by role or status. In either case, the workflow will continue through off-page connector E into Figure 11B. 

67 

**Figure 11B. Flowchart of User Management — User Actions** 

Figure 11B continues from off-page connector E and presents the actions that can be performed on a selected user. The administrator will choose to add a new user account, edit an existing user's details, or archive a user account. Whichever action is selected, the changes will be saved before the workflow ends. From the same action selector, the administrator may also choose to generate a report, which transitions through off-page connector F into Figure 11C. 

68 

**Figure 11C. Flowchart of User Management — Reporting** 

Figure 11C continues from off-page connector F and presents the reporting and data-protection options of User Management. The administrator will be able to generate a user report, view the user activity logs, or perform a backup or restore. Each path terminates at the End node. 

69 

**Figure 12A. Flowchart of the Main Interface for Citizen — Authentication** 

70 

Figure 12A presents the authentication portion of the Citizen workflow. The citizen will first indicate whether they are a new or returning user. New citizens will provide an email address and a password, after which an email onetime password will be sent and verified before they complete a short profile form. Returning citizens will sign in with their credentials or with an emailed one-time password as an alternative for passwordless login or password recovery. After successful authentication, both paths converge at the Main Interface, from which two off-page connectors, labeled G and H, branch out: G leads to Core Services (Figure 12B) and H leads to Account Options (Figure 12C). 

**Figure 12B. Flowchart of the Main Interface for Citizen — Core Services** 

71 

Figure 12B continues from off-page connector G and presents the citizenfacing services. From the Main Interface, eight branches are available. Service Directory leads to Apply for LGU Documents, Submit Report leads to Submit GPS-Based Issue Report, Track Report leads to Check Submission Status, and News and Announcements leads to a View Page; all four of these paths terminate at the End node. The remaining four services transition through offpage connectors to their dedicated flowcharts: Town Map continues through offpage connector I into Figure 16, Emergency Hotlines through off-page connector J into Figure 17, Community Forum through off-page connector K into Figure 18, and Chatbot through off-page connector L into Figure 19. 

**Figure 12C. Flowchart of the Main Interface for Citizen — Account Options** 

Figure 12C continues from off-page connector H and presents the secondary options of the Citizen Main Interface. The citizen will be able to 

72 

manage their account settings, view their submission history, or log out, with 

each path terminating at the End node. 

**Figure 13. Flowchart of the Service Directory for Citizen** 

73 

Figure 13 presents the citizen's document-application flow. The citizen will browse the catalog of available LGU services, select a service, and fill out the guided application form that captures only the data required for that service. The citizen will decide whether to save the form as a draft; if saved, the citizen may continue later, which loops back to the form, or end the session for now. If the form is submitted, the system will generate a reference number and a QR code, which the citizen will present at the Municipal Hall counter, after which the workflow ends. 

74 

**Figure 14. Flowchart of Submit Report for Citizen** 

Figure 14 presents the GPS-based reporting flow. The citizen will open the report submission form, select a report category, capture a photo using the inapp camera, and confirm the GPS location on the map. If the selected category is Pothole, the on-device YOLOv8n pothole detector will run on the photo. If the model's confidence is above the configured threshold, the citizen will proceed to add an optional description; otherwise, a low-confidence warning will be shown, and the citizen will decide whether to confirm the submission anyway. If the 

75 

citizen confirms, they will continue to the description step; if not, the report will be cancelled. For non-pothole categories, the description step is reached directly. After the citizen submits, the system will generate a reference number and add 

the report to the citizen's tracking list before the workflow ends. 

**Figure 15. Flowchart of Track Report for Citizen** 

76 

Figure 15 presents the workflow for monitoring submissions. After opening the Track Report screen, the citizen will see the list of their service requests and issue reports and select one. The screen will then show the current status and the assigned office. The status branches into Submitted, Under Review, In Progress, Rejected, and Resolved. For Resolved submissions, the citizen will be asked whether they want to rate the resolution; if yes, they will provide feedback and a rating that will update the LGU's citizen-satisfaction score. All other status values lead directly to the End node. 

77 

**Figure 16. Flowchart of the Town Map for Citizen** 

78 

Figure 16 continues from off-page connector I and presents the interactive map flow. After opening the Town Map, the system will render OpenStreetMap tiles with key landmarks highlighted. The citizen will choose one of three actions: search for a landmark by name, tap a pin directly, or request directions. Searching will drop a pin on the matching landmark and lead to its details view, which will display office hours and contact information. Requesting directions will display a route to the selected location. Each path terminates at the End node. 

79 

**Figure 17. Flowchart of Emergency Hotlines for Citizen** 

80 

Figure 17 continues from off-page connector J and presents the one-tap emergency-contact flow. After opening the Emergency Hotlines screen, the citizen will select a hotline type — Police, Fire Department, Hospital, or the MDRRMO Duty Desk — and the device will place the corresponding outgoing call. After the call is initiated, the citizen will be asked whether to activate the SOS payload; if yes, the citizen's GPS location will be shared with the MDRRMO Duty Desk and the duty desk will be notified, and otherwise the workflow ends. 

81 

**Figure 18. Flowchart of the Community Forum for Citizen** 

82 

Figure 18 continues from off-page connector K and presents the moderated forum flow from the citizen's perspective. After opening the Community Forum, the citizen will choose to browse recent posts, search by keyword, or compose a new post. Browsing or searching leads to the post list, where the citizen will be able to like, comment on, or report a post. Composing a new post triggers the automated profanity filter and image safety scan; posts that pass the filter will be published immediately, while those that fail will be placed in a moderation queue. The citizen will be notified either that the post has been published or that it is pending moderation, and the workflow ends. 

83 

**Figure 19. Flowchart of the Chatbot for Citizen** 

Figure 19 continues from off-page connector L and presents the chatbot 

flow. After opening the chatbot interface, the citizen will type a question, and the 

84 

system will first search the LGU's curated FAQ knowledge base. If a matching FAQ entry is found, the system will return the matching answer together with its source document. If no FAQ match is found, the question will be forwarded to Gemini AI, which will generate an answer that the system will return to the citizen. 

85 

**Figure 20. Flowchart of Account Settings for Citizen** 

Figure 20 presents the account-settings flow. After opening the Account Settings screen, the citizen will review the current preferences and decide 

86 

whether changes are needed. If not, the citizen will return to the Main Interface. Otherwise, the citizen will choose which setting to edit — password, notification preferences, language (English or Filipino), or theme (light mode or dark mode) — and submit the changes. The system will then confirm that the modifications have been applied and present the external links to the LGU's official Facebook page and YouTube channel before returning the citizen to the Main Interface. 

## **Wireframes** 

**Figure 21. Wireframe for the Citizen Sign-Up** 

87 

Figure 21 illustrates the Sign-Up screen of AGAPP. At the top of the screen is the application logo, followed by the wordmark "Agapp." and the tagline "Automated Governance and Public Service Platform." The citizen will be able to authenticate using a passwordless flow: an email input field labeled with the sample placeholder "user@email.com," a "Send Passcode" button that will trigger a one-time passcode to the supplied email address, a six-box passcode entry strip labeled "Enter Passcode," and a Login button. Below the login controls is a "Permissions & Consent" panel containing two opt-in checkboxes, one for GPS Geofence Tracking and one for Emergency Push Notifications. The layout is intentionally minimal so that first-time users will be able to complete registration quickly. 

**Figure 22. Wireframe for the Citizen Main Interface** 

88 

Figure 22 illustrates the Main Interface of the AGAPP mobile application. The top of the screen carries a header showing the active municipality (for example, "Municipality of Liliw") and a "Switch LGU" link at the upper right that will allow the citizen to change the active LGU. Directly below the header is a banner block displaying "Bayan ng Liliw" with the secondary line "Citizen Service & Governance Portal." The body of the screen is organized into two stacked sections. The first section, labeled "E-Services," presents a horizontally scrollable carousel of feature tiles — visible examples include Documents, Potholes, and AI Assistant — with left and right arrow indicators showing that more tiles can be reached by swiping. The second section, labeled "Emergency Access," provides one-tap hotline buttons for Police Department (PNP) and Fire Protection Bureau. A bottom navigation bar with five icon shortcuts persists at the foot of the screen. 

**Figure 23. Wireframe for the Submit Report Flow** 

89 

Figure 23 illustrates the Submit Report screen, titled "Report Community Concern." The screen is divided vertically into four sections. The first section, "Select Category," presents a horizontally scrollable strip of pill-shaped category chips such as "pothole," "clogged drainage," and "stray," with left and right arrow indicators showing that more categories can be reached by swiping. The second section, "Description," is a multi-line text area for the citizen to enter additional details. The third section is the photo capture area, consisting of a "Snap Photo" button, a "Photo Preview" placeholder where the captured image will be displayed, and an "ML Confidence" indicator that will display the on-device pothole detector's confidence score (for example, 93%). The fourth section, "Location," shows the auto-captured GPS coordinates. 

**Figure 24. Wireframe of the LGU Admin Dashboard** 

90 

Figure 24 illustrates the Dashboard Overview of the LGU Admin Dashboard. The screen is divided into a left vertical sidebar and a main content area. The sidebar carries the site logo at the top, followed by navigation links for Dashboard, Service Requests, Issue Reports, News, Forum, and Settings. The main content area has a header bar with the title "Dashboard Overview" and the signed-in user's name and avatar at the upper right. Directly below the header is a row of four key-metric stat cards, each showing a label, a numeric value, and a trend indicator. The middle row pairs a "Report Volume by Category" bar chart with a "Location Heatmap" panel. The bottom row contains a "Recent Submissions" panel with a data table and a "View All" shortcut at the upper right. 

**Figure 25. Wireframe of the Issue Reports Page** 

91 

Figure 25 illustrates the Issue Reports Page of the LGU Admin Dashboard. The left sidebar carries the same navigation links as the dashboard. The main content area has a header bar titled "Issue Reports" with three filter controls at the upper right: All Categories, Status: All, and Date Range. The body of the page is split into two side-by-side panes. The left pane is a search and queue panel that begins with a "Search reports…" input followed by a vertical list of report cards; each card shows the report reference number, category, barangay, time since submission, and a status tag (such as Submitted, Under Review, or In Progress). The right pane is a report-detail panel showing the selected report's reference number and status tag, a photo preview placeholder, and the report's metadata — Category, Submitted By, Location, GPS Coordinates, and Assigned Office — followed by three action buttons: Acknowledge, Reassign, and Reject. 

**Figure 26. Wireframe of the Service Requests Page** 

92 

Figure 26 illustrates the Service Requests Page of the LGU Admin Dashboard. The header bar carries the title "Service Requests" and a "Generate Report" button at the upper right. Below the header is a row of four filter dropdowns — Date Range, Service Type, Status, and Office — followed by a row of four stat cards: Total Requests, Pending, Processing, and Completed. The lower portion of the page contains a data table of citizen document applications with the columns Reference, Service, Requester, Status, and Office. Sample rows illustrate the layout, including a Birth Certificate request routed to the Civil Registrar, a Business Permit routed to the Business Permits and Licensing Office 

(BPLO), and a Barangay Clearance routed to the Barangay office. 

**Figure 27. Wireframe of the News and Announcements Page** 

93 

Figure 27 illustrates the News and Announcements Page of the LGU Admin Dashboard. The header bar carries the title "News and Announcements" and a "+ Create New" button at the upper right. The body of the page is split into two side-by-side panels. The left panel, titled "Create Announcement," contains a Title input field, a Content text area, and an Attachments drop zone labeled "Drop files here or click to upload — Images and PDFs supported," followed by two primary action buttons, "Publish Now" and "Schedule." The right panel, titled "Mobile Preview," displays a vertical phone-sized placeholder so that the LGU Administrator will be able to preview how the announcement will appear in the citizen mobile application before publishing. 

**Figure 28. Wireframe of the Forum Moderation Page** 

94 

Figure 28 illustrates the Forum Moderation Page of the LGU Admin Dashboard. The header bar carries the title "Forum Moderation" and three tab counters at the upper right: Pending (5), Flagged (2), and All Posts. Below the header is a search bar labeled "Search posts by author or keyword…" and an "All Categories" dropdown. The body of the page lists individual post cards. Each card shows the author's avatar and name, the time since posting, the post text, the post category and comment count, a status tag at the upper right (for example, "Awaiting Moderation" or "Flagged by Filter"), and three action buttons: Approve, Edit, and Reject. The wireframe shows sample cards including a community post awaiting moderation and a post automatically flagged by the profanity filter. 

**Figure 29. Wireframe of the Office Assignments Page** 

95 

Figure 29 illustrates the Office Assignments Page of the LGU Admin Dashboard. The body of the page is split into two side-by-side panels. The left panel, titled "Current Routing Rules," contains a table of existing rules with the columns Category, Barangay, Assigned Office, SLA Tier, and Actions; sample rows illustrate the format, including Pothole and Drainage routed to the Engineering office, Business Permit routed to BPLO, and Birth Certificate routed to the Civil Registrar, each tagged with an SLA tier (Simple, Complex, or Technical) and Edit and Archive controls. The right panel, titled "Add New Rule," is a form with a Category dropdown, a Barangay input, an Assign Office dropdown, and an SLA Tier (RA 11032) dropdown, followed by a reference card listing the RA 11032 service-level tiers (Simple Transactions — 3 days, Complex Transactions — 7 days, and Highly Technical — 10 days) and a primary "Save Rule" button. 

96 

## **Figure 30. Wireframe of the User Management Page** 

Figure 30 illustrates the User Management Page of the LGU Admin Dashboard. The header bar carries the title "User Management" and two buttons at the upper right: "Export Users" and "+ Add Users." Below the header is a search bar labeled "Search users by name or email…" paired with an "All Roles" filter and an "All Status" dropdown. The main content area is a user table with the columns Name / Email, Role, Barangay, Status, and Actions, where the Actions column carries three icon buttons per row for editing, archiving, and similar operations. Sample rows illustrate the row format, including an LGU Administrator, an Engineering Staff member, and two citizen accounts. A pagenumber pagination control with previous and next arrows sits below the table. 

97 

**Figure 31. Wireframe of the Super Admin Cross-LGU Analytics Page** 

Figure 31 illustrates the Cross-LGU Analytics Dashboard of the Super Admin Dashboard. The header bar carries the title "Cross-LGU Analytics Dashboard" and the signed-in user's name and avatar at the upper right. Directly below the header is a row of LGU filter chips — All LGUs, Liliw Laguna, Nagcarlan Laguna, Rizal Laguna, and an "+ Add LGU" chip — followed by a row of four key-metric stat cards. The middle row pairs a "Reports by LGU" bar chart with a "Service Request Trends" line chart. The bottom row contains an "LGU Performance Leaderboard" panel with a "View All" shortcut at the upper right. 

98 

## **Use Case Diagram** 

**Figure 32. Use Case Diagram for Super Administrator** 

Figure 32 shows a Use Case Diagram of the interactions between the Super Administrator actor and the system. The diagram presents the main functions: registering and deactivating LGU municipalities, managing feature flags per LGU, monitoring cross-LGU analytics, supervising compliance and audit logs, and overseeing user accounts across all LGUs. It illustrates how the Super 

99 

Administrator will interact with the platform to oversee the deployment of AGAPP 

across multiple LGUs. 

**Figure 33. Use Case Diagram for LGU Administrator** 

Figure 33 shows a Use Case Diagram of the interactions between the LGU Administrator actor and the system. The diagram emphasizes important 

100 

functions including managing service requests, processing issue reports, configuring office assignments, publishing news and announcements, moderating the community forum, maintaining the chatbot knowledge base, and managing LGU staff accounts. It shows how the LGU Administrator will use the dashboard to monitor citizen submissions, assign work, and ensure compliance with Republic Act No. 11032 service-level standards. 

**Figure 34. Use Case Diagram for LGU Personnel** 

101 

Figure 34 exhibits a Use Case Diagram for the LGU Personnel actor. It delineates the day-to-day functions of front-line LGU staff: viewing assigned reports and service requests, updating their status, attaching released documents, posting status updates, and adding internal notes. The figure offers a methodical diagram of how LGU Personnel will interact with the system to act on the work routed to them by the LGU Administrator. 

**Figure 35. Use Case Diagram for Citizen** 

102 

Figure 35 illustrates a Use Case Diagram for the Citizen actor. It provides a structured representation of how citizens will interact with the AGAPP mobile application by outlining core features such as signing up, applying for LGU documents, submitting GPS-based issue reports, tracking the status of submissions, viewing news and announcements, opening the town map, calling emergency hotlines, participating in the moderated community forum, and asking questions through the chatbot. 

## **Project Development** 

The project will be developed using the Agile model, applied in a Scrumstyle cadence as described by Schwaber and Sutherland (2020) in The Scrum Guide. In this approach, the whole process of software development is divided into separate phases, organized into eight sprints labeled Sprint 0 through Sprint 7. The outcome of each sprint will act as the input for the next, with a Sprint Review and Sprint Retrospective held at the end of every sprint to incorporate stakeholder feedback before the team proceeds. 

103 

**Figure 36. Agile Scrum Model of AGAPP** 

## **Phase 1: Sprint 0 — Project Initiation** 

In this opening sprint, the developers will conduct interviews with the client, specifically the Office of the Mayor, the Municipal Information and Communications Technology Officer, and the heads of the offices that will be onboarded onto AGAPP, including the Civil Registrar, the Municipal Assessor, the Business Permits and Licensing Office, the Engineering Office, the Public Employment Service Office, and the Municipal Disaster Risk Reduction and Management Office. The discussion will focus on the current processes, challenges, and goals of delivering front-line public services and of monitoring citizen-reported issues. A signed scope-of-work document, a project charter, and a prioritized product backlog of at least forty user stories will be produced as the deliverables of this sprint. The version-control repository, continuous-integration 

104 

pipeline, and staging environment will also be set up. The draft Privacy Notice and the draft Privacy Impact Assessment required by NPC Circular 16-01 will be initiated so that the project will comply with Republic Act No. 10173 (the Data Privacy Act) from day one. High-fidelity wireframes for the citizen, LGU Admin, and Super Admin screens will be drawn in Figma before any production code is written, and the database schema covering PostGIS-backed geospatial entities and the knowledge-base structure will be finalized. 

## **Phase 2: Sprint 1 — Authentication and Data Foundation** 

The second sprint will build the foundation that the rest of the system depends on. The developers will implement email-and-password login with emailbased one-time-password support for passwordless login and password recovery, role-based access control for the four user roles, and the lgu_id column with PostgreSQL Row-Level Security policies that will isolate one LGU's data from another. The first-launch LGU-selection screen will be implemented in the citizen mobile application, and a test LGU will be seeded for the partner municipality. Unit tests for authentication and integration tests for the Row-Level Security policies will be written before the sprint closes. 

## **Phase 3: Sprint 2 — Service Directory** 

The third sprint will deliver the read-only content modules. Contentmanagement screens will be built for the LGU Administrator to maintain the catalog of municipal services and the citizen guide entries, and the citizen mobile application will fetch and cache the catalog so that it remains usable when 

105 

network connectivity is intermittent. By the close of the sprint, the partner LGU's services will be populated end-to-end and visible inside the mobile application. 

## **Phase 4: Sprint 3 — Issue Reporting and On-Device Pothole Detection** 

The fourth sprint will deliver the geotagged reporting pipeline together with the on-device pothole verifier. The citizen mobile application will capture a photograph and a GPS point, upload them through a presigned URL to object storage, and persist a record into the reports table with a PostGIS point. The status state machine, the citizen tracking screen, and the LGU Admin queue with map view will be built. In parallel, an initial dataset of pothole photographs will be labeled in Roboflow, a YOLOv8n model will be trained in Google Colab and exported to TensorFlow Lite, and the model will be integrated into the application through react-native-fast-tflite so that inference runs before submission. An active-learning loop will be configured so that confirmed reports flow back into the dataset for periodic retraining. 

## **Phase 5: Sprint 4 — News, Notifications, Maps, Forum, and Chatbot** 

The fifth sprint will deliver the remaining citizen-facing features. The LGU Administrator will be able to publish official announcements through a rich-text editor; push notifications will be dispatched through Expo Push or Firebase Cloud Messaging, both of which offer free tiers suitable for student-led deployment, and a broadcast-by-barangay capability will be exposed. An SMS fallback through a Philippine SMS gateway is documented as an optional extension that the LGU may enable once it provisions a paid messaging account, since SMS-gateway 

106 

services are not free and lie outside the budget of a student capstone. The town map will be implemented with MapLibre GL over OpenStreetMap tiles and will highlight government offices, hospitals, schools, and tourist spots. The moderated community forum will be wired to an automated profanity filter and an image safety scan, with a moderation queue for posts that fail the filter. The chatbot will search the LGU's curated FAQ knowledge base as its primary response mechanism; if no FAQ match is found, the question will be forwarded to Gemini AI, which will generate an answer as a fallback. 

## **Phase 6: Sprint 5 — LGU Admin and Super Admin Dashboards** 

The sixth sprint will complete the management interfaces. The LGU Admin Dashboard will gain its routing-rule editor, service-level-agreement tracker calibrated to the categories of Republic Act No. 11032, audit-log viewer, and forum moderation console. The Super Admin Dashboard will gain its LGU registration workflow, feature-flag console, cross-LGU analytics view, and Data Privacy Act compliance dashboard. By the close of the sprint, both dashboards will be feature-complete and their analytics will be reconciled against the product analytics tool. 

## **Phase 7: Sprint 6 — Hardening, Security Review, and Data-Privacy Artifacts** 

The seventh sprint will prepare the system for evaluation and defense. Within the limits of a student capstone, basic security testing will be performed using the free, openly available tools that the developers can operate themselves: OWASP ZAP for a baseline dynamic vulnerability scan, Semgrep for static 

107 

analysis with its community rule sets, and `npm audit` for dependency scanning. A manual review of the data isolation between LGUs will be conducted by attempting to access another LGU's records using a logged-in account from a different LGU, to confirm that no cross-LGU data leakage is possible through the implemented Row-Level Security policies. Light performance testing will be performed with k6 against the busiest endpoints on the staging environment, and an accessibility check will be performed with axe-core to verify alignment with the WCAG 2.1 AA guidelines and the spirit of Batas Pambansa Bilang 344. As part of the documentation deliverables, the developers will draft a Privacy Notice, a Privacy Impact Assessment, and a Data Subject Access Request workflow modeled on the requirements of Republic Act No. 10173 and NPC Circular 16-01, and will provide the partner LGU with a recommendation to designate a Data Protection Officer prior to any real-world deployment. These artifacts will be turned over to the LGU as drafts, since the formal designation of a Data Protection Officer and the registration of personal-data processing systems remain the responsibility of the LGU itself. 

## **Phase 8: Sprint 7 — User Acceptance Testing and Capstone Deployment** 

The closing sprint will move AGAPP from the development environment into a publicly accessible evaluation environment so that the system can be defended and used by the partner LGU's respondents. User Acceptance Testing will be conducted with citizen respondents and LGU personnel of the partner municipality using the System Usability Scale and an ISO/IEC 25010 evaluation questionnaire; functionality testing, browser compatibility testing, and device 

108 

compatibility testing will be intensified during this period. Bug fixes and minor refinements that arise during UAT will be applied. Because the developers are undergraduate capstone students and do not maintain a paid Google Play Developer account or an Apple Developer Program account, the citizen mobile application will not be released through the Google Play Store or the Apple App Store. Instead, the application will be distributed for evaluation through Expo Application Services internal distribution, which generates a shareable build link, and through a directly downloadable Android APK hosted on the project repository, both of which the partner LGU's respondents will be able to install on their own devices. The LGU Admin Dashboard and the Super Admin Dashboard will be deployed to a free-tier cloud-hosting platform such as Vercel, Render, or Railway, and the database will be hosted on the free tier of Supabase or a comparable managed PostgreSQL service. A walkthrough session will be conducted with the designated LGU Administrator and with selected LGU Personnel, and a short demonstration will be conducted for the partner LGU's information-technology focal person and for the office identified by the LGU as responsible for data privacy. The Sprint Review and Sprint Retrospective held at the close of this sprint will document the evaluation results and the lessons learned, and will identify the additional steps — paid developer accounts, formal store listings, an LGU-procured cloud environment, and the LGU's own designation of a Data Protection Officer — that the LGU will need to undertake if it later decides to operate the system as a fully production deployment. 

109 

## **Project Testing and Evaluation Procedures** 

The system will be tested for functionality, browser compatibility, and device compatibility, and will be evaluated using the System Usability Scale (SUS) and ISO/IEC 25010 to assess product quality. 

## **Project Testing** 

## **Functionality Testing** 

According to ISO/IEC 25010 (2011), functional suitability is the degree to which a product or system provides functions that meet stated and implied needs when used under specified conditions; the standard decomposes this characteristic into functional completeness, functional correctness, and functional appropriateness. Functionality testing is therefore the activity that verifies, against the user-facing specifications, whether each declared function performs the task it is supposed to perform and produces the correct result. 

During this process, the developers will perform tests to ensure the system meets its objectives, focusing on the user interface and confirming that all functions are working correctly. By using a testing table, the developers will track the expected result, the function, the action, the actual result, and the status (passed or failed) for every interactive element. This testing will not only verify system performance but will also highlight areas for improvement, guiding the developers in refining the system. 

110 

**Table 1. Functionality Testing in Super Administrator Page** 

|**Test**<br>**Sequence**|**Expected**<br>**Result**|**Function**|**Action**|**Actual**<br>**Result**|**Status**|
|---|---|---|---|---|---|
|Sign<br>in<br>button|Redirects to<br>Super<br>Admin<br>dashboard|Authenticates<br>Super<br>Admin<br>login|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Register<br>LGU button|Show<br>LGU<br>registration<br>form|Allows<br>the<br>Super<br>Admin<br>to<br>register<br>a<br>new<br>LGU<br>municipality|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Edit<br>LGU<br>button|Show<br>Edit<br>LGU form|Allows<br>the<br>Super<br>Admin<br>to<br>edit<br>LGU<br>details|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Deactivate<br>LGU button|Show<br>confirmation<br>dialog|Deactivates an<br>existing LGU|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Feature<br>Flag toggle|Enable<br>or<br>disable<br>a<br>module<br>per<br>LGU|Controls which<br>AGAPP<br>modules<br>are<br>visible to each<br>LGU|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|



111 

|Cross-LGU<br>Analytics<br>button|Show<br>aggregated<br>metrics<br>across<br>all<br>LGUs|Loads<br>the<br>cross-LGU<br>dashboard|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|---|---|---|---|---|---|
|Compliance<br>button|Show<br>compliance<br>page|Loads<br>audit<br>logs,<br>Data<br>Protection<br>Officer status,<br>and<br>data-<br>privacy<br>artifacts|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Configure<br>Settings<br>button|Show global<br>settings<br>page|Allows<br>the<br>Super<br>Admin<br>to<br>configure<br>authentication,<br>notification,<br>and<br>storage<br>settings|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Export<br>button|Show export<br>options|Initiates<br>data<br>export|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Add<br>user<br>button|Show<br>Add<br>User form|Allows<br>the<br>Super<br>Admin<br>to add a new<br>user|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|



112 

|Edit<br>user<br>button|Show<br>Edit<br>User form|Allows<br>the<br>Super<br>Admin<br>to<br>edit<br>user<br>details|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|---|---|---|---|---|---|
|Archive<br>user button|Archive user|Allows<br>the<br>Super<br>Admin<br>to<br>archive<br>a<br>user|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|View button|Display user<br>information|Allows<br>the<br>Super<br>Admin<br>to<br>view<br>user<br>information|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Backup<br>now button|Show<br>confirmation<br>of<br>backup<br>creation|Confirms<br>backup<br>creation|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Create<br>backup<br>button|Create<br>backup|Initiates<br>backup<br>creation|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Restore<br>now button|Show<br>confirmation<br>of database<br>restoration|Confirms<br>database<br>restoration|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|



113 

|Restore<br>database<br>button|Restore<br>database|Initiates<br>database<br>restoration|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|---|---|---|---|---|---|
|Logout<br>button|Redirect<br>to<br>login page|Logs<br>out<br>the<br>Super Admin|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|



**Table 2. Functionality Testing in LGU Administrator Page** 

|**Test**<br>**Sequence**|**Expected**<br>**Result**|**Function**|**Action**|**Actual**<br>**Result**|**Status**|
|---|---|---|---|---|---|
|Sign in button|Redirects<br>to<br>LGU<br>Admin<br>dashboard|Authenticates<br>LGU<br>Admin<br>login|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Service<br>Requests<br>button|Show<br>service-<br>request<br>queue|Loads<br>the<br>page<br>of<br>pending citizen<br>document<br>applications|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Update<br>status button|Update<br>request<br>status|Moves<br>a<br>request<br>from<br>Submitted to In<br>Progress<br>or<br>Resolved|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|



114 

|Issue<br>Reports<br>button|Show<br>issue-<br>report queue|Loads<br>the<br>page<br>of<br>pending GPS-<br>based<br>citizen<br>reports|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|---|---|---|---|---|---|
|Acknowledge<br>button|Acknowledge<br>a report|Marks a report<br>as<br>Under<br>Review<br>and<br>notifies<br>the<br>citizen|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Reassign<br>button|Show<br>reassignment<br>dialog|Allows<br>the<br>LGU Admin to<br>reroute<br>a<br>report<br>to<br>another office|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Reject button|Show<br>rejection<br>dialog|Allows<br>the<br>LGU Admin to<br>reject a report<br>with<br>a<br>stated<br>reason|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Compose<br>Post button|Show<br>News<br>editor|Allows<br>the<br>LGU Admin to<br>publish<br>an<br>announcement|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|



115 

|Publish<br>button|Publish<br>the<br>post|Makes<br>the<br>post visible in<br>the<br>citizen<br>mobile<br>application|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|---|---|---|---|---|---|
|Approve<br>forum<br>post<br>button|Approve<br>queued post|Releases<br>a<br>moderated<br>post<br>to<br>the<br>public forum|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Reject forum<br>post button|Reject<br>queued post|Removes<br>the<br>post<br>and<br>notifies<br>the<br>citizen|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Add<br>Office<br>Assignment<br>button|Show<br>rule<br>editor|Allows<br>the<br>LGU Admin to<br>map<br>a<br>category<br>and<br>barangay to an<br>office|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Add<br>Knowledge-<br>Base<br>entry<br>button|Show<br>knowledge-<br>base editor|Allows<br>the<br>LGU Admin to<br>add a chatbot<br>source<br>document|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Export button|Show<br>export<br>options|Initiates<br>data<br>export|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|



116 

|Add<br>user<br>button|Show<br>Add<br>User form|Allows<br>the<br>LGU Admin to<br>add<br>a<br>new<br>staff account|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|---|---|---|---|---|---|
|Edit<br>user<br>button|Show<br>Edit<br>User form|Allows<br>the<br>LGU Admin to<br>edit<br>staff<br>details|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Archive<br>user<br>button|Archive user|Allows<br>the<br>LGU Admin to<br>archive a staff<br>account|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|
|Logout button|Redirect<br>to<br>login page|Logs<br>out<br>the<br>LGU Admin|Click|_(To be_<br>_tested)_|Passed<br>/ Failed|



**Table 3. Functionality Testing in LGU Personnel Page** 

|**Test**<br>**Sequence**|**Expected**<br>**Result**|**Function**|**Action**|**Actual**<br>**Result**|**Status**|
|---|---|---|---|---|---|
|Sign<br>in<br>button|Redirects<br>to<br>LGU<br>Personnel<br>queue|Authenticates<br>LGU<br>Personnel<br>login|Click|_(To_<br>_be_<br>_tested)_|Passed<br>/<br>Failed|



117 

|View<br>assigned<br>button|Show<br>items<br>assigned<br>to<br>the<br>user|Loads<br>the<br>personal queue<br>of<br>reports<br>and<br>requests|Click|_(To_<br>_be_<br>_tested)_|Passed<br>/<br>Failed|
|---|---|---|---|---|---|
|Update<br>status<br>button|Update<br>item<br>status|Moves an item<br>to<br>the<br>next<br>status|Click|_(To_<br>_be_<br>_tested)_|Passed<br>/<br>Failed|
|Add<br>internal<br>note<br>button|Show<br>internal<br>note<br>editor|Allows the LGU<br>Personnel<br>to<br>add<br>a<br>note<br>visible<br>only<br>to<br>LGU staff|Click|_(To_<br>_be_<br>_tested)_|Passed<br>/<br>Failed|
|Attach<br>document<br>button|Open<br>file<br>upload<br>window|Allows the LGU<br>Personnel<br>to<br>attach<br>the<br>released<br>document<br>or<br>resolution photo|Click|_(To_<br>_be_<br>_tested)_|Passed<br>/<br>Failed|
|Logout<br>button|Redirect<br>to<br>login<br>page|Logs<br>out<br>the<br>LGU Personnel|Click|_(To_<br>_be_<br>_tested)_|Passed<br>/<br>Failed|



118 

**Table 4. Functionality Testing in Citizen Mobile Application** 

|**Test**<br>**Sequence**|**Expected**<br>**Result**|**Function**|**Action**|**Actual**<br>**Result**|**Status**|
|---|---|---|---|---|---|
|Send<br>Passcode<br>button|Send<br>one-<br>time<br>passcode to<br>the<br>citizen's<br>email|Triggers<br>email<br>passcode delivery<br>for<br>passwordless<br>sign-in|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Enter<br>Passcode<br>field|Accept<br>the<br>six-digit<br>passcode|Allows the citizen<br>to<br>type<br>the<br>passcode<br>received by email|Type|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Login<br>button|Authenticate<br>citizen|Verifies<br>the<br>passcode<br>and<br>proceeds<br>to<br>the<br>Main Interface|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Service<br>Directory<br>button|Show list of<br>LGU<br>services|Opens the service<br>catalog|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Apply<br>for<br>service<br>button|Show guided<br>application<br>form|Begins<br>a<br>document<br>application|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Submit<br>application<br>button|Save<br>application<br>and<br>generate<br>reference<br>number<br>and|Records<br>the<br>application in the<br>database|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|



119 

||QR|||||
|---|---|---|---|---|---|
|Submit<br>Report<br>button|Show report<br>submission<br>flow|Begins<br>a<br>GPS-<br>based issue report|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Capture<br>photo<br>button|Open in-app<br>camera|Allows the citizen<br>to<br>capture<br>a<br>photograph of the<br>issue|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|On-device<br>detector<br>check|Verify that a<br>pothole<br>is<br>present<br>in<br>the captured<br>image|Warns the citizen<br>if<br>confidence<br>is<br>below<br>the<br>configured<br>threshold|Automati<br>c|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Confirm<br>submissio<br>n button|Save<br>report<br>and<br>assign<br>reference<br>number|Records the report<br>in the database|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Track<br>Report<br>button|Show list of<br>submissions<br>and<br>their<br>statuses|Loads the tracking<br>screen|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Rate<br>resolution<br>button|Submit<br>citizen-<br>satisfaction|Records<br>the<br>citizen feedback|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|



120 

||score|||||
|---|---|---|---|---|---|
|News<br>button|Show<br>LGU<br>announceme<br>nts|Loads<br>the<br>news<br>feed|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Town Map<br>button|Show<br>interactive<br>municipal<br>map|Opens<br>the<br>OpenStreetMap-<br>based view|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Emergenc<br>y<br>hotline<br>button|Place<br>an<br>outgoing call|Calls the selected<br>hotline|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|SOS<br>button|Share<br>GPS<br>location with<br>the<br>MDRRMO<br>duty desk|Sends<br>an<br>SOS<br>payload|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Forum<br>button|Show<br>community<br>forum|Opens<br>the<br>moderated forum|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Compose<br>post button|Show<br>post<br>editor|Allows the citizen<br>to compose a new<br>forum post|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Chatbot<br>button|Open<br>chatbot|Loads the chatbot<br>interface|Click|_(To be_<br>_tested)_|Passe<br>d<br>/|



121 

||conversation||||Failed|
|---|---|---|---|---|---|
|Ask<br>question|Return<br>FAQ<br>answer<br>or<br>Gemini-<br>generated<br>answer|Searches the FAQ<br>knowledge<br>base;<br>falls<br>back<br>to<br>Gemini<br>AI<br>if<br>no<br>match is found|Type and<br>send|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Theme<br>toggle|Switch<br>between<br>light<br>mode<br>and<br>dark<br>mode|Persists<br>the<br>citizen's<br>appearance<br>preference|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Language<br>toggle|Switch<br>between<br>English<br>and<br>Filipino|Persists<br>the<br>citizen's language<br>preference|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Account<br>Settings<br>button|Show<br>settings<br>screen|Allows the citizen<br>to<br>update<br>password,<br>notification<br>preferences,<br>theme,<br>and<br>language|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|
|Logout<br>button|Log out the<br>citizen<br>and<br>return<br>to<br>sign-in<br>screen|Allows the citizen<br>to log out|Click|_(To be_<br>_tested)_|Passe<br>d<br>/<br>Failed|



122 

## **Browser Compatibility Testing** 

Cross-browser compatibility testing is the practice of executing a web application against multiple web browsers, browser versions, and operating systems to verify that rendering and behavior remain consistent for every supported environment. Mesbah and Prasad (2011) demonstrated that even small differences between browsers — in JavaScript engines, CSS handling, and event timing — can introduce defects that escape testing on a single browser, and proposed automated cross-browser regression as a routine engineering practice. Public browser-market data published by StatCounter Global Stats consistently identify Google Chrome as the most widely used desktop browser, followed by Microsoft Edge and Mozilla Firefox. 

Therefore, the developers will perform browser compatibility testing on the LGU Admin Dashboard and the Super Admin Dashboard to ensure that they are compatible across these three browsers. Each test will use the latest stable release of the browser at the time of evaluation. 

**Table 5. Browser Compatibility Testing** 

|**Web**<br>**Browser**|**Expected Result**|**Actual**<br>**Result**|**Recommended**|
|---|---|---|---|
|Google<br>Chrome|The dashboards display<br>smoothly and all features<br>are fully compatible.|_(Result)_|Yes / No|



123 

|Mozilla<br>Firefox|The dashboards display<br>smoothly and all features<br>are fully compatible.|_(Result)_|Yes / No|
|---|---|---|---|
|Microsoft<br>Edge|The dashboards display<br>smoothly and all features<br>are fully compatible.|_(Result)_|Yes / No|



## **Device Compatibility Testing** 

Joorabchi, Mesbah, and Kruchten (2013) reported that one of the principal challenges in mobile application development is the wide range of devices, screen sizes, and operating-system versions that an application must support, and recommended explicit device-compatibility testing as part of any release process. Because the citizen-facing component of AGAPP is delivered as a mobile application, the developers will give particular attention to mobile-phone compatibility, while the LGU Admin Dashboard and the Super Admin Dashboard will be tested on desktop, laptop, and tablet form factors. Testing will cover both portrait and landscape orientations where applicable. 

124 

**Table 6. Device Compatibility Testing** 

|**Devices**|**Resolutions**|**Expected Result**|**Actual**<br>**Result**|**Recommended**|
|---|---|---|---|---|
|**Desktop**|1920 x 1080<br>(Full HD)<br>2560<br>x<br>1440(QHD)|The LGU Admin<br>and Super Admin<br>dashboards<br>display<br>correctly<br>and<br>all<br>features<br>are<br>fully<br>compatible.|Pass / Fail|Yes / No|
|**Laptop**|1366 x 768<br>(HD)<br>1440 x 900<br>1600 x 900<br>1920 x 1080<br>(Full HD)|The LGU Admin<br>and Super Admin<br>dashboards<br>display<br>correctly<br>and<br>all<br>features<br>are<br>fully<br>compatible.|Pass / Fail|Yes / No|
|**Tablet**|1280 x 800<br>1536 x 2048<br>1920 x 1200|The<br>citizen<br>mobile<br>application<br>displays correctly<br>and<br>all<br>features<br>are<br>fully<br>compatible.|Pass / Fail|Yes / No|



125 

||**Mobile**<br>**Phone**|1280 x 720<br>(HD)<br>1920 x 1080<br>(Full HD)<br>2340 x 1080<br>(FHD+)|The<br>citizen<br>mobile<br>application<br>displays correctly<br>and<br>all<br>features<br>are<br>fully<br>compatible.|Pass / Fail|Yes / No||
|---|---|---|---|---|---|---|



## **Project Evaluation Procedure** 

To assess the usability and user satisfaction of the system, the developers will conduct an evaluation using the System Usability Scale (SUS). SUS is a standardized questionnaire designed to measure users' perceived ease of use and overall experience. The system will be evaluated by twenty-five (25) citizens of the partner municipality and five (5) representatives from the LGU Administrator and LGU Personnel roles, which is equivalent to thirty (30) non-IT respondents, representing the overall end users of the system. In addition, the system's technical quality will be evaluated using ISO/IEC 25010, which assesses attributes such as functional suitability, performance efficiency, compatibility, usability, reliability, security, maintainability, and portability. This evaluation will be conducted with ten (10) IT experts, providing professional insights into the system's performance and robustness. System Usability Scale (SUS) 

The System Usability Scale (SUS), developed by Brooke (1996), is one of the most widely used tools for measuring the usability of a system or product. It is 

126 

a ten-item questionnaire scored on a five-point Likert scale; respondents indicate their level of agreement with five positively worded items and five negatively worded items, and the alternating-item formula is applied so that contributions from positive and negative items align before the result is multiplied by 2.5 to yield a single composite score on a 0-to-100 scale. 

Lewis (2018), in a retrospective review of more than two decades of SUS use, confirmed its enduring reliability and reported that SUS scores remain comparable across products, populations, and contexts of use. SUS will therefore be used in this study because it is standardized, widely validated, and produces a single comparable number that can be benchmarked against published norms. 

**Table 7. Likert Scale of SUS** 

|**Scale**|**Interpretation**|
|---|---|
|**1**|Strongly Disagree|
|**2**|Disagree|
|**3**|Neutral|
|**4**|Agree|
|**5**|Strongly Agree|



127 

**Table 8. Numerical Scale of the SUS** 

|**Scale Range**|**Interpretation**|
|---|---|
|80.30 – 100.00|Excellent|
|68.00 – 80.29|Good|
|68.00|Okay|
|51.00 – 67.99|Poor|
|1.00 – 50.99|Awful|



## **ISO/IEC 25010** 

ISO/IEC 25010:2011 is an international standard for evaluating software quality. It assesses key attributes such as functional suitability, performance efficiency, compatibility, usability, reliability, security, maintainability, and portability. This standard provides a structured framework for analyzing a system's technical quality and ensuring it meets both user and industry requirements. 

The evaluation will focus on the following eight key aspects: 

- **Functional Suitability:** Used to test whether the core features of AGAPP, such as service requests, GPS-based issue reporting, the on-device 

128 

pothole detector, news and announcements, the moderated community forum, and the chatbot, work as intended and meet user requirements. 

- **Performance Efficiency:** Used to test the system's response time, 

   - image-processing speed, and overall performance to ensure that it can handle concurrent citizen submissions and large volumes of LGU reports efficiently. 

- **Compatibility:** Used to test AGAPP on multiple devices, browsers, and operating systems to ensure a consistent user experience for citizens, LGU Personnel, LGU Administrators, and Super Administrators. 

- **Usability:** Used to test the system's user interface, navigation, and ease of use. Feedback from citizens, LGU staff, and non-IT respondents will be gathered to ensure the platform is intuitive and accessible for all users. 

- **Reliability:** Used to test the stability and fault tolerance of AGAPP under different conditions, ensuring minimal system downtime and continuous availability of the citizen mobile application and the LGU dashboards. 

- **Security:** Used to test data privacy and protection measures, ensuring that sensitive citizen and LGU data are safeguarded against unauthorized access and cyber threats, in line with Republic Act No. 10173 (the Data Privacy Act of 2012) and NPC Circular 16-01. 

- **Maintainability:** Used to test the system's architecture, code quality, and ease of updates, ensuring long-term maintainability and scalability across additional LGUs. 

129 

- **Portability:** Used to test AGAPP's ability to be deployed across different LGU IT infrastructures and to integrate with other government systems, ensuring smooth implementation when additional municipalities are onboarded. 

## Statistical Treatment of Data 

The Likert scale used in this study is a psychometric instrument widely employed in social-science and educational research for measuring respondents' attitudes, opinions, and impressions toward a given statement. Joshi, Kale, Chandel, and Pal (2015), in their methodological review, explained that the Likert scale offers several response options — typically five or seven — that capture varying levels of agreement, and that the scale is most reliable when the wording of items is precise and the analysis treats the resulting data appropriately. Sullivan and Artino (2013) likewise recommended that ordinal Likert-type data be summarized using descriptive statistics such as the mean and the standard deviation, and that interpretation be made through a verbal scale linked to predefined ranges, rather than treating individual integer responses as a true interval measure. 

The data collected from the respondents will be organized, counted, analyzed, and interpreted. The following statistical method will be used to interpret the gathered data: 

**Mean** – This will be used to calculate the average response of the respondents to the Survey Questionnaire. It is determined by adding the number of 

130 

respondents who selected each particular choice for each question and then dividing the total sum by the overall number of respondents. The formula used is as follows: 

## Where: 

- xˉ — the calculated mean score 

- f — the frequency of respondents selecting a particular choice 

- x — the weight or numerical score assigned to that choice 

- N — the total number of respondents 

To assess the reliability of the collected data, the developers will refer to a 

numerical table that contains the scale used to evaluate the system. 

**Table 9. Numerical Scale of the ISO/IEC 25010** 

|**Scale Range**|**Interpretation**|
|---|---|
|4.51 – 5.00|Excellent|
|3.51 – 4.50|Very Good|
|2.51 – 3.50|Good|
|1.51 – 2.50|Fair|
|1.00 – 1.50|Poor|



131 

## **References** 

- Alqaralleh, B. A. Y., Al-Omari, A. H., & Alksasbeh, M. (2020). An integrated conceptual model for m-government acceptance in developing countries: The case study of Jordan. *International Journal of Interactive Mobile Technologies, 14*(6), 163–184. https://doi.org/10.3991/ijim.v14i06.11449 

- Aminah, S., & Saksono, H. (2021). Digital transformation of the government: A case study in Indonesia. *Jurnal Komunikasi: Malaysian Journal of Communication, 37*(2), 272–288. https://doi.org/10.17576/jkmjc-2021-3702-17 

- Arya, D., Maeda, H., Ghosh, S. K., Toshniwal, D., & Sekimoto, Y. (2021). RDD2020: An annotated image dataset for automatic road damage detection using deep learning. *Data in Brief, 36*, 107133. https://doi.org/10.1016/j.dib.2021.107133 

- Bales, J. M., Dandoy, V. M. A., Pipino, R. O., & Sobradil, M. T. (2024). Policy capacity and e-governance: Assessment of the e-government services of Valencia City, Bukidnon. *Journal of Governance and Development, 19*(1), 127–153. https://doi.org/10.32890/jgd2023.19.1.6 

- Baxter, D., Dacre, N., Dong, H., & Ceylan, S. (2023). Institutional challenges in agile adoption: Evidence from a public sector IT project. *Government Information Quarterly, 40*(4), 101858. https://doi.org/10.1016/j.giq.2023.101858 

132 

- Berntzen, L., Johannesen, M. R., Böhm, S., Weber, C., & Morales, R. (2018). Citizens as sensors: Human sensors as a smart city data source. In *Proceedings of the 13th International Conference on Digital Information Management* (pp. 179–185). IEEE. 

- Csontos, B., & Heckl, I. (2025). Five years of changes in the accessibility, usability, and security of Hungarian government websites. *Universal Access in the Information Society*. https://doi.org/10.1007/s10209-02501223-5 

- Dar, S. A. (2023). Exploring the advantages and obstacles of mobile governance in Kashmir: A comprehensive study. *Devotion Journal of Research and Community Service, 4*(10), 1957–1972. https://doi.org/10.59188/devotion.v4i10.581 

- Department of Information and Communications Technology. (2022). *EGovernment Masterplan 2022*. Republic of the Philippines. https://dict.gov.ph/egovmasterplan/ 

- Diao, Z., Huang, X., Liu, H., & Liu, Z. (2023). LE-YOLOv5: A lightweight and efficient road damage detection algorithm based on improved YOLOv5. *International Journal of Intelligent Systems, 2023*, 8879622. https://doi.org/10.1155/2023/8879622 

- Dingsøyr, T., Bjørnson, F. O., Schrof, J., & Sporsem, T. (2022). A longitudinal explanatory case study of coordination in a very large development programme: The impact of transitioning from a first- to a second-generation large-scale agile development method. *Empirical 

133 

Software Engineering, 28*(1), 5. https://doi.org/10.1007/s10664-02210230-6 

- Følstad, A., Araujo, T., Law, E. L. C., Brandtzaeg, P. B., Papadopoulos, S., Reis, L., Baez, M., Laban, G., McAllister, P., Ischen, C., Wald, R., Catania, F., Meyer von Wolff, R., Hobert, S., & Luger, E. (2021). Future directions for chatbot research: An interdisciplinary research agenda. *Computing, 103*(12), 2915–2942. https://doi.org/10.1007/s00607-021-01016-7 

- Francis Mark, Q., Caboverde, C. E., & Salazar, A. M. (2025). How ready are LGUs for AI adoption? *Philippine Institute for Development Studies Discussion Paper Series, 2025-48*. https://doi.org/10.62986/dp2025.48 

- Furtado, L. S., Coelho da Silva, T. L., Ferreira, M. G. F., de Macêdo, J. A. 

   - F., & Moreira, J. K. M. L. C. (2023). A framework for digital transformation towards smart governance: Using big data tools to target SDGs in Ceará, Brazil. *Journal of Urban Management, 12*(2), 185–199. https://doi.org/10.1016/j.jum.2023.01.003 

- Gao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., Dai, Y., Sun, J., Wang, M., & Wang, H. (2023). Retrieval-augmented generation for large language models: A survey. *arXiv*. https://doi.org/10.48550/arxiv.2312.10997 

- Haltofová, B. (2017). Implementation of geo-crowdsourcing mobile applications in e-government of V4 countries: A state-of-the-art survey. *Zenodo*. https://doi.org/10.5281/zenodo.1130473 

134 

- Hansen, M. M., & Dahiya, B. (2025). Traffy Fondue: A smart city citizen engagement platform for urban issue reporting. *Frontiers in Sustainable Cities, 7*, 1491621. https://doi.org/10.3389/frsc.2025.1491621 

- Işıtan, M., & Köklü, M. (2020). Comparison and evaluation of cross platform mobile application development tools. *International Journal of Applied Mathematics Electronics and Computers, 8*(4), 261–267. https://doi.org/10.18100/ijamec.832673 

- Iwenyan, O. S. (2025). Semantic anomaly detection using vector databases. *Journal of ICT Development, Applications and Research, 7*(2), 1–14. https://doi.org/10.47524/jictdar.v7i2.86 

- Jaworski, T. (2018). *Evaluation of cross-platform app development using React Native* [Bachelor's thesis, RWTH Aachen University]. RWTH Publications. https://doi.org/10.18154/rwth-2018-223392 

- Jou, Y.-T., Mariñas, K. A., Saflor, C. S., Baleña, A., Gutierrez, C. J., Dela Fuente, G., Manzano, H. M., Tanglao, M. S., Verde, N. A., Alvarado, P., & Young, M. N. (2024). Investigating various factors influencing the accessibility of digital government with eGov PH mobile application. *Sustainability, 16*(3), 992. https://doi.org/10.3390/su16030992 

- Kalyuzhnaya, A. V., Mityagin, S., Lutsenko, E., Getmanov, A., Aksenkin, 

   - Y., Fatkhiev, K., Fedorin, K., Nikitin, N. O., Chichkova, N., Vorona, V., & Boukhanovsky, A. V. (2025). LLM agents for smart city management: Enhancing decision support through multi-agent AI systems. *Smart Cities, 8*(1), 19. https://doi.org/10.3390/smartcities8010019 

135 

- Kanaan, R. K., Abumatar, G., Al-Lozi, M., & Abu Hussein, A. M. (2019). Implementation of m-government: Leveraging mobile technology to streamline the e-governance framework. *Journal of Social Sciences, 8*(3), 495–508. https://doi.org/10.25255/jss.2019.8.3.495.508 

- Kaur, P., & Gupta, V. (2025). AI-driven quality assurance framework for inclusive government and e-commerce web services: Integrating accessibility, usability, and emerging technologies. *International Journal of Research and Innovation in Applied Science, 10*(10), 233–240. https://doi.org/10.51584/ijrias.2025.1010000017 

- Kumar, R. (2020). Multi-tenant SaaS architectures: Design principles and security considerations. *Journal of Software Engineering and Simulation, 6*(5), 28–41. https://doi.org/10.35629/3795-06052841 

- Maeda, H., Sekimoto, Y., Seto, T., Kashiyama, T., & Omata, H. (2018). Road damage detection using deep neural networks with smartphone images. *Computer-Aided Civil and Infrastructure Engineering, 33*(12), 1127–1141. https://doi.org/10.1111/mice.12387 

- Mascara, A. C. (2025). E-government service delivery in selected municipalities of Lanao del Sur, Philippines. In *Proceedings of the International Conference on Public Administration and Governance*. EAI. https://doi.org/10.4108/eai.30-10-2024.2354817 

- Mergel, I., Edelmann, N., & Haug, N. (2019). Defining digital transformation: Results from expert interviews. *Government Information Quarterly, 36*(4), 101385. https://doi.org/10.1016/j.giq.2019.06.002 

136 

- Mina, F. L. P., Batara, E. B., Hussien, E. P., & Lavilles, R. Q. (2023). Citizens' adoption of an e-health system during the pandemic. *Jurnal Studi Pemerintahan, 13*(1), 1–22. 

https://doi.org/10.18196/jgp.v13i1.13541 

- Nuottila, J., Aaltonen, K., & Kujala, J. (2022). Challenges of adopting agile methods in a public organization. *International Journal of Information Systems and Project Management, 4*(3), 65–85. https://doi.org/10.12821/ijispm040304 

- Organisation for Economic Co-operation and Development. (2020). *The OECD digital government policy framework: Six dimensions of a digital government* (OECD Public Governance Policy Papers No. 02). OECD Publishing. https://doi.org/10.1787/f64fed2a-en 

- Palma, J. P., Avila, L., Mag-iba, M. A., Buman-eg, L., Nacpil, E., Dayrit, D. J., & Rodelas, N. (2023). e-Governance: A critical review of e-government systems features and frameworks for success. *International Journal of Computing Sciences Research, 7*, 2147–2167. https://doi.org/10.25147/ijcsr.2017.001.1.138 

- Pena-Caballero, C., Kim, D., González, A. H., Castellanos, O., Cantu, A. A., & Ho, J. (2020). Real-time road hazard information system. *Infrastructures, 5*(9), 75. https://doi.org/10.3390/infrastructures5090075 

- Rahmadany, A. F., & Ahmad, M. (2021). The implementation e- government to increase democratic participation: The use of mobile 

137 

government. *Jurnal Studi Sosial dan Politik, 5*(1), 89–103. https://doi.org/10.19109/jssp.v5i1.8552 

- Republic of the Philippines. (2018). *Republic Act No. 11032: Ease of Doing Business and Efficient Government Service Delivery Act of 2018*. Official Gazette. https://www.officialgazette.gov.ph/2018/05/28/republicact-no-11032/ 

- Sabani, A., Thai, V. V., & Hossain, M. A. (2023). Factors affecting citizen adoption of e-government in developing countries. *Journal of Global Information Management, 31*(2), 1–24. https://doi.org/10.4018/jgim.318131 

- Sagarik, D., Chansukree, P., Cho, W., & Berman, E. M. (2018). E- government 4.0 in Thailand: The role of central agencies. *Information Polity, 23*(3), 343–363. https://doi.org/10.3233/ip-180006 

- Sami, A. A., Sakib, S. M. N., Deb, K., & Sarker, I. H. (2023). Improved YOLOv5-based real-time road pavement damage detection in road infrastructure management. *Algorithms, 16*(9), 452. https://doi.org/10.3390/a16090452 

- See, L., Mooney, P., Foody, G., Bastin, L., Comber, A., Estima, J., Fritz, S., Kerle, N., Jiang, B., Laakso, M., Liu, H. Y., Milčinski, G., Nikšič, M., Painho, M., Pődör, A., Olteanu-Raimond, A. M., & Rutzinger, M. (2016). Crowdsourcing, citizen science or volunteered geographic information? The current state of crowdsourced geographic information. *ISPRS 

138 

International Journal of Geo-Information, 5*(5), 55. https://doi.org/10.3390/ijgi5050055 

- Sigwejo, A. O., & Pather, S. (2016). A citizen-centric framework for assessing e-government effectiveness. *The Electronic Journal of Information Systems in Developing Countries, 74*(1), 1–24. https://doi.org/10.1002/j.1681-4835.2016.tb00542.x 

- United Nations Department of Economic and Social Affairs. (2022). *United Nations e-government survey 2022: The future of digital government*. United Nations. 

https://publicadministration.un.org/egovkb/en-us/Reports/UN-EGovernment-Survey-2022 

- United Nations Department of Economic and Social Affairs. (2024). *United Nations e-government survey 2024: Accelerating digital transformation for sustainable development*. United Nations. https://publicadministration.un.org/egovkb/en-us/Reports/UN-EGovernment-Survey-2024 

- Venkatesh, V., Thong, J. Y. L., & Xu, X. (2016). Unified theory of acceptance and use of technology: A synthesis and the road ahead. *Journal of the Association for Information Systems, 17*(5), 328–376. https://doi.org/10.17705/1jais.00428 

- Yun, L., Yun, S., & Xue, H. (2024). Improving citizen-government interactions with generative artificial intelligence: Novel human-computer interaction strategies for policy understanding through large language 

139 

models. *PLoS ONE, 19*(12), e0311410. 

https://doi.org/10.1371/journal.pone.0311410 

