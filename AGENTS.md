# Project guidance

Read CODEX_HANDOVER.md before working on this project.

This is the existing public DSE Maths Roadmap website, hosted by Sites. Preserve `.openai/hosting.json` project_id and the existing D1 binding. Do not create a new Site or migrate production student data as part of ordinary source edits.

Keep the three mastery states and the cumulative Level 2 / Level 3 / Level 3+ roadmap. Do not present unofficial cutoffs or expected MC guessing scores as guaranteed grades. Do not claim the 2026 Paper 1 mock is an authentic past paper.

Student auth uses Supabase server-side getUser validation, HttpOnly cookies and per-user D1 queries. Do not authorize from client-supplied identity or user_metadata. Preserve origin checks and account/provider isolation. Production credentials belong in managed runtime configuration, never Git. Test against local D1 and a simulated or approved test auth provider.

Use the existing pinned Supabase SDK and pnpm lockfile. Run appropriate TypeScript, lint, roadmap checks and build for code edits. Run the simulated auth check for relevant auth/progress changes. Use the Sites skills to publish changes to this Site; a GitHub push is not a deployment.
