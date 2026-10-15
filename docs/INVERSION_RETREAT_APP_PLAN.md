# Inversion retreat: handwritten responses to shared insights

Revised October 15, 2026. Proposed plan; no app or handwriting recognition has been implemented or validated.

## Direction and source

The app is a responsive, hosted web facilitator workbench: open it on a phone, launch the camera, photograph handwritten responses, upload and automatically transcribe them, then review, analyze/group, and present from a PC. Both devices share the same private retreat workspace. The student-facing form stays separate. Google Forms or another simple form can supply digital answers through CSV import or paste; direct integration is deferred.

This follows the user's clarification and estimate of about 30 students and one facilitator. Plan for roughly 30 responses per session, about 120 across four sessions if each student contributes once. Counts describe submissions, not unique participants.

Conclave sources retrieved in full at revision 1:

- `one80-inversion-retreat-reflection-station-multimodal-ingestion--80` — primary requirements, saved October 15.
- `one80-fall-retreat-2026-mystery-hiddenness-freedom-and-revelatio--58` — earlier retreat context.
- `one80-retreat-mirror-enigma-and-attention-scriptural-ponderings--78` — exploratory supporting context.

Retreat date/location in the handoff: November 20–22, 2026, Camp Koinonia. The newer app handoff puts Peace before Pursuit, reversing the older context. Follow the newer order provisionally. Mystery mechanics and mirror imagery remain exploratory; they need not be resolved to build the workbench.

## The workflow

**Open phone capture → choose session → photograph → upload and automatically transcribe → review on PC → suggest/refine groups → present.**

### 1. Capture a batch

- On the PC, sign in, open the retreat workspace, and select Connect phone. Scan a short-lived QR pairing link on the phone to open the same workspace in capture mode. Also allow normal sign-in on the phone. Pairing grants limited capture access, not public access to the review dashboard.
- On the phone, select the question/session once and tap Take photo. Launch the rear camera, preview/retake the image, then confirm Upload and take next. Each confirmed upload starts transcription automatically; the phone need not wait for it before capturing the next response.
- Use the browser's camera/file capture picker for the first version, with gallery upload as an alternative. An embedded live camera can follow if repeated capture needs fewer taps. Camera-picker behavior varies by browser and must be tested on the actual phone. See [MDN capture](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture). An embedded camera using getUserMedia requires a secure context and permission; serve the app over HTTPS. See [MDN MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices).
- The PC queue refreshes as uploads and transcripts arrive. Desktop batch photo/scan upload remains available.
- Default to one response per image, with a short paper ID such as PEACE-07. This helps find the original and avoid double entry.
- Support rotation/cropping and a simple retake warning for blurred or clipped images.
- Record quill/pen/other medium at batch level, allowing individual corrections.
- Keep a photo's session fixed even after moving to the next question.
- A photo containing several responses needs a split/segmentation review; defer automatic multi-answer segmentation until single-response intake works reliably.
- Direct phone upload is an MVP requirement. Show separate states for saved on phone, uploading, received by server, transcribing, needs review, and failed. Only report received after durable server acknowledgement. Keep a stable capture ID so retries cannot create duplicate responses.
- Queue pending images locally when feasible, retry while the app is open, and make unsent counts obvious. Browser storage/background execution can be interrupted or cleared; do not promise reliable closed-app uploads. Test airplane mode, phone locking, page reload, and reconnection on the actual phone. Keep originals until upload acknowledgement, and provide a gallery/manual upload fallback.

### 2. Convert handwriting into editable text

AI-assisted handwriting transcription is a central prototype feature. Use a swappable vision/transcription adapter so we can test candidate services on actual quill and pen samples before choosing one. Provider and model are undecided; no paid API work is required for this planning stage.

Each image produces a draft transcription tied to the source image, with uncertain spans explicitly marked. An uncertainty indicator is a review aid, not a calibrated guarantee of accuracy. Never infer unreadable words from the retreat topic.

Review screen:

- Photo on the left, editable transcription on the right.
- Keyboard-friendly Next, Previous, Save, and Mark verified controls.
- Visible uncertainty and permission status.
- All responses need human verification; uncertainty flags determine review order rather than replacing review.
- Preserve the machine draft, corrected transcription, original image, and optional display excerpt separately.

The goal is checking and correcting rather than retyping every response. Manual transcription remains available when recognition fails.

### 3. Suggest and refine groups

Run analysis on verified responses for the selected question. Ask AI to propose about three to five groups, each with:

- A short editable title and a plain-language explanation.
- Exact supporting response IDs.
- Suggested representative excerpts copied from verified text.
- Contrasting answers or responses that do not fit comfortably.

The facilitator can rename, merge, split, add/remove membership, or leave an answer ungrouped. Preserve minority answers; do not force everything into the dominant theme. Responses may have multiple themes, with counts labelled accordingly.

Calculate counts from stored membership, not from AI-written totals. Reject unknown response IDs and quotations that do not match the verified source. Display AI interpretations separately from students' words. Re-running analysis creates suggestions for review and does not overwrite accepted edits.

A facilitator can do all grouping manually if AI is unavailable. Medium comparisons show what people selected; they do not establish why they selected it or imply personality, motive, or time orientation.

### 4. Compose the session opening

Select a small set of reviewed material and click Preview presentation. Suggested sequence:

1. The reflection question.
2. About three themes, with simple bars or counts and a clear reviewed-response denominator.
3. Four to six permitted anonymous excerpts, including differing perspectives where appropriate.
4. An optional medium-distribution chart or a facilitator-edited discussion question.

These are suggested limits, not quotas. Show fewer excerpts when permission or time is limited. Avoid word clouds as the primary summary because they remove context.

Separate approval for public excerpts from private analysis. Missing permission means no public excerpt. Review aggregates for identifying or vulnerable small groups. Editing approved text requires renewed approval. Do not present generated paraphrases as student quotations.

Presentation mode receives only approved display data. It has large type, high contrast, full-screen controls, and a frozen snapshot so incoming edits cannot interrupt teaching. Save a standalone HTML presentation with bundled assets for use without internet; add print/PDF output if it proves useful. Corrections/withdrawals require replacing or removing affected snapshots and exports.

## Separate digital form

Keep form management outside this app. Suggested fields: question/session, response, medium, optional reason for medium choice, and optional permission for an anonymous excerpt. Prefer a separate form or stable question ID per session so later prompt edits do not change the meaning of older answers.

MVP import options:

- CSV: preview columns, map question/answer/medium/permission, then confirm import.
- Paste: one explicitly separated answer per entry, followed by a preview.

Imported text skips handwriting transcription but still needs content/permission review. Unknown consent values default to no public excerpt. Preserve import batch and row identity, flag repeat imports, and avoid automatic deduplication of identical wording: two students may give the same answer. Mixed-session rows must be mapped explicitly.

No form API, student kiosk software, or dedicated local router is required for the workbench MVP. Phone-to-PC updates happen through the shared backend. Availability of the chosen separate form at camp is an independent operational check. Paper remains available if that service cannot be reached.

## Build shape

A hosted HTTPS web application with two responsive layouts: a large-button phone capture screen and a PC workspace with Intake, Review, Groups, and Present. Presentation opens in a separate window for the projector. No native app installation is required; a home-screen shortcut is optional.

Store sessions, response images/original text, draft and verified transcriptions, source/medium, import identity, permission and review states, theme membership, and approved presentation snapshots in a shared database and private object storage. Keep facilitator edits across restarts. Backups must include both records and images. The phone and PC may use different networks as long as both can reach the service.

Choose hosting, database, storage, and exact dependencies during implementation. A TypeScript web app/backend plus a durable transcription worker is the starting proposal. Persist the uploaded image and pending job before reporting success. Jobs must survive browser closure and backend restarts; retries must not overwrite verified work. Store AI credentials only on the server. Keep image access private and workspace-scoped; expiring phone pairing can be revoked. Presentation endpoints return only approved display data.

Transcription starts automatically after each confirmed upload. Suggest groups remains an explicit facilitator action on verified responses. Also offer manual re-transcription/retry for selected images, without overwriting verified text. Show progress per response, partial failures, retry, and cancellation. Save completed results as jobs finish. Retrying a failed operation must not duplicate a response. Choose bounded concurrency after measuring speed and cost.

Hosted upload, synchronization, transcription, and grouping require internet. The phone's pending queue is a best-effort interruption aid, not a fully offline service. Existing exported presentations work without internet; the hosted dashboard is not assumed to work offline. Before each session, download approved material and a private working export if manual fallback is needed. If camp connectivity is insufficient, revise the deployment approach explicitly; a PC-hosted local server requires additional network/HTTPS setup and is a different operating mode.

Before real student content is sent to a third party, settle provider access and the organizer's processing/retention policy. Avoid names/accounts by default, recognize that handwriting/free text may still identify someone, and keep originals out of projector output. Decide when to delete raw images, text, backups, and exported files; no retention period is currently established.

## First prototype and verification

Build one complete useful batch workflow before integrations:

1. Open the same workspace on the actual phone and PC. Capture/upload 10–15 volunteered/synthetic quill and pen samples, including messy and crossed-out writing; confirm they appear on the PC without manual file transfer.
2. Generate draft transcriptions and verify them beside the photos.
3. Suggest groups, edit membership, and preserve an outlier.
4. Select permitted excerpts and open the frozen projector view.
5. Save, restart, and recover the work; interrupt an upload and transcription job, reconnect, and verify no silent loss or duplicate response. Export and open the presentation without internet.

Measure total elapsed time and facilitator hands-on time, correction burden, uncertain-word handling, and failed-image rate. Count AI processing cost separately. Then rehearse a 30-response batch. A useful provisional target is 10–15 minutes of facilitator work for short answers, but this is an acceptance target to test, not a prediction. If it is missed, simplify output or reduce the reviewed selection rather than skipping verification.

Behavior checks:

- Paper/image boundaries and session attribution remain correct.
- No invented wording or unsupported response IDs appear in accepted results.
- Unverified or unapproved text cannot enter the public view.
- Theme totals match actual memberships, with multi-label counts explained.
- Imported rows preserve meaning and permission; repeated imports are flagged.
- Changing/re-running groups preserves facilitator decisions until explicitly replaced.
- Phone uploads show honest acknowledgement/status, preserve question attribution, and retry without duplicate responses.
- Interrupted AI jobs retain completed work and can retry failed items after browser/backend restart.
- Presentation payload/export contains no private images or hidden raw answers.
- Saved server work is recovered after reconnection; downloaded presentations remain available when internet disappears.

## Sequence to the retreat

| Stage | Target | Deliverable |
| --- | --- | --- |
| Phone-to-PC handwriting proof | By Oct 23 | Phone camera → durable upload → automatic draft text on PC → fast correction; test real samples |
| Analysis and display | By Oct 30 | Editable groups, source-linked excerpts, approval, frozen projector view |
| Imports and recovery | By Nov 6 | CSV/paste, duplicate warnings, backup/restore, saved offline presentation |
| Solo rehearsal | By Nov 13 | Timed 30-response run and tested network/AI failure paths |
| Finish and freeze | Nov 14–19 | Fix rehearsal issues, polish large-screen readability, prepare equipment/runbook |

This schedule is provisional. Prioritize handwriting conversion, editable grouping, and presentation; integrations and visual embellishment follow only after the core workflow works.

## Four-session operation

| Display this question from | Question | Prepares |
| --- | --- | --- |
| Friday registration | Where do you find peace? | Friday evening: Peace |
| After Friday session | What are you chasing? | Saturday morning: Pursuit |
| After Saturday morning | What's your passion? | Saturday evening: Passion |
| After Saturday evening | What's your purpose? | Sunday morning: Purpose |

Swap the physical sign and separate form immediately after each session. Collect labelled paper in trays; digitize manageable batches during breaks. Start preparing the presentation about 30–45 minutes before teaching, using the rehearsal to set the real cutoff. Freeze the selected presentation about 10 minutes before the session. Friday may need a smaller selection because registration gives less time.

If AI/network fails, correct/type the small number of excerpts needed, group manually, and present the saved approved material. If the app fails, use the exported deck or reviewed printed excerpts. Unreviewed responses never become the emergency presentation.

Remaining decisions: actual phone/browser and PC/projector devices; whether the facilitator is also speaking; sample handwriting quality; camp internet availability for the hosted app, AI, and separate form; hosting/provider budget; processing/retention policy; and preferred visual style. No student form needs to be built to start the phone-camera-to-presentation prototype.
