# VideoTube Node.js Backend

A learning project for building a video-platform REST API with Node.js, Express, MongoDB, and Mongoose. The repository follows the [Chai aur Code backend series](https://www.youtube.com/watch?v=EH3vGeqeIAo&list=PLu71SKxNbfoBGh_8p_NS-ZAh6v7HhYqHW).

## Current status

All planned controllers are implemented — there are no placeholder handlers left. Users, videos, comments, likes, playlists, subscriptions, tweets, and the channel dashboard all have working CRUD/action endpoints. The project is feature-complete for the scope of the tutorial series, but it is an educational codebase, not a production-ready service.

## What’s in the project

- Express API organized into route, controller, model, middleware, and utility modules.
- User registration and login flows with bcrypt password hashing and JWT access/refresh tokens.
- Cookie and bearer-token authentication middleware (`verifyJWT`).
- Multer upload handling and Cloudinary integration for avatars, cover images, thumbnails, and video files.
- Pagination via `mongoose-aggregate-paginate-v2` for video and comment listings.
- Aggregation pipelines for channel stats, watch history, and owner lookups.
- Consistent responses and errors through `ApiResponse`, `ApiError`, and `asyncHandler` helpers.
- Route groups for users, videos, comments, likes, playlists, subscriptions, tweets, dashboard, and health checks.

## Tech stack

- Node.js with ES modules
- Express
- MongoDB and Mongoose
- JSON Web Tokens and bcrypt
- Multer and Cloudinary
- `mongoose-aggregate-paginate-v2`

## Getting started

### Requirements

- Node.js and npm
- A MongoDB connection string
- Cloudinary credentials for media-upload flows

### Install

```bash
git clone https://github.com/faizanshekh/videotube-nodejs-backend.git
cd videotube-nodejs-backend
npm install
```

Create a `.env` file in the project root:

```env
PORT=8000
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

The application appends the database name `videotube` to `MONGODB_URI`. Keep your real credentials out of source control.

Start the development server:

```bash
npm run dev
```

The API listens on port `8000` by default. The health-check route is mounted at `/api/v1/healthcheck`.

## Project structure

```text
src/
├── app.js            # Express app, CORS, body parsing, route mounting
├── index.js          # Entry point, DB connect + server start
├── constants.js      # DB name constant
├── db/               # MongoDB connection
├── controllers/      # Request handlers per resource
├── routes/           # Route definitions per resource
├── middlewares/      # verifyJWT (auth) and Multer upload
├── models/           # Mongoose schemas (user, video, comment, like, playlist, subscription, tweet)
└── utils/            # ApiError, ApiResponse, asyncHandler, Cloudinary upload
```

## API reference

All routes are mounted under `/api/v1`. Routes marked **auth** require a valid JWT, sent as a bearer token or an `accessToken` cookie.

### Health check

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/healthcheck` | — | Service liveness check |

### Users — `/users`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/users/register` | — | Multipart: `avatar`, `coverImage` |
| POST | `/users/login` | — | Returns tokens |
| POST | `/users/logout` | auth | Clears refresh-token cookie |
| POST | `/users/refresh-token` | — | Issues a new access token |
| POST | `/users/change-password` | auth | |
| GET | `/users/current-user` | auth | |
| PATCH | `/users/update-account` | auth | |
| PATCH | `/users/avatar` | auth | Multipart: `avatar` |
| PATCH | `/users/cover-image` | auth | Multipart: `coverImage` |
| GET | `/users/c/:username` | auth | Channel profile with subscriber counts |
| GET | `/users/history` | auth | Watch history with populated videos |

### Videos — `/videos`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/videos` | auth | Query: `page`, `limit`, `query`, `sortBy`, `sortType`, `userId` |
| POST | `/videos` | auth | Multipart: `videoFile`, `thumbnail` |
| GET | `/videos/:videoId` | auth | Owner populated |
| PATCH | `/videos/:videoId` | auth | Owner only; optional multipart `thumbnail` |
| DELETE | `/videos/:videoId` | auth | Owner only |
| PATCH | `/videos/toggle/publish/:videoId` | auth | Owner only |

### Comments — `/comments`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/comments/:videoId` | auth | Paginated (`page`, `limit`) |
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
| GET | `/playlist/:playlistId` | auth | |
| PATCH | `/playlist/:playlistId` | auth | Owner only |
| DELETE | `/playlist/:playlistId` | auth | Owner only |
| PATCH | `/playlist/add/:videoId/:playlistId` | auth | Owner only |
| PATCH | `/playlist/remove/:videoId/:playlistId` | auth | Owner only |
| GET | `/playlist/user/:userId` | auth | |

### Subscriptions — `/subscriptions`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/subscriptions/c/:channelId` | auth | Toggle subscription |
| GET | `/subscriptions/c/:channelId` | auth | List of a channel’s subscribers |
| GET | `/subscriptions/u/:subscriberId` | auth | Channels the user is subscribed to |

### Tweets — `/tweets`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/tweets` | auth | |
| GET | `/tweets/user/:userId` | auth | |
| PATCH | `/tweets/:tweetId` | auth | Owner only |
| DELETE | `/tweets/:tweetId` | auth | Owner only |

### Dashboard — `/dashboard`

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/dashboard/stats` | auth | `totalVideos`, `totalViews`, `totalSubscribers`, `totalLikes` |
| GET | `/dashboard/videos` | auth | Current user’s videos |

## Current limitations

- This repository is an educational project with no production deployment or frontend.
- There are no automated tests, lint scripts, or build scripts — only the `npm run dev` development script.
- Deleting a video does not cascade-delete its comments and likes, and its files are not removed from Cloudinary (`deleteFromCloudinary` is only used when replacing a user’s avatar or cover image).
- External MongoDB and Cloudinary services are needed for their respective features.

## Learning resource

[Chai aur Code — Backend playlist](https://www.youtube.com/watch?v=EH3vGeqeIAo&list=PLu71SKxNbfoBGh_8p_NS-ZAh6v7HhYqHW)
