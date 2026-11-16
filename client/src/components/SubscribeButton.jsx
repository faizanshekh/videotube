import { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import api from '../api/axios'
import { errorMessage } from '../utils/format'

export default function SubscribeButton({
  channelId,
  initialSubscribed = false,
  initialCount = 0,
  onChange,
}) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await api.post(`/subscriptions/c/${channelId}`)
      const next = !subscribed
      setSubscribed(next)
      setCount((current) => current + (next ? 1 : -1))
      onChange?.(next)
    } catch (err) {
      setError(errorMessage(err, 'Could not update subscription'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={toggle}
        disabled={busy}
        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          subscribed
            ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {subscribed ? (
          <>
            <BellRing className="h-4 w-4" /> Subscribed
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" /> Subscribe
          </>
        )}
      </button>
      <p className="text-right text-xs text-zinc-500">
        {count.toLocaleString()} subscriber{count === 1 ? '' : 's'}
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
