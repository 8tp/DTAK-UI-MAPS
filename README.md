# DTAK Mobile Application MVP

This repository contains the source code for the DTAK Mobile Application, a native, offline-first mapping tool built with React Native. The immediate goal is to develop a Minimum Viable Product (MVP) for a demo this Friday.

This document outlines the project requirements, development setup, key tasks, and known risks.

## Table of Contents

- [Project Overview](#project-overview)
- [Core Technologies & Resources](#core-technologies--resources)
- [MVP Requirements (Demo Deadline: Friday)](#mvp-requirements-demo-deadline-friday)
- [Stretch Goals (If Time Permits)](#stretch-goals-if-time-permits)
- [Getting Started: Development Environment](#getting-started-development-environment)
- [Immediate Coordination Tasks](#immediate-coordination-tasks)
- [Architectural Decisions](#architectural-decisions)
- [Risks and Unknowns](#risks-and-unknowns)

## Project Overview

The objective is to rapidly develop a standalone, native mobile mapping application. The architecture must be **offline-first**, using a decentralized sync model, and must **not** have any dependency on the external TAC kernel. The user interface will be persona-driven to support various operational roles.

## Core Technologies & Resources

-   **Mobile Platform:** React Native
-   **Offline Sync:** Ditto
-   **Map Libraries:**
    -   [MapLibre](https://maplibre.org/)
    -   [Mapbox](https://www.mapbox.com/)
-   **Reference Repositories:**
    -   [COTAK (GitHub)](https://github.com/dfpc-coe)
-   **Account Creation:**
    -   [TAK.gov Registration](https://tak.gov/registration/registration_requests/new)

## MVP Requirements (Demo Deadline: Friday)

This is the prioritized checklist for the Friday demo.

-   [ ] **1. Mobile Map App (Native)**
    -   **Description:** The application loads and displays an interactive map.
    -   **Acceptance Criteria:** App launches on a device or emulator. Map tiles render correctly. The user can pan and zoom the map.

-   [ ] **2. Offline-First Architecture**
    -   **Description:** The app must be fully functional without an internet connection, using Ditto or a local database stub for data persistence.
    -   **Acceptance Criteria:** A user can add or edit a map point while the device is offline. The point persists locally and is visible after the app is restarted.

-   [ ] **3. Drop, Create, and View Map Points**
    -   **Description:** Implement the core UI for creating and managing map points.
    -   **Acceptance Criteria:** A user can create a point. The point appears on the map and in a list view. Tapping a point opens its detail view (title/description).

-   [ ] **4. Persona Selection (Skeleton)**
    -   **Description:** Create the UI for selecting a user persona. The initial roles are: Disaster Response, First Responder, Tactical/Military Operator, Firefighter, Police, Civilian, Volunteer.
    -   **Acceptance Criteria:** A persona selection screen exists. The chosen persona is saved, persists across app sessions, and can toggle any persona-specific UI placeholders.

-   [ ] **5. Select Map Features / Plugins (Stubbed)**
    -   **Description:** A UI to enable or disable tactical plugins and other map features.
    -   **Acceptance Criteria:** A screen with feature toggles exists. The state of the toggles is saved and can be used to change the UI (actual plugin functionality can be mocked).

-   [ ] **6. Basic GPS Integration and Point Metadata**
    -   **Description:** Capture device location and store basic metadata when creating a point.
    -   **Acceptance Criteria:** Dropped points automatically store and display the device's latitude and longitude. The point's detail view shows a placeholder for floor/precision.

-   [ ] **7. No Dependency on TAC Kernel**
    -   **Description:** The codebase must be self-reliant and use in-house or rewritten components instead of the external TAC kernel.
    -   **Acceptance Criteria:** This README explicitly documents that the TAC kernel is not used and lists the local components that replace its functionality.

-   [ ] **8. AWS Development Environment and Onboarding**
    -   **Description:** A shared development environment must be available for the team in AWS.
    -   **Acceptance Criteria:** The team can `git clone` the repository and run a development build. Instructions are clear. Patrick is the confirmed owner and point of contact.

## Stretch Goals (If Time Permits)

-   [ ] **1. Simple Authentication Stub (Mocked)**
    -   **Description:** A mocked user flow for biometric/photo-ID that creates a local "wallet" object.
    -   **Acceptance Criteria:** The user can navigate a "create account" flow. A local credential/wallet object is successfully stored on the device. No real ID verification is required.

-   [ ] **2. Basic Overlay Capability**
    -   **Description:** Demonstrate the ability to toggle a single data overlay on the map.
    -   **Acceptance Criteria:** An overlay layer (e.g., roads or weather) can be toggled on and off, with the change immediately visible on the map.

-   [ ] **3. Sync Proof-of-Concept with Ditto**
    -   **Description:** Show data sync between two devices or emulators.
    -   **Acceptance Criteria:** A point created on Device A (offline) appears on Device B when both devices come online and connect.

-   [ ] **4. KOTAC Library Import/Analysis**
    -   **Description:** Ingest KOTAC open-source JSON assets to demonstrate data mapping.
    -   **Acceptance Criteria:** The repository contains a `kotac-assets/` folder with parsed JSON. A sample component renders a UI element (e.g., a dropdown menu) driven by this data.

## Getting Started: Development Environment

1.  **Contact Patrick:** Reach out to Patrick to get credentials and access to the AWS development environment.
2.  **Clone the Repository:**
    ```bash
    git clone <repository_url>
    cd dtak-mobile-app
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Install iOS Dependencies:**
    ```bash
    cd ios && pod install && cd ..
    ```
5.  **Run the Application:**
    ```bash
    # For iOS
    npx react-native run-ios

    # For Android
    npx react-native run-android
    ```

## Immediate Coordination Tasks

The following tasks must be completed to unblock development progress.

-   [ ] **Contact Kyle:** Review his existing Node.js to React Native port to avoid duplicating work. (**Meeting: Tomorrow @ 8:30 AM**)
-   [ ] **Contact Patrick:** Confirm AWS dev environment setup and get credentials for the team.
-   [ ] **Locate Source Code:** Find the vendor-provided source code and perform a gap analysis to identify missing features.
-   [ ] **Parse KOTAC Assets:** Clone the KOTAC open-source repository and parse the JSON assets to accelerate UI implementation.
-   [ ] **Document Decisions:** Formally document the decision to use Ditto and explicitly state that Trustworth or other SDKs are not in scope for the MVP.

## Architectural Decisions

-   **Data Sync:** The project will use **Ditto** for decentralized, offline-first data synchronization. Other SDKs like Trustworth are out of scope for the MVP.
-   **Core Kernel:** The application will **not** use the external TAC kernel. All required functionality will be built or rewritten internally.

## Risks and Unknowns

-   **Ambiguous Terminology:** The source transcript contains unclear or misspelled names (e.g., TAC/iTAC, DTEC/DTEC core, Kotac/KOTAC). These must be clarified.
-   **Identity/Wallet Scope:** Full digital wallet and self-sovereign identity integration is complex and **not expected** for the Friday demo. Only UI stubs are required.
-   **Source Code Gaps:** The vendor likely withheld proprietary "crown-jewel" code (e.g., wallet implementation, backend hooks). Full feature parity is not a realistic goal without significant replacement development.
-   **Future Work (Out of Scope for MVP):** Advanced features like high-precision GPS, floor-level positioning, and complex overlays (MGPS) are not required for the initial demo.