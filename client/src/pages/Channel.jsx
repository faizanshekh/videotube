import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import api from '../api/axios'
import { errorMessage } from '../utils/format'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import VideoCard from '../components/VideoCard'
import TweetCard from '../components/TweetCard'
import SubscribeButton from '../components/SubscribeButton'

const TABS = [
  { id: 'videos', label: 'Videos' },
  { id: 'tweets', label: 'Tweets' },
  { id: 'playlists', label: 'Playlists' },
]

export default function Channel() {
  const { username } = useParams()
  const { user } = useSelector((state) => state.auth)

  const [channel, setChannel] = useState(null)
  const [tab, setTab] = useState('videos')
  const [videos, setVideos] = useState([])
  const [tweets, setTweets] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [error, setError] = useState('')

  const isOwn = channel?._id === user?._id

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      setChannel(null)
      setTab('videos')
      try {
        const response = await api.get(`/users/c/${username}`)
        if (!cancelled) setChannel(response.data.data)
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Channel not found'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [username])

  const loadTab = useCallback(async () => {
    if (!channel?._id) return
    setTabLoading(true)
    setError('')
    try {
      if (tab === 'videos') {
        const response = await api.get('/videos', {
          params: { userId: channel._id, limit: 50 },
        })
        setVideos(response.data.data.docs || [])
      } else if (tab === 'tweets') {
        const response = await api.get(`/tweets/user/${channel._id}`)
        setTweets(response.data.data || [])
      } else {
        const response = await api.get(`/playlist/user/${channel._id}`)
        setPlaylists(response.data.data || [])
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not load content'))
    } finally {
      setTabLoading(false)
    }
  }, [channel?._id, tab])

  useEffect(() => {
    loadTab()
  }, [loadTab])

  const updateTweet = (updated) =>
    setTweets((current) =>
      current.map((tweet) => (tweet._id === updated._id ? updated : tweet)),
    )

  const removeTweet = (tweetId) =>
    setTweets((current) => current.filter((tweet) => tweet._id !== tweetId))

  if (loading) return <Spinner />

  if (error && !channel) {
    return (
      <EmptyState
        title="Channel not found"
        subtitle="This channel does not exist or was removed."
        action={
          <Link
            to="/"
            className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Back to home
          </Link>
        }
      />
    )
  }
  if (!channel) return null

  return (
    <div>
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="h-40 w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800">
          {channel.coverImage && (
            <img
              src={channel.coverImage}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="-mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-zinc-900 bg-zinc-800 sm:-mt-14 sm:h-28 sm:w-28">
            {channel.avatar && (
              <img
                src={channel.avatar}
                alt={channel.username}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{channel.fullName}</h1>
            <p className="text-sm text-zinc-400">@{channel.username}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {channel.subscribersCount?.toLocaleString()} subscribers •{' '}
              {channel.channelsSubscribedToCount?.toLocaleString()} subscribed
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isOwn ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2 text-sm font-semibold hover:bg-zinc-700"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            ) : (
              <SubscribeButton
                key={channel._id}
                channelId={channel._id}
                initialSubscribed={channel.isSubscribed}
                initialCount={channel.subscribersCount}
                onChange={(subscribed) =>
                  setChannel((current) => ({
                    ...current,
                    subscribersCount:
                      current.subscribersCount + (subscribed ? 1 : -1),
                    isSubscribed: subscribed,
                  }))
                }
              />
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-zinc-800">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === id
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {tabLoading ? (
        <Spinner />
      ) : tab === 'videos' ? (
        videos.length === 0 ? (
          <EmptyState
            title="No published videos"
            subtitle={
              isOwn
                ? 'Upload your first video to see it here.'
                : 'This channel has not published any videos yet.'
            }
            action={
              isOwn ? (
                <Link
                  to="/upload"
                  className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Upload video
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )
      ) : tab === 'tweets' ? (
        tweets.length === 0 ? (
          <EmptyState
            title="No tweets yet"
            subtitle={
              isOwn
                ? 'Share an update from the Tweets page.'
                : 'This channel has not posted any tweets.'
            }
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {tweets.map((tweet) => (
              <TweetCard
                key={tweet._id}
                tweet={tweet}
                onUpdate={updateTweet}
                onDelete={removeTweet}
              />
            ))}
          </div>
        )
      ) : playlists.length === 0 ? (
        <EmptyState
          title="No playlists"
          subtitle={
            isOwn
              ? 'Save videos into playlists from any watch page.'
              : 'This channel has no public playlists.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Link
              key={playlist._id}
              to={`/playlist/${playlist._id}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700"
            >
              <div className="flex gap-3">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {playlist.videos?.[0]?.thumbnail && (
                    <img
                      src={playlist.videos[0].thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
