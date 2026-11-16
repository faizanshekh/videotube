import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ListVideo, Trash2 } from 'lucide-react'
import api from '../api/axios'
import { errorMessage } from '../utils/format'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

export default function Playlists() {
  const { user } = useSelector((state) => state.auth)
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchPlaylists = useCallback(async () => {
    if (!user?._id) return
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/playlist/user/${user._id}`)
      setPlaylists(response.data.data || [])
    } catch (err) {
      setError(errorMessage(err, 'Could not load playlists'))
    } finally {
      setLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  const createPlaylist = async (event) => {
    event.preventDefault()
    if (!name.trim() || !description.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await api.post('/playlist', {
        name: name.trim(),
        description: description.trim(),
      })
      setPlaylists((current) => [response.data.data, ...current])
      setName('')
      setDescription('')
      setShowForm(false)
    } catch (err) {
      setError(errorMessage(err, 'Could not create playlist'))
    } finally {
      setBusy(false)
    }
  }

  const deletePlaylist = async (playlistId) => {
    setError('')
    try {
      await api.delete(`/playlist/${playlistId}`)
      setPlaylists((current) =>
        current.filter((playlist) => playlist._id !== playlistId),
      )
    } catch (err) {
      setError(errorMessage(err, 'Could not delete playlist'))
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your playlists</h1>
        <button
          onClick={() => setShowForm((open) => !open)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          {showForm ? 'Cancel' : '+ New playlist'}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={createPlaylist}
          className="mb-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Playlist name"
            maxLength={60}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            maxLength={200}
            rows={2}
            required
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Creating...' : 'Create playlist'}
          </button>
        </form>
      )}

      {playlists.length === 0 ? (
        <EmptyState
          title="No playlists yet"
          subtitle="Create a playlist to organize videos, or save one from any watch page."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <Link to={`/playlist/${playlist._id}`} className="flex gap-3">
                <div className="flex h-16 w-24 shrink-0 items-center justify-center gap-0.5 overflow-hidden rounded-lg bg-zinc-800">
                  {playlist.videos
                    ?.slice(0, 3)
                    .map(
                      (video) =>
                        video.thumbnail && (
                          <img
                            key={video._id}
                            src={video.thumbnail}
                            alt=""
                            className="h-full w-1/3 object-cover"
                          />
                        ),
                    )}
                  {(!playlist.videos || playlist.videos.length === 0) && (
                    <ListVideo className="h-6 w-6 text-zinc-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold group-hover:text-white">
                    {playlist.name}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {playlist.videos?.length || 0} video
                    {(playlist.videos?.length || 0) === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                    {playlist.description}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => deletePlaylist(playlist._id)}
                aria-label="Delete playlist"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 opacity-0 hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
