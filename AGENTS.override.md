# Approval-Based Working Agreements

- These instructions override any conflicting global instruction that says to work autonomously or avoid intermediate confirmation.
- For any non-trivial change, build, or fix request, first inspect the relevant code without modifying it. Then explain the proposed approach and wait for the user's explicit approval before making the first material code change.
- Ask for the user's decision before every important step. Important steps include architectural or design choices, choosing between materially different implementations, adding, removing, or upgrading dependencies, changing public APIs or data schemas, security, authentication, or permission changes, migrations, deployments, external writes, broad refactors, deletions, and material expansion of scope.
- If a requirement is ambiguous in a way that could materially change the result, present the relevant options and a recommendation, then wait for the user's choice.
- Read-only inspection, diagnostics, and non-destructive validation may proceed without approval.
- After an approach is approved, complete routine, reversible edits and tests within that agreed scope without repeatedly asking for confirmation. Ask again if the scope, risk, or chosen approach materially changes.
- Always ask before destructive, irreversible, costly, or externally visible actions.
- Preserve unrelated user changes and keep all work within the requested scope.
- Finish with a concise summary of changes and validation results.

# Naming and Component Conventions

- Use intention-revealing names for variables, functions, types, and CSS classes. A reader should understand the responsibility of an identifier without needing to inspect its implementation.
- Avoid vague names such as `data`, `item`, `value`, `info`, `temp`, `result`, `process`, or `handle` when a more domain-specific name is available. Short generic names are acceptable only in very small, unambiguous scopes.
- Name functions with a verb that describes the action and result, such as `fetchDashboardSummary`, `updateUserProfile`, or `formatFileSize`.
- Prefix boolean variables and computed values with `is`, `has`, `can`, or `should`, such as `isLoading`, `hasInitialError`, or `canPreviewDocument`.
- Name event-handler functions with the `handle` prefix followed by the event or user action, such as `handleLogout`, `handleFileDrop`, or `handleProfileSubmit`.
- Name Vue component files in PascalCase. When a component renders a root HTML element, its main CSS class must be the kebab-case form of the component name. For example, `AdminLogin.vue` must use `admin-login`, and `DashboardView.vue` must use `dashboard-view`.
- Prefix component descendant and modifier classes with the main component class. Prefer a BEM-style structure such as `dashboard-view__header` and `dashboard-view--loading` so class ownership is immediately clear.
- Pass-through or renderless components that do not render their own HTML root element are exempt from the main-class requirement.
- When renaming an identifier or CSS class, update every template, style, test, and consumer reference consistently.

# Git Visibility

- Keep every non-ignored project file tracked by Git. After creating a file, stage that file with `git add -- <path>` so no project file remains untracked and every change is visible in the Git changes list.
- Before handing work back, run `git status --short --untracked-files=all` and ensure no non-ignored project file remains as `??`.
- Stage only in-scope files created or changed during the task. Do not commit or push unless the user explicitly requests that action. Files intentionally excluded by `.gitignore`, such as `.env`, `node_modules/`, and `dist/`, remain untracked.
- If the execution environment blocks writes to the Git index, report the restriction immediately and provide the exact `git add` command for the user to run locally.
