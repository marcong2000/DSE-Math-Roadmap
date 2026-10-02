# DSE Maths Roadmap: Codex Cloud handover

## Current state

The live website is https://dse-maths-roadmap.marcong2000.chatgpt.site.
The source snapshot was deployed as Sites version 3 on 2 October 2026.
This transfer contains the current tracked source plus these handover documents and the simulated authentication check. It excludes dependency folders, local databases, runtime state, credentials, build output and the generated tsconfig.tsbuildinfo cache.

## Connect to Codex in the browser

1. Create a private GitHub repository named `dse-maths-roadmap` in the intended personal account, or use an empty repository selected by the owner.
2. Extract this ZIP and upload the CONTENTS of `dse-maths-roadmap/` to the repository root. Include `.openai/hosting.json`, `.npmrc`, and `.gitignore`. Do not put the whole project inside a second nested folder.
3. In a new Codex task choose Work in > Cloud > Select environment > Create environment, then select this repository. Another entry point is Settings > Codex Cloud > Environments > Create environment.
4. Let Codex prepare the environment. Request Node.js >=22.13.0 and pnpm exactly 11.25.0, install dependencies from the frozen lockfile, and run the checks below. Enable package-registry access during setup if prompted.
5. Review the setup results and publish the cloud environment, then start a task from it. Publishing an environment prepares a workspace; publishing a Sites version changes the live website.
6. Enable the Sites plugin in the new task before asking it to update this existing website. Supabase is useful for inspecting the existing login project. Google Drive is needed only for additional research/source material.

Official setup: https://learn.chatgpt.com/docs/environments/cloud-environments

## Install, build and local checks

The exported checkout has no host-specific execution profile. Its default is portable.
Use `corepack pnpm` if Corepack is available; otherwise use `npx --yes pnpm@11.25.0` for these pnpm commands. Keep the existing lockfile and package versions.

```sh
corepack pnpm install --frozen-lockfile --store-dir .sites-runtime/pnpm-store
corepack pnpm exec tsc --noEmit
corepack pnpm exec eslint app db
node scripts/check-roadmap.mjs
corepack pnpm run build
```

For a local progress/authentication test, apply the migration to the LOCAL D1 database after building. Never run this with `--remote`.

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_great_ego.sql
node scripts/check-student-auth-simulated.mjs
```

The simulated auth check verifies login rejection, cookies, progress persistence, account separation, refresh, confirmation-token validation and logout against a local HTTP provider. It does not verify real email delivery. Use the owner-approved test workflow for actual registration and recovery.

## Production configuration and data

Keep `.openai/hosting.json` and its existing project ID exactly as provided:
`appgprj_6abf46f55b688191bd4b84c0aba86df9`.
Do not call create_site or create a replacement database when continuing this project.

- Sites hosts the Worker and its production D1 `DB` binding. Progress is stored in D1, keyed by user ID and topic ID.
- Supabase project: `igzzobzsmpdhlfxmwhbl`, named DSE Maths Roadmap in Marco's Org, Singapore.
- Supabase API URL: https://igzzobzsmpdhlfxmwhbl.supabase.co
- Supabase provides email/password identity. Supabase accounts use `supabase:<user UUID>` as their D1 identity key.
- Existing ChatGPT sign-in remains an alternative and preserves its original user-ID keys. Its progress is separate from student-account progress.
- Sites runtime variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are already configured in Sites, outside source control. Read them through the Sites tools if needed; never include service-role keys or credentials in the repository.
- The owner reported saving Supabase SMTP and URL settings. Public settings and the redirect to `/student/login` were verified. A real student registration and confirmation-email delivery check remains outstanding.
- Supabase email confirmation is enabled. Do not disable it as a shortcut.
- Resend SMTP credentials belong in Supabase, not this source tree.
- Guest visitors can explore and change temporary statuses; durable saving requires student or ChatGPT sign-in.

Local preview is separate from production: local D1 starts empty. Do not import real student records into development. For an authenticated Supabase preview, use a separate approved test project and test redirect settings. Production Sites variables do not automatically populate the Codex Cloud environment.

## Product and content

The dashboard has 39 topics across cumulative Level 2, Level 3 and Level 3+ priorities. Statuses are 0 = not yet mastered, 1 = semi-ready, 2 = complete.
Content includes mastery criteria, pitfalls, paper references and a scoring estimator. Grade thresholds are unofficial estimates, and missing/conflicting evidence is disclosed. The same-option MC model uses expected lucky guesses and does not guarantee an outcome. The 2026 Paper 1 source was a mock and excluded from authentic-past-paper claims.

The exercise upload/download feature was discussed but has not been implemented.

## Publishing future edits

Use the Sites building/hosting skills for this EXISTING site. Open the existing source, preserve its public audience and ID, run appropriate checks, push the exact source through the supported Sites workflow, save the matching version and deploy it. A GitHub commit alone does not update the live Site. Runtime values stay in Sites; do not add them to `.openai/hosting.json`.

The current deployment succeeded with environment revision 1. No backend migration is required just to begin using Codex Cloud.
