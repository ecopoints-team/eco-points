# Folder Structure Visualization

Generated on 2026-04-26 18:07:35

```text
Github/
+-- client/
|   +-- app/
|   |   +-- admin/
|   |   |   +-- analytics/
|   |   |   |   \-- page.js
|   |   |   +-- bulk-sessions/
|   |   |   |   \-- page.js
|   |   |   +-- leaderboards/
|   |   |   |   \-- page.js
|   |   |   +-- locations/
|   |   |   |   \-- page.js
|   |   |   +-- logs/
|   |   |   |   +-- access/
|   |   |   |   |   \-- page.js
|   |   |   |   +-- bottles/
|   |   |   |   |   \-- page.js
|   |   |   |   +-- machines/
|   |   |   |   |   \-- page.js
|   |   |   |   +-- rewards/
|   |   |   |   |   \-- page.js
|   |   |   |   \-- transactions/
|   |   |   |       \-- page.js
|   |   |   +-- machines/
|   |   |   |   \-- page.js
|   |   |   +-- profile/
|   |   |   |   \-- page.js
|   |   |   +-- rewards/
|   |   |   |   \-- page.js
|   |   |   +-- settings/
|   |   |   |   \-- page.js
|   |   |   +-- users/
|   |   |   |   +-- permissions/
|   |   |   |   |   \-- page.js
|   |   |   |   \-- page.js
|   |   |   +-- layout.js
|   |   |   \-- page.js
|   |   +-- leaderboard/
|   |   |   \-- page.js
|   |   +-- login/
|   |   |   \-- page.js
|   |   +-- profile/
|   |   |   \-- page.js
|   |   +-- qr/
|   |   |   \-- page.js
|   |   +-- rewards/
|   |   |   \-- page.js
|   |   +-- layout.js
|   |   +-- page.js
|   |   \-- providers.js
|   +-- public/
|   |   +-- Rewards/
|   |   |   +-- Eco Pen.jpg
|   |   |   +-- Eco Pin.jpg
|   |   |   +-- Eco ToteBag.jpg
|   |   |   +-- Eco Tumbler.jpg
|   |   |   \-- Notebook.png
|   |   +-- bamboo_notebook_new.png
|   |   +-- bamboo_usb_new.png
|   |   +-- eco_pencil_new.png
|   |   +-- EcoPoints Logo Mark with Name (Light Version).png
|   |   +-- EcoPoints Logo Mark with Name.png
|   |   +-- EcoPoints Primary Logo (Light version).png
|   |   +-- EcoPoints Primary Logo.png
|   |   +-- ezgif-frame-001.png
|   |   +-- Leaf-Border-Left.png
|   |   +-- Leaf-Border-Right.png
|   |   +-- Logo Elements (Light).png
|   |   +-- Logo Elements.png
|   |   +-- logo.png
|   |   +-- logo2-removebg-preview.png
|   |   +-- logo3-removebg-preview.png
|   |   +-- logo-removebg-preview.png
|   |   +-- manifest.json
|   |   +-- SampleBorder(Circuit-Line-Left).png
|   |   +-- SampleBorder(Circuit-Line-Right).png
|   |   +-- SampleImage-CurrentPoints.png
|   |   +-- SampleImage-EcoPoints.png
|   |   +-- SampleImage-Face1.jpeg
|   |   +-- SampleImage-Face10.jpg
|   |   +-- SampleImage-Face10-bg.png
|   |   +-- SampleImage-Face2.jpg
|   |   +-- SampleImage-Face2-bg.png
|   |   +-- SampleImage-Face3.jpg
|   |   +-- SampleImage-Face4.avif
|   |   +-- SampleImage-Face5.webp
|   |   +-- SampleImage-Face6.jpg
|   |   +-- SampleImage-Face6-bg.png
|   |   +-- SampleImage-Face7.jpg
|   |   +-- SampleImage-Face8.jpg
|   |   +-- SampleImage-Face8-bg.png
|   |   +-- SampleImage-Face9.png
|   |   +-- SampleImage-Features.webp
|   |   +-- SampleImage-Features-five.png
|   |   +-- SampleImage-Features-four.jpg
|   |   +-- SampleImage-Features-three.webp
|   |   +-- SampleImage-Features-two.jpg
|   |   +-- SampleImage-QRAuthentication.jpeg
|   |   +-- SampleImage-Scan.png
|   |   +-- SampleImage-Streak.png
|   |   +-- SampleImage-Tracking.jpg
|   |   +-- SampleImage-UserIcon.png
|   |   +-- SampleReward-Keychain.jpg
|   |   +-- SampleReward-Lanyard.jpg
|   |   +-- SampleReward-Ntbk.jpg
|   |   +-- SampleReward-Stickers.jpg
|   |   +-- SampleReward-ToteBag.jpg
|   |   +-- steel_water_tumbler_logo.png
|   |   +-- sw.js
|   |   +-- swe-worker-5c72df51bb1f6ee0.js
|   |   \-- workbox-f1770938.js
|   +-- src/
|   |   +-- assets/
|   |   |   \-- react.svg
|   |   +-- components/
|   |   |   +-- admin/
|   |   |   |   +-- AddRegularUserModal.jsx
|   |   |   |   +-- AddUserModal.jsx
|   |   |   |   +-- AdminLayout.jsx
|   |   |   |   +-- CustomDropdown.jsx
|   |   |   |   +-- PageSizeSelector.jsx
|   |   |   |   \-- Sidebar.jsx
|   |   |   +-- pages/
|   |   |   |   +-- Leaderboard.jsx
|   |   |   |   +-- LeaderboardPodium.jsx
|   |   |   |   +-- LogIn.jsx
|   |   |   |   +-- ProfileSection.jsx
|   |   |   |   +-- RecentActivity.jsx
|   |   |   |   \-- Rewards.jsx
|   |   |   +-- shared/
|   |   |   |   +-- skeletons/
|   |   |   |   |   +-- LeaderboardSkeleton.jsx
|   |   |   |   |   +-- ProfileSkeleton.jsx
|   |   |   |   |   \-- RewardsSkeleton.jsx
|   |   |   |   \-- SlotCounter.jsx
|   |   |   \-- website/
|   |   |       +-- sections/
|   |   |       |   +-- Carousel.jsx
|   |   |       |   +-- CTASection.jsx
|   |   |       |   +-- Features.jsx
|   |   |       |   +-- HeroSection.jsx
|   |   |       |   \-- HowItWorks.jsx
|   |   |       +-- Footer.jsx
|   |   |       +-- NavBar.jsx
|   |   |       \-- ScrollToTop.jsx
|   |   +-- context/
|   |   |   +-- AuthContext.js
|   |   |   \-- ThemeContext.js
|   |   +-- data/
|   |   |   +-- mockData.js
|   |   |   \-- roleConfig.js
|   |   +-- services/
|   |   |   \-- apiService.js
|   |   +-- utils/
|   |   |   +-- formatDate.js
|   |   |   \-- useDebounce.js
|   |   \-- index.css
|   +-- .env.example
|   +-- .env.local
|   +-- .gitignore
|   +-- AUDIT_REPORT.md
|   +-- Dockerfile
|   +-- next.config.js
|   +-- package.json
|   +-- package-lock.json
|   +-- postcss.config.js
|   \-- tailwind.config.js
+-- Guides/
|   +-- EcoPoints_Database_Setup_Guide.md
|   \-- EcoPoints_GitHub_Guide.md
+-- nginx/
|   \-- default.conf
+-- prompts/
|   +-- 1-plan.md
|   +-- 2-code.md
|   +-- 3-review.md
|   \-- for-codex.md
+-- server/
|   +-- app/
|   |   +-- controllers/
|   |   |   +-- __init__.py
|   |   |   +-- auth_controller.py
|   |   |   +-- rpi_controller.py
|   |   |   \-- web_controller.py
|   |   +-- seeder/
|   |   |   +-- __init__.py
|   |   |   \-- seed.py
|   |   +-- services/
|   |   |   +-- __init__.py
|   |   |   +-- logo.png
|   |   |   +-- notification_service.py
|   |   |   \-- otp_service.py
|   |   +-- __init__.py
|   |   +-- middleware.py
|   |   +-- models.py
|   |   \-- routes.py
|   +-- migrations/
|   |   +-- versions/
|   |   |   +-- 406e48d40e9e_add_token_blacklist_city_unique_.py
|   |   |   +-- 48dd370398d3_add_2fa_and_login_attempts.py
|   |   |   \-- edab494b5c67_14_table_approved_schema.py
|   |   +-- alembic.ini
|   |   +-- env.py
|   |   +-- README
|   |   \-- script.py.mako
|   +-- .env
|   +-- .gitignore
|   +-- api.rest
|   +-- API_DOCUMENTATION.md
|   +-- api-testing.http
|   +-- check_data.py
|   +-- DEPLOYMENT_GUIDE.md
|   +-- Dockerfile
|   +-- ecopoints.db
|   +-- eco-points.service
|   +-- gunicorn.conf.py
|   +-- README.md
|   +-- requirements.txt
|   +-- run.py
|   +-- seed.py
|   \-- SETUP_GUIDE.md
+-- src/
|   \-- app/
|       \-- admin/
|           \-- leaderboards/
+-- #implementation_plan
+-- .env.example
+-- .gitignore
+-- Check.md
+-- docker-compose.yml
+-- original_models.txt
+-- package.json
+-- package-lock.json
+-- README.md
\-- security_audit.md
```

> Notes: Excludes common build and dependency folders such as node_modules, .next, .git, **pycache**, dist, and build.
