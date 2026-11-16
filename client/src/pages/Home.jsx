import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import VideoCard from '../components/VideoCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { errorMessage } from '../utils/format'

const PAGE_SIZE = 12

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const page = Number(searchParams.get('page') || 1)

  const [videos, setVideos] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/videos', {
        params: { page, limit: PAGE_SIZE, query: query || undefined },
      })
      const data = response.data.data
      setVideos(data.docs || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(errorMessage(err, 'Could not load videos'))
    } finally {
      setLoading(false)
    }
  }, [page, query])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const goToPage = (nextPage) => {
    const params = {}
    if (query) params.q = query
    if (nextPage > 1) params.page = String(nextPage)
    setSearchParams(params)
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {query ? `Results for "${query}"` : 'Latest videos'}
        </h1>
        {query && (
          <button
            onClick={() => setSearchParams({})}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Clear search
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <Spinner />
      ) : videos.length === 0 ? (
        <EmptyState
          title={query ? 'No videos found' : 'No videos yet'}
          subtitle={
            query
              ? 'Try a different search term.'
              : 'Be the first to publish a video on VideoTube.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
