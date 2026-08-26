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
