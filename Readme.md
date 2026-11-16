# VideoTube — MERN Video Platform

A full-stack YouTube-style video platform built with the **MERN stack** (MongoDB, Express, React, Node.js) — a REST API backend with a complete React frontend.

## Highlights

- Full CRUD REST API for videos, comments, likes, playlists, subscriptions, tweets, and channel analytics
- JWT authentication with access/refresh tokens, httpOnly cookies, and automatic token refresh on the client
- Media uploads (video, thumbnail, avatar, cover image) via Multer + Cloudinary
- React 19 frontend with Redux Toolkit, protected/guest routes, and a dark YouTube-style UI
- Express-validator request validation, centralized JSON error handling, and aggregation pipelines for feeds/stats
- In-memory MongoDB smoke suite (`npm run smoke`) covering auth, validation, and every major resource

## Tech stack

**Backend** — Node.js (ES modules), Express, MongoDB, Mongoose, JSON Web Tokens, bcrypt, Multer, Cloudinary, express-validator

**Frontend** — React 19, Vite, Redux Toolkit, React Router, Axios, Tailwind CSS 4, lucide-react

## Features

### Backend

- Registration/login with bcrypt hashing and JWT access/refresh tokens (httpOnly cookies + bearer header)
- Route guards (`verifyJWT`) and ownership checks on update/delete actions
- Paginated, searchable video feed with aggregation pipelines (`mongoose-aggregate-paginate-v2`)
- Video publishing flow: multipart upload → Cloudinary → MongoDB, publish/draft toggle, view counting
- Comments with per-comment like counts, likes on videos/comments/tweets, playlists, subscriptions, tweets
- Channel stats dashboard (videos, views, subscribers, likes)
- express-validator validation on auth/content routes, centralized error middleware (ApiError, Mongoose, and malformed-JSON errors → consistent JSON)

### Frontend

| Page | Route | What it does |
| --- | --- | --- |
| Login / Register | `/login`, `/register` | Auth forms with auto-login after signup |
| Home feed | `/` | Search, paginated video grid |
| Watch | `/watch/:videoId` | Player, like, save-to-playlist, subscribe, comments |
| Upload | `/upload` | Multipart publish flow with previews |
| Channel | `/channel/:username` | Cover/avatar, subscribe, Videos / Tweets / Playlists tabs |
| Playlists | `/playlists`, `/playlist/:id` | Create, rename, delete, add/remove videos |
| Tweets | `/tweets` | Compose, edit, delete, like |
| Dashboard | `/dashboard` | Channel stats + video table (edit, publish toggle, delete) |

Auth handling: Redux Toolkit session restore on load, axios interceptor that attaches the bearer token and transparently refreshes it on 401, protected vs guest-only routes.

## Project structure

```text
├── src/                    # Express API
│   ├── controllers/        # Route handlers per resource
│   ├── routes/             # Route definitions + validation wiring
│   ├── middlewares/        # auth, multer, validation, error handler
│   ├── models/             # Mongoose schemas
│   ├── validators/         # express-validator chains
│   ├── utils/              # ApiError, ApiResponse, asyncHandler, Cloudinary
│   ├── db/                 # MongoDB connection
│   ├── app.js              # Express app + route mounting
│   └── index.js            # Entry point
├── scripts/smoke.js        # End-to-end smoke test (in-memory MongoDB)
└── client/                 # React app
    └── src/
        ├── api/            # Axios instance + token refresh interceptor
        ├── store/          # Redux Toolkit store + auth slice
        ├── components/     # Navbar, VideoCard, CommentSection, ...
        ├── pages/          # Route-level pages
        └── utils/          # Formatting helpers
```

## Getting started

### Requirements

- Node.js 18+ and npm
- MongoDB (local or Atlas connection string)
- Cloudinary credentials for media uploads

### Install

```bash
git clone https://github.com/faizanshekh/videotube.git
cd videotube
npm install
npm install --prefix client
```

Create a `.env` in the project root (see `.env.sample`):

```env
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017
ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

The API appends the database name `videotube` to `MONGODB_URI`. Keep real credentials out of source control.

### Run

Start both servers together (API on `:8000`, frontend on `:5173` with `/api` proxied to the API):

```bash
npm run dev:all
```

Or separately:

```bash
npm run dev          # API only
npm run dev:client   # React only
```

Open http://localhost:5173, register an account, and publish a video.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev:all` | Run API + frontend together |
| `npm run dev` | API with nodemon |
| `npm run dev:client` | Vite dev server |
| `npm run build:client` | Production build of the React app |
| `npm start` | Run the API without nodemon |
| `npm run smoke` | End-to-end API smoke test (in-memory MongoDB) |
| `npm run format` | Prettier format for `src/` |

## API reference

All routes are mounted under `/api/v1`. Routes marked **auth** require a JWT (bearer header or `accessToken` cookie).

### Health check

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/healthcheck` | — | Service liveness check |

### Users — `/users`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/users/register` | — | Multipart: `avatar` (required), `coverImage` |
| POST | `/users/login` | — | Accepts username and/or email + password; returns tokens |
| POST | `/users/logout` | auth | Clears auth cookies |
| POST | `/users/refresh-token` | — | Cookie or body refresh token → new tokens |
| POST | `/users/change-password` | auth | |
| GET | `/users/current-user` | auth | |
| PATCH | `/users/update-account` | auth | |
| PATCH | `/users/avatar` | auth | Multipart: `avatar` |
| PATCH | `/users/cover-image` | auth | Multipart: `coverImage` |
| GET | `/users/c/:username` | auth | Channel profile: subscriber counts + `isSubscribed` |
| GET | `/users/history` | auth | Watch history with populated videos |

### Videos — `/videos`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/videos` | auth | Query: `page`, `limit`, `query`, `sortBy`, `sortType`, `userId`; published only |
| POST | `/videos` | auth | Multipart: `videoFile`, `thumbnail` |
| GET | `/videos/:videoId` | auth | Owner populated, `likesCount`, `isLiked`, increments `views` |
| PATCH | `/videos/:videoId` | auth | Owner only; optional multipart `thumbnail` |
| DELETE | `/videos/:videoId` | auth | Owner only |
| PATCH | `/videos/toggle/publish/:videoId` | auth | Owner only |

### Comments — `/comments`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/comments/:videoId` | auth | Paginated; owner, `likesCount`, `isLiked` per comment |
| POST | `/comments/:videoId` | auth | |
| PATCH | `/comments/c/:commentId` | auth | Owner only |
| DELETE | `/comments/c/:commentId` | auth | Owner only |

### Likes — `/likes`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/likes/toggle/v/:videoId` | auth | Toggle video like |
| POST | `/likes/toggle/c/:commentId` | auth | Toggle comment like |
| POST | `/likes/toggle/t/:tweetId` | auth | Toggle tweet like |
| GET | `/likes/videos` | auth | Videos liked by the current user |

### Playlists — `/playlist`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/playlist` | auth | Create playlist |
| GET | `/playlist/:playlistId` | auth | Owner + videos populated |
| PATCH | `/playlist/:playlistId` | auth | Owner only |
| DELETE | `/playlist/:playlistId` | auth | Owner only |
| PATCH | `/playlist/add/:videoId/:playlistId` | auth | Owner only |
| PATCH | `/playlist/remove/:videoId/:playlistId` | auth | Owner only |
| GET | `/playlist/user/:userId` | auth | |

### Subscriptions — `/subscriptions`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/subscriptions/c/:channelId` | auth | Toggle subscription |
| GET | `/subscriptions/c/:channelId` | auth | Subscribers of a channel |
| GET | `/subscriptions/u/:subscriberId` | auth | Channels the user is subscribed to |

### Tweets — `/tweets`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/tweets` | auth | Max 280 characters |
| GET | `/tweets/user/:userId` | auth | Owner populated, `likesCount`, `isLiked` |
| PATCH | `/tweets/:tweetId` | auth | Owner only |
| DELETE | `/tweets/:tweetId` | auth | Owner only |

### Dashboard — `/dashboard`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/dashboard/stats` | auth | `totalVideos`, `totalViews`, `totalSubscribers`, `totalLikes` |
| GET | `/dashboard/videos` | auth | Own videos including drafts |

## Testing

```bash
npm run smoke
```

Boots the API against an in-memory MongoDB and runs 26 checks covering health, the JSON 404/error handler, validation failures, login/refresh/logout, bearer auth, the video feed, likes, comments, tweets, playlists, subscriptions, channel profiles, and dashboard stats.

## Current limitations

- Educational project — no production deployment or HTTPS termination; Cloudinary credentials are required for registration/uploads.
- No automated frontend tests; the client is verified with `npm run lint` and `npm run build`.
- Deleting a video does not cascade-delete its comments and likes, and its files are not removed from Cloudinary (`deleteFromCloudinary` is only used when replacing a user's avatar or cover image).
