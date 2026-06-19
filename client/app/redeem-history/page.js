"use client";
import dynamic from "next/dynamic";
import RewardsSkeleton from "../../src/components/shared/skeletons/RewardsSkeleton";
import RequireAuth from "../../src/components/auth/RequireAuth";

const RedeemHistory = dynamic(
  () => import("../../src/components/pages/RedeemHistory"),
  { loading: () => <RewardsSkeleton /> }
);

export default function RedeemHistoryPage() {
  return (
    <RequireAuth>
      <RedeemHistory />
    </RequireAuth>
  );
}
