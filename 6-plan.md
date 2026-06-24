Role: You are an expert React Frontend Developer and UI/UX Designer.

Task: Refine a multi-step, responsive "EcoPoints" Sign-Up Modal component using React and Tailwind CSS.

Design Language:
- Use Floating Labels (input label transitions to top border on focus/fill) to maintain a modern, clean aesthetic. Similar with the Login fields.
- Layout: Multi-step wizard (3 Steps) with a progress bar and a backdrop blur effect.

Step-by-Step Structure:
Step 1: Account Credentials
- Fields: Email, Username, Password, Confirm Password.
Step 2: Personal Details
- Fields: First Name, Middle Name (optional), Last Name, Phone Number.
Step 3: Institutional Details
- Fields: Organization (Typeable Dropdown), User Type (Dropdown), Community Group (Typeable Dropdown), Year Level (Only visible if User Type is 'Student'), Terms & Conditions (add link to modal) and Privacy Policy (add link to modal) Checkboxes.

Validation Rules (Required Fields only where marked):
1. Email: Standard email format, no spaces, unique check simulation.
2. Username: No spaces, alphanumeric plus '.' and '_' allowed. 
3. Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, no spaces. 
4. Password Match: Dynamic status (Match/Mismatch) below fields.
5. Phone: 10 digits only, start with '9', no letters/special chars. 
6. Error Handling: Use a "touched" state for every field. Error messages (red, bold, small text) appear below the field ONLY after the user has interacted with/left the field.
7. Conditional Logic: "Year Level" field must be hidden unless 'Student' is selected in User Type.

UI/UX Requirements:
- Use Tailwind CSS exclusively.
- Use Lucide-React icons for UI elements (Lock, Mail, User, Eye, etc.).
- Typeable Dropdowns: Use <datalist> for Organization, User Type, and Community Group so users can pick an option or type a custom value.
- Button Logic: The "Next Step" or "Create Account" button must remain disabled until all validation rules in that specific step are met.
- Animations: Use standard Tailwind transition classes for smooth input state changes.
- Aesthetics: Ensure the "Terms and Conditions" step uses a legible, checkbox-led interaction.

Use the current Sign Up for the connection to database. We will only change the ui and input validation but the connection to backend is already settled.