# AI-based-Career-and-Skill-Gap-analyzer
Swipegen additional project

# AI-Based Career and Skill Gap Analyzer

An AI-powered career guidance application designed to help users explore career paths, assess their current skills, identify skill gaps, and plan their learning journey.

> **Project status:** Initial development setup is complete. The React frontend, Express backend, and local MongoDB connection have been configured. User-profile features and AI-powered analysis are planned next.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Run the Application](#run-the-application)
- [Verify the Backend API](#verify-the-backend-api)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Planned Features](#planned-features)
- [Security Notes](#security-notes)
- [License](#license)

## Overview

The goal of this project is to help users make informed career decisions by comparing their existing skills with the skills required for a target role. The planned application will collect user education, experience, skills, and career interests, then use AI to provide personalized guidance.

Planned capabilities include:

- User profiles containing education, experience, skills, and career interests
- Career-role exploration
- Skill-gap identification
- Personalized learning recommendations
- AI-generated career guidance using the Gemini API

These are planned features and may not be available in the current version.

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React, TypeScript, Vite | User interface and frontend development server |
| Backend | Node.js, Express | REST API and application logic |
| Database | MongoDB Community Server (local) | Data storage |
| Database integration | Mongoose | Connects the Node.js backend to MongoDB and defines schemas |
| Middleware | CORS, Express JSON middleware | Enables cross-origin development requests and JSON request parsing |
| Configuration | dotenv | Loads backend environment variables from `.env` |
| Development utility | Nodemon | Restarts the backend when files change |
| Planned AI integration | Google Gemini API | AI-powered career and skill-gap guidance |

## Project Structure

```text
AI-based-Career-and-Skill-Gap-analyzer/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── node_modules/       # Created by npm install; do not commit
├── .gitignore              # Recommended at the project root
└── README.md
```

Your Vite-generated frontend may contain additional configuration files. The `node_modules` directories are installed locally and should not be committed to version control.

## Prerequisites

- **Node.js and npm.** Use a supported Node.js LTS version. Check installed versions with `node -v` and `npm -v`.
- **MongoDB Community Server** running locally.
- **MongoDB Compass** (optional GUI for inspecting databases and collections).
- **Visual Studio Code** or another code editor.

MongoDB Compass is a graphical client; it is not the database server itself. The local MongoDB server must be installed and running separately.

## Installation and Setup

### 1. Clone or open the project

If the project is already on your computer, open its root folder in VS Code. Otherwise, clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd AI-based-Career-and-Skill-Gap-analyzer
```

Replace `<repository-url>` with the actual repository URL. If you have not created a remote repository, simply open your existing project folder instead.

### 2. Set up the frontend

The frontend was created with Vite's React + TypeScript template.

If the `frontend` directory already exists, install its dependencies:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Vite prints the local development URL in the terminal, commonly `http://localhost:5173`. Open the exact URL shown in your terminal.

Keep this terminal running while you work on the frontend.

To create a production build:

```bash
npm run build
```

Return to the project root before following the backend steps, or open a second terminal in VS Code.

### 3. Set up the backend

Open a new VS Code terminal and move into the backend directory from the project root:

```bash
cd backend
```

If you have not initialized the backend yet, run:

```bash
npm init -y
```

Install the backend dependencies:

```bash
npm install express mongoose cors dotenv
npm install -D nodemon
```

In `backend/package.json`, ensure the top-level `"type"` property is set to `"module"` so the backend can use ES module imports:

```json
"type": "module"
```

Ensure the `scripts` section contains:

```json
"scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

Do not add a second `"type"` property. Keep the rest of your `package.json` fields and installed dependency versions.

The backend entry point is `backend/server.js`. It should load environment variables, configure Express and CORS, define the `/` and `/api/health` test routes, connect to MongoDB through Mongoose, and start listening on the configured port.

### 4. Configure environment variables

Create a file named `.env` inside the `backend` directory:

```text
backend/.env
```

Add the following local-development configuration:

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/career_skill_analyzer
```

Save the file. The MongoDB URI points to a local MongoDB server and uses the `career_skill_analyzer` database. MongoDB creates the database when data is first written; it may not appear in Compass until a collection or document exists.

The backend should load these variables using:

```javascript
import dotenv from "dotenv";

dotenv.config();
```

And connect to MongoDB using Mongoose:

```javascript
await mongoose.connect(process.env.MONGODB_URI);
```

**Important:** `.env` belongs in the backend, not in the frontend. Never expose your MongoDB connection string or future Gemini API key in frontend code.

### 5. Start MongoDB

On Windows:

1. Open the Windows Services application by pressing `Win + R`, entering `services.msc`, and pressing Enter.
2. Find the MongoDB service.
3. Confirm that its status is **Running**. If it is stopped, start it if you have permission.
4. Optionally open MongoDB Compass and connect to:

```text
mongodb://127.0.0.1:27017
```

The backend can connect directly to the local MongoDB server; connecting through Compass first is not required.

If your local MongoDB server uses a different port or requires authentication, update `MONGODB_URI` accordingly.

## Run the Application

Run the frontend and backend in **two separate terminals**.

### Terminal 1: Backend

From the project root:

```bash
cd backend
npm run dev
```

When the configuration is correct and MongoDB is running, the terminal should display messages similar to:

```text
MongoDB connected successfully!
Server is running on http://localhost:5000
```

The exact log text depends on your `server.js` implementation.

### Terminal 2: Frontend

From the project root:

```bash
cd frontend
npm run dev
```

Open the URL printed by Vite, commonly `http://localhost:5173`.

Both development servers need to remain running while you use the application. Press `Ctrl + C` in a terminal to stop its server.

## Verify the Backend API

The current test endpoint is:

```http
GET http://localhost:5000/api/health
```

Open this URL in a browser:

[http://localhost:5000/api/health](http://localhost:5000/api/health)

A successful response should look similar to:

```json
{
  "success": true,
  "message": "Career and Skill Gap Analyzer API is running!"
}
```

The root URL `http://localhost:5000/` may display a welcome message if the `/` route has been added to `server.js`. If only `/api/health` is defined, visiting `/` can return `Cannot GET /`; that does not necessarily mean the API is broken.

## Environment Variables

| Variable | Description | Local development value |
|---|---|---|
| `PORT` | Port used by the Express server | `5000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/career_skill_analyzer` |
| `GEMINI_API_KEY` | Planned API key for Gemini integration | Add when AI integration is implemented |

Do not add a Gemini API key until you need it. When you do, store it in the backend `.env` file and read it only from backend code.

## Troubleshooting

### `npm error Missing script: "dev"`

- Confirm that the terminal is inside the `backend` directory.
- Check that `backend/package.json` contains `"dev": "nodemon server.js"` inside `"scripts"`.
- Save `package.json`, then run `npm run` to list available scripts.

### `mongoose is not defined`

Ensure `server.js` contains this import:

```javascript
import mongoose from "mongoose";
```

Also confirm that `mongoose` is installed in the backend by running `npm install mongoose` from the `backend` directory.

### MongoDB connection fails

- Confirm that the MongoDB Windows service is running.
- Verify the `MONGODB_URI` value in `backend/.env`.
- Ensure `dotenv.config()` runs before the connection is attempted.
- If MongoDB uses authentication or a non-default port, use the appropriate URI.

### `Cannot GET /`

This means Express does not have a matching route for `/`. Test the defined health endpoint at `http://localhost:5000/api/health`, or add a root route in `server.js`.

### Port 5000 is already in use

Stop the other process using that port, or change `PORT` in `backend/.env`. Restart the backend after changing environment variables.

### Nodemon says `clean exit`

Check that `server.js` calls `app.listen(...)` and that the file was saved. If the server is intended to wait for MongoDB first, check the connection error printed in the terminal.

## Planned Features

- [ ] Create a Mongoose user-profile model
- [ ] Add API routes to create and retrieve user profiles
- [ ] Connect the React frontend to the Express API
- [ ] Add education, experience, skills, and career-goal forms
- [ ] Implement career-role and skill-gap analysis
- [ ] Integrate the Gemini API securely on the backend
- [ ] Add validation, error handling, and automated tests
- [ ] Improve authentication and authorization
- [ ] Prepare production deployment configuration

## Security Notes

- Add `.env` to `.gitignore` so credentials are not committed.
- Ignore `node_modules/` in Git.
- Never put database credentials or the Gemini API key in frontend code.
- Do not commit secrets to GitHub. If a secret is accidentally exposed, rotate it.
- The local MongoDB URI in this README is for development only. Production deployments should use appropriately secured configuration and database access controls.
- Configure CORS with the intended frontend origin before deploying publicly.

Example `.gitignore` entries (place these in the root `.gitignore`, or the appropriate backend ignore file):

```gitignore
node_modules/
.env
dist/
```

## License

Choose and add a license before distributing the project publicly. If the repository uses the MIT License, include a `LICENSE` file containing the standard MIT License text and update this section accordingly.
