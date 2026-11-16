import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Play, Trash2 } from 'lucide-react'
import api from '../api/axios'
import { errorMessage, formatDuration, formatViews, timeAgo } from '../utils/format'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

export default function PlaylistDetail() {
  const { playlistId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchPlaylist = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/playlist/${playlistId}`)
      setPlaylist(response.data.data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load playlist'))
    } finally {
      setLoading(false)
    }
  }, [playlistId])

  useEffect(() => {
    fetchPlaylist()
  }, [fetchPlaylist])

  if (loading) return <Spinner />
  if (error && !playlist) {
    return (
      <EmptyState
        title="Playlist not found"
        subtitle="It may have been deleted."
        action={
          <Link
            to="/playlists"
            className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Back to playlists
          </Link>
        }
      />
    )
  }
  if (!playlist) return null

  const isOwn = playlist.owner?._id === user?._id
  const videos = playlist.videos || []

  const saveEdit = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const response = await api.patch(`/playlist/${playlist._id}`, {
        name: name.trim(),
        description: description.trim(),
      })
      setPlaylist(response.data.data)
      setEditing(false)
    } catch (err) {
      setError(errorMessage(err, 'Could not update playlist'))
    } finally {
      setBusy(false)
    }
  }

  const removeVideo = async (videoId) => {
    setError('')
    try {
      const response = await api.patch(
        `/playlist/remove/${videoId}/${playlist._id}`,
      )
      setPlaylist(response.data.data)
    } catch (err) {
      setError(errorMessage(err, 'Could not remove video'))
    }
  }

  const deletePlaylist = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await api.delete(`/playlist/${playlist._id}`)
      navigate('/playlists')
    } catch (err) {
      setError(errorMessage(err, 'Could not delete playlist'))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
              required
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={200}
              rows={2}
              className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{playlist.name}</h1>
                <p className="mt-1 text-sm text-zinc-400">
                  {playlist.description}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {videos.length} video{videos.length === 1 ? '' : 's'} • by{' '}
                  <Link
                    to={`/channel/${playlist.owner?.username}`}
                    className="text-zinc-300 hover:text-white"
                  >
                    {playlist.owner?.fullName}
                  </Link>
                  {timeAgo(playlist.createdAt) &&
                    ` • created ${timeAgo(playlist.createdAt)}`}
                </p>
              </div>
              {isOwn && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setName(playlist.name)
                      setDescription(playlist.description)
                      setEditing(true)
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold hover:bg-zinc-700"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={deletePlaylist}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg bg-red-950/60 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/60 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {videos.length === 0 ? (
        <EmptyState
          title="This playlist is empty"
          subtitle="Open any video and press Save to add it here."
        />
      ) : (
        <ul className="space-y-3">
          {videos.map((video, index) => (
            <li
              key={video._id}
              className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
            >
              <span className="w-6 shrink-0 pt-2 text-center text-sm text-zinc-500">
                {index + 1}
              </span>
              <Link
                to={`/watch/${video._id}`}
                className="relative block aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-zinc-800"
              >
                {video.thumbnail && (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-xs text-white">
                  {formatDuration(video.duration)}
                </span>
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/watch/${video._id}`}>
                  <h3 className="line-clamp-2 font-semibold hover:text-white">
                    {video.title}
                  </h3>
                </Link>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatViews(video.views)} views •{' '}
                  {timeAgo(video.createdAt)}
                </p>
                <div className="mt-2 flex gap-3">
                  <Link
                    to={`/watch/${video._id}`}
                    className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-400"
                  >
                    <Play className="h-3.5 w-3.5" /> Watch
                  </Link>
                  {isOwn && (
                    <button
                      onClick={() => removeVideo(video._id)}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
