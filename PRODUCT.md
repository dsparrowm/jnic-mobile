# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Church operations staff across a five-level hierarchy: `LEAD_PASTOR` > `ADMIN` > `STATE_PASTOR` > `ZONAL_PASTOR` > `BRANCH_PASTOR` (Admin and HQ Admin are the same role). Screens are designed for all roles equally — each role sees the same design language with role-appropriate data. Branch pastors submit weekly reports from the field (often on modest Android devices); HQ/Admin monitors national coverage; the lead pastor reviews and approves summaries.

## Product Purpose

JNLOP (Jubilee Nation Leadership & Operations Platform) is the mobile companion for JNIC's church operations. It replaces WhatsApp-and-spreadsheet reporting with real-time national visibility of weekly reporting coverage, enforced accountability (missed reports surface immediately), and structured rollups and approval workflows. Success = every branch report submitted on time and visible nationally without manual chasing.

## Positioning

Built-in hierarchy awareness — reports roll up branch → zone → state → national automatically, and every screen is scoped to the viewer's actual jurisdiction. A generic reporting tool cannot truthfully copy this because the RBAC tree is the product.

## Operating Context

Field use on Android phones, often on intermittent connectivity. Reporting runs on a weekly cadence ending Sunday; monthly summaries roll up for approval. The API (NestJS, deployed on Render) is the same backend as the web admin app in `jnic-management`.

## Capabilities and Constraints

- Weekly report submission (attendance + finance) with zone/state rollup and forwarding
- HQ dashboard: coverage, attendance trend, needs-attention queue, recent activity
- Org tree (states/zones/branches), pastor onboarding and directory, pending approvals
- Role-based tab navigation; RBAC enforced in API guards, never UI-only
- Shipped as arm64-v8a Android APK via EAS; JS-only changes deliver OTA via `eas update`
- No react-native-svg / expo-linear-gradient: adding native deps requires a new APK, so visual work must stay pure-RN where possible

## Brand Commitments

JNIC navy + gold palette; "JNLOP" product name; Plus Jakarta Sans body type with Fraunces as the display serif for numerals. The Midnight Executive direction (deep navy surfaces, single gold accent, editorial serif figures) is the chosen visual identity.

## Evidence on Hand

Real dashboard/report data comes from `https://jnic-management.onrender.com`. No marketing assets, testimonials, or press — do not fabricate any.

## Product Principles

1. Glanceable truth: an HQ user should read national health in seconds — state, coverage, exceptions.
2. Accountability over decoration: surface missed/late work plainly; ornament never competes with status.
3. One design language, every role: consistency reduces training cost across a non-technical field team.
4. Ship via OTA: prefer pure-RN solutions so fixes and polish reach installed APKs without a rebuild.
