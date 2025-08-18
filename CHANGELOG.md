# CHANGELOG.md

## [5.1.0] - 2025-08-18

### Added
- Enforced onboarding flow across protected routes with step tracking and redirects.
- New onboarding routes standardized to `/onboarding/{step}` with `/onboarding/complete`.
- AuthContext: onboarding state management (`updateOnboardingStep`, `completeOnboarding`), `currentUser` alias, and local persistence per user.
- ProtectedRoute: onboarding enforcement, allow viewing `/onboarding/complete` post-finish.
- Admin: "Add User" modal on Customers page enabling internal user creation.
- Avatars: License-safe avatar set generated and mapped to DBZ filenames; avatar picker integrated end-to-end.
- Backend (FastAPI): Modular structure (`main.py`, `models.py`, `database.py`, `auth.py`), CORS, JWT auth, signup/login endpoints.
- Account page: User info display and change password flow (UI + backend endpoint).

### Changed
- Updated onboarding pages (01–04) to use new routes and AuthContext methods; submit advances steps and completes onboarding.
- Sidebar behavior: hover expand/collapse retained with dropdowns.
- Frontend API service: improved headers, token handling, and error handling.

### Fixed
- Bcrypt compatibility by pinning version 4.0.1.
- Backend CSV header handling for empty users file during signup.
- Modal basic listener bug causing instant-close; fixed so Add User modal opens/closes reliably.

### Notes
- Onboarding state is currently persisted on the frontend in `localStorage` per user (`onboarding:{username}`); backend can be extended to own this state later.
- Admin user is seeded on backend startup if missing (username: `admin`, password: `admin`).
- Backend exposes protected `/admin/users` for admin listing; Customers page consumes this.

## [5.0.0] - 2023-05-31

- Dark mode support

## [4.4.0] - 2023-05-04

- Several minor improvements

## [4.3.5] - 2023-04-11

- Dependency updates

## [4.3.4] - 2023-03-28

- Improve sidebar group links behaviour

## [4.3.3] - 2023-02-13

- Update dependencies
- Improve sidebar icons color logic

## [4.3.1] - 2022-07-21

- Fix issue with mobile menu not expanding

## [4.3.0] - 2022-07-15

- Replace Sass with CSS files

## [4.2.0] - 2022-07-11

- Update dependencies
- Update React to v18

## [4.1.0] - 2022-07-11

- Several minor changes

## [4.0.0] - 2022-03-03

- v4 Release

## [3.10.0] - 2022-02-23

- Add Forum pages

## [3.9.0] - 2022-02-19

- Add more pages

## [3.8.0] - 2022-02-09

- Add Meetups pages

## [3.5.0] - 2022-02-08

- Add a new cart page

## [3.4.1] - 2022-02-05

- Minor change

## [3.4.0] - 2022-02-04

- Add Fintech page

## [3.3.0] - 2022-01-25

- Replace CRA (Create React App) with Vite
- Remove Craco
- Update dependencies

## [3.2.0] - 2022-01-13

- Minor changes

## [3.1.0] - 2021-12-13

- Update Tailwind 3
- Several improvements

## [3.0.0] - 2021-10-20

Add more pages
Update dependencies and remove some

## [2.2.0] - 2021-09-09

Add Cart, Cart 2 and Pay pages

## [2.1.0] - 2021-09-06

Add Invoices page

## [2.0.2] - 2021-08-30

Improve colors in settings sidebar and fix dashboard icon

## [2.0.1] - 2021-08-30

Sidebar fix

## [2.0.0] - 2021-08-30

Add more pages and components

## [1.1.0] - 2021-05-06

Several improvements

## [1.0.0] - 2021-04-20

First release