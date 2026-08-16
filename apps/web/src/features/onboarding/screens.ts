export const onboardingScreens = [
  { id: "alpha-welcome", title: "Welcome", route: "/alpha/onboarding" },
  { id: "mode-choice", title: "Local or Networked Alpha", route: "/alpha/onboarding/mode" },
  { id: "first-question", title: "First Question", route: "/alpha/onboarding/question" },
  { id: "first-export", title: "First Export", route: "/alpha/onboarding/export" }
] as const;
