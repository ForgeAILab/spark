---
name: shadcn-dashboard-patterns
description: Compose shadcn-style primitives into dense, practical dashboard layouts without drifting into marketing UI.
---

# Skill: shadcn-dashboard-patterns

## Goal

Build dashboard screens from small primitives that stay easy to scan, resize,
and extend. Use the shadcn component style as a starting point, not as a reason
to turn every section into a card.

## Defaults

- Start with the user's job, not the component catalog.
- Put navigation, filters, and primary actions where repeat users expect them.
- Prefer one clear page title, one toolbar, and one main content region.
- Use cards for repeated objects, stat summaries, forms, and modal content.
- Do not wrap the whole page in a decorative card.
- Keep radii at `rounded-lg` or below unless the app theme says otherwise.
- Use `cn()` for class merging and keep variants close to the component.

## Layout

- Use a shell with a sidebar or top nav only when there are real destinations.
- Keep dashboard width constrained with `mx-auto w-full max-w-7xl px-4`.
- Use `gap-4` or `gap-6`; avoid ornamental whitespace in operational views.
- Put status, owner, date, and filters near the table or list they affect.
- Align destructive actions away from the primary happy path.
- Keep tables full width and let dense data breathe through row height.
- Use sticky headers only when the table is long enough to justify them.

## Cards

- A card should represent one thing: a metric, a record, a form, or a chart.
- Do not nest cards inside cards.
- Use `CardHeader`, `CardContent`, and `CardFooter` only when each region helps.
- Small metric cards should use compact labels, one strong value, and a trend.
- Empty cards should show the empty state for that object, not generic help copy.
- Repeated cards need stable height or clear wrapping behavior.

## Buttons

- Primary buttons create or commit work.
- Secondary buttons reveal adjacent options.
- Ghost buttons belong in rows, toolbars, and low-emphasis actions.
- Icon buttons need an accessible label.
- Use `asChild` when routing through `Link`, not nested buttons or anchors.
- Keep button labels short and concrete: `Save`, `Invite`, `Export`.
- Avoid full-width buttons on desktop unless the panel itself is narrow.

## Forms

- Group fields by workflow, not by database table.
- Put validation text next to the field that caused it.
- Use disabled and pending states during server actions.
- Use destructive copy only for irreversible actions.
- Keep advanced settings collapsed until they are needed.
- Use consistent input widths inside the same form group.

## Tables And Lists

- Use a table when users compare many rows across the same fields.
- Use a list when records have mixed metadata and short actions.
- Keep row actions at the trailing edge.
- Expose bulk actions only after selection exists.
- Use badges sparingly for status, plan, role, or risk.
- Do not use color as the only status signal.

## Empty, Loading, Error

- Empty states should offer the next valid action.
- Loading states should preserve the final layout shape.
- Error states should say what failed and offer retry or recovery.
- Avoid giant empty illustrations inside work dashboards.
- Do not teach the whole product in an empty state.

## Motion And Polish

- Prefer subtle color, border, and shadow changes over large motion.
- Keep hover states predictable across cards, rows, and buttons.
- Respect reduced motion when adding transitions.
- Check mobile wrapping for toolbar actions and long entity names.
- Make the first useful workflow visible without a landing page.
