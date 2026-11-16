export default function EmptyState({ title, subtitle, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-16 text-center">
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      {subtitle && <p className="max-w-md text-sm text-zinc-400">{subtitle}</p>}
      {action}
    </div>
  )
}
