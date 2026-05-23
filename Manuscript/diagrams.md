# AGAPP Diagrams and Figures

## Figure 1: Conceptual Model of AGAPP
```mermaid
flowchart TB
    subgraph Input["📥 INPUT"]
        I1[Knowledge Requirements]
        I2[Software Requirements]
        I3[Hardware Requirements]
    end
    
    subgraph Process["⚙️ PROCESS"]
        P1[System Analysis & Design]
        P2[Database Implementation]
        P3[Mobile App Development]
        P4[Web Dashboard Development]
        P5[Testing & QA]
        P6[Deployment]
    end
    
    subgraph Output["📤 OUTPUT"]
        O1[Citizen Mobile App]
        O2[LGU Admin Dashboard]
        O3[Super Admin Dashboard]
        O4[AGAPP Platform]
    end
    
    Input --> Process --> Output
```

---

## Figure 2: Project Design of AGAPP
```mermaid
flowchart TB
    subgraph Users["👥 Users"]
        C[Citizen<br/>Mobile App]
        SA[Super Administrator<br/>Web Browser]
        LA[LGU Administrator<br/>Web Browser]
        LP[LGU Personnel<br/>Web Browser]
    end
    
    subgraph Backend["🖥️ AGAPP Backend"]
        API[Node.js + NestJS API]
    end
    
    subgraph Storage["💾 Data Storage"]
        DB[(PostgreSQL + PostGIS)]
        Storage[Supabase Storage<br/>Photos/Attachments]
    end
    
    C <-->|HTTP/REST| API
    SA <-->|HTTP/REST| API
    LA <-->|HTTP/REST| API
    LP <-->|HTTP/REST| API
    API <-->|SQL| DB
    API <-->|Upload/Download| Storage
```

---

## Figure 3: Flowchart of Main Interface for Super Administrator
```mermaid
flowchart TD
    Start([Login]) --> Main[Main Interface]
    Main --> LM[LGU Management]
    Main --> CA[Cross-LGU Analytics]
    Main --> FF[Feature Flags]
    Main --> Comp[Compliance]
    Main --> Ext[Extended Functions]
    
    LM --> Provision[Provision/Deactivate Tenants]
    LM --> Sub[Edit Subscriptions]
    
    CA --> Metrics[View Metrics]
    CA --> Leader[Leaderboards]
    
    FF --> Toggle[Enable/Disable Modules]
    
    Comp --> Audit[Audit Logs]
    Comp --> DPO[DPO Status]
    
    Ext --> Settings[System Settings]
    Ext --> UM[User Management]
    Ext --> Logout([Logout])
```

---

## Figure 4: Flowchart of Main Interface for LGU Administrator
```mermaid
flowchart TD
    Start([Login]) --> Main[Main Interface]
    Main --> Dash[Dashboard]
    Main --> SR[Service Requests]
    Main --> IR[Issue Reports]
    Main --> News[News & Announcements]
    Main --> Forum[Forum Moderation]
    Main --> Ext[Extended Functions]
    
    Ext --> OA[Office Assignments]
    Ext --> KB[Knowledge Base]
    Ext --> UM[User Management]
    Ext --> Logout([Logout])
    
    Dash --> Metrics[View Metrics]
    SR --> Process[Process Applications]
    IR --> Handle[Handle Reports]
```

---

## Figure 5: Flowchart of Dashboard for Super Admin and LGU Admin
```mermaid
flowchart TD
    Start([Open Dashboard]) --> Gather[Gather Key Metrics]
    Gather --> Display[Display Graphs & Heatmap]
    Display --> Filter{Apply Filters?}
    Filter -->|Yes| Adjust[Adjust Metrics]
    Filter -->|No| Generate[Generate Report]
    Adjust --> Generate
    Generate --> Export[Print/Export Report]
    Export --> End([End])
```

---

## Figure 6: Flowchart of Service Requests for LGU Administrator
```mermaid
flowchart TD
    Start([View Service Requests]) --> Queue[Queue of Applications]
    Queue --> Filter{Apply Filters?}
    Filter -->|Yes| Filtered[Filtered Results]
    Filter -->|No| Action[Action Panel]
    Filtered --> Action
    Action --> Update[Update Status]
    Action --> Assign[Assign Personnel]
    Action --> Attach[Attach Document]
    Action --> Reject[Reject with Reason]
    Update --> Log[Record in Audit Log]
    Assign --> Log
    Attach --> Log
    Reject --> Log
    Log --> End([End])
```

---

## Figure 7: Flowchart of Issue Reports for LGU Administrator
```mermaid
flowchart TD
    Start([View Issue Reports]) --> MapView[Map View]
    Start --> Queue[Queue by Category]
    Queue --> AutoRoute[Auto-Routing Engine]
    AutoRoute --> Route{Route to Office}
    Route --> Verify[Verify Report]
    Route --> Reroute[Reroute Report]
    Route --> Reject[Reject Report]
    Verify --> Status[Update Status]
    Status --> Notify[Push Notification to Citizen]
    Status --> Resolved{Resolved?}
    Resolved -->|Yes| Log[Printable Resolution Log]
    Resolved -->|No| Status
    Reroute --> Status
    Reject --> End([End])
    Log --> End
```

---

## Figure 8: Flowchart of News and Announcements for LGU Administrator
```mermaid
flowchart TD
    Start([Create News Post]) --> Draft[Draft Editor]
    Draft --> Attach[Attach Images/PDFs]
    Attach --> Schedule{Schedule?}
    Schedule -->|Yes| SetDate[Set Publish Date]
    Schedule -->|No| Publish[Publish Immediately]
    SetDate --> Wait[Wait for Date]
    Wait --> Publish
    Publish --> Notify[Push Notification to Citizens]
    Publish --> Visible[Visible in Mobile App]
    Notify --> End([End])
```

---

## Figure 9: Flowchart of Forum Moderation for LGU Administrator
```mermaid
flowchart TD
    Start([Forum Moderation]) --> NewPost[New Citizen Post]
    NewPost --> Filter[Automated Filter]
    Filter --> Pass{Passes Filter?}
    Pass -->|Yes| Publish[Publish Immediately]
    Pass -->|No| Queue[Moderation Queue]
    Queue --> Review[Admin Review]
    Review --> Action{Decision}
    Action -->|Approve| Publish
    Action -->|Edit| EditPost[Edit Post]
    EditPost --> Publish
    Action -->|Reject| Reject[Reject with Reason]
    Publish --> Notify1[Citizen Notified: Published]
    Reject --> Notify2[Citizen Notified: Rejected]
    Notify1 --> Log1[Action Logged]
    Notify2 --> Log2[Action Logged]
```

---

## Figure 10: Flowchart of Office Assignments for LGU Administrator
```mermaid
flowchart TD
    Start([Office Assignments]) --> View[View Current Ruleset]
    View --> Action{Action}
    Action -->|Add| Add[Add New Rule]
    Action -->|Edit| Edit[Edit Existing Rule]
    Action -->|Archive| Archive[Archive Outdated Rule]
    Add --> Map[Map Category + Barangay]
    Edit --> Map
    Map --> Office[Assign to Office]
    Office --> SLA[Set SLA Tier]
    SLA --> Save[Save Rule]
    Archive --> Save
    Save --> Apply[Apply to New Reports]
```

---

## Figure 11: Flowchart of User Management for Super Admin and LGU Admin
```mermaid
flowchart TD
    Start([User Management]) --> Users[View User List]
    Users --> Search[Search/Filter Users]
    Search --> Action{Select Action}
    Action -->|Add| Add[Add New User]
    Action -->|Edit| Edit[Edit User Details]
    Action -->|Archive| Archive[Archive User]
    Action -->|Generate| Report[Generate User Report]
    Action -->|View Logs| Logs[View User Logs]
    Action -->|Backup| Backup[Backup & Restore]
    Add --> Save[Save Changes]
    Edit --> Save
    Archive --> Save
    Report --> End([End])
    Logs --> End
    Backup --> End
    Save --> End
```

---

## Figure 12: Flowchart of Main Interface for Citizen
```mermaid
flowchart TD
    Start([Sign Up/Login]) --> Profile[Complete Profile]
    Profile --> Main[Main Interface]
    
    Main --> SD[Service Directory]
    Main --> SR[Submit Report]
    Main --> TR[Track Report]
    Main --> News[News]
    Main --> Map[Town Map]
    Main --> SOS[Emergency Hotlines]
    Main --> Forum[Forum]
    Main --> Chat[Chatbot]
    Main --> Settings[Account Settings]
    Main --> Logout([Logout])
    
    SD --> Apply[Apply for Documents]
    SR --> Report[Submit Issue Report]
    TR --> Status[Check Status]
```

---

## Figure 13: Flowchart of Service Directory for Citizen
```mermaid
flowchart TD
    Start([Open Service Directory]) --> Browse[Browse Catalog]
    Browse --> Select[Select Service]
    Select --> Form[Guided Form]
    Form --> Draft{Save as Draft?}
    Draft -->|Yes| Save[Save Draft]
    Draft -->|No| Submit[Submit Application]
    Save --> Continue{Continue Later?}
    Continue -->|Yes| Form
    Continue -->|No| End([End])
    Submit --> QR[Generate Reference + QR Code]
    QR --> Present[Present QR at Municipal Hall]
    Present --> Pay[Payment & Release]
    Pay --> End
```

---

## Figure 14: Flowchart of Submit Report for Citizen
```mermaid
flowchart TD
    Start([Open Report Form]) --> Category[Select Category]
    Category --> Photo[Capture Photo]
    Photo --> GPS[Confirm GPS Location]
    GPS --> Check{Is Pothole?}
    
    Check -->|Yes| YOLO[YOLOv8n Detection]
    YOLO --> Confidence{Confidence > Threshold?}
    Confidence -->|Yes| Desc[Add Description]
    Confidence -->|No| Warn[Show Warning]
    Warn --> Confirm{User Confirms?}
    Confirm -->|Yes| Desc
    Confirm -->|No| Cancel[Cancel Report]
    
    Check -->|No| Desc
    Desc --> Submit[Submit Report]
    Submit --> Ref[Generate Reference Number]
    Ref --> Track[Add to Tracking List]
    Ref --> Success([Success])
    Cancel --> End([End])
```

---

## Figure 15: Flowchart of Track Report for Citizen
```mermaid
flowchart TD
    Start([Track Report]) --> List[View Submission List]
    List --> Item[Select Item]
    Item --> Status{Check Status}
    Status --> Submitted[Submitted]
    Status --> UnderReview[Under Review]
    Status --> InProgress[In Progress]
    Status --> Resolved[Resolved]
    Status --> Rejected[Rejected]
    Resolved --> Rate{Rate Resolution?}
    Rate -->|Yes| Feedback[Provide Feedback]
    Rate -->|No| End([End])
    Feedback --> Score[Update Satisfaction Score]
    Score --> End
    Submitted --> End
    UnderReview --> End
    InProgress --> End
    Rejected --> End
```

---

## Figure 16: Flowchart of Town Map for Citizen
```mermaid
flowchart TD
    Start([Open Town Map]) --> OSM[OpenStreetMap Tiles]
    OSM --> Landmarks[Key Landmarks Shown]
    Landmarks --> Action{User Action}
    Action -->|Search| Search[Search Landmark]
    Action -->|Tap| Details[View Details]
    Action -->|Directions| Navigate[Get Directions]
    Search --> Pin[Landmark Pin]
    Pin --> Details
    Details --> Info[Office Hours, Contact]
    Navigate --> Route[Route to Location]
    Info --> End([End])
    Route --> End
```

---

## Figure 17: Flowchart of Emergency Hotlines for Citizen
```mermaid
flowchart TD
    Start([Emergency Hotlines]) --> Select[Select Hotline]
    Select --> Type{Type}
    Type -->|Police| Call1[Call Police]
    Type -->|Fire| Call2[Call Fire Dept]
    Type -->|Hospital| Call3[Call Hospital]
    Type -->|MDRRMO| Call4[Call MDRRMO]
    Call1 --> SOS{Enable SOS?}
    Call2 --> SOS
    Call3 --> SOS
    Call4 --> SOS
    SOS -->|Yes| Share[Share GPS Location]
    SOS -->|No| End([End])
    Share --> Duty[Notify Duty Desk]
    Duty --> End
```

---

## Figure 18: Flowchart of Community Forum for Citizen
```mermaid
flowchart TD
    Start([Community Forum]) --> Browse[Browse Posts]
    Start --> Search[Search by Keyword]
    Start --> Compose[Compose New Post]
    Browse --> Interact[Like/Comment/Report]
    Compose --> Filter[Automated Filter]
    Filter --> Pass{Passes?}
    Pass -->|Yes| Published[Published Immediately]
    Pass -->|No| Await[Awaiting Moderation]
    Published --> Notify1[User Notified]
    Await --> Notify2[User Notified: Pending]
    Notify1 --> End([End])
    Notify2 --> End
    Interact --> End
```

---

## Figure 19: Flowchart of Chatbot for Citizen
```mermaid
flowchart TD
    Start([Citizen Types Question]) --> KM[Keyword Matching]
    KM --> Check{Match Found?}
    
    Check -->|Yes| Answer[Return Predefined Answer]
    Answer --> Source[Show Source Document]
    Source --> Done([End])
    
    Check -->|No| Gemini[Call Gemini API]
    Gemini --> GeminiCheck{Gemini Can Answer?}
    
    GeminiCheck -->|Yes| GeminiAnswer[Return Gemini Response]
    GeminiAnswer --> Done
    
    GeminiCheck -->|No| Fallback[Safe Fallback Message]
    Fallback --> Ticket[Offer to File Support Ticket]
    Ticket --> Done
```

---

## Figure 20: Flowchart of Account Settings for Citizen
```mermaid
flowchart TD
    Start([Account Settings]) --> Review[Review Preferences]
    Review --> Change{Need Changes?}
    Change -->|No| Main[Return to Main Interface]
    Change -->|Yes| Edit[Edit Settings]
    Edit --> Pass[Change Password]
    Edit --> Notif[Notification Preferences]
    Edit --> Lang[Language Settings]
    Edit --> Theme[Theme: Light/Dark]
    Pass --> Submit[Submit Changes]
    Notif --> Submit
    Lang --> Submit
    Theme --> Submit
    Submit --> Confirm[Confirm Modifications]
    Confirm --> Links[External Links: FB, YouTube]
    Links --> Main
    Main --> End([End])
```

---

## Figure 21: Wireframe for Citizen Sign-Up

---

## Figure 22: Wireframe for Citizen Main Interface

---

## Figure 23: Wireframe for Submit Report Flow

---

## Figure 24: Wireframe of LGU Admin Dashboard

---

## Figure 25: Wireframe of Issue Reports Page

---

## Figure 26: Wireframe of Service Requests Page

---

## Figure 27: Wireframe of News and Announcements Page

---

## Figure 28: Wireframe of Forum Moderation Page

---

## Figure 29: Wireframe of Office Assignments Page

---

## Figure 30: Wireframe of User Management Page

---

## Figure 31: Wireframe of Super Admin Cross-LGU Analytics Page

---

## Figure 32: Use Case Diagram for Super Administrator
```mermaid
useCaseDiagram
    actor "Super Administrator" as SA
    
    package AGAPP {
        usecase "Provision LGU Tenants" as UC1
        usecase "Deactivate Tenants" as UC2
        usecase "Manage Feature Flags" as UC3
        usecase "Monitor Cross-LGU Analytics" as UC4
        usecase "Supervise Compliance" as UC5
        usecase "Record Onboarding Fees" as UC6
        usecase "Oversee User Accounts" as UC7
    }
    
    SA --> UC1
    SA --> UC2
    SA --> UC3
    SA --> UC4
    SA --> UC5
    SA --> UC6
    SA --> UC7
```

---

## Figure 33: Use Case Diagram for LGU Administrator
```mermaid
useCaseDiagram
    actor "LGU Administrator" as LA
    
    package AGAPP {
        usecase "Manage Service Requests" as UC1
        usecase "Process Issue Reports" as UC2
        usecase "Configure Office Assignments" as UC3
        usecase "Publish News" as UC4
        usecase "Moderate Forum" as UC5
        usecase "Maintain Knowledge Base" as UC6
        usecase "Manage Staff Accounts" as UC7
        usecase "Monitor RA 11032 Compliance" as UC8
    }
    
    LA --> UC1
    LA --> UC2
    LA --> UC3
    LA --> UC4
    LA --> UC5
    LA --> UC6
    LA --> UC7
    LA --> UC8
```

---

## Figure 34: Use Case Diagram for LGU Personnel
```mermaid
useCaseDiagram
    actor "LGU Personnel" as LP
    
    package AGAPP {
        usecase "View Assigned Reports" as UC1
        usecase "Update Status" as UC2
        usecase "Attach Documents" as UC3
        usecase "Post Status Updates" as UC4
        usecase "Add Internal Notes" as UC5
    }
    
    LP --> UC1
    LP --> UC2
    LP --> UC3
    LP --> UC4
    LP --> UC5
```

---

## Figure 35: Use Case Diagram for Citizen
```mermaid
useCaseDiagram
    actor "Citizen" as C
    
    package AGAPP {
        usecase "Sign Up/Login" as UC1
        usecase "Apply for Documents" as UC2
        usecase "Submit Issue Report" as UC3
        usecase "Track Submission Status" as UC4
        usecase "View News" as UC5
        usecase "Open Town Map" as UC6
        usecase "Call Emergency Hotlines" as UC7
        usecase "Participate in Forum" as UC8
        usecase "Ask Chatbot" as UC9
    }
    
    C --> UC1
    C --> UC2
    C --> UC3
    C --> UC4
    C --> UC5
    C --> UC6
    C --> UC7
    C --> UC8
    C --> UC9
```

---

## Figure 36: Agile Scrum Model of AGAPP
```mermaid
flowchart LR
    subgraph Sprint0["Sprint 0: Initiation"]
        S0[Client Interviews<br/>Scope Document<br/>Wireframes<br/>DB Schema]
    end
    
    subgraph Sprint1["Sprint 1: Auth"]
        S1[Login/OTP<br/>Role Access<br/>Multi-tenant RLS]
    end
    
    subgraph Sprint2["Sprint 2: Service Directory"]
        S2[Content Modules<br/>Service Catalog<br/>Offline Caching]
    end
    
    subgraph Sprint3["Sprint 3: Issue Reporting + ML"]
        S3[Geotagged Reports<br/>YOLOv8n Detection<br/>Status Workflow]
    end
    
    subgraph Sprint4["Sprint 4: News/Forum/Chatbot"]
        S4[News Publishing<br/>Forum Moderation<br/>Keyword Chatbot]
    end
    
    subgraph Sprint5["Sprint 5: Admin Dashboards"]
        S5[Routing Rules<br/>SLA Tracker<br/>Analytics]
    end
    
    subgraph Sprint6["Sprint 6: Hardening"]
        S6[Security Review<br/>Performance Testing<br/>Privacy Compliance]
    end
    
    subgraph Sprint7["Sprint 7: UAT + Release"]
        S7[Beta Testing<br/>Bug Fixes<br/>Production Deploy]
    end
    
    Sprint0 --> Sprint1 --> Sprint2 --> Sprint3 --> Sprint4 --> Sprint5 --> Sprint6 --> Sprint7
    
    style Sprint0 fill:#e1f5fe
    style Sprint1 fill:#e8f5e9
    style Sprint2 fill:#fff3e0
    style Sprint3 fill:#fce4ec
    style Sprint4 fill:#f3e5f5
    style Sprint5 fill:#e0f2f1
    style Sprint6 fill:#fff8e1
    style Sprint7 fill:#d1c4e9
```
