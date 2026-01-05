# TalentLayer Backend

This is the backend for the TalentLayer platform, built with Node.js, Express, and MongoDB.

## 🛠 Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js **v5.1.0**
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB URI

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment:
   Rename `.env.example` to `.env` and add your secrets:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
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

## ⚠️ Important Notes
- This project uses **Express 5**, which handles routing differently than Express 4.
  - Wildcard routes (`*`) must be named or handled via `app.use()`.
  - Proper error handling middleware is configured in `src/controllers/errorController.ts`.
