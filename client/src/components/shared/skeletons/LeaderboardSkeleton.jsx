export default function LeaderboardSkeleton() {
  const Bone = ({ className }) => (
    <div className={`bg-emerald-100/80 animate-pulse rounded-lg ${className}`} />
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #d1fae5 0%, #f0fdf4 40%)" }}>
      {/* ── Pill nav skeleton ── */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-[1200px]">
        <div className="bg-white/80 backdrop-blur rounded-3xl px-4 md:px-6 py-3 flex justify-between items-center shadow-sm">
          <Bone className="h-10 w-32" />
          <Bone className="h-7 w-36" />
          <Bone className="h-10 w-36 rounded-full" />
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="pt-28 pb-16 px-4 sm:px-6 max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-4 gap-8">

          {/* ── Main (3 cols) ── */}
          <div className="lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">

            {/* Podium card */}
            <div className="bg-emerald-50 rounded-[40px] px-6 sm:px-12 pt-10 pb-0 overflow-hidden border border-emerald-100">
              {/* Title */}
              <div className="flex flex-col items-center gap-3 mb-10">
                <Bone className="h-10 w-56" />
                <Bone className="h-4 w-40" />
              </div>

              {/* Podium stands — 2nd | 1st | 3rd */}
              <div className="flex items-end justify-center gap-6 h-[300px] sm:h-[380px]">
                {/* 2nd */}
                <div className="flex flex-col items-center gap-3 w-24 sm:w-32">
                  <Bone className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
                  <Bone className="h-4 w-20" />
                  <Bone className="h-4 w-16" />
                  <Bone className="w-full h-24 rounded-t-2xl mt-auto" />
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center gap-3 w-28 sm:w-36">
                  <Bone className="w-5 h-7" />
                  <Bone className="w-20 h-20 sm:w-28 sm:h-28 rounded-full" />
                  <Bone className="h-4 w-24" />
                  <Bone className="h-4 w-20" />
                  <Bone className="w-full h-36 rounded-t-2xl mt-auto" />
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center gap-3 w-24 sm:w-32">
                  <Bone className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
                  <Bone className="h-4 w-20" />
                  <Bone className="h-4 w-16" />
                  <Bone className="w-full h-16 rounded-t-2xl mt-auto" />
                </div>
              </div>
            </div>

            {/* Filter row */}
            <div className="flex gap-2 items-center">
              <Bone className="h-10 flex-1" />
              <Bone className="h-10 w-48" />
              <Bone className="h-10 w-52" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] border border-emerald-100 overflow-hidden">
              {/* Header */}
              <div className="flex gap-4 px-8 py-5 border-b border-emerald-100">
                <Bone className="h-3 w-10" />
                <Bone className="h-3 w-20" />
                <Bone className="h-3 w-32 ml-auto mr-auto" />
                <Bone className="h-3 w-16 ml-auto" />
              </div>
              {/* Rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-8 py-4 border-b border-emerald-50 last:border-none">
                  <Bone className="h-8 w-8 rounded-full shrink-0" />
                  <Bone className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Bone className="h-3.5 w-32" />
                    <Bone className="h-2.5 w-20" />
                  </div>
                  <Bone className="h-3.5 w-40 hidden md:block" />
                  <Bone className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Sidebar (1 col) ── */}
          <div className="relative order-1 lg:order-2 lg:col-span-1 flex flex-col gap-6">
            {/* Standing card */}
            <div className="bg-gradient-to-b from-emerald-400/60 to-emerald-600/60 rounded-[40px] p-6 h-52 animate-pulse" />
            {/* Points card */}
            <div className="bg-white rounded-[40px] border border-emerald-100 p-6 flex flex-col gap-3">
              <Bone className="h-8 w-8 rounded-lg" />
              <Bone className="h-3 w-32" />
              <Bone className="h-8 w-24" />
              <Bone className="h-3 w-48" />
            </div>
            {/* Rewards card */}
            <div className="bg-white rounded-[40px] border border-emerald-100 p-6 flex flex-col gap-3">
              <Bone className="h-8 w-8 rounded-lg" />
              <Bone className="h-3 w-28" />
              <Bone className="h-8 w-16" />
              <Bone className="h-3 w-44" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
