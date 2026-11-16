import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  LayoutDashboard,
  ListVideo,
  LogOut,
  MessageSquare,
  Search,
  Upload,
  User,
} from 'lucide-react'
import { logout } from '../store/slices/authSlice'

const navLinks = [
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/playlists', label: 'Playlists', icon: ListVideo },
  { to: '/tweets', label: 'Tweets', icon: MessageSquare },
]

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useSelector((state) => state.auth)

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    setSearch(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleSearch = (event) => {
    event.preventDefault()
    navigate(search.trim() ? `/?q=${encodeURIComponent(search.trim())}` : '/')
  }

  const handleLogout = async () => {
    setMenuOpen(false)
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 font-bold text-white">
            V
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:block">
            VideoTube
          </span>
        </Link>

        <form
          onSubmit={handleSearch}
          className="mx-auto flex w-full max-w-md items-center"
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search videos..."
            className="h-10 w-full rounded-l-lg border border-zinc-700 bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex h-10 w-12 items-center justify-center rounded-r-lg border border-l-0 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 text-sm font-semibold text-white hover:border-red-500"
            aria-label="Account menu"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl">
              <div className="border-b border-zinc-800 px-4 py-3">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.fullName}
                </p>
                <p className="truncate text-xs text-zinc-400">
                  @{user?.username}
                </p>
              </div>
              <Link
                to={`/channel/${user?.username}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                <User className="h-4 w-4" /> Your channel
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
