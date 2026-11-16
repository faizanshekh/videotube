import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Image as ImageIcon, User } from 'lucide-react'
import { clearError, register } from '../store/slices/authSlice'

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector((state) => state.auth)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
  })
  const [avatar, setAvatar] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const avatarInputRef = useRef(null)
  const coverInputRef = useRef(null)

  useEffect(() => {
    dispatch(clearError())
    return () => dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/', { replace: true })
    }
  }, [status, navigate])

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    },
    [avatarPreview],
  )

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleAvatar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)

    const formData = new FormData()
    formData.append('fullName', form.fullName.trim())
    formData.append('email', form.email.trim())
    formData.append('username', form.username.trim())
    formData.append('password', form.password)
    if (avatar) formData.append('avatar', avatar)
    if (coverImage) formData.append('coverImage', coverImage)

    await dispatch(register(formData))
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-2xl font-bold text-white">
            V
          </span>
          <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Join VideoTube to upload and interact
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-zinc-600 bg-zinc-950 text-zinc-500 hover:border-red-500"
              title="Choose avatar"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="mx-auto h-6 w-6" />
              )}
            </button>
            <div className="text-sm text-zinc-400">
              <p className="font-medium text-zinc-200">Profile photo *</p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="mt-1 flex items-center gap-1 text-red-500 hover:text-red-400"
              >
                <Camera className="h-3.5 w-3.5" /> Upload avatar
              </button>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="mt-1 flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
              >
                <ImageIcon className="h-3.5 w-3.5" />{' '}
                {coverImage ? 'Cover selected' : 'Add cover image'}
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              className="hidden"
            />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => setCoverImage(event.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Jane Doe"
              maxLength={60}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="janedoe"
                maxLength={30}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-red-500 hover:text-red-400"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
