import {
  Award,
  AwardIcon,
  FlameIcon,
  MedalIcon,
  PencilIcon,
  QrCodeIcon,
  University,
  UniversityIcon,
  UserIcon,
} from "lucide-react";

export default function ProfileSection() {
  return (
    <section className="">
      {/* ROOT DIV */}
      <div className="grid grid-cols-4 gap-4 bg-slate-200 p-4">
        {/* USER INFORMATION (CREDENTIALS) SECTION */}
        <div className="p-2 grid gap-4">
          <div className="col-span-1 grid grid-row-3 rounded-xl gap-2 bg-slate-50">
            {/* USERNAME & ICON*/}
            <div className="justify-self-center p-4">
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
          <div className="relative group p-2 rounded-lg grid gap-2 bg-emerald-700 overflow-hidden">
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
          <div className="relative group p-2 rounded-lg bg-emerald-700 overflow-hidden">
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
        <div className="col-span-3 bg-green-200">2</div>
        {/* USER HISTORY (TRANSACTIONS) SECTION*/}
        <div className="col-span-4 bg-green-300">
          <div className="">3</div>
        </div>
      </div>
    </section>
  );
}
