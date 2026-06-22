# Role: You are an expert Frontend Developer specializing in React and Tailwind CSS.

# Task: Redesign an activity heatmap component (similar to GitHub's contribution graph) for a React dashboard named "EcoPoints".

# Section Layout & Requirements:
- With the current existing "Recent Activity" Section and functional heatmap. We will be focusing of the redesigning the container while not affecting the content and functionality.

## The Header & Dropdown (Top Row):
   *   Layout: Use flexbox `justify-between items-center` with a bottom border separator.
   *   Left Side: Title "Recycling Activity" (Bold, Forest Green) with a Lucide `Leaf` icon. Below the title, add a sub-text showing the total bottles recycled dynamically (e.g., "[X] bottles recycled").
   *   Right Side: A custom `<select>` dropdown for the Year (Options: 2024, 2025, 2026).
   *   Dropdown Styling: Remove default appearance (`appearance-none`). Style it with `bg-[#F8FAFC] border border-slate-200 text-[#064E3B] font-bold rounded-xl px-5 py-2.5`. Use absolute positioning to place a small Lucide `Calendar` icon over the default dropdown arrow location. Add hover effects (`hover:bg-[#F0FDF4] hover:border-[#10B981]/50`).

## The Heatmap Grid (Center):
   *   Layout Constraint: The heatmap container MUST have a fixed maximum width to mimic the GitHub style and prevent horizontal stretching. Use a wrapper with `w-full overflow-x-auto hide-scrollbar` holding an inner div of exactly `w-[850px] mx-auto`.
   *   Y-Axis Labels: Add "Mon", "Wed", "Fri" stacked vertically on the left side.
   *   X-Axis Labels: Add the 12 month abbreviations across the top.
   *   Grid Tiles: Map the 52 weeks x 7 days data into small rounded squares (`w-3.5 h-3.5 rounded-[3px]`). Add a hover state: `hover:ring-2 hover:ring-offset-1 hover:ring-[#10B981]`. Include a standard `title` attribute for tooltips (e.g., "Recycled 3 bottles on this day").

## The Legend (Bottom Row):
   *   Layout: Place at the bottom, aligned to the right (`justify-end items-center`), with a top border separator.
   *   Content: Text "Less" -> 5 small squares displaying the 5 intensity colors -> Text "More". Use 'Space Mono' font for the text.