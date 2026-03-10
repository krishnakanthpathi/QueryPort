# QueryPort 🚀

**QueryPort** is a modern, headless portfolio platform designed for developers to store, manage, and showcase their professional journey. It treats your portfolio data (projects, skills, achievements, certifications) as an API, allowing you to build any frontend presentation layer you desire while managing your content centrally.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://query-port-brown.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

## 🌟 Features

- **Headless Architecture**:  Decoupled backend and frontend.  Your data is served via a RESTful API
- **Project Management**: Create, update, and showcase your projects with rich details, images, and links
- **Skills Management**: Add and manage skills from a shared global pool
- **Achievements & Certifications**:  Highlight your awards and professional credentials
- **Profile Customization**: Manage your bio, titles, location, resume, and social presence
- **Leaderboard**: Rank users by likes, CGPA, LeetCode, Codeforces, HackerRank with sort and filters
- **Advanced Report Download**: Filter by stats, certifications, education, experience, achievements, projects; export CSV (up to 1000 rows)
- **Weekly Leaderboard Sync**: Daemon runs every Sunday at 3:00 AM to refresh all users’ stats (CGPA, coding profiles, project likes)
- **Authentication**: Secure signup/login with Email & Password and Google OAuth
- **Public Profiles**: Share your portfolio via unique URLs (`/u/:username`)
- **Real-time Updates**: Dynamic content management with instant updates
- **Responsive Design**: Beautiful UI that works on all devices

## 🏗 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT & Google OAuth
- **File Storage**:  Cloudinary integration for image uploads
- **Security**: bcryptjs for password hashing, JWT for session management

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **Routing**: React Router DOM
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom wrapper

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Google Cloud Console Project (for OAuth)
- Cloudinary account (for image uploads)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/krishnakanthpathi/QueryPort.git
cd QueryPort
```

#### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory:
```env
PORT=8888
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=5d
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
# Optional: set to 1 or true to disable the weekly leaderboard sync cron
# DISABLE_LEADERBOARD_CRON=0
```

Start the backend server:
```bash
# Development mode
npm run dev

# Production build
npm run build
node dist/index.js
```

#### 3. Frontend Setup

```bash
cd Frontend
npm install
```

Create a `.env` file in the `Frontend` directory:
```env
VITE_API_URL=http://localhost:8888/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend development server:
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application running.

## 📁 Project Structure

```
QueryPort/
├── Backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── cron/             # Scheduled jobs (e.g. weekly leaderboard sync)
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Helper functions
│   │   └── index.ts          # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/       # React components (Leaderboard, AdvancedReport, etc.)
│   │   ├── context/          # Context providers
│   │   ├── lib/              # Utilities and API client
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🔌 API Documentation

### Base URL
`/api/v1`

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/signup` | Register a new user | `{ name, username, email, password }` |
| `POST` | `/login` | Login with email/password | `{ email, password }` |
| `POST` | `/google` | Login with Google OAuth | `{ credential }` |

### 👤 Profile (`/api/v1/profile`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/:userId` | Get profile by User ID | Public |
| `GET` | `/u/:username` | Get profile by Username | Public |
| `GET` | `/me` | Get your own profile | Protected |
| `PATCH` | `/me` | Create/Update your profile | Protected |

### 📂 Projects (`/api/v1/projects`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/` | Get all projects | Public |
| `GET` | `/id/:projectId` | Get project by ID | Public |
| `POST` | `/` | Create new project | Protected |
| `PATCH` | `/id/:projectId` | Update project | Protected |
| `DELETE` | `/id/:projectId` | Delete project | Protected |
| `GET` | `/my-projects` | Get logged in user's projects | Protected |

#### Project Object Structure
```json
{
  "title": "string",
  "description": "string",
  "tagline": "string",
  "skills": "string",
  "status": "draft | published",
  "category": "personal | professional | others",
  "links": ["string"],
  "tags": ["string"],
  "images": ["string"],
  "avatar": "string",
  "startDate": "Date",
  "endDate": "Date",
  "budget": "number",
  "contributors": ["string"],
  "views": "number",
  "likes": "number"
}
```

### 🏆 Achievements (`/api/v1/achievements`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/` | Get all achievements | Public |
| `GET` | `/id/:achievementId` | Get achievement by ID | Public |
| `POST` | `/` | Create new achievement | Protected |
| `PATCH` | `/id/:achievementId` | Update achievement | Protected |
| `DELETE` | `/id/:achievementId` | Delete achievement | Protected |
| `GET` | `/my-achievements` | Get logged in user's achievements | Protected |

### 🎓 Certifications (`/api/v1/certifications`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/` | Get all certifications | Public |
| `GET` | `/id/:certificationId` | Get certification by ID | Public |
| `POST` | `/` | Create new certification | Protected |
| `PATCH` | `/id/:certificationId` | Update certification | Protected |
| `DELETE` | `/id/:certificationId` | Delete certification | Protected |
| `GET` | `/my-certifications` | Get logged in user's certifications | Protected |

### 💪 Skills (`/api/v1/skills`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/` | Get all global skills | Public |
| `POST` | `/` | Create new skill | Protected |

### 🏅 Leaderboard (`/api/v1/leaderboard`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/` | Get leaderboard with filters & sort | Public |
| `POST` | `/sync` | Sync your own stats (CGPA, LeetCode, etc.) | Protected |

**Query params for `GET /leaderboard`:** `page`, `limit`, `sortBy` (e.g. `cgpa:desc`, `leetcode:desc`), `order`, `type` (Student \| Professional \| Other \| All), `search`; optional filters: `minCgpa`, `maxCgpa`, `minLeetcode`, `maxLeetcode`, `minCodeforces`, `maxCodeforces`, `minHackerrank`, `maxHackerrank`, `minLikes`, `credentialId`, `issuingOrganization`, `certificationName`, `institution`, `degree`, `fieldOfStudy`, `currentStudent`, `company`, `role`, `hasCurrentJob`, `achievementOrganization`, `achievementTitle`, `projectCategory`, `minPublishedProjects`, `hasResume`, `hasLocation`, `skillId`. Use `export=1` with higher `limit` (max 1000) for report exports.

## 🎨 Features in Detail

### Project Management
- Create and manage multiple projects
- Add multiple images and links to each project
- Categorize projects (Personal, Professional, Others)
- Track project status (Draft, Published)
- Add start/end dates, budget, and contributors
- View analytics (views, likes)

### Profile System
- Custom usernames and user IDs
- Social media links integration
- Resume upload capability
- Location tracking
- Professional title and bio

### Authentication
- Email/Password authentication with secure password hashing
- Google OAuth integration for quick sign-in
- JWT-based session management
- Protected routes for authenticated users

## 🗺 Roadmap

- [x] Advanced report download (filter by stats, certs, education, experience; CSV export)
- [x] Weekly leaderboard sync daemon (cron)
- [ ] Add comments system for projects
- [ ] Implement project sharing functionality
- [ ] Add search and filter capabilities
- [ ] Integrate analytics dashboard
- [ ] Implement dark/light mode toggle
- [ ] Add project collaboration features
- [ ] Mobile application
- [ ] Email notifications
- [ ] Advanced profile themes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Issues

Found a bug or have a feature request? Please open an issue [here](https://github.com/krishnakanthpathi/QueryPort/issues).

## 👨‍💻 Author

**Krishna Kanth Pathi**
- GitHub: [@krishnakanthpathi](https://github.com/krishnakanthpathi)
- Website: [query-port-brown.vercel.app](https://query-port-brown.vercel.app/)

## ⭐ Show Your Support

Give a ⭐️ if you like this project! 

---

Made with ❤️ by [Krishna Kanth Pathi](https://github.com/krishnakanthpathi)
