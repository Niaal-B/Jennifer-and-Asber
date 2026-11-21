# RSVP backend: Google Sheets + Apps Script

RSVPs are stored in a private Google Sheet. The website never talks to the
Sheet directly:

```
Guest's browser ──POST /api/rsvp──▶ Vercel function (api/rsvp.ts)
                                      │  validates, spam checks, adds secret
                                      ▼
                         Apps Script web app (Code.gs) ──▶ Google Sheet "RSVP"
```

## Sheet columns

| Submitted At (IST) | Name | Attendance | Guest Count | Message | Submission ID |
|---|---|---|---|---|---|
| 2026-12-02 19:41:07 | Fathima Rahman | Attending | 3 | Congratulations! | 3f2b8c1e-… |

- **Attendance** is `Attending` or `Not Attending`. **Guest Count** is 0 when not attending.
- **Submission ID** identifies one form submission. A retried submission isn't written twice.
- If a guest uses **Update RSVP**, a new row is added. The latest row for a name is their current answer.
- Values starting with `= + - @` are stored with a leading `'`, so they can't run as formulas.

## One-time setup (about 10 minutes)

1. **Create the Sheet.** In the Google account that should own the guest list,
   create a new Google Sheet (e.g. "Jennifer & Asber – RSVP"). Leave it private
   and don't share it publicly.
2. **Add the script.** In the Sheet, open **Extensions → Apps Script**. Delete the
   sample code, paste the whole of `apps-script/Code.gs`, and save.
3. **Run `setup` once.** Choose `setup` in the function dropdown and click
   **Run**. Approve the permission prompt (Google will warn that the app is
   unverified; choose *Advanced → Go to project*). This:
   - creates the `RSVP` tab with headers, and
   - generates a random `SHARED_SECRET` in Script Properties.
4. **Copy the secret.** Go to **Project Settings (gear) → Script Properties** and copy
   the value of `SHARED_SECRET`. Optionally add `MAX_GUESTS` (default `10`).
5. **Deploy as a web app.** Click **Deploy → New deployment → type: Web app**.
   - Description: `RSVP v1`
   - Execute as: **Me**
   - Who has access: **Anyone** (needed so Vercel can call it; requests without
     the secret are rejected, and the script never returns sheet data)

   Click **Deploy** and copy the **Web app URL** (ends in `/exec`).
6. **Set the Vercel environment variables** (Project → Settings → Environment
   Variables, for Production and Preview):
   - `RSVP_SCRIPT_URL` = the web app URL
   - `RSVP_SHARED_SECRET` = the secret from step 4
   - `RSVP_MAX_GUESTS` = `10` (optional)

   Redeploy the site so the function picks them up.

## Changing the script later

After editing `Code.gs`, use **Deploy → Manage deployments → (edit) → Version: New
version → Deploy**. This keeps the same `/exec` URL. Choosing "New deployment"
instead would create a new URL, which you'd then have to update on Vercel.

## Verify it works

1. Visit the web app URL in a browser. You should see only `{"status":"ok"}`, with no data.
2. Submit an RSVP on the live site. A row appears in the `RSVP` tab within a few seconds.
3. Optional check from a terminal (replace the URL); it should be rejected:
   ```bash
   curl -sL -X POST -H 'Content-Type: application/json' \
     -d '{"secret":"wrong","name":"Test"}' 'https://script.google.com/macros/s/XXXX/exec'
   # → {"ok":false,"error":"unauthorized"}
   ```

## Protection in place

| Threat | Mitigation |
|---|---|
| Someone calls Apps Script directly | Shared secret, which is checked in constant time |
| Reading the guest list | The Sheet stays private; `doGet` returns only a health status |
| Bots | Honeypot field, plus a minimum 3-second fill time (bots get a fake success) |
| Floods | Proxy: 5 requests/min per IP. Apps Script: 30 submissions/min overall, plus the same name blocked for 30s |
| Double taps and retries | One `submissionId` per dialog, checked under `LockService` |
| Bad data | Validated in the browser, the proxy and Apps Script (attendance values, 1–10 guests, length limits) |
| Formula injection | Leading apostrophe on `= + - @` values |

## Quotas

The free Google account limits (~20k URL calls per day and 6 minutes of script
time per run) are far above what a wedding RSVP needs.
