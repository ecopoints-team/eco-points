export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950">
      {/* Header skeleton */}
      <div className="fixed top-0 left-0 right-0 z-[999] h-16 skeleton-pulse rounded-none" style={{ background: "linear-gradient(90deg, #1b4332 25%, #2a5c34 50%, #1b4332 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />

      <div className="pt-24 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Avatar and info skeleton */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-24 h-24 rounded-full skeleton-pulse" />
          <div className="h-8 w-48 skeleton-pulse" />
          <div className="h-4 w-32 skeleton-pulse" />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 skeleton-pulse rounded-2xl" />
          ))}
        </div>

        {/* Activity list skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 w-full skeleton-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
