"use client";
import dynamic from "next/dynamic";
import RewardsSkeleton from "../../src/components/shared/skeletons/RewardsSkeleton";

const Rewards = dynamic(
  () => import("../../src/components/pages/Rewards"),
  { loading: () => <RewardsSkeleton /> }
);

export default function RewardsPage() {
  return <Rewards />;
}