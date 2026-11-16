import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-6xl font-bold text-zinc-800">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-zinc-400">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
      >
        Back to home
      </Link>
    </div>
  )
}
