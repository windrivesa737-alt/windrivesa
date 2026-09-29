# WinDriveSA — Google AI Studio Handoff

This is a CLEANED handoff of the WinDriveSA Stitch project.

The original Stitch download contained many obsolete iterations. Only the 22 approved screen versions in `stitch/screens/` are included here.

## Approved screens

1. Homepage — `/`
2. Register — `/register`
3. Login — `/login`
4. Forgot Password — `/forgot-password`
5. User Dashboard — `/dashboard`
6. Cash Prize Claim
7. Vehicle Prize Claim
8. User Claim Requests — `/claims`
9. Account / Profile — `/account`
10. User Support — `/support`
11. Admin Dashboard — `/admin`
12. Admin Users — `/admin/users`
13. Admin Rewards — `/admin/rewards`
14. Admin Cash Prizes — `/admin/cash-prizes`
15. Admin Vehicle Prizes — `/admin/vehicle-prizes`
16. Admin Claim Requests — `/admin/claims`
17. Admin Claim Requirements — `/admin/claim-requirements`
18. Admin Winners — `/admin/winners`
19. Admin Support — `/admin/support`
20. Admin Audit Logs — `/admin/audit-logs`
21. Admin Settings — `/admin/settings`
22. Reset Password — `/reset-password`

## Navigation architecture

Exactly three navigation contexts exist:

### Public
Only `/`
- Home
- Prizes
- How It Works
- About
- FAQs
- Contact

### Authenticated user
- Dashboard
- My Rewards
- Claim Requests
- Account
- Support
- Logout

### Admin
- Dashboard
- Users
- Rewards
- Cash Prizes
- Vehicle Prizes
- Claim Requests
- Claim Requirements
- Winners
- Support
- Audit Logs
- Settings
- Logout

The public navbar MUST NOT render in authenticated or admin routes, even hidden.

Desktop authenticated/admin: left sidebar.
Tablet/mobile: compact header with logo upper-left and theme + hamburger upper-right.
Headers must participate in normal document flow and never cover page content.

## Theme

Light mode is the default.
Do not initialize from `prefers-color-scheme`.
Dark mode is optional through the app theme toggle.

## Design

Read `stitch/DESIGN.md`.

Brand:
WinDriveSA — “Win Big. Drive Away.”

Core colors:
Deep Navy `#071A2B`
Gold `#F2B705`
Emerald `#00843D`
Charcoal `#17212B`
Light Background `#F5F7FA`
Muted Text `#667085`
Border `#D9E0E7`

Typography:
Sora headings.
Manrope body/UI.

Use the supplied logo asset. Do not recreate it.

## Product rules

This is an admin-assigned reward platform, not a competition/betting product.

New self-registered users begin `PENDING REVIEW`.
Admins may also create users.

After approval, an admin assigns:
- one active cash prize
- one active vehicle prize

Default configurable reward:
- R250,000 ZAR
- 2026 Toyota Hilux

Users cannot see reward information before approval and assignment.

## Claim lifecycle

Keep account, reward, and claim status separate.

NOT_AVAILABLE → AVAILABLE → SUBMITTED → UNDER_REVIEW → APPROVED → REQUIREMENT_PENDING → PROCESSING → FULFILLED

Additional branches:
REJECTED
MORE_INFORMATION_REQUIRED

Applicable Charge is shown only after claim approval and only when configured by admin.
Use neutral admin-supplied wording. Do not invent tax, government, regulatory, or endorsement claims.
The website does not process the applicable charge.

## Claim data

Cash:
Full Name, Bank Name, Account Number, Account Type, Branch Code.

Never collect/display card number, CVV, PIN, password, or OTP.

Vehicle:
Full Name, Mobile Number, Delivery Address, City, Province, Postal Code, Preferred Delivery Contact.

## Claim requirements

Admin-configured fields:
Claim Type, Prize, Applicable Charge, Currency (ZAR), Description, Status Enabled/Disabled, WhatsApp Support Number.

Do not include “Supporting Document”.

## Support

WhatsApp is support only.
No payment processing through WhatsApp.
Do not request banking credentials, card details, PINs, passwords, or OTPs through WhatsApp.

## Backend direction

Use Supabase Auth for authentication/session management.

Core entities:
profiles
rewards
cash_prizes
vehicle_prizes
claims
claim_requirements
support_requests
audit_logs
admin_users

Use Row Level Security.
Users can access only their own user-facing records.
Admin operations must be authorized server-side.
Do not trust frontend-only status changes.

## Implementation rule

Treat the 22 numbered screens as the approved visual source of truth.
Preserve their design language, navigation architecture, responsive behavior, and interaction patterns.

The Stitch HTML files are UI source material, not a finished production backend.

Build in stages:
1. frontend architecture/routes
2. preserve Stitch UI
3. Supabase Auth
4. database + RLS
5. business-state transitions
6. admin permissions/audit logging
7. responsive + interaction QA
