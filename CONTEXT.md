# PhysiosMate — Developer Session Context

> **Purpose:** This file serves as a quick-reference context document capturing the features built, design decisions made, and all relevant file locations for the Doctor Dashboard. It is intended to help any developer (or AI assistant) instantly pick up context without reading the full codebase.

---

## What Was Built (Session Summary)

### 1. `ARCHITECTURE.md` (Project-Level Docs)
**File:** `src/ARCHITECTURE.md`

A comprehensive 558-line technical documentation file written at the project root covering:
- Executive Summary & Core Principles
- Full Technology Stack table (Angular 20, TypeScript, SSR, Bootstrap 5, SweetAlert2, Web Push)
- System Architecture diagram (SSR / CSR / SSG flow)
- Complete Directory & File Structure tree
- Routing Architecture & Navigation Map
- Core Functional Modules (Discovery, Booking, Auth, Patient Portal, Doctor Dashboard, Push Notifications)
- Service Layer & API Integration patterns
- All TypeScript Data Models & Schemas
- UI/UX & Layout Architecture
- Environment Configuration & Build Pipeline details

---

### 2. Add Patient Tab (Strict C# Backend DTO Alignment & 4-Column Full-Page Layout)
**Files:**
- `src/app/pages/doctor-dashboard/addpatient/addpatient.ts`
- `src/app/pages/doctor-dashboard/addpatient/addpatient.html`
- `src/app/pages/doctor-dashboard/addpatient/addpatient.css`

**Features & Architecture:**
- **Strict Backend C# DTO Alignment**: Registration collects permanent demographic/contact profile data matching the backend entity:
  - `file`: Profile photo upload with instant image preview, change, and remove options.
  - `FullName` & `Mobile`: Core identity fields with validation.
  - `Email`, `DOB` (with real-time age calculation badge), `Gender`.
  - `Address`, `City`, `State`.
  - `userId`, `roleId`: Maintained in payload state.
- **Layout Requirements**:
  - **Full-Page Width**: Spans 100% width of the dashboard workspace.
  - **4 Columns Per Row**:
    - **Row 1 (4 cols)**: Full Name, Mobile, Email, Date of Birth.
    - **Row 2 (4 cols)**: Gender, Residential Address, City, State.
  - **Clinical Separation**: Removed conditions and precautions from Add Patient (moved exclusively to Consultations).
- **Post-Registration Success Screen**:
  - Full-width card with patient avatar, code (`PT-XXXX`), demographics, contact, and address.
  - "Start Clinical Consultation &rarr;" button seamlessly routes to Consultations with patient pre-selected.
  - "Go to Patient Directory" and "Register Another Patient" actions.

---

### 3. Appointments Tab (Doctor Dashboard)
**Files:**
- `src/app/pages/doctor-dashboard/appointments/doctor-appointments.ts`
- `src/app/pages/doctor-dashboard/appointments/doctor-appointments.html`
- `src/app/pages/doctor-dashboard/appointments/doctor-appointments.css`

**Features built:**
- **Left Column**: Patient Directory with live search (by name, phone, patient code). Clicking a patient auto-fills all fields.
- **Right Column**: Two-mode form panel:
  - **Clinical Appointment Mode**: Schedule date, time slot chips (09:00 AM - 06:00 PM), visit mode (In-Clinic / Video / Home), session type, condition, and fee.
  - **Inquiry / Prospect Mode**: Records patient inquiries without billing. Captures inquiry source, follow-up date, priority (High/Medium/Low), what service was inquired about, and callback notes.
- **Bottom Section**: Tabbed ledger:
  - Today & Upcoming Appointments table (with Start/Complete status actions)
  - Prospect Inquiries & Follow-up Leads table (with "Convert to Appointment" action)

**Key Design Decision:** Patient may be an inquiry only (no consultancy, no appointment) — the doctor still wants to log it for future follow-up. The Inquiry mode explicitly shows "No Consultation Bill" to reflect this.

---

### 3. Consultations Tab (Doctor Dashboard)
**Files:**
- `src/app/pages/doctor-dashboard/consultations/consultations.ts`
- `src/app/pages/doctor-dashboard/consultations/consultations.html`
- `src/app/pages/doctor-dashboard/consultations/consultations.css`

**Features & Architecture:**
- **Separation of Permanent Data vs Encounter Data**: Patient demographic fields (Name, Age, Gender, Phone, Email, Medical History, Allergies) belong permanently to the patient profile and are **never re-entered** during consultations.
- **Left Column**: Patient Directory search panel for patient selection.
- **Right Column (Encounter Panel)**:
  - **Unselected State**: Prominent empty-state card prompting doctor to select or search a patient.
  - **Compact Read-Only Patient Card**: Displays patient avatar, name, code pill (`PT-XXXX`), status badge, age/gender/contact, baseline primary condition, systemic history, and allergies. If red flags exist, an amber warning strip is displayed.
  - **Section 1 - Consultation Specs & Pricing**: Consultancy Fee (₹500 default), Payment Status (Paid/Pending/Waived), Consultation Type, Visit Mode.
  - **Section 2 - Clinical Examination & Diagnosis**: Chief Complaint textarea, Quick Diagnosis preset chips, Provisional Diagnosis, Pain Severity rating (Mild/Moderate/Severe NPRS), Vitals (BP, Pulse, ROM restriction).
  - **Section 3 - Treatment Given & Rehabilitation Plan**:
    - **Treatment Administered During Encounter** (modality, manual mobilization, dry needling, exercises performed today).
    - Prescribed Care Plan Protocol & Next Review Date.
    - Clinical Advice & Home Exercise Prescription.
- **Bottom Section**: Recent Clinical Consultations ledger table with "Slip" action.
- **Prescription Slip Modal**: Printable slip showing patient snapshot, clinical findings, treatment administered today, assigned protocol, and home advice. Supports `window.print()`.

**Key Design Decision:** Consultations creates an encounter record linked to an existing permanent patient. The form focuses purely on what happened *during that encounter*, eliminating redundant data re-entry.

---

### 4. Font & Typography Alignment
All doctor dashboard tabs (Patients, Add Patient, Appointments, Consultations) now share **identical font styling**:

```css
/* Body font - all containers */
font-family: var(--font-body, 'Manrope', sans-serif);

/* Panel titles (h3/h4) */
font-family: var(--font-heading, 'Inter Tight', sans-serif);
font-size: 16px;
font-weight: 700;
color: var(--text-main, #1F2937);
letter-spacing: -0.01em;

/* Panel subtitles */
font-size: 13px;
color: var(--text-muted, #787887);

/* Form labels */
font-size: 12px;
font-weight: 600;
color: var(--text-main, #1F2937);
text-transform: uppercase;
letter-spacing: 0.05em;
```

All CSS is driven by **`variable.css`** tokens — no hard-coded colors or fonts except as fallbacks.

---

## Architecture Patterns Used

### Component Architecture
```
DoctorDashboard (doctordashboard.ts)  <- Shell / Orchestrator
  |-- <app-addpatient>                <- Add Patient Form
  |-- <app-patients>                  <- Patient Directory
  |-- <app-treatmentplans>            <- Treatment Plans
  |-- <app-consultations>             <- Consultations & Prescriptions
  `-- <app-doctor-appointments>       <- Appointments & Inquiries
```

### Data Flow
- **Central State**: All `patients[]`, `treatmentPlans[]`, `todayAppointments[]` arrays live in `Doctordashboard` (parent).
- **Patient Auto-fill**: Child tabs receive `@Input() patients: DoctorPatient[]` and use an Angular Signal + `computed()` for real-time search filtering.
- **Event Up**: Children emit `@Output()` events (`consultationAdded`, `appointmentAdded`) to notify the parent shell.
- **Graceful API fallback**: Service calls in `fetchData()` use `.subscribe({ error: () => {} })` — rich mock data is always shown if API fails.

### Routing
```typescript
// doctor-dashboard-routing-module.ts
{ path: 'consultations',   component: Doctordashboard },
{ path: 'Consultations',   component: Doctordashboard },
{ path: 'appointments',    component: Doctordashboard },
{ path: 'Appointments',    component: Doctordashboard },
```
All paths load the same `Doctordashboard` shell. The shell reads the URL segment via `ActivatedRoute` and sets `activeTab` accordingly using `pathToTab` lookup map.

### Tab Navigation
```typescript
export type DoctorDashboardTab =
  'dashboard' | 'add-patient' | 'patients' | 'treatment-plans' | 'Consultations' | 'Appointments';
```
`selectTab(tab)` sets `activeTab` and navigates to the corresponding URL path. This keeps URL and tab state in sync.

---

## Key Models Referenced
**File:** `src/app/models/doctor-dashboard.model.ts`

| Model | Purpose |
|---|---|
| `DoctorPatient` | Patient record with clinical details, plan assignment, session tracking |
| `DoctorTreatmentPlan` | Multi-phase rehabilitation protocol with progress tracking |
| `DoctorAppointment` | Today's appointment entry (scheduling + status flow) |
| `DoctorConsultationRecord` | Full clinical consultation record with diagnosis, vitals, billing, and prescription |
| `DoctorInquiryOrAppointment` | Combined inquiry/appointment output model from the Appointments tab |
| `DoctorStats` | KPI metrics for the dashboard overview (by day/week/month/lifetime) |
| `NewPatientFormData` | Form data structure for adding a new patient |

---

## CSS File Reference (Doctor Dashboard Tabs)

| Tab | CSS File |
|---|---|
| Dashboard Shell | `doctordashboard/doctordashboard.css` |
| Add Patient | `addpatient/addpatient.css` |
| Patients Directory | `patients/patients.css` |
| Treatment Plans | `treatmentplans/treatmentplans.css` |
| **Consultations** | `consultations/consultations.css` (New) |
| **Appointments** | `appointments/doctor-appointments.css` (New) |

All CSS files use `variable.css` tokens from the global design system for colors, typography, spacing, and border radii.

---

## Design Decisions Log

| Decision | Reasoning |
|---|---|
| Consultations is a separate tab from Appointments | Consultation = clinical event with billing/diagnosis/Rx. Appointment = scheduling. Different workflows. |
| Patient Inquiry (no bill) is in Appointments tab | Doctor wants to log prospective patients; no clinical record or consultation is created yet. |
| Auto-fill from left patient panel | Reduces manual data entry; clicking a patient instantly populates all fields on the right. |
| Payment Status: "Waived" option | Covers free inquiry doctor courtesy cases without requiring Rs 0 fee entry. |
| Consultancy fee auto-fills to Rs 500 | Default from doctor's profile fee; editable for custom pricing. |
| Slip modal with print support | Doctors need to hand a physical prescription slip to patients; `window.print()` is triggered. |
| `signal()` + `computed()` for search filtering | Angular Signals provide fine-grained reactivity without full re-render on every keystroke. |
| Mock data fallback in every @Input | Even if API is down, all panels show rich, realistic clinical data so the UI is always usable. |

---

## Quick File Locations

```
src/
|-- ARCHITECTURE.md                                   <- Full project documentation
`-- app/
    `-- pages/
        `-- doctor-dashboard/
            |-- doctor-dashboard-routing-module.ts    <- Route definitions
            |-- doctordashboard/
            |   |-- doctordashboard.ts                <- Shell orchestrator, central state
            |   |-- doctordashboard.html              <- Tab switcher, child rendering
            |   `-- doctordashboard.css               <- Sidebar + tab layout styles
            |-- addpatient/                           <- Add New Patient form
            |-- patients/                             <- Patient Directory tab
            |-- treatmentplans/                       <- Treatment Plans tab
            |-- consultations/                        <- Consultations & Prescriptions tab (New)
            `-- appointments/                         <- Appointments & Inquiries tab (New)
```

---

*Last updated: September 2026 - PhysiosMate Developer Session*
