import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  Heart,
  Pencil,
  Trash2,
  Upload,
  Users,
  Video as VideoIcon,
} from 'lucide-react'
import api from '../api/axios'
import { errorMessage, formatViews, timeAgo } from '../utils/format'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

const statCards = [
  { key: 'totalVideos', label: 'Total videos', icon: VideoIcon },
  { key: 'totalViews', label: 'Total views', icon: Eye },
  { key: 'totalSubscribers', label: 'Subscribers', icon: Users },
  { key: 'totalLikes', label: 'Likes on videos', icon: Heart },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsResponse, videosResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/videos'),
      ])
      setStats(statsResponse.data.data)
      setVideos(videosResponse.data.data || [])
    } catch (err) {
      setError(errorMessage(err, 'Could not load dashboard'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const startEdit = (video) => {
    setEditingId(video._id)
    setEditTitle(video.title)
    setEditDescription(video.description)
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    if (busy || !editingId) return
    setBusy(true)
    setError('')
    try {
      const response = await api.patch(`/videos/${editingId}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      })
      const updated = response.data.data
      setVideos((current) =>
        current.map((video) => (video._id === editingId ? updated : video)),
      )
      setEditingId(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not update video'))
    } finally {
      setBusy(false)
    }
  }

  const togglePublish = async (video) => {
    setBusy(true)
    setError('')
    try {
      const response = await api.patch(`/videos/toggle/publish/${video._id}`)
      const updated = response.data.data
      setVideos((current) =>
        current.map((item) => (item._id === video._id ? updated : item)),
      )
    } catch (err) {
      setError(errorMessage(err, 'Could not update publish status'))
    } finally {
      setBusy(false)
    }
  }

  const deleteVideo = async (video) => {
    if (!window.confirm(`Delete "${video.title}"? This cannot be undone.`)) {
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.delete(`/videos/${video._id}`)
      setVideos((current) => current.filter((item) => item._id !== video._id))
      setStats((current) =>
        current ? { ...current, totalVideos: current.totalVideos - 1 } : current,
      )
    } catch (err) {
      setError(errorMessage(err, 'Could not delete video'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Channel dashboard</h1>
        <Link
          to="/upload"
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Upload className="h-4 w-4" /> Upload video
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-center gap-2 text-zinc-400">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                {label}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {stats ? (stats[key] ?? 0).toLocaleString() : '—'}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold">Your videos</h2>

      {videos.length === 0 ? (
        <EmptyState
          title="No videos yet"
          subtitle="Upload your first video to see it here."
          action={
            <Link
              to="/upload"
              className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Upload video
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {videos.map((video) => (
                <Fragment key={video._id}>
                  <tr className="bg-zinc-950/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-zinc-800">
                          {video.thumbnail && (
                            <img
                              src={video.thumbnail}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/watch/${video._id}`}
                            className="block max-w-xs truncate font-medium hover:text-white"
                          >
                            {video.title}
                          </Link>
                          <p className="max-w-xs truncate text-xs text-zinc-500">
                            {video.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {formatViews(video.views)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          video.isPublished
                            ? 'bg-green-950/60 text-green-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {video.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {timeAgo(video.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => startEdit(video)}
                          aria-label="Edit"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => togglePublish(video)}
                          disabled={busy}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {video.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => deleteVideo(video)}
                          disabled={busy}
                          aria-label="Delete"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === video._id && (
                    <tr>
                      <td colSpan={5} className="bg-zinc-900 px-4 py-4">
                        <form onSubmit={saveEdit} className="space-y-3">
                          <input
                            value={editTitle}
                            onChange={(event) => setEditTitle(event.target.value)}
                            maxLength={100}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                            placeholder="Title"
                            required
                          />
                          <textarea
                            value={editDescription}
                            onChange={(event) =>
                              setEditDescription(event.target.value)
                            }
                            rows={3}
                            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                            placeholder="Description"
                            required
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={busy}
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Save changes
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
