import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import { errorMessage } from '../utils/format'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import TweetCard from '../components/TweetCard'

export default function Tweets() {
  const { user } = useSelector((state) => state.auth)
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchTweets = useCallback(async () => {
    if (!user?._id) return
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/tweets/user/${user._id}`)
      setTweets(response.data.data || [])
    } catch (err) {
      setError(errorMessage(err, 'Could not load tweets'))
    } finally {
      setLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    fetchTweets()
  }, [fetchTweets])

  const createTweet = async (event) => {
    event.preventDefault()
    if (!content.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await api.post('/tweets', { content: content.trim() })
      const created = response.data.data
      setTweets((current) => [
        {
          ...created,
          owner: {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            avatar: user.avatar,
          },
          likesCount: 0,
          isLiked: false,
        },
        ...current,
      ])
      setContent('')
    } catch (err) {
      setError(errorMessage(err, 'Could not post tweet'))
    } finally {
      setBusy(false)
    }
  }

  const updateTweet = (updated) =>
    setTweets((current) =>
      current.map((tweet) => (tweet._id === updated._id ? updated : tweet)),
    )

  const removeTweet = (tweetId) =>
    setTweets((current) => current.filter((tweet) => tweet._id !== tweetId))

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Tweets</h1>

      <form
        onSubmit={createTweet}
        className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
      >
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          maxLength={280}
          className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {content.length}/280 characters
          </span>
          <button
            type="submit"
            disabled={busy || !content.trim()}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Posting...' : 'Tweet'}
          </button>
        </div>
      </form>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <Spinner />
      ) : tweets.length === 0 ? (
        <EmptyState
          title="No tweets yet"
          subtitle="Post your first tweet above."
        />
      ) : (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <TweetCard
              key={tweet._id}
              tweet={tweet}
              onUpdate={updateTweet}
              onDelete={removeTweet}
            />
          ))}
        </div>
      )}
    </div>
  )
}
