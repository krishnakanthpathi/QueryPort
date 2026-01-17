# QueryPort Backend

This is the backend for the QueryPort platform, built with Node.js, Express, and MongoDB. It serves as a headless content management system for developer portfolios.

## 🛠 Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js **v5.1.0**
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT & Google OAuth

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB URI
- Google Cloud Console Project (for OAuth)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment:
   Rename `.env.example` to `.env` and add your secrets:
   ```env
   PORT=8888
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=5d
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

### Running the Server
- **Development**:
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  node dist/index.js
  ```

## 🔌 API Documentation

### Base URL
`/api/v1`

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/signup` | Register a new user | `{ name, username, email, password }` |
| `POST` | `/login` | Login with email/password | `{ email, password }` |
| `POST` | `/google` | Login with Google | `{ credential }` (Google ID Token) |

### 👤 Profile (`/api/v1/profile`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/:userId` | Get profile by User ID | **Public** |
| `GET` | `/u/:username` | Get profile by Username | **Public** |
| `GET` | `/me` | Get your own profile | **Protected** (Bearer Token) |
| `PATCH` | `/me` | Create/Update your profile | **Protected** (Bearer Token) |

#### Profile Object Structure
```json
{
  "bio": "String (Max 500 chars)",
  "title": "String (e.g. Full Stack Developer)",
  "locations": "String",
  "resume": "String (URL)",
  "socialLinks": [
    {
      "platform": "GitHub",
      "url": "https://github.com/..."
    }
  ]
}
```

## ⚠️ Important Notes
- This project uses **Express 5**.
- Password hashing uses `bcryptjs`.
- All errors follow the `JSend` specification:
  ```json
  {
    "status": "error" | "fail",
    "message": "Error description"
  }
  ```
