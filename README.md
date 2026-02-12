# Eco-Points System

Eco-Points is a multi-tenant SaaS platform designed to incentivize recycling through Reverse Vending Machines (RVMs). Organizations can rent machines, create community leaderboards, and offer rewards to users who recycle.

## System Architecture

The project is divided into two main parts:
- **Client**: A React-based frontend (Next.js/Vite) for users and admins.
- **Server**: A Flask-based backend handling API requests, database interactions, and RVM communication.

## Database Schema (Data Models)

The core logic of the application is defined in `server/app/models.py`. The schema is designed around three main pillars:

### 1. Multi-Tenant Identity (The Core)
This group manages *who* is using the system and *where* they belong.

- **Organization**: The top-level client (e.g., University, Corporation, HOA).
- **CommunityGroup**: Sub-groups for identification and logical separation (e.g., Department, Building Block).
    - **Concept**: Acts as a container to organize users within an Organization.
    - **Purpose**: Primarily used to isolate and identify distinct groups for management and reporting. It allows for aggregating usage data across a specific subset of the organization.

- **User**: The individual human interacting with the system.
    - **Roles**:
        - `Superadmin`: Platform owner/developer.
        - `Admin`: Campus Administrator (e.g., Dean, Head of Student Affairs).
        - `User` (Primary): The main account holder (e.g., Student, Faculty Member). Requires email/password for web access.
        - `Maintenance`: Facilities Staff (e.g., Janitors, Technicians). Requires email for reporting tools.
        - `Dependent`: Restricted Members (e.g., Service Personnel, Event Guests). No email required. They use **printed QR codes or RFID fobs** to contribute to the central department/organization account.

- **AccessCredential**: Decouples login from physical presence. Stores data for **QR Codes** or **RFID Fobs**, allowing users (especially Dependents) to log in at an RVM without credentials.

### 2. Hardware & IoT (The RVM Operations)
This group manages the physical machines and the act of recycling.
- **RVM**: The physical Reverse Vending Machine. Tracks status, location, and capacity.
- **MaintenanceLog**: Records actions performed by **Maintenance Staff** (e.g., emptying bins, cleaning sensors).
- **RecyclingSession**: A user's interaction with a machine (Scan QR/Tap RFID -> Deposit -> Finish).
- **RecyclingItem**: Detailed log of each item deposited (Type, Material, Weight, Points).

### 3. The Economy (Points & Rewards)
This group manages the "gamification" and value exchange.
- **Transaction**: A double-entry ledger for all point movements (Earn vs. Redeem).
- **Reward**: Digital perks created by Organizations (e.g., "Free Coffee at Campus Café", "Priority Parking").
- **RewardRedemption**: Represents a claimed reward. Generates a unique **QR Code** for merchants to scan and verify.

## Key Features

- **QR Code & RFID Integration**:
    - **User Login**: Users can display a QR code or tap an RFID fob (from `AccessCredential`) to log in to an RVM.
    - **Dependent Onboarding**: Dependents can be issued printed QR badges or cheap RFID tags linked to the Household Account.
    - **Reward Redemption**: Users show a redemption QR code (from `RewardRedemption`) to claim perks.
- **Maintenance Tracking**:
    - Designated **Maintenance** staff manage RVMs.
    - Maintenance actions are logged in `MaintenanceLog` for accountability and operational tracking.
- **Point Pooling (Departmental Accounts)**:
    - Designed for Campus Organizations. An entire department or student council contributes to a single goal.

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL (or SQLite for development)

### Setup
1.  **Backend**:
    ```bash
    cd server
    pip install -r requirements.txt
    flask run
    ```
2.  **Frontend**:
    ```bash
    cd client
    npm install
    npm run dev
    ```
