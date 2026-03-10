# QueryPort Frontend

This is the frontend application for **QueryPort**, built with React, TypeScript, and Vite. It consumes the QueryPort API to manage and display portfolio data. It includes a **Leaderboard** (sortable by likes, CGPA, LeetCode, Codeforces, HackerRank) and an **Advanced Report** page for filtered CSV exports.

## 🛠 Tech Stack
-   **Framework**: React 18
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **Routing**: React Router DOM

## 🚀 Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Create a `.env` file in the root of the `frontend` directory:
    ```env
    VITE_API_URL=http://localhost:8888/api/v1
    VITE_GOOGLE_CLIENT_ID=your_google_client_id
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

## 📄 Key Pages

- **Leaderboard** (`/leaderboard`): Ranked list with sort by likes, CGPA, LeetCode, Codeforces, HackerRank; type and search filters; quick “Export CSV”.
- **Advanced Report** (`/leaderboard/report`): Filter by stats ranges, certifications, education, experience, achievements, projects, profile; choose CSV columns; download report (up to 1000 rows).
