import {
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  AwardIcon,
  FlameIcon,
  Key,
  LeafIcon,
  MedalIcon,
  PencilIcon,
  QrCodeIcon,
  Sparkle,
  SparkleIcon,
  Star,
  StarHalfIcon,
  University,
  UniversityIcon,
  UserIcon,
} from "lucide-react";

import CalendarHeatmap from "react-calendar-heatmap";

export default function ProfileSection() {
  const headerSummary = [
    {
      title: "Current Balance",
      icon: <SparkleIcon className="w-4 h-4 fill-amber-400" />,
      points: "1,650",
      pointDetail: "EP",
    },
    {
      title: "Total Impact",
      icon: <LeafIcon className="w-4 h-4 fill-emerald-400" />,
      points: "10,350",
      pointDetail: "Bottles",
    },
    {
      title: "Total Streak",
      icon: <FlameIcon className="w-4 h-4 fill-amber-400" />,
      points: "13",
      pointDetail: "Days",
    },
  ];

  const recentActivity = [
    {
      icon: <ArrowUpRight />,
      title: "5 Big Bottles Recycled",
      date: "March 29, 2026",
      status: "Completed",
      points: "+25",
    },
    {
      icon: <ArrowUpRight />,
      title: "5 Small Bottles Recycled",
      date: "April 04, 2026",
      status: "Completed",
      points: "+15",
    },
    {
      icon: <ArrowDownLeft />,
      title: "EcoPoints Canvas Bag",
      date: "April 06, 2026",
      status: "Claimed",
      points: "+1350",
    },
    {
      icon: <ArrowUpRight />,
      title: "10 Big Bottles Recycled",
      date: "April 10, 2026",
      status: "Completed",
      points: "+50",
    },
    {
      icon: <ArrowUpRight />,
      title: "10 Small Bottles Recycled",
      date: "April 16, 2026",
      status: "Completed",
      points: "+30",
    },
  ];
  return (
    <section className="">
      {/* ROOT DIV */}
      <div className="grid grid-cols-4 gap-4 bg-slate-200 p-4">
        {/* USER INFORMATION (CREDENTIALS) SECTION */}
        <div className="grid gap-4">
          <div className="col-span-1 grid grid-row-3 rounded-xl gap-2 bg-slate-50">
            {/* USERNAME & ICON*/}
            <div className="justify-self-center p-6">
              <div className="w-20 h-20 md:w-40 md:h-40 rounded-full bg-slate-200 justify-items-center">
                <div className="p-2 md:p-4">
                  <UserIcon className="w-15 h-15 md:w-30 md:h-30" />
                </div>
              </div>
            </div>
            {/* USER DETAILS */}
            <div className="justify-items-center">
              <div className="my-2 justify-items-center">
                <div className="text-2xl lg:text-4xl font-medium">NAME</div>
                <div className="text-sm lg:text-md">@username</div>
              </div>
            </div>
            {/* BUTTON FOR USER DETAILS */}
            <div className="group justify-items-center">
              <button className="flex p-2 w-3/5 gap-4 place-content-center bg-green-200 rounded-lg cursor-pointer">
                <PencilIcon className="w-10 h-10 md:w-6 md:w-6 transition-transform duration-300 ease-in group-hover:text-base group-hover:scale-120 group-hover:-translate-x-2" />
                <p className="text-sm md:text-md font-medium place-content-center">
                  Edit Profile
                </p>
              </button>
            </div>
            {/* USER ROLES & OTHER DETAILS */}
            <div className="justify-self-center p-2">
              <div className="grid grid-row-2 gap-4">
                {/* ROLE */}
                <div className="flex group">
                  <div className="flex gap-2 bg-emerald-400 rounded-s-full w-full p-2">
                    <div className="p-2 rounded-full bg-slate-200">
                      <UserIcon className="h-6 w-6 md:h-8 md:w-8 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-4" />
                    </div>
                    <div className="content-center">
                      <p className="text-xs font-normal">role</p>
                      <p className="text-sm font-semibold">Student</p>
                    </div>
                  </div>
                </div>
                {/* UNIVERSITY */}
                <div className="flex group">
                  <div className="flex gap-2 bg-emerald-400 rounded-s-full w-full p-2">
                    <div className="p-2 rounded-full bg-slate-200">
                      <UniversityIcon className="h-6 w-6 md:h-8 md:w-8 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-4" />
                    </div>
                    <div className="content-center">
                      <p className="text-xs font-normal">Institution</p>
                      <p className="text-sm font-semibold">
                        Polytechnic University of the Philippines
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* LEADERBOARD RANK, PERSONAL QR CODE & OTHER DETAILS */}
          {/* LEADERBOARD RANK */}
          <div className="relative group p-2 rounded-lg grid gap-2 bg-emerald-900 overflow-hidden">
            <div className="">
              <p className="text-lg font-black text-emerald-200">Campus Rank</p>
            </div>
            <div className="">
              <p className="text-4xl font-bold text-emerald-200">TOP #12</p>
              <p className="text-xs font-medium text-emerald-50">
                out of 10,000 recyclers
              </p>
            </div>
            <div className="">
              <p className="text-sm font-medium text-emerald-200">
                Highest Attained Rank: TOP #12
              </p>
            </div>
            <AwardIcon className="absolute text-amber-400 -right-4 -top-6 w-15 h-15 md:w-25 md:h-25 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-translate-x-2 group-hover:translate-y-4" />
          </div>
          {/* OTHER DETAILS (IF MAGDADAGDAG) */}
          <div className="relative group p-2 rounded-lg bg-emerald-900 overflow-hidden">
            <div>
              <p className="text-lg font-black text-emerald-200">
                All Time Streak
              </p>
            </div>
            <div>
              <p className="text-4xl font-medium text-emerald-200">15 Days</p>
              <FlameIcon className="absolute text-amber-400 -right-3 -top-10 w-15 h-15 md:w-25 md:h-25 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-translate-x-2 group-hover:translate-y-4" />
            </div>
          </div>
          {/* PERSONAL QR CODE */}
          <div className="group grid grid-row-2 rounded-lg bg-emerald-400 ">
            <button className="p-2 cursor-pointer">
              <QrCodeIcon className="w-10 h-10 md:w-12 md:h-12 justify-self-center transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-4" />
              <p className="text-md font-medium justify-self-center">
                Show Personal QR
              </p>
            </button>
          </div>
        </div>
        {/* USER SUMMARY (ECO-POINTS) SECTION*/}
        <div className="col-span-3 p-2">
          {/* TOP SECTION (Balance, Streak, Summary) */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg">
            {/* FIRST COL */}
            {headerSummary.map((headerSummary, key) => (
              <div className="bg-slate-200 p-4 rounded-lg">
                <div className="grid grid-row-3 rounded-lg">
                  {/* HEADER */}
                  <div className="flex gap-2">
                    {/* ICON */}
                    <div className="p-2 bg-green-50 text-emerald-900 rounded-full">
                      {headerSummary.icon}
                    </div>
                    {/* TITLE */}
                    <h1 className="text-md font-medium text-emerald-900 place-self-center">
                      {headerSummary.title}
                    </h1>
                  </div>
                  {/* POINTS */}
                  <div className="flex gap-2">
                    <h1 className="text-4xl font-black text-emerald-900">
                      {headerSummary.points}
                    </h1>
                    <div className="flex gap-2 text-emerald-900 ">
                      <h2 className="text-lg font-black place-self-center">
                        {headerSummary.pointDetail}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* ACTIVITY HISTORY (HEATMAP)*/}
          <div className="p-8 mt-6 bg-slate-50 rounded-lg">
            <h1 className="text-xl font-bold text-emerald-900 mb-6">
              Activity Heatmap
            </h1>
            <CalendarHeatmap
              startDate={new Date("2026-01-01")}
              endDate={new Date("2026-12-31")}
              values={[
                { date: "2026-03-29", count: 1 },
                { date: "2026-04-04", count: 2 },
                { date: "2026-04-06", count: 3 },
                { date: "2026-04-10", count: 2 },
                { date: "2026-04-16", count: 1 },
              ]}
              classForValue={(value) => {
                if (!value) return "fill-slate-200";
                if (value.count === 1) return "fill-emerald-200";
                if (value.count === 2) return "fill-emerald-400";
                if (value.count >= 3) return "fill-emerald-600";
              }}
              gutterSize={3}
              showWeekdayLabels
            />
          </div>
          {/* USER HISTORY (TRANSACTIONS) SECTION*/}
          <div className="p-2 mt-6 grid grid-row-3 gap-4 bg-slate-50">
            {/* HEADER */}
            <div className="p-2">
              <h1 className="text-3xl font-bold text-emerald-900">
                Recent Activities
              </h1>
            </div>
            {recentActivity.map((activity, key) => (
              <div
                key={key}
                className={
                  key === 2
                    ? "p-2 flex items-center gap-4 bg-slate-200 rounded-s-full"
                    : "p-2 flex items-center gap-4 bg-slate-200 rounded-s-full"
                }
              >
                {/* ICON */}
                <div className="p-2 rounded-full place-content-center">
                  <div
                    className={
                      key === 2
                        ? "p-2 bg-amber-300 rounded-full"
                        : "p-2 bg-emerald-300 rounded-full"
                    }
                  >
                    {activity.icon}
                  </div>
                </div>
                {/* CONTENT */}
                <div className="p-2 w-full">
                  {/* HEADER */}
                  <h1 className="text-xl font-semibold text-emerald-900 ">
                    {activity.title}
                  </h1>
                  {/* DATE & STATUS */}
                  <div className="flex gap-2 font-normal">
                    <span className="text-sm p-1 text-emerald-900">
                      {activity.date}
                    </span>
                    <span className="font-bold">|</span>
                    <span className="text-sm p-1 text-emerald-900">
                      {activity.status}
                    </span>
                  </div>
                </div>
                <div className="p-2 w-1/6 place-content-center">
                  <p
                    className={
                      key === 2
                        ? "text-xl font-bold text-emerald-900"
                        : "text-lg font-bold text-emerald-900"
                    }
                  >
                    {activity.points}
                  </p>
                </div>
              </div>
            ))}
            {/* SAMPLE PAGINATION BUT NOT FUNCTIONAL */}
            <div className="p-2">
              <div className="flex justify-between">
                <button className="p-2 bg-emerald-300 px-10 text-md font-medium rounded-lg transition-transform duration-300 ease-out hover:scale-102 hover:-translate-y-2">
                  Prev
                </button>
                <div className="place-content-center">
                  <h1 className="text-sm text-gray-500">Page 1 of 2</h1>
                </div>
                <button className="p-2 bg-emerald-300 px-10 text-md font-medium rounded-lg transition-transform duration-300 ease-out hover:scale-102 hover:-translate-y-2">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
