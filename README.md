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

## PWA installation

Open the private site in Chrome, Edge, or Safari, sign in, then choose **Install app** in the studio. When a native prompt is unavailable, the button shows browser-specific instructions. The manifest supports standalone launch, branded regular/maskable/Apple icons, and a Capture shortcut. The authenticated manifest link requests credentials so installation works with the private-site boundary.

Offline launch shows a generic reconnect screen. Private responses, photos, authenticated HTML, APIs, and sign-in/OAuth traffic are never stored in the service-worker cache. The existing account-scoped pending-photo queue stays separate in IndexedDB. Keep a connected workspace open to upload and transcribe; background uploads and a full offline dashboard are not promised. Downloaded standalone presentations still work offline.

New service-worker versions wait rather than forcing reloads. An explicit update checks for pending photos and asks you to save review/theme edits before reloading.

PWA checks: `node --test tests/pwa.test.mjs` validates manifest/icon dimensions, the public-only cache, API/auth exclusions, redirect-poisoning protection, fallback behavior, and update activation scope.

Sites rewrites HTML URLs/bodies. The worker therefore embeds the generic offline page directly and never fetches or caches HTML from the host. After editing `public/offline.html`, run `node scripts/generate-offline-page.mjs` before testing/building.

The local browser offline-launch check passed with the preview server stopped. Native phone installation/reopening still needs device acceptance. `scripts/check-pwa-assets.mjs` accepts the Site URL and optional service-access token through hidden stdin, verifies seven deployed PWA resources against local SHA-256 hashes, checks the embedded offline page, and checks anonymous API privacy.

## Source and hosting

The canonical working repository is `E:\Coding\Inversion`, with GitHub remote `https://github.com/DanPace725/Inversion.git`. Commit and push app changes there. Sites uses its existing registered source repository as a deployment mirror; it remains the same private Site with the same database, photos, and runtime secret. Hosting credentials, local caches, dependencies, and deployment staging stay ignored under `.sites-runtime/`.

## Using the studio

1. Sign in on the PC and choose the session.
2. Open the app on your phone and sign in with the same ChatGPT account. The PC's **Connect phone** QR is an optional shortcut.
3. Tap **Camera** in the phone's bottom navigation to open the camera directly. Check framing and confirm upload. Use the capture screen's medium selector for quill or other handwriting.
4. Keep the phone or PC workspace open while transcription jobs process.
5. Review text, mark verified, add an excerpt and record permission, then save.
6. Approve the saved excerpt separately. Edits or withdrawals invalidate the active presentation snapshot.
7. Suggest/edit/save groups. Freeze the presentation, open it, and download an offline copy.

Mobile navigation keeps Responses, Camera, and Themes available on every screen. Themes also has an explicit **Back to responses** button on all screen sizes. Leaving an unsaved review or theme draft asks whether to keep editing or discard it. The camera opens in the tap event, without a QR or pairing step on the phone; the browser and device determine whether the image picker launches the rear camera or offers a camera choice.

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
