# Screen Design Plan — JNLOP Mobile

Confirmed briefs for the remaining screens, inside the established Midnight Executive world (see DESIGN.md). Direction is settled; these briefs fix structure, states, and behavior — not visual direction. Every screen keeps the same skeleton: content header (serif display or title1) → overline-labeled sections → hairline-divided rows; gold only on the primary action and the key figure.

---

## 1. Reports (weekly/index)

- **Job & audience:** the weekly reporting hub. Branch pastors see "My branch" submit state; zonal/state pastors see review queues; HQ sees national coverage.
- **Structure (top → bottom):** header (week picker chip, compact) → hero stat card per role (my branch status / zone review count / national coverage ring reuse) → "Zone review" / "State roll" / "National" summary cards → report list rows (branch, status tag, meta).
- **Primary action:** one gold CTA matched to role — "Submit report", "Review zone", or "Open weekly health".
- **States:** loading skeleton rows; empty = quiet EmptyState ("No reports this week"); forwarding pending = disabled CTA with pending tag; error = inline retry.
- **Interaction:** role sections collapse to what's relevant; drill-down rows → report detail. Forwarding is a single confirm, never a form.
- **Boundary:** don't show other jurisdictions' controls — RBAC is API-side; UI shows only the viewer's scope.

## 2. Submit report (weekly/submit)

- **Job & audience:** branch pastor files this week's report fast on a phone, possibly intermittent data.
- **Structure:** header ("Submit report" + week meta) → single stacked form (attendance adults/teenage/children → finance tithe/offering/other) → sticky gold submit bar → success becomes a receipt state ("Report sent" + summary + status tag), not a toast.
- **Interaction:** numeric keypad inputs, live total line under each group (serif numeral), edit mode reuses same form prefilled; disabled while submitting.
- **States:** draft (editable), pending zone review (read-only + status tag), receipt/confirmation, field-level validation errors inline (red caption under field).
- **Boundary:** one screen, one submission — no wizard, no stepper; the report is one scroll.

## 3. Report detail (weekly/[id])

- **Job & audience:** any role reads a single submitted report — the "receipt" view.
- **Structure:** header (branch + week meta + status tag) → "Attendance and finance" group card (labeled rows, serif values) → submission meta (submitted by/at, forwarded state).
- **Interaction:** read-only; edit CTA only when `editable` (branch pastor, pre-review).
- **States:** loading skeleton; not-found → EmptyState.

## 4. Pastors

- **Job & audience:** ADMIN/LP manage the field team — onboard, reassign, deactivate; HQ checks coverage.
- **Structure:** header ("Pastors" + count meta) → search field + role filter chips → directory list (avatar, name, role tag, assignment meta, status dot) → "Invite pastor" gold CTA → sheets for invite/reassign/deactivate confirms.
- **Interaction:** search filters client-side; row → detail/action sheet; destructive actions (deactivate) use danger tone + confirm.
- **States:** skeleton; empty search → "No pastors found" with reset; pending onboarding = warning tag.
- **Boundary:** destructive ops stay inside confirm sheets; no inline buttons on rows.

## 5. Organization

- **Job & audience:** the org tree (states → zones → branches) for orientation; ADMIN/LP create units.
- **Structure:** header ("Organization") → expandable tree rows (state chevron → zones → branches, indent guides + count badges) → "Create unit" gold CTA → bottom-sheet create form (type segmented control → name + parent pickers).
- **Interaction:** expand/collapse per state; long-press or row chevron — keep simple tap-to-expand.
- **States:** skeleton; empty = "No states yet" + create CTA; create success = toast-free inline new row.
- **Boundary:** creation needs parent selection always visible — never a blank freeform parent field.

## 6. Approvals

- **Job & audience:** LEAD_PASTOR signs off national monthly summaries — a decision queue, not a list.
- **Structure:** header → "Pending decisions" section (decision cards: month/year serif figure, submitted-by meta, approve/deny pair) → "Monthly history" (decided rows with outcome tag).
- **Interaction:** approve = gold button; deny = ghost/danger with confirm; decided cards collapse out to history.
- **States:** empty pending = "All clear" (check + calm copy); history empty = quiet caption only.

## 7. Summaries

- **Job & audience:** read-only monthly rollups for HQ/LP — the archive view.
- **Structure:** header + month picker → list of summary cards (month serif figure, status tag, key totals row).
- **States:** empty → "No summaries" for the selected month; picker never navigates away.

## 8. Profile

- **Job & audience:** self-service account view for every role.
- **Structure:** header (avatar + name serif + role badge) → Account (email, phone) → Assignment (branch/zone/state, role) → App (version, update channel) → Session (sign out, ghost danger).
- **States:** avatar fallback = initials on navy-mute; sign out = confirm sheet.
- **Boundary:** no settings sprawl — read-only sections plus the one session action.

## 9. Notifications

- **Job & audience:** the alert inbox; unread items route to their target screen.
- **Structure:** header ("Notifications" + unread meta) → rows (unread gold dot, title, body caption, time meta, unread = subtle surface tint) → mark-all-read ghost action.
- **Interaction:** tap → mark read + deep-link to target (report, approval, pastor).
- **States:** empty = calm "You're caught up".

## 10. Library

- **Job & audience:** placeholder for HQ-published sermons/books — keep the honest EmptyState ("Sermons and books from HQ") rather than a fake catalog.
- **Boundary:** do not build fake content; when the API lands, this becomes a simple document list with the same row grammar.

---

**Shared boundaries (all screens):** no new native deps (pure-RN so changes ship OTA); every numeric value in Fraunces; status = small-caps tags on soft washes; destructive actions behind confirms; skeletons match final layout (no spinner-only loads).
