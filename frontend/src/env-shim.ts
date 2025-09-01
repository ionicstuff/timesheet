// Simple runtime shim so CRA-style process.env reads don't crash under Vite.
// Note: Prefer migrating to import.meta.env and VITE_* variables.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;
w.process = w.process || {};
w.process.env = w.process.env || {};

// Optional: Map a Vite variable if you create one (VITE_API_URL)
// This keeps current code working without edits.
if (import.meta && import.meta.env) {
  w.process.env.REACT_APP_API_URL = w.process.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL;
}

