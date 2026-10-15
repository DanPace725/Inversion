# Inversion Reflection Studio

Private web workbench for the One80 Inversion retreat. Open the same hosted app on a phone and PC using the same ChatGPT account.

## Current first version

- Four retreat sessions with separate response collections.
- Phone camera/gallery capture, preview, image resizing, local IndexedDB upload queue, durable upload acknowledgement, and idempotent retries.
- Private photos in R2 and response/job state in D1.
- Automatic OpenAI image transcription while a workspace is open. Persisted jobs can resume after interruptions; there is no unattended scheduler yet.
- Side-by-side photo/text review, human verification, separate excerpt permission and approval, and conflict detection.
- Paste digital answers from a separate form, separated by blank lines.
- AI theme suggestions with editable labels and membership; manual groups and ungrouped answers remain available.
- Frozen presentation with theme counts, approved excerpts, medium counts, keyboard navigation, and standalone offline HTML download.
- Delete responses/photos and export private text data. Text exports are not full photo backups and do not yet have an automated restore interface.

The app starts empty. Test fixtures are synthetic and are not production retreat responses. No student accounts or form builder are included.

## Operation

1. Sign in on the PC and choose the session.
2. Connect phone; scan the QR and sign in with the same ChatGPT account.
3. Choose the medium, take a photo, check framing, and confirm upload.
4. Keep the phone or PC workspace open while transcription jobs process.
5. Review text, mark verified, add an excerpt and record permission, then save.
6. Approve the saved excerpt separately. Edits or withdrawals invalidate the active presentation snapshot.
7. Suggest/edit/save groups. Freeze the presentation, open it, and download an offline copy.

Hosted capture and AI require internet. Browser queues are best effort, and closed-app/background uploads are not guaranteed. Keep originals until upload is acknowledged. Downloaded presentations contain only the approved display payload; removing approval cannot revoke copies already downloaded.

## Development

Node 22.13 or later. Use the Sites plugin workflow for installation, builds, source packaging, and private publication. The Windows npm shim in `.sites-runtime/bin` works around a host-specific npm launcher issue and is ignored by Git.

Runtime bindings: `DB` (D1), `BUCKET` (R2), `OPENAI_API_KEY` (secret), `OPENAI_MODEL` (defaults to `gpt-4.1-mini`). The existing API key was reused with user permission and configured as a hosted secret. It is never included in source, client code, or production build configuration. Local preview gets its AI key from the inherited process environment via a development-only binding.

Generate schema changes with `npm run db:generate`; production migrations are applied by Sites publication. Local development uses the starter's Wrangler D1 commands and `.wrangler/state`.

Checks:

- `node node_modules/typescript/bin/tsc --noEmit`
- `node --experimental-strip-types --test tests/domain.test.ts`
- `node scripts/smoke.mjs` against the running local preview. This performs small real OpenAI requests on a synthetic handwriting fixture, checks private access/upload retries/verification/approval/grouping/projection/withdrawal, and deletes its test records by default. Set `INVERSION_KEEP_TEST_DATA=1` only for local visual inspection.

## Verification and next checks

Passed local typecheck, production build, six domain safety tests, a live OpenAI transcription/grouping smoke test with synthetic handwriting, and browser upload through the UI. This does not establish real handwriting accuracy or native phone-camera behavior. Validate actual quill/pen samples, actual phone browser, camp connectivity, and solo 30-response throughput before retreat use.

Still deferred: CSV column mapping, multi-response image segmentation, crop/rotation tools, unattended job scheduling, full backup/restore, short-lived limited-access phone pairing, and a complete offline dashboard. The current QR is a normal private-site capture link, not an authentication token; both devices sign in as the owner. Only the active frozen snapshot is served; previously downloaded copies need separate removal.
