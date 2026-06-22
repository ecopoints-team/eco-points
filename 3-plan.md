Role: You are an expert Frontend Developer specializing in React and Tailwind CSS.

Task: Revise the "Recent Activity" section UI for the profile page of a web application. 

---
DATA MAPPING & LOGIC:
The component should render a list of activity/transaction items. Map the UI data to these variables:
*   `activity.description`: The main title of the transaction (e.g., "5 Big Bottles Recycled", "EcoPoints Canvas Bag").
*   `activity.date`: Timestamp of the transaction. Format as "Mon DD, YYYY" (e.g., Oct 12, 2026).
*   `activity.amount`: Number of points gained/lost.
*   `activity.status`: "Deposited", "Rewarded", "Redeemed", or "Claimed". 
    *   If Deposited/Rewarded: Display amount as "+X" in green (#059669). Icon should be an arrow pointing down-left (e.g. `ArrowDownLeft` or `Tag`).
    *   If Redeemed/Claimed: Display amount as "-X" in orange (#d97706) or pink. Icon should be an arrow pointing up-right (`ArrowUpRight`).
*   `activity.location`: The location of the transaction (e.g., "Main Gate RVM").
*   `activity.reference`: Transaction ID or reference number.
*   `activity.bottles`: Number of bottles recycled (if applicable).

---
DESIGN SYSTEM:
*   Brand Colors: Deep Forest Green (#0f4f46 or #064E3B), Emerald (#10B981), and Slate for borders/subtext.
*   Typography: 'Fredoka' for Headings, 'Quicksand' for body/labels, 'Space Mono' for numbers, timestamps, and data values.
*   Icons: Use `lucide-react`.

---
UI COMPONENT 1: The Activity Container & Header
*   Layout: A white, card-style container with rounded-[24px] corners, a light slate border, and a subtle shadow.
*   Header Section: 
    *   Left side: A `History` icon placed next to the title "Recent Activity" (Deep Forest Green, bold, Fredoka font).
    *   Right side (Filters): Place two custom dropdown/select buttons side-by-side. 
        1. A custom Date Picker button (styled with a `Calendar` icon and light slate border).
        2. A custom Activity Type filter button dropdown ("All Activities", "Deposited", "Rewarded", "Redeemed", "Claimed").
    *   CRITICAL RULE: DO NOT implement a "Sort by" filter. 

---
UI COMPONENT 2: The Activity List & Pagination
*   List Container: An scrollable vertical list. 
*   Activity Row: Each row must be highly compact and clean, with a hover effect (e.g., `hover:bg-slate-50`).
    *   Left: A colored circular background containing the status icon (e.g., light green circle for deposits, light orange circle for redemptions).
    *   Middle: The activity description (bold, dark forest green text). Below it, display the formatted Date, a dot separator, and the Display Status in a smaller, gray text.
    *   Right: The transaction amount aligned to the right (use Space Mono font).
*   Zero State: If no activities exist or match the filter, show a centered empty state saying "No activities" with a loading spinner if it's currently fetching. 
*   Pagination (Footer): At the bottom of the container, include a custom styled pagination bar (Previous/Next arrow buttons flanking circular page number buttons).

---
UI COMPONENT 3: "Transaction Receipt" Modal (Popup)
*   Interaction: When a user clicks an activity row, open a centered modal overlaying a blurred dark backdrop.
*   Visual Style: This modal must look like a physical paper receipt. 
    *   Background: White with a slight drop-shadow. 
    *   Layout: Portrait-oriented rectangle. Use dashed gray lines for separators inside the receipt.
    *   Top: A subtle "LOGO" placeholder, the word "ECOPOINTS" (bold, tracking-tight), and text "Official Transaction" (tracking-widest, uppercase).
    *   Middle Data Rows: A vertical list of key-value pairs (Description, Date, Time, Location, Qty Recycled, Reference). The key should be uppercase mono text in gray, and the value should be aligned right in dark gray/black.
    *   Points Total Divider: A highlighted block at the bottom displaying the total points earned/spent on this transaction.
    *   Bottom Edge: Create a jagged/zig-zag edge effect at the absolute bottom of the container using a CSS clip-path to simulate a torn piece of paper.
    *   Close Action: An explicit "Close Receipt" button placed right below the ticket.