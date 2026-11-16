// End-to-end smoke test: boots the API against an in-memory MongoDB and
// exercises auth, validation, and the main resource routes.
// Run with: npm run smoke
import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"

const results = []
let failed = 0

const check = (name, condition, detail = "") => {
    results.push({ name, ok: Boolean(condition), detail })
    if (!condition) failed += 1
    console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`)
}

const main = async () => {
    const mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri().replace(/\/+$/, "")

    process.env.NODE_ENV = "test"
    process.env.PORT = "0"
    process.env.CORS_ORIGIN = "http://localhost:5173"
    process.env.MONGODB_URI = uri
    process.env.ACCESS_TOKEN_SECRET = "test-access-secret-that-is-long-enough"
    process.env.ACCESS_TOKEN_EXPIRY = "15m"
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-that-is-long-enough"
    process.env.REFRESH_TOKEN_EXPIRY = "7d"

    const { default: connectDB } = await import("../src/db/index.js")
    await connectDB()

    const { app } = await import("../src/app.js")
    const { User } = await import("../src/models/user.model.js")
    const { Video } = await import("../src/models/video.model.js")

    const server = app.listen(0)
    await new Promise((resolve) => server.once("listening", resolve))
    const base = `http://127.0.0.1:${server.address().port}/api/v1`

    const request = async (path, { method = "GET", token, body, headers = {} } = {}) => {
        const response = await fetch(`${base}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        })
        let json = null
        try {
            json = await response.json()
        } catch {
            // non-JSON response
        }
        return { status: response.status, json }
    }

    try {
        // --- health check & error handler ---
        const health = await request("/healthcheck")
        check("healthcheck returns 200", health.status === 200 && health.json?.success === true)

        const missing = await request("/no-such-route")
        check(
            "unknown route returns JSON 404",
            missing.status === 404 && missing.json?.success === false,
            missing.json?.message,
        )

        // --- validation ---
        const invalidRegister = await request("/users/register", {
            method: "POST",
            body: { fullName: "", email: "not-an-email", username: "x", password: "short" },
        })
        check(
            "register rejects invalid input with 400 + errors[]",
            invalidRegister.status === 400 &&
                invalidRegister.json?.success === false &&
                Array.isArray(invalidRegister.json?.errors) &&
                invalidRegister.json.errors.length > 0,
            `${invalidRegister.json?.errors?.length} validation errors`,
        )

        // --- seed a user directly (avatar upload needs Cloudinary) ---
        const user = await User.create({
            fullName: "Test User",
            username: "testuser",
            email: "test@example.com",
            password: "password123",
            avatar: "https://example.com/avatar.png",
        })

        const badLogin = await request("/users/login", {
            method: "POST",
            body: { username: "testuser", email: "test@example.com", password: "wrongpass" },
        })
        check("login rejects bad password with 401", badLogin.status === 401)

        const login = await request("/users/login", {
            method: "POST",
            body: { username: "testuser", email: "test@example.com", password: "password123" },
        })
        const accessToken = login.json?.data?.accessToken
        const refreshToken = login.json?.data?.refreshToken
        check(
            "login returns user + tokens",
            login.status === 200 && Boolean(accessToken) && Boolean(refreshToken) &&
                login.json?.data?.user?.username === "testuser",
        )

        // --- auth middleware ---
        const noAuth = await request("/users/current-user")
        check("protected route rejects missing token with 401", noAuth.status === 401)

        const me = await request("/users/current-user", { token: accessToken })
        check(
            "current-user works with bearer token",
            me.status === 200 && me.json?.data?.username === "testuser",
        )

        const refreshed = await request("/users/refresh-token", {
            method: "POST",
            body: { refreshToken },
        })
        check(
            "refresh-token issues new tokens",
            refreshed.status === 200 && Boolean(refreshed.json?.data?.accessToken),
        )

        // --- videos ---
        const video = await Video.create({
            title: "Smoke test video",
            description: "A video created by the smoke test",
            videoFile: "https://example.com/video.mp4",
            thumbnail: "https://example.com/thumb.png",
            duration: 42,
            owner: user._id,
            isPublished: true,
        })

        const feed = await request("/videos", { token: accessToken })
        check(
            "video feed returns published videos with owner",
            feed.status === 200 &&
                feed.json?.data?.docs?.length === 1 &&
                feed.json.data.docs[0].owner?.username === "testuser",
        )

        const detail = await request(`/videos/${video._id}`, { token: accessToken })
        check(
            "video detail includes likesCount/isLiked and counts a view",
            detail.status === 200 &&
                detail.json?.data?.likesCount === 0 &&
                detail.json?.data?.isLiked === false &&
                detail.json?.data?.views === 1,
            `views=${detail.json?.data?.views}`,
        )

        const like = await request(`/likes/toggle/v/${video._id}`, {
            method: "POST",
            token: accessToken,
        })
        check("toggle video like returns 201", like.status === 201)

        const detailAfterLike = await request(`/videos/${video._id}`, { token: accessToken })
        check(
            "video detail reflects the like",
            detailAfterLike.json?.data?.likesCount === 1 &&
                detailAfterLike.json?.data?.isLiked === true,
        )

        // --- comments ---
        const comment = await request(`/comments/${video._id}`, {
            method: "POST",
            token: accessToken,
            body: { content: "Nice video!" },
        })
        check("add comment returns 201", comment.status === 201)

        const comments = await request(`/comments/${video._id}`, { token: accessToken })
        const firstComment = comments.json?.data?.docs?.[0]
        check(
            "comment list includes owner, likesCount and isLiked",
            comments.status === 200 &&
                firstComment?.owner?.username === "testuser" &&
                firstComment?.likesCount === 0 &&
                firstComment?.isLiked === false,
        )

        const badComment = await request(`/comments/${video._id}`, {
            method: "POST",
            token: accessToken,
            body: { content: "" },
        })
        check("empty comment rejected with 400", badComment.status === 400)

        // --- tweets ---
        const tweet = await request("/tweets", {
            method: "POST",
            token: accessToken,
            body: { content: "Hello from the smoke test!" },
        })
        check("create tweet returns 201", tweet.status === 201)

        const tweets = await request(`/tweets/user/${user._id}`, { token: accessToken })
        check(
            "tweet list includes owner + likesCount",
            tweets.status === 200 &&
                tweets.json?.data?.[0]?.owner?.username === "testuser" &&
                tweets.json?.data?.[0]?.likesCount === 0,
        )

        const badTweet = await request("/tweets", {
            method: "POST",
            token: accessToken,
            body: { content: "x".repeat(281) },
        })
        check("over-length tweet rejected with 400", badTweet.status === 400)

        // --- playlists ---
        const playlist = await request("/playlist", {
            method: "POST",
            token: accessToken,
            body: { name: "Favorites", description: "My favorite videos" },
        })
        check("create playlist returns 201", playlist.status === 201)
        const playlistId = playlist.json?.data?._id

        const added = await request(`/playlist/add/${video._id}/${playlistId}`, {
            method: "PATCH",
            token: accessToken,
        })
        check(
            "video added to playlist",
            added.status === 200 &&
                (added.json?.data?.videos || []).some((id) => String(id) === String(video._id)),
        )

        const playlists = await request(`/playlist/user/${user._id}`, { token: accessToken })
        check("playlist list returns the playlist", playlists.status === 200 && playlists.json?.data?.length === 1)

        // --- subscriptions & channel profile ---
        const otherUser = await User.create({
            fullName: "Other User",
            username: "otheruser",
            email: "other@example.com",
            password: "password123",
            avatar: "https://example.com/other.png",
        })

        const subscribe = await request(`/subscriptions/c/${otherUser._id}`, {
            method: "POST",
            token: accessToken,
        })
        check("subscribe returns 201", subscribe.status === 201)

        const channel = await request("/users/c/otheruser", { token: accessToken })
        check(
            "channel profile includes subscriber counts + isSubscribed",
            channel.status === 200 &&
                channel.json?.data?.subscribersCount === 1 &&
                channel.json?.data?.isSubscribed === true,
        )

        // --- dashboard ---
        const stats = await request("/dashboard/stats", { token: accessToken })
        check(
            "dashboard stats aggregates videos/views/subscribers/likes",
            stats.status === 200 &&
                stats.json?.data?.totalVideos === 1 &&
                stats.json?.data?.totalViews >= 2 &&
                stats.json?.data?.totalLikes === 1,
            JSON.stringify(stats.json?.data),
        )

        const channelVideos = await request("/dashboard/videos", { token: accessToken })
        check(
            "dashboard videos returns own videos incl. drafts",
            channelVideos.status === 200 && channelVideos.json?.data?.length === 1,
        )

        // --- logout ---
        const logout = await request("/users/logout", { method: "POST", token: accessToken })
        check("logout returns 200", logout.status === 200)
    } catch (error) {
        failed += 1
        console.error("SMOKE TEST CRASHED:", error)
    } finally {
        server.close()
        await mongoose.disconnect()
        await mongod.stop()
    }

    console.log(`\n${results.length - failed}/${results.length} checks passed`)
    process.exit(failed === 0 ? 0 : 1)
}

main()
