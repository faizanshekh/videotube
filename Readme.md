# VideoTube Node.js Backend

A learning project for building a video-platform REST API with Node.js, Express, MongoDB, and Mongoose. The repository follows the [Chai aur Code backend series](https://www.youtube.com/watch?v=EH3vGeqeIAo&list=PLu71SKxNbfoBGh_8p_NS-ZAh6v7HhYqHW).

## What’s in the project

- Express API organized into route, controller, model, middleware, and utility modules.
- User registration and login flows with bcrypt password hashing and JWT access/refresh tokens.
- Cookie and bearer-token authentication middleware.
- Multer upload handling and Cloudinary integration for media uploads.
- Route groups for users, videos, comments, likes, playlists, subscriptions, tweets, dashboard, and health checks.

This is a work in progress, not a production-ready service. Several controller actions are placeholders; for example, video listing, detail, update, delete, and publish-status handlers still need implementation. Check the controller TODOs before relying on an endpoint.

## Tech stack

- Node.js with ES modules
- Express
- MongoDB and Mongoose
- JSON Web Tokens and bcrypt
- Multer and Cloudinary

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

## API route groups

All routes are mounted under `/api/v1`.

| Prefix | Area |
| --- | --- |
| `/healthcheck` | Health check |
| `/users` | Registration, login, account, profile, and watch history |
| `/videos` | Video routes (some controller actions are unfinished) |
| `/comments` | Comment routes |
| `/likes` | Like routes |
| `/playlist` | Playlist routes |
| `/subscriptions` | Subscription routes |
| `/tweets` | Tweet routes |
| `/dashboard` | Dashboard routes |

Route presence does not guarantee that every handler is complete. Review the corresponding controller before using a route.

## Current limitations

- This repository is an educational project and has no production deployment or frontend included.
- Some API controller methods are unfinished.
- The package currently provides a development script only; there are no test or build scripts.
- External MongoDB and Cloudinary services are needed for their respective features.

## Learning resource

[Chai aur Code — Backend playlist](https://www.youtube.com/watch?v=EH3vGeqeIAo&list=PLu71SKxNbfoBGh_8p_NS-ZAh6v7HhYqHW)
