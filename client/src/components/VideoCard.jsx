import { Link } from 'react-router-dom'
import { formatDuration, formatViews, timeAgo } from '../utils/format'

export default function VideoCard({ video }) {
  const owner = video.owner

  return (
    <div className="group flex flex-col gap-2">
      <Link
        to={`/watch/${video._id}`}
        className="relative block aspect-video overflow-hidden rounded-xl bg-zinc-900"
      >
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            No thumbnail
          </div>
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.duration)}
        </span>
      </Link>

      <div className="flex gap-3">
        {owner && (
          <Link
            to={`/channel/${owner.username}`}
            className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-800"
          >
            {owner.avatar && (
              <img
                src={owner.avatar}
                alt={owner.username}
                className="h-full w-full object-cover"
              />
            )}
          </Link>
        )}
        <div className="min-w-0">
          <Link to={`/watch/${video._id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100 hover:text-white">
              {video.title}
            </h3>
          </Link>
          {owner && (
            <Link
              to={`/channel/${owner.username}`}
              className="mt-1 block truncate text-xs text-zinc-400 hover:text-zinc-200"
            >
              {owner.fullName}
            </Link>
          )}
          <p className="text-xs text-zinc-500">
            {formatViews(video.views)} views • {timeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
