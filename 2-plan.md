Role: You are an expert Frontend Developer specializing in React and Tailwind CSS.
Task: Build the "Profile Identity Card" and its associated Modals (Edit Profile & QR Code) for a web application called EcoPoints.
DATA MAPPING & LOGIC:
The component will receive a user object. Map the UI data strictly to these variables:
Profile Picture: user.avatar_url (If null, display the initials of first_name + last_name)
Display Name: user.first_name + " " + user.last_name
Username: "@" + user.username
User ID: user.display_id (e.g., USER-PUP-001)
Email: user.email
Phone Number: user.phone -> CRITICAL RULE: This field is nullable. If phone is null or empty, completely hide/remove the Phone Number row from the UI.
User Type: user.user_type
Organization: user.organization.name (Joined from organizations table)
Community Group: user.community_group.name (Joined from community_group table)
DESIGN SYSTEM:
Brand Colors: Deep Forest Green (#064E3B), Emerald (#10B981), Soft Mint (#F0FDF4).
Typography: 'Fredoka' for Headings, 'Quicksand' for body/labels, 'Space Mono' for User ID and Username.
Icons: Use lucide-react.
UI COMPONENT 1: Profile Identity Card (Left Sidebar)
Top Section (Centered):
A large circular Avatar.
At the bottom-right of the avatar, overlap a small circular button containing an Edit2 icon. IMPORTANT: Clicking this small button must trigger a hidden <input type="file" accept="image/*"> to upload a new picture. It should NOT open the Edit Info modal.
Below the avatar: Display Name (Bold, Large) and Username (Gray, Space Mono).
Middle Section (Left-Aligned List):
A top horizontal separator line.
A vertical list of user details: User ID, Organization, User Type, Community Group, Email, and Phone (if not null).
Layout for each row: A small gray/mint square containing a Lucide icon on the left, and the text data on the right.
Spacing: Use very tight spacing between these rows (e.g., gap-2 or gap-2.5). Do not spread them far apart.
Bottom Section (Actions):
A bottom horizontal separator line.
Two side-by-side buttons of equal width: "Edit Info" (White bg, green text/border) and "Show QR" (Dark #102027 bg, White text). Both buttons should have corresponding icons next to the text.
UI COMPONENT 2: "Edit Profile" Modal
Layout: A clean, centered modal over a blurred backdrop.
Editable Fields: First Name, Middle Name (Optional), Last Name, Username, and Phone Number.
Read-Only Fields: User Type, Community Group, Organization, User ID, and Email. Style these with a grayed-out background to look locked.
Disclaimer: At the bottom of the modal, add a highlighted informational box stating: "User Type, Community Group, and Email are locked to your institutional record. To change these, please contact the administrator."
Username Confirmation: If the user changes their username and clicks Save, intercept the submission with a secondary pop-up modal. It must warn them: "Are you sure you want to change your username? You will not be able to change it again for 30 days." Provide "Cancel" and "I Understand" buttons.
UI COMPONENT 3: "Show QR" Modal
Layout: A portrait-oriented, card-style modal. White background, rounded corners.
Top: A small circular icon container (Mint background, Emerald Green QrCode icon).
Header: "Your Personal QR" with subtitle "Scan this QR code at any Reverse Vending Machine to start recycling."
QR Image: A large square container for the QR code image.
ID Badge: Below the QR code, a small, pill-shaped gray badge displaying the user.display_id.
Action: A full-width, solid Emerald Green (#10B981) button at the bottom saying "Download QR Code" with a download icon.