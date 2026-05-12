# Sheets setup (one-time)

This is the one-time setup to wire up Google Sheets as the content source for the site. Once done, the VA edits the sheet, the site rebuilds automatically, and you never touch it.

There are four steps. Total time: ~30 minutes.

---

## 1. Create the sheet

1. In Google Drive, create a new Google Sheet. Name it **On Stage Events** or similar.
2. Set up the columns in row 1. Use these **exact column names** (case-insensitive, order doesn't matter):

   ```
   ID  |  Title  |  Organization  |  Category  |  Performance Dates  |  Duration  |  Description  |  Short Description  |  Ticket URL  |  Price Range  |  Age Guidance  |  Image Filename  |  Image Alt  |  Accent Color  |  Hidden
   ```

3. **Add data validation (dropdowns) to two columns** so the VA can't typo them:
   - Select column **Organization** → Data → Data validation → Add rule → "Dropdown" → list these four values exactly:
     - `encore-performing-arts`
     - `stage-door`
     - `st-george-dance-company`
     - `fmasu`
   - Select column **Category** → Data → Data validation → Add rule → "Dropdown" → list:
     - `theater`
     - `dance`
     - `film`
     - `music`
     - `other`

4. **Recommended: freeze row 1** (View → Freeze → 1 row) so the header stays visible while editing.
5. Add a few rows of real events so you can test the integration (you can copy current entries from each org's website).

---

## 2. Publish the sheet as CSV

The build script fetches the sheet as a CSV at build time.

1. In the sheet, go to **File → Share → Publish to web**.
2. In the "Link" tab, choose:
   - Document: the specific sheet/tab with your events
   - Format: **Comma-separated values (.csv)**
3. Check **"Automatically republish when changes are made"**.
4. Click **Publish**.
5. **Copy the URL.** It will look like:

   ```
   https://docs.google.com/spreadsheets/d/e/2PACX-1vXXX.../pub?output=csv
   ```

Keep that URL handy — you'll paste it into Netlify in step 4.

**Note on visibility:** Publishing to web makes the sheet's contents readable by anyone with this exact URL. The events are going on a public website anyway, so this is fine. The URL itself is unguessable.

---

## 3. Create a Netlify build hook

A build hook is a URL that triggers a fresh build when called. The Google Apps Script in step 4 will call this URL whenever the sheet changes.

1. In Netlify, go to your site → **Site configuration → Build & deploy → Build hooks**.
2. Click **Add build hook**.
3. Name it `Google Sheet` and target branch `main` (or whichever branch your site builds from).
4. Save. Copy the URL Netlify gives you. It looks like:

   ```
   https://api.netlify.com/build_hooks/abc123xyz
   ```

---

## 4. Add the env var and the Apps Script

### Add the env var in Netlify

1. In Netlify → **Site configuration → Environment variables → Add a variable**.
2. Key: `SHEETS_CSV_URL`
3. Value: the URL from step 2.
4. Save.

Trigger a deploy (Deploys → Trigger deploy → Deploy site) to confirm the site now builds from the sheet. Check the build log — you should see `✓ Generated events.json from sheet (N events, M performances)`.

### Add the Apps Script

This makes the sheet auto-rebuild the site when edits happen.

1. In the sheet, go to **Extensions → Apps Script**.
2. Delete any existing code in the editor.
3. Paste this in, replacing `YOUR_BUILD_HOOK_URL` with the URL from step 3:

   ```javascript
   const BUILD_HOOK = 'YOUR_BUILD_HOOK_URL';
   const DEBOUNCE_MINUTES = 5;

   function onEdit(e) {
     const props = PropertiesService.getScriptProperties();
     const lastTriggered = Number(props.getProperty('lastTriggered') || 0);
     const now = Date.now();
     if (now - lastTriggered < DEBOUNCE_MINUTES * 60 * 1000) {
       // Already queued — Apps Script time trigger will fire it
       props.setProperty('pendingEdit', String(now));
       return;
     }
     UrlFetchApp.fetch(BUILD_HOOK, { method: 'post' });
     props.setProperty('lastTriggered', String(now));
     props.deleteProperty('pendingEdit');
   }

   function flushPending() {
     const props = PropertiesService.getScriptProperties();
     const pending = props.getProperty('pendingEdit');
     if (!pending) return;
     const lastTriggered = Number(props.getProperty('lastTriggered') || 0);
     if (Date.now() - lastTriggered < DEBOUNCE_MINUTES * 60 * 1000) return;
     UrlFetchApp.fetch(BUILD_HOOK, { method: 'post' });
     props.setProperty('lastTriggered', String(Date.now()));
     props.deleteProperty('pendingEdit');
   }
   ```

4. Save the script (give it any name — e.g. "On Stage Rebuild Trigger").
5. Set up triggers:
   - In Apps Script, click the clock icon in the left sidebar ("Triggers").
   - **Add a trigger:**
     - Function: `onEdit`
     - Event source: From spreadsheet
     - Event type: On edit
   - **Add a second trigger** to flush any pending edits:
     - Function: `flushPending`
     - Event source: Time-driven
     - Type: Minutes timer
     - Interval: Every 10 minutes
6. Save and authorize when prompted (Apps Script will ask for permission to call external URLs and read the sheet).

### How the debounce works

- First edit fires a rebuild immediately.
- Further edits within 5 minutes are batched — they don't fire fresh rebuilds.
- After the debounce window expires, the next time `flushPending` runs (every 10 minutes), it fires one more rebuild to pick up the recent edits.
- Worst-case delay between final edit and live update: ~15 minutes.

---

## Verifying the whole thing works

1. Open the sheet and add a test event row.
2. Wait ~2 minutes (1 minute for the trigger, ~1 minute for Netlify to build).
3. Check the live site — the new event should appear on `/events/`.
4. If it doesn't, check the Netlify deploy log for errors.

---

## Troubleshooting

**Build fails with "Could not fetch the events sheet."**
The publish-to-web URL might have expired or been unpublished. Re-do step 2.

**Build fails with a row-level error.**
The error message names the row number and the field. Open the sheet, find the row, fix the field. Save. The next build will succeed.

**Apps Script trigger isn't firing.**
Check Extensions → Apps Script → Executions. If you see errors, click into them. Common cause: the BUILD_HOOK URL is wrong or wasn't updated. Most other issues clear up by re-saving the script.

**Edits aren't showing up after several minutes.**
The 5-minute debounce + the 10-minute flush interval means a brand-new edit can take up to ~15 minutes to appear if other edits happened recently. If you need an immediate rebuild, paste the build hook URL into a tool like Postman or call it from a terminal with `curl -X POST <URL>`.
