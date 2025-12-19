/**
 * Application configuration constants
 * This file contains app-wide configuration values and default settings.
 */

// App version and environment
export const VERSION_ID = "v17.6 (BreakLoop Privacy)";
export const USER_LOCATION = "Munich";

// Quick Task feature configuration
export const QUICK_TASK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
export const QUICK_TASK_TEST_DURATION_MINUTES = 10 / 60; // 10 seconds for testing

export const QUICK_TASK_DURATION_OPTIONS = [
  { value: QUICK_TASK_TEST_DURATION_MINUTES, label: "Testing (10 s)" },
  { value: 2, label: "Short" },
  { value: 3, label: "Standard" },
  { value: 5, label: "Longer" },
];

export const QUICK_TASK_ALLOWED_DURATIONS = QUICK_TASK_DURATION_OPTIONS.map(
  (opt) => opt.value
);

export const DEFAULT_QUICK_TASK_DURATION = 3;
export const DEFAULT_QUICK_TASK_LIMIT = 1;

// Default monitored apps
export const DEFAULT_MONITORED_APPS = ["instagram", "tiktok"];

// Default application settings
export const DEFAULT_SETTINGS = {
  interventionDuration: 5,
  gracePeriod: 5,
  shareAlternatives: true,
  shareActivity: true, // Share current alternative activity
  shareMood: true, // Share recent mood/root cause
  theme: "default",
};

// Default user account configuration
export const DEFAULT_USER_ACCOUNT = {
  loggedIn: false,
  name: "Wei",
  email: "wei@example.com",
  streak: 3,
  isPremium: false,
};
