import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Heart, ListPlus } from 'lucide-react'
import api from '../api/axios'
import { errorMessage, formatViews, timeAgo } from '../utils/format'
import Spinner from '../components/Spinner'
import CommentSection from '../components/CommentSection'
import SubscribeButton from '../components/SubscribeButton'
import SaveToPlaylistModal from '../components/SaveToPlaylistModal'

export default function Watch() {
  const { videoId } = useParams()
  const { user } = useSelector((state) => state.auth)

  const [video, setVideo] = useState(null)
  const [channel, setChannel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likeBusy, setLikeBusy] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)

  const fetchVideo = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/videos/${videoId}`)
      const videoData = response.data.data
      setVideo(videoData)

      // Channel profile carries the subscription state for the button
      if (videoData.owner?.username) {
        try {
          const channelResponse = await api.get(
            `/users/c/${videoData.owner.username}`,
          )
          setChannel(channelResponse.data.data)
        } catch {
          setChannel(null)
        }
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not load video'))
    } finally {
      setLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    fetchVideo()
    window.scrollTo(0, 0)
  }, [fetchVideo])

  const toggleLike = async () => {
    if (likeBusy || !video) return
    setLikeBusy(true)
    try {
      await api.post(`/likes/toggle/v/${videoId}`)
      setVideo((current) => ({
        ...current,
        isLiked: !current.isLiked,
        likesCount: current.likesCount + (current.isLiked ? -1 : 1),
      }))
    } catch (err) {
      setError(errorMessage(err, 'Could not update like'))
    } finally {
      setLikeBusy(false)
    }
  }

  if (loading) return <Spinner />
  if (error && !video) {
    return (
      <p className="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-400">
        {error}
      </p>
    )
  }
  if (!video) return null

  const owner = video.owner
  const isOwnChannel = owner?._id === user?._id

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="overflow-hidden rounded-xl bg-black">
            <video
              key={video._id}
              className="aspect-video w-full"
              controls
              poster={video.thumbnail || undefined}
              src={video.videoFile}
            />
          </div>

          <h1 className="mt-4 text-xl font-bold leading-snug">{video.title}</h1>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              {formatViews(video.views)} views • {timeAgo(video.createdAt)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLike}
                disabled={likeBusy}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
                  video.isLiked
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                }`}
              >
                <Heart
                  className="h-4 w-4"
                  fill={video.isLiked ? 'currentColor' : 'none'}
                />
                {video.likesCount || 0}
              </button>
              <button
                onClick={() => setSaveOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
              >
                <ListPlus className="h-4 w-4" /> Save
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-zinc-900 p-4">
            <Link
              to={`/channel/${owner?.username}`}
              className="flex min-w-0 items-center gap-3"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                {owner?.avatar && (
                  <img
                    src={owner.avatar}
                    alt={owner.username}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{owner?.fullName}</p>
                <p className="truncate text-xs text-zinc-400">
                  @{owner?.username}
                </p>
              </div>
            </Link>
            {!isOwnChannel && owner && channel && (
              <SubscribeButton
                key={owner._id}
                channelId={channel._id}
                initialSubscribed={channel.isSubscribed}
                initialCount={channel.subscribersCount}
              />
            )}
          </div>

          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-900 p-4 text-sm text-zinc-300">
            {video.description}
          </div>

          <CommentSection videoId={video._id} />
        </div>

        <aside className="hidden lg:block">
          <h2 className="mb-3 font-semibold text-zinc-300">Up next</h2>
          <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
            Browse the home feed for more videos.
          </p>
          <Link
            to="/"
            className="mt-3 block rounded-xl bg-zinc-900 p-4 text-center text-sm font-medium text-red-500 hover:bg-zinc-800"
          >
            Back to home feed
          </Link>
        </aside>
      </div>

      {saveOpen && (
        <SaveToPlaylistModal
          videoId={video._id}
          onClose={() => setSaveOpen(false)}
        />
      )}
    </div>
  )
}
