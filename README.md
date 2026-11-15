# JobConnect India

A full-stack recruitment platform built with React, Express, MongoDB, and Socket.IO. It supports job discovery and applications, employer candidate pipelines, interview scheduling, scorecards, offer letters, and in-app notifications.

## Requirements

- Node.js 18 or newer
- MongoDB, either running locally on port 27017 or available through `MONGO_URI`

## Local development

Install frontend dependencies in the project root and backend dependencies in `server/`:

```bash
npm install
cd server
npm install
cd ..
```

Create `server/.env` as needed:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/jobconnect
JWT_SECRET=replace-with-a-long-random-secret
# Optional; omit to simulate email delivery in development.
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
EMAIL_FROM=JobConnect India <your_email@gmail.com>
```

Set `REACT_APP_API_URL` in a root `.env` when the API is hosted somewhere other than `http://localhost:5000/api`.

Start MongoDB first. Then run the API and frontend in separate terminals:

```bash
cd server
npm start
```

```bash
npm start
```

Alternatively, `npm run start:all` launches the API and frontend and attempts to start MongoDB when it is not already running. If `mongod` is not at the default Windows install location, set `MONGOD_PATH` to its executable path before running the launcher. The database files are stored under `server/data/db/` and are ignored by Git.

- Frontend: http://localhost:3000/job-board-platform
- API health: http://localhost:5000/api/health
- Default MongoDB URI: `mongodb://127.0.0.1:27017/jobconnect`

## Seed accounts

On an empty database, the backend seeds demo accounts. Change or remove these credentials before deploying with a shared or public database.

| Role | Email | Password |
|---|---|---|
| Job seeker | `thorato384@gmail.com` | `password123` |
| Employer | `priya@techcorp.in` | `employer123` |
| Administrator | `admin@jobconnect.in` | `admin123` |

## Production configuration

Set `JWT_SECRET` to a long, randomly generated secret in every production API and Socket.IO process. The server refuses to start in production if it is missing. Configure `MONGO_URI` for the production database, and set `REACT_APP_API_URL` to the deployed API URL when building the frontend. Never commit `.env` files or production credentials.

## Project layout

- `src/`: React app, pages, components, contexts, and API clients
- `server/`: Express API, Mongoose models, routes, middleware, and Socket.IO services
- `start-dev.js`: Local multi-service development launcher
