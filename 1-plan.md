Role: You are an expert Frontend Developer specializing in React and Tailwind CSS.

Task: Build the ambient background and the top two summary cards (Current Balance and Rewards Redeemed) for the EcoPoints Profile Dashboard. Ensure that we are using the branding that already exists on our website.

---
REQUIREMENT 1: The Ambient Background
Create a fixed background layer (`z-0`) that sits behind the entire profile page to give it a premium, glassmorphic depth.
* Layer 1: A subtle transparent cubes/grid pattern overlapping the base.
* Layer 2: Add 3 massive, absolute-positioned circular `div`s scattered across the corners. Give them massive blurs (`blur-[100px]` to `blur-[150px]`), low opacities (5% to 10%), and use the brand colors (Emerald, Teal, Forest Green). Add `mix-blend-multiply` and a slow pulse animation.

---
REQUIREMENT 2: Summary Card 1 (Current Balance)
Build a premium summary card with a dark forest green base.
* Background Effects: Add two large, highly blurred circles (`bg-emerald-500/20` and `bg-teal-400/20`) absolute-positioned in the top-right and bottom-left corners to give the card internal lighting. Add a large, low-opacity Lucide `Zap` icon in the top right as a watermark.
* Main Content: Label "Current Balance" (uppercase, tracking-widest) with a small glowing icon. The main value should be a massive, bold, monospace number (e.g., "1,250") with a smaller "EP" text next to it.
* Footer (Total Accumulated): At the bottom of the card, add a dark, semi-transparent box (`bg-black/20 backdrop-blur-sm`) showing the "Total Accumulated" points.

---
REQUIREMENT 3: Summary Card 2 (Rewards Redeemed)
Build a premium summary card with a vibrant gradient base (`bg-gradient-to-br from-[#10B981] to-[#00838F]`).
* Background Effects: Add a massive, low-opacity (20%) Lucide `ShoppingBag` icon absolute-positioned in the top-right corner, rotated slightly. Add a blurred white circle in the bottom-left.
* Main Content: Label "Rewards Redeemed" (uppercase) with a small frosted-glass icon container. The main value should be a massive, bold, monospace number with "Items" next to it.
* Footer (Points Spent): At the bottom, add a frosted glass box (`bg-white/10 backdrop-blur-md`) showing the total "Points Spent" formatted in monospace.

Use the provided React code snippet as the exact implementation for these components.