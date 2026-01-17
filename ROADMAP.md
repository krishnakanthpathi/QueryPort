# QueryPort Roadmap

This document outlines the development roadmap for **QueryPort**, a headless portfolio platform allowing users to store and serve their portfolio data via API.

## 🚀 Phase 1: Foundation & Setup (Completed)
**Goal**: Establish the technical infrastructure for Backend and Frontend.

- [x] **Repo Setup**: Initialize Git, Monorepo structure (Backend/Frontend).
- [x] **Frontend Init**: React 19, Vite, TailwindCSS 4, GSAP/Three.js setup.
- [x] **Backend Init**: Express 5, TypeScript setup.
- [x] **Database Setup**:
    - [x] Database: **MongoDB** (Selected).
    - [x] Setup Connection: **Mongoose**.
- [x] **Project Structure**:
    - [x] **Folders**: `controllers`, `models`, `routes`, `middlewares`, `utils`, `types`.
    - [x] **MVC Pattern**: Setup Separation of Concerns.
- [x] **API Structure**:
    - [x] **Response Format**: JSend Standard `{ status: 'success' | 'fail' | 'error', data: ... }`.
    - [x] **Error Handling**: Global Error Handler Middleware + `AppError` class.
    - [x] **Async Wrapper**: `catchAsync` to avoid try-catch blocks in controllers.

## 🛠 Phase 2: Core Backend (The "Headless" Engine)
**Goal**: Build the API that serves user data.

- [x] **Authentication**:
    - [x] User Schema (Email, Password hash, Name, Username).
    - [x] Auth Routes (Signup, Login, Google OAuth).
    - [x] Middleware (JWT Verification).
- [x] **Profile Module**:
    - [x] Schema: Bio, Avatar, Resume Link, Social Links (Dynamic).
    - [x] Endpoints: `GET /profile/me`, `PATCH /profile/me`.
    - [x] Public Lookup: `GET /profile/:userId` and `GET /profile/u/:username`.
- [ ] **Projects Module**:
    - [ ] Schema: Title, Description, Tech Stack, Live Link, Repo Link, Images.
    - [ ] Endpoints: CRUD (`GET`, `POST`, `PUT`, `DELETE` /projects).
    - [ ] File Upload: Project Images (Storage: **Cloudinary**).
- [ ] **Skills & Experience Module**:
    - [ ] Schema: Skill name, Proficiency; Company, Role, Date Range.
    - [ ] Endpoints: CRUD.
- [ ] **Public API Endpoint**:
    - [ ] `GET /api/v1/:username` -> Returns aggregated public data (Profile + Projects + Skills).
    - [ ] Rate Limiting (Prevent abuse).

## 🎨 Phase 3: Frontend Dashboard
**Goal**: A beautiful interface for users to manage their data.

- [ ] **Auth Pages**: Login/Register with form validation.
- [ ] **Dashboard Layout**: Sidebar navigation, responsive design.
- [ ] **Profile Editor**: Real-time preview of data entry.
- [ ] **Project Manager**:
    - [ ] Image Upload (integrating Cloudinary or S3/R2).
    - [ ] List view of projects with Edit/Delete actions.
- [ ] **Developer Settings**:
    - [ ] View API Key (if required) or public endpoint URL.
    - [ ] "How to use" documentation snippet.

## 🌍 Phase 4: The Core Value (Usage)
**Goal**: Demonstrate how the data is used.

- [ ] **Default Portfolio Template**: A simple, elegant portfolio site that fetches data from the user's QueryPort API.
- [ ] **Documentation Site**: Clear guides on how others can fetch this data to build *their own* sites.

## 🔮 Phase 5: Future Enhancements
- [ ] **Analytics**: Track how many times a user's portfolio API is hit.
- [ ] **Custom Domains**: Allow users to map a domain to their public profile.
- [ ] **AI Generator**: Generate bio/descriptions based on keywords.
