export default function Spinner({ className = 'h-8 w-8' }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        className={`${className} animate-spin rounded-full border-2 border-zinc-700 border-t-red-500`}
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
