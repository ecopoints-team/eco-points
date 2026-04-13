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

- Thoroughly scan the client folder for you to understand the codespace and the task that will be given.
- Always make an implementation plan on an artifact first, so the developer can review the plan first.

# Main Task


## High Priority

- Fix this runtime error:

Unhandled Runtime Error
Error: Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error

Text content did not match. Server: "
        :root {
          --filter-btn-size: 56px;
          --filter-stem-open: 128px;
          --filter-bar-top: 72px;
        }

        @media (min-width: 640px) {
          :root {
            --filter-btn-size: 72px;
            --filter-stem-open: 160px;
            --filter-bar-top: 88px;
          }
        }

        .font-heading { font-family: &#x27;Fredoka&#x27;, sans-serif; }
        .font-body { font-family: &#x27;Quicksand&#x27;, sans-serif; }
        .font-data { font-family: &#x27;Space Mono&#x27;, monospace; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-glow { animation: glow 3s ease-in-out infinite; }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUpFade 0.6s ease-out forwards; }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          100% { transform: rotate(-360deg); }
        }
        .wave-back { animation: spin-slow 4s linear infinite; }
        .wave-front { animation: spin-reverse 5s linear infinite; }

        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-error-shake { animation: error-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      " Client: "
        :root {
          --filter-btn-size: 56px;
          --filter-stem-open: 128px;
          --filter-bar-top: 72px;
        }

        @media (min-width: 640px) {
          :root {
            --filter-btn-size: 72px;
            --filter-stem-open: 160px;
            --filter-bar-top: 88px;
          }
        }

        .font-heading { font-family: 'Fredoka', sans-serif; }
        .font-body { font-family: 'Quicksand', sans-serif; }
        .font-data { font-family: 'Space Mono', monospace; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-glow { animation: glow 3s ease-in-out infinite; }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUpFade 0.6s ease-out forwards; }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          100% { transform: rotate(-360deg); }
        }
        .wave-back { animation: spin-slow 4s linear infinite; }
        .wave-front { animation: spin-reverse 5s linear infinite; }

        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-error-shake { animation: error-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      "


<RewardsPage>
  <Rewards>
    <div>
      <style>
        "
        :root {
          --filter-btn-size: 56px;
          --filter-stem-open: 128px;
          --filter-bar-top: 72px;
        }

        @media (min-width: 640px) {
          :root {
            --filter-btn-size: 72px;
            --filter-stem-open: 160px;
            --filter-bar-top: 88px;
          }
        }

        .font-heading { font-family: &#x27;Fredoka&#x27;, sans-serif; }
        .font-body { font-family: &#x27;Quicksand&#x27;, sans-serif; }
        .font-data { font-family: &#x27;Space Mono&#x27;, monospace; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-glow { animation: glow 3s ease-in-out infinite; }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUpFade 0.6s ease-out forwards; }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          100% { transform: rotate(-360deg); }
        }
        .wave-back { animation: spin-slow 4s linear infinite; }
        .wave-front { animation: spin-reverse 5s linear infinite; }

        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-error-shake { animation: error-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      "
        "
        :root {
          --filter-btn-size: 56px;
          --filter-stem-open: 128px;
          --filter-bar-top: 72px;
        }

        @media (min-width: 640px) {
          :root {
            --filter-btn-size: 72px;
            --filter-stem-open: 160px;
            --filter-bar-top: 88px;
          }
        }

        .font-heading { font-family: 'Fredoka', sans-serif; }
        .font-body { font-family: 'Quicksand', sans-serif; }
        .font-data { font-family: 'Space Mono', monospace; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-glow { animation: glow 3s ease-in-out infinite; }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUpFade 0.6s ease-out forwards; }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          100% { transform: rotate(-360deg); }
        }
        .wave-back { animation: spin-slow 4s linear infinite; }
        .wave-front { animation: spin-reverse 5s linear infinite; }

        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-error-shake { animation: error-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      "