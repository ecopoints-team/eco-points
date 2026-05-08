"use client";
import dynamic from "next/dynamic";
import RewardsSkeleton from "../../src/components/shared/skeletons/RewardsSkeleton";

const MyRewards = dynamic(
  () => import("../../src/components/pages/MyRewards"),
  { loading: () => <RewardsSkeleton /> }
);

export default function MyRewardsPage() {
  return <MyRewards />;
}
