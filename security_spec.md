# VideoFlow AI Security Specification

## Data Invariants
1. A **Project** must belong to a user. Its `userId` must match the authenticated user's UID.
2. A **Workflow** must belong to a user. Its `userId` must match the authenticated user's UID.
3. A **StylePreset** must belong to a user. Its `userId` must match the authenticated user's UID.
4. Users can only read, update, or delete their own documents.

## Dirty Dozen Payloads (Hardened Rules Tests)
1. Project creation with `userId` of another user.
2. Workflow update by a user who is not the owner.
3. Project update attempting to change the `userId`.
4. StylePreset creation with a huge `configJson` string (resource exhaustion).
5. Workflow creation with invalid characters in the ID.
6. Project update setting `status` directly to 'completed' without processing (system-only logic, though for now we allow some states).
7. Reading another user's project by ID.
8. Listing workflows without filtering by `userId`.
9. Project creation with a `name` longer than 255 characters.
10. StylePreset deletion by a non-owner.
11. Project update with an invalid `mimeType`.
12. Workflow update with an invalid `version` type.

## Firestore Rules Drafting...
(Will be written to DRAFT_firestore.rules after this turn)
