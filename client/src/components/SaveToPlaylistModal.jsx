import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Check, ListPlus, X } from 'lucide-react'
import api from '../api/axios'
import { errorMessage } from '../utils/format'
import Spinner from './Spinner'

export default function SaveToPlaylistModal({ videoId, onClose }) {
  const { user } = useSelector((state) => state.auth)
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchPlaylists = useCallback(async () => {
    if (!user?._id) return
    setLoading(true)
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

  const containsVideo = (playlist) =>
    (playlist.videos || []).some((video) =>
      typeof video === 'object' ? video._id === videoId : video === videoId,
    )

  const toggleVideo = async (playlist) => {
    setBusy(true)
    setError('')
    try {
      const action = containsVideo(playlist) ? 'remove' : 'add'
      const response = await api.patch(
        `/playlist/${action}/${videoId}/${playlist._id}`,
      )
      setPlaylists((current) =>
        current.map((item) =>
          item._id === playlist._id ? response.data.data : item,
        ),
      )
    } catch (err) {
      setError(errorMessage(err, 'Could not update playlist'))
    } finally {
      setBusy(false)
    }
  }

  const createPlaylist = async (event) => {
    event.preventDefault()
    if (!name.trim() || !description.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const created = await api.post('/playlist', {
        name: name.trim(),
        description: description.trim(),
      })
      const playlist = created.data.data
      await api.patch(`/playlist/add/${videoId}/${playlist._id}`)
      setPlaylists((current) => [
        { ...playlist, videos: [videoId] },
        ...current,
      ])
      setName('')
      setDescription('')
      setCreating(false)
    } catch (err) {
      setError(errorMessage(err, 'Could not create playlist'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <ListPlus className="h-5 w-5 text-red-500" /> Save to playlist
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <Spinner className="h-6 w-6" />
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {playlists.length === 0 && (
              <li className="py-4 text-center text-sm text-zinc-500">
                No playlists yet — create one below.
              </li>
            )}
            {playlists.map((playlist) => (
              <li key={playlist._id}>
                <button
                  onClick={() => toggleVideo(playlist)}
                  disabled={busy}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-zinc-800 disabled:opacity-60"
                >
                  <span>
                    <span className="block font-medium text-zinc-100">
                      {playlist.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {(playlist.videos || []).length} video
                      {(playlist.videos || []).length === 1 ? '' : 's'}
                    </span>
                  </span>
                  {containsVideo(playlist) && (
                    <Check className="h-4 w-4 text-green-400" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {creating ? (
          <form onSubmit={createPlaylist} className="mt-4 space-y-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Playlist name"
              maxLength={60}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              required
            />
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              maxLength={200}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Create & save
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="mt-4 w-full rounded-lg border border-dashed border-zinc-700 py-2.5 text-sm text-zinc-300 hover:border-red-500 hover:text-red-400"
          >
            + New playlist
          </button>
        )}
      </div>
    </div>
  )
}
