export default function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header skeleton */}
      <div className="fixed top-0 left-0 right-0 z-[999] h-16 skeleton-pulse rounded-none" style={{ background: "linear-gradient(90deg, #1b4332 25%, #2a5c34 50%, #1b4332 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />

      <div className="pt-16 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          {/* Podium skeleton */}
          <div className="flex justify-center items-end gap-4 mb-12 pt-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full skeleton-pulse" />
              <div className="h-24 w-20 skeleton-pulse rounded-t-xl" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full skeleton-pulse" />
              <div className="h-32 w-24 skeleton-pulse rounded-t-xl" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full skeleton-pulse" />
              <div className="h-20 w-20 skeleton-pulse rounded-t-xl" />
            </div>
          </div>

          {/* List skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 w-full skeleton-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
