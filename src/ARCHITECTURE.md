# PhysiosMate — Angular Architecture Reference

> This document describes the component architecture, routing design, and user flow
> for authentication and the booking funnel in PhysiosMate.

---

## Core Principle

> **One `AuthFormComponent`, two layouts.**  
> The login/signup UI is never duplicated. It is always `AuthFormComponent`.  
> Context (standalone vs booking) is passed via `@Input()`.

---

## Component Hierarchy

```
AuthFormComponent          ← reusable leaf (no router awareness)
       │
       ├── AuthPageComponent              /login  /signup
       │
       └── BookingAuthComponent           /booking/consultancy/:providerId
                   │
                   └── ProviderSummaryComponent
```

---

## Directory Structure

```
src/app/
│
├── auth/
│   ├── auth-form/
│   │   ├── auth-form.component.ts        ← @Input() mode, @Input() bookingContext
│   │   ├── auth-form.component.html
│   │   └── auth-form.component.scss
│   │
│   └── auth-page/
│       ├── auth-page.component.ts        ← reads URL to set mode
│       ├── auth-page.component.html
│       └── auth-page.component.scss
│
├── booking/
│   ├── booking-auth/
│   │   ├── booking-auth.component.ts     ← reads :providerId, loads provider
│   │   ├── booking-auth.component.html
│   │   └── booking-auth.component.scss
│   │
│   ├── provider-summary/
│   │   ├── provider-summary.component.ts ← @Input() provider: PractitionerDetailedData
│   │   ├── provider-summary.component.html
│   │   └── provider-summary.component.scss
│   │
│   ├── booking-details/
│   │   ├── booking-details.component.ts  ← date/time picker (AuthGuard protected)
│   │   ├── booking-details.component.html
│   │   └── booking-details.component.scss
│   │
│   └── booking-confirmation/
│       ├── booking-confirmation.component.ts  ← summary + confirm CTA (AuthGuard protected)
│       ├── booking-confirmation.component.html
│       └── booking-confirmation.component.scss
│
├── helper/
│   └── auth.guard.ts                     ← CanActivateFn — checks authService.isLoggedIn()
│
├── services/
│   └── authservice.ts                    ← login, register, isLoggedIn, logout, getToken
│
├── pages/
│   ├── home/
│   ├── doctors/
│   ├── doctordetail/                     ← bookConsultancy() method wired to button
│   └── layout/
│
└── app.routes.ts                         ← all route definitions
```

---

## Routes

```typescript
const routes: Routes = [

  // ─── Layout routes (with header + footer) ───────────────────────────────
  {
    path: '',
    component: LayoutwithheaderFooter,
    children: [
      { path: '',                   component: Home },
      { path: 'find-doctors',       component: Doctors },
      { path: 'doctors',            component: Doctors },
      { path: 'doctors/:specialty', component: Doctors },
      { path: 'doctor-detail',      component: Doctordetail },
      { path: 'doctor-detail/:id',  component: Doctordetail },
      { path: 'doctor/:id',         component: Doctordetail },
      { path: 'providers/:id',      component: Doctordetail },   // canonical
    ]
  },

  // ─── Standalone auth (no header/footer) ─────────────────────────────────
  { path: 'login',   component: AuthPageComponent },
  { path: 'signup',  component: AuthPageComponent },

  // ─── Booking authentication ──────────────────────────────────────────────
  {
    path: 'booking/consultancy/:providerId',
    component: BookingAuthComponent                             // Doctor summary + AuthForm
  },
  {
    path: 'booking/consultancy/:providerId/details',
    redirectTo: 'doctor-detail/:providerId',
  },
  {
    path: 'booking/consultancy/:providerId/confirmation',
    redirectTo: 'doctor-detail/:providerId',
  },

  { path: '**', redirectTo: '' }
];
```

---

## User Flows

### 1 — Header Login

```
Header [Login]
      │
      ▼
   /login
      │
      ▼
AuthPageComponent  (mode = 'login')
      │
      ▼
AuthFormComponent  (centered, full-page)
      │
  login success
      │
      ▼
  / (home)  or  returnUrl if query param present
```

### 2 — Booking (user NOT logged in)

```
Doctor Detail Page (/doctor-detail/:id)
   - User selects available date & time slot directly on page
   - Clicks [Book Consultancy] or [Book Appointment]
      │
      ▼
authService.isLoggedIn()  →  false
      │
      ▼ (preserves selected slot in BookingService)
/booking/consultancy/:providerId
      │
      ▼
BookingAuthComponent
  ┌───────────────────────┬──────────────────────────┐
  │   ProviderSummary     │      AuthFormComponent    │
  │   (left column)       │      (right column)       │
  │                       │   mode = 'login'          │
  │   📸 Dr. Name         │   [bookingContext]=true   │
  │   ⭐ 4.8              │                           │
  │   ₹500                │   "Login to continue      │
  │   📍 City             │    your booking"          │
  └───────────────────────┴──────────────────────────┘
              │
         login / signup success
              │
              ▼
Redirect back to Doctor Detail (/doctor-detail/:id?bookingConfirmed=true)
              │
              ▼
Booking Confirmed Popup Modal Opens Automatically!
  ┌────────────────────────────────────────────────────────┐
  │  ✔ Consultation Confirmed!                            │
  │  Booking ID: PHY-XXXXXX                                │
  │  Doctor: Dr. Sneha Sharma                              │
  │  Clinic: Fit N Fly Physiotherapy & Fitness Centre      │
  │  Date & Time: Wed, 2 Sep at 10:00 AM                   │
  │  Fee: ₹500 (Pay at Clinic)                             │
  │  [Download Receipt]   [Done]                           │
  └────────────────────────────────────────────────────────┘
```

### 3 — Booking (user already logged in)

```
Doctor Detail Page (/doctor-detail/:id)
   - User selects available date & time slot
   - Clicks [Book Consultancy]
      │
      ▼
authService.isLoggedIn()  →  true
      │
      ▼
Immediate Consultation Confirmed Popup Modal on Page!
(No redirection, no duplicate slot selection needed)
```

### 4 — AuthGuard redirect

```
Unauthenticated user tries to access:
/booking/consultancy/:providerId/details
      │
      ▼
authGuard  →  false
      │
      ▼
/login?returnUrl=/booking/consultancy/:providerId/details
      │
  login success
      │
      ▼
/booking/consultancy/:providerId/details   ← booking preserved ✅
```

---

## AuthFormComponent Inputs / Outputs

| Property | Type | Description |
|---|---|---|
| `mode` | `'login' \| 'signup'` | Which form to show |
| `bookingContext` | `boolean` | Adjusts copy: "Login to continue your booking" |
| `authSuccess` | `EventEmitter<void>` | Emitted after successful auth |

---

## AuthService Key Methods

| Method | Returns | Description |
|---|---|---|
| `login(model)` | `Observable<ApiResponse<authmodel>>` | POST /Auth/Login |
| `register(model)` | `Observable<ApiResponse<authmodel>>` | POST /Auth/Register |
| `isLoggedIn()` | `boolean` | Checks localStorage for user token |
| `getToken()` | `string \| null` | Returns JWT token |
| `getuserid()` | `number \| null` | Returns user ID |
| `logout()` | `void` | Clears localStorage, navigates to `/` |

---

## Design Layout — Booking Auth (Two-Column)

```
┌──────────────────────────────────────────────────────────────┐
│  🩺 PhysiosMate                                      ← Back  │
├──────────────────────────┬───────────────────────────────────┤
│                          │                                   │
│    BOOK CONSULTANCY      │         Welcome Back              │
│                          │                                   │
│    ┌────────────────┐    │   Login to continue               │
│    │                │    │   your booking                    │
│    │    PHOTO       │    │                                   │
│    │                │    │   Email / Phone                   │
│    └────────────────┘    │   ┌───────────────────────────┐   │
│                          │   └───────────────────────────┘   │
│    Dr. Rahul Sharma      │                                   │
│    Physiotherapist       │   Password                        │
│    ⭐ 4.8                │   ┌───────────────────────────┐   │
│                          │   └───────────────────────────┘   │
│    ABC Physio Clinic     │                                   │
│    📍 Kota               │           [ LOGIN ]               │
│    💰 ₹500               │                                   │
│    📅 Consultancy        │   Don't have account?             │
│                          │        Sign Up                    │
│                          │                                   │
└──────────────────────────┴───────────────────────────────────┘
      ProviderSummaryComponent        AuthFormComponent
```

---

## Design Layout — Standalone Auth (/login)

```
┌─────────────────────────────────────────────────────────────┐
│  🩺 PhysiosMate                    Doctors  Clinics  Login  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              ┌─────────────────────────────┐                │
│              │       Welcome Back           │                │
│              │                             │                │
│              │  Email / Phone              │                │
│              │  ┌───────────────────────┐  │                │
│              │  └───────────────────────┘  │                │
│              │                             │                │
│              │  Password                   │                │
│              │  ┌───────────────────────┐  │                │
│              │  └───────────────────────┘  │                │
│              │                             │                │
│              │       [ LOGIN ]             │                │
│              │                             │                │
│              │   Forgot Password?          │                │
│              │                             │                │
│              │  Don't have account?        │                │
│              │       Sign Up               │                │
│              └─────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*Last updated: 2026-09-02*  
*Maintained by: PhysiosMate Engineering*
