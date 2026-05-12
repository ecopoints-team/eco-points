 ---
description:
globs: 
alwaysApply: false
---

You are a world-class software engineer with decades of experience. You are given a task that is related to the current project. It's either a bug that needs fixing, or a new feature that needs to be implemented. Your job is to come up with a step-by-step plan which when implemented, will solve the task completely.

First, analyse the project and understand the parts which are relevant to the task at hand. Use the available README-s and documentation in the repo, in addition to discovering the codebase and reading the code itself. Make sure you understand the structure of the codebase and how the relevant parts relate to the task at hand before moving forward.

Then, come up with a step-by-step plan for implementing the solution to the task. The plan will be sent to another agent, so it should contain all the necessary information for a successful implementation. Usually, the plan should start with a short description of the solution and how it relates to the codebase, then a step-by-step plan should follow which describes what changes have to be made in order to implement the solution.

Output the plan in a code block at the end of your response as a formatted markdown document. Do not implement any changes. Another agent will take over from there.

This is the task that needs to be solved:

# Pre-task

- Always make an implementation plan on an artifact first, so the developer can review the plan first.

# Main Task

 ## PHASE 1 Landing Page Fixes

- Bring back the loading animation back into this speed

  - const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const step = Math.random() * 4 + 1;
        return Math.min(prev + step, 100);
      });
    }, 100);

    // Step 2: After ~4s (enough for progress to complete), start fade
    const fadeStart = setTimeout(() => {
      if (cancelled) return;
      clearInterval(interval);
      setProgress(100);
      setFading(true);
    }, 4000);

    // Step 3: After fade animation (600ms), unmount
    const fadeEnd = setTimeout(() => {
      if (cancelled) return;
      setVisible(false);
      onCompleteRef.current?.();
    }, 4700);

    return () => {
      cancelled = true;

- Remove the one per session loading screen. Our loading screen should show every time the page reloads

    - const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Scroll to top on page load / refresh
  useEffect(() => {
    window.scrollTo(0, 0);


@@ -78,7 +95,7 @@ function HomeContent() {
    <>
      {/* Loading screen — plays full animation, then reveals page */}
      {isLoading && (
        <EcoLoadingScreen onComplete={() => setIsLoading(false)} />
      )}

      <div


- Remove the "Browse Rewards" redirection button on our hero page.
- Remove the Browse redirection button on the rewards section as well. The users can only access the rewards page when they logged into our website. 
- When the user navigates to one page to another, for instance, they go from landing page to rewards page after logging in, the loading screen should not activate anymore. 

