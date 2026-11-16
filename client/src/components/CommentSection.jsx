import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'
import api from '../api/axios'
import { errorMessage, timeAgo } from '../utils/format'
import Spinner from './Spinner'
import EmptyState from './EmptyState'

export default function CommentSection({ videoId }) {
  const { user } = useSelector((state) => state.auth)

  const [comments, setComments] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async (pageNumber) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/comments/${videoId}`, {
        params: { page: pageNumber, limit: 10 },
      })
      const data = response.data.data
      setComments(data.docs || [])
      setPage(data.page || 1)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(errorMessage(err, 'Could not load comments'))
    } finally {
      setLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    fetchComments(1)
  }, [fetchComments])

  const addComment = async (event) => {
    event.preventDefault()
    if (!content.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const response = await api.post(`/comments/${videoId}`, {
        content: content.trim(),
      })
      const created = response.data.data
      setComments((current) => [
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
      setError(errorMessage(err, 'Could not post comment'))
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (commentId) => {
    setError('')
    try {
      await api.delete(`/comments/c/${commentId}`)
      setComments((current) => current.filter((c) => c._id !== commentId))
    } catch (err) {
      setError(errorMessage(err, 'Could not delete comment'))
    }
  }

  const toggleLike = async (commentId) => {
    setError('')
    try {
      await api.post(`/likes/toggle/c/${commentId}`)
      setComments((current) =>
        current.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likesCount: comment.likesCount + (comment.isLiked ? -1 : 1),
              }
            : comment,
        ),
      )
    } catch (err) {
      setError(errorMessage(err, 'Could not update like'))
    }
  }

  return (
    <section className="mt-6">
      <h2 className="mb-4 text-lg font-semibold">Comments</h2>

      <form onSubmit={addComment} className="mb-6 flex gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-800">
          {user?.avatar && (
            <img
              src={user.avatar}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add a comment..."
            maxLength={1000}
            className="w-full border-b border-zinc-700 bg-transparent pb-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setContent('')}
              disabled={!content.trim()}
              className="rounded-full px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <Spinner />
      ) : comments.length === 0 ? (
        <EmptyState
          title="No comments yet"
          subtitle="Be the first to share what you think."
        />
      ) : (
        <ul className="space-y-5">
          {comments.map((comment) => {
            const isOwn = comment.owner?._id === user?._id
            return (
              <li key={comment._id} className="flex gap-3">
                <Link
                  to={`/channel/${comment.owner?.username}`}
                  className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-800"
                >
                  {comment.owner?.avatar && (
                    <img
                      src={comment.owner.avatar}
                      alt={comment.owner.username}
                      className="h-full w-full object-cover"
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200">
                      @{comment.owner?.username}
                    </span>{' '}
                    • {timeAgo(comment.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">
                    {comment.content}
                  </p>
                  <div className="mt-1.5 flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(comment._id)}
                      className={`flex items-center gap-1 text-xs ${
                        comment.isLiked
                          ? 'text-red-500'
                          : 'text-zinc-500 hover:text-red-400'
                      }`}
                    >
                      <Heart
                        className="h-3.5 w-3.5"
                        fill={comment.isLiked ? 'currentColor' : 'none'}
                      />
                      {comment.likesCount || 0}
                    </button>
                    {isOwn && (
                      <button
                        onClick={() => deleteComment(comment._id)}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => fetchComments(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="flex items-center px-2 text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchComments(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  )
}
