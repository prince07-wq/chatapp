# Chatapp Engineering Instructions

## Scope

- Inspect existing code before editing.
- Modify only files required for the requested task.
- Never recreate or replace working files unnecessarily.
- Do not refactor unrelated code.
- Do not add features that were not requested.
- Stop immediately after completing the requested task.

## Project Boundaries

- Frontend code belongs only in `client/`.
- Backend code belongs only in `server/`.
- Preserve the existing architecture, naming conventions, folder structure, and design system.
- Reuse existing components, hooks, services, utilities, APIs, socket instances, and constants.
- Do not create duplicate implementations.
- Do not introduce a new library when the existing stack can solve the problem.
- Never expose, print, modify unnecessarily, or commit `.env` files or secrets.

## UI Rules

- Preserve approved authentication and chat styling.
- Do not redesign UI without explicit permission.
- New UI must follow the existing colors, spacing, typography, radii, shadows, animations, and light/dark themes.
- Do not generate new layouts when an existing component can be extended.
- Preserve responsive behavior and accessibility.

## Engineering Standard

- Write production-quality code at a senior software engineer level.
- Prefer clear, maintainable, testable code over shortcuts.
- Keep components and functions focused.
- Avoid duplicated logic, hidden side effects, fragile state, and unnecessary abstractions.
- Use existing backend contracts and socket payloads exactly.
- Inspect contracts before implementing; never guess endpoint names, event names, or payload shapes.
- Validate inputs and handle loading, empty, error, reconnect, and cleanup states where relevant.
- Prevent duplicate listeners, requests, messages, timers, and state entries.
- Preserve backward compatibility with existing features.

## Change Safety

Before editing:

1. Inspect the relevant files.
2. Check existing implementations and imports.
3. Check `git diff` or current changes when useful.
4. Identify the smallest safe change.

During editing:

- Keep the diff minimal.
- Do not rename or move files unless required.
- Do not rewrite entire files for a small change.
- Do not remove existing behavior unless explicitly requested.
- Do not silently alter API contracts, schemas, events, or authentication logic.

After editing:

- Run the relevant build, lint, syntax check, or focused test.
- Fix errors caused by the current task.
- Do not spend time fixing unrelated pre-existing errors unless requested.
- Confirm no unrelated files were modified.

## Redundancy Prevention

- Search for an existing implementation before creating a new one.
- Extend existing components instead of creating near-duplicates.
- Use one source of truth for shared state.
- Use one configured API client and one shared socket connection.
- Reuse existing constants instead of repeating strings.
- Reuse existing helpers for timestamps, IDs, validation, uploads, tokens, presence, receipts, and message normalization.
- Do not implement the same behavior in both parent and child components.
- Do not add fallback logic for multiple guessed payload formats unless the repository already requires it.
- Remove temporary debugging logs before finishing unless explicitly requested.

## Output Rules

- Prioritize making the code changes over explaining them.
- Do not print complete files unless requested.
- Do not include tutorials, examples, long plans, or repeated context.
- Do not describe obvious implementation details.
- Do not suggest additional features.
- Do not commit or push unless explicitly requested.

After completing a task, return only:

- `Created:` file paths, or `None`
- `Modified:` file paths, or `None`
- `Checks:` build/test result
- `Issues:` unresolved blockers, or `None`

Maximum 8 lines.

## Blocking Conditions

- Ask one concise question only when a required detail cannot be determined from the repository.
- Do not ask for confirmation when the repository already provides the answer.
- If blocked by missing backend support, report the exact missing contract instead of inventing one.
## ChatPlaceholder Protection

- Do not add new feature logic or substantial UI markup to `ChatPlaceholder.jsx`.
- Treat it as an orchestration-only page.
- New chat functionality must go into dedicated components, hooks, services, or utilities.
- Changes to `ChatPlaceholder.jsx` should normally be limited to imports, hook usage, props, and composition.