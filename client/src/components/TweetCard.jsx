import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Heart, Pencil, Trash2 } from 'lucide-react'
import api from '../api/axios'
import { errorMessage, timeAgo } from '../utils/format'

export default function TweetCard({ tweet, onUpdate, onDelete }) {
  const { user } = useSelector((state) => state.auth)
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(tweet.content)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const isOwn = tweet.owner?._id === user?._id

  const toggleLike = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await api.post(`/likes/toggle/t/${tweet._id}`)
      onUpdate?.({
        ...tweet,
        isLiked: !tweet.isLiked,
        likesCount: (tweet.likesCount || 0) + (tweet.isLiked ? -1 : 1),
      })
    } catch (err) {
      setError(errorMessage(err, 'Could not update like'))
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    if (!content.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await api.patch(`/tweets/${tweet._id}`, {
        content: content.trim(),
      })
      onUpdate?.(response.data.data)
      setEditing(false)
    } catch (err) {
      setError(errorMessage(err, 'Could not update tweet'))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await api.delete(`/tweets/${tweet._id}`)
      onDelete?.(tweet._id)
    } catch (err) {
      setError(errorMessage(err, 'Could not delete tweet'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={`/channel/${tweet.owner?.username}`}
            className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-800"
          >
            {tweet.owner?.avatar && (
              <img
                src={tweet.owner.avatar}
                alt={tweet.owner.username}
                className="h-full w-full object-cover"
              />
            )}
          </Link>
          <div className="min-w-0">
            <Link
              to={`/channel/${tweet.owner?.username}`}
              className="block truncate text-sm font-semibold hover:text-white"
            >
              {tweet.owner?.fullName}
            </Link>
            <p className="text-xs text-zinc-500">
              @{tweet.owner?.username} • {timeAgo(tweet.createdAt)}
            </p>
          </div>
        </div>
        {isOwn && !editing && (
          <div className="flex gap-1">
            <button
              onClick={() => {
                setContent(tweet.content)
                setEditing(true)
              }}
              aria-label="Edit tweet"
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={remove}
              aria-label="Delete tweet"
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={saveEdit} className="mt-3">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            maxLength={280}
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !content.trim()}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-200">
          {tweet.content}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={toggleLike}
          disabled={busy}
          className={`flex items-center gap-1.5 text-sm ${
            tweet.isLiked
              ? 'text-red-500'
              : 'text-zinc-500 hover:text-red-400'
          }`}
        >
          <Heart
            className="h-4 w-4"
            fill={tweet.isLiked ? 'currentColor' : 'none'}
          />
          {tweet.likesCount || 0}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </article>
  )
}
