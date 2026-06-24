Role: You are an expert Frontend Developer specializing in React and Tailwind CSS.
Task: Improve high-fidelity, secure Email and Password input fields with a complex floating label and icon interaction.

Design & Interaction Requirements:
Floating Label Pattern: Use Tailwind's peer utility. The label must start centered inside the input (left-aligned next to the icon). When the input is focused or contains text, the label must float to the upper border with a smaller font size (text-[11px]) and bold weight.
Left-Aligned Icons: Each field must include a Lucide icon (Mail, Lock) on the left side. The icon must be slate-400 by default and change to Emerald Green (#10B981) when the input is focused.
Dynamic Separator: There must be a vertical line separator (w-px h-6) between the left icon and the floating label. This separator should be invisible (opacity-0) by default, and fade in (opacity-100) when the input is focused or contains text.
Password Toggle: The password field must include an Eye / EyeOff toggle button on the right side.
Error State: If an error state is true, the input border, label, icon, and separator must turn into a rose color (rose-500 or rose-200 for the separator).