import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, Image as ImageIcon, Upload as UploadIcon } from 'lucide-react'
import api from '../api/axios'
import { errorMessage } from '../utils/format'

export default function Upload() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [videoPreviewName, setVideoPreviewName] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleVideo = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreviewName(file.name)
  }

  const handleThumbnail = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')

    if (!videoFile) {
      setError('Please choose a video file')
      return
    }
    if (!thumbnail) {
      setError('Please choose a thumbnail image')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('videoFile', videoFile)
      formData.append('thumbnail', thumbnail)

      const response = await api.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate(`/watch/${response.data.data._id}`)
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'))
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Upload a video</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
      >
        <div>
          <label
            htmlFor="videoFile"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Video file *
          </label>
          <label
            htmlFor="videoFile"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 px-4 py-8 text-center hover:border-red-500"
          >
            <Film className="h-8 w-8 text-zinc-500" />
            <span className="text-sm text-zinc-300">
              {videoPreviewName || 'Click to choose a video'}
            </span>
            <span className="text-xs text-zinc-500">
              MP4, WebM or MOV — uploaded to Cloudinary
            </span>
          </label>
          <input
            id="videoFile"
            type="file"
            accept="video/*"
            onChange={handleVideo}
            className="hidden"
            required
          />
        </div>

        <div>
          <label
            htmlFor="thumbnail"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Thumbnail *
          </label>
          <label
            htmlFor="thumbnail"
            className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-zinc-700 px-4 py-4 hover:border-red-500"
          >
            <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-950">
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-zinc-600" />
              )}
            </div>
            <span className="text-sm text-zinc-300">
              {thumbnail ? thumbnail.name : 'Click to choose a thumbnail'}
            </span>
          </label>
          <input
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={handleThumbnail}
            className="hidden"
            required
          />
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Title *
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Give your video a catchy title"
            maxLength={100}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tell viewers about your video"
            rows={5}
            maxLength={5000}
            required
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          <UploadIcon className="h-4 w-4" />
          {submitting ? 'Uploading to Cloudinary...' : 'Publish video'}
        </button>
      </form>
    </div>
  )
}
