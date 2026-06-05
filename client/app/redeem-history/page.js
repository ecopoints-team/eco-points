"use client";
import dynamic from "next/dynamic";
import RewardsSkeleton from "../../src/components/shared/skeletons/RewardsSkeleton";

const RedeemHistory = dynamic(
  () => import("../../src/components/pages/RedeemHistory"),
  { loading: () => <RewardsSkeleton /> }
);

export default function RedeemHistoryPage() {
  return <RedeemHistory />;
}
