# QueryPort

**QueryPort** is a modern, headless portfolio platform designed for developers to store, manage, and showcase their professional journey. It treats your portfolio data (projects, skills, achievements, certifications) as an API, allowing you to build any frontend presentation layer you desire while managing your content centrally.

## 🌟 Features

-   **Headless Architecture**: Decoupled backend and frontend. Your data is served via a RESTful API.
-   **Project Management**: Showcase your projects with rich details, images, and links.
-   **Global Skills**: Add and manage skills from a shared global pool.
-   **Achievements & Certifications**: Highlight your awards and credentials.
-   **Profile Customization**: Manage your bio, titles, and social presence.
-   **Authentication**: Secure signup/login with Email & Password and Google OAuth.

## 🏗 Tech Stack

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB
-   **Auth**: JWT & Google OAuth

### Frontend
-   **Framework**: React (Vite)
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React

## 🚀 Getting Started

To get the full application running locally, you need to set up both the backend and frontend.

### 1. Backend Setup
Navigate to the `Backend` directory:
```bash
cd Backend
npm install
```
Configure your `.env` file (see `Backend/README.md` for details) and start the server:
```bash
npm run dev
```

### 2. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
```
Start the development server:
```bash
npm run dev
```

## 🗺 Roadmap

Check out our [ROADMAP.md](./ROADMAP.md) to see what's coming next!
