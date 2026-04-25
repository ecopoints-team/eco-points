export default function RewardsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4]/80 to-white/80">
      {/* Header skeleton */}
      <div className="fixed top-0 left-0 right-0 z-[999] h-16 skeleton-pulse rounded-none" />

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24">
        {/* User summary skeleton */}
        <div className="mt-4 mb-12">
          <div className="h-52 w-full skeleton-pulse rounded-[2rem]" />
        </div>

        {/* Hero text skeleton */}
        <div className="text-center mb-12 flex flex-col items-center gap-4">
          <div className="h-6 w-40 skeleton-pulse rounded-full" />
          <div className="h-14 w-[70%] max-w-lg skeleton-pulse" />
          <div className="h-5 w-[50%] max-w-md skeleton-pulse" />
        </div>

        {/* Search bar skeleton */}
        <div className="h-14 max-w-3xl mx-auto skeleton-pulse rounded-[2rem] mb-12" />

        {/* Product grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[420px] skeleton-pulse rounded-[2rem]" />
          ))}
        </div>
      </div>
    </div>
  );
}
