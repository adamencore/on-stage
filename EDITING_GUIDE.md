# How to add and edit events on On Stage

This guide is for whoever maintains the events list. You don't need to know how to code — you just edit a Google Sheet.

Every event on the site comes from one Google Sheet. Add a new row, save, and the site updates itself in a couple of minutes.

---

## The basics

1. Open the **On Stage Events** Google Sheet (the maintainer will share the link).
2. Each row in the sheet is one event.
3. To add a new event, add a new row at the bottom and fill in the columns.
4. To edit an event, change the cells in its row.
5. To remove an event, delete the row — or set the **Hidden** column to `TRUE` if you want to keep the row for reference.

The site rebuilds automatically about a minute after you stop editing. You don't have to push a button.

If you make a mistake (a bad date, a missing field), the rebuild fails and the live site stays as it was. The maintainer gets a failure notice. Nothing breaks for visitors.

---

## Column reference

The sheet has these columns. Most are required.

### Required columns

| Column | What it is | Example |
|---|---|---|
| **ID** | A unique tag for this event. Make it from the org, the show title, and the year-month. Lowercase, hyphens between words. Once an event is saved, don't change its ID — it's the event's permanent address on the site. | `sgdc-spring-concert-2026-04` |
| **Title** | The name of the show. | `Dear Evan Hansen` |
| **Organization** | Which resident company is producing. Pick from the dropdown. | `stage-door` |
| **Category** | What kind of event. Pick from the dropdown: theater, dance, film, music, or other. | `theater` |
| **Performance Dates** | One date per line, in the format `YYYY-MM-DD HH:MM` using 24-hour time. To add multiple dates in one cell, press `Alt + Enter` (Windows) or `Option + Enter` (Mac) between them. See "How to format dates" below. | `2026-09-11 19:30`<br>`2026-09-12 19:30`<br>`2026-09-18 19:30` |
| **Duration** | How long each performance is, in minutes. Leave blank to default to 120 (2 hours). | `135` |
| **Description** | One paragraph about the event. Shows on the event's detail page. | `Stage Door's fall production of Thornton Wilder's Pulitzer-winning play...` |
| **Short Description** | One sentence used on event cards. Under 180 characters. | `Stage Door's fall production of the Pulitzer-winning Wilder classic.` |

### Optional columns

| Column | What it is | Example |
|---|---|---|
| **Ticket URL** | Where visitors go to buy tickets — usually the producing org's website. | `https://www.stagedoorutah.com/` |
| **Price Range** | How much tickets cost. Free text — for humans, not parsed. | `$15–$25` or `Free` |
| **Age Guidance** | Audience recommendation. | `All ages` or `Recommended 13+` |
| **Image Filename** | A square image for the event. Just the filename — the path is added automatically. The file must already be uploaded to the site (see "Adding an image" below). | `our-town.jpg` |
| **Image Alt** | A short description of the image for screen readers and search engines. | `Our Town — Stage Door at the Electric Theater` |
| **Accent Color** | A hex color used as the accent on the event's detail page. Pick a color from the image at [coolors.co/image-picker](https://coolors.co/image-picker). | `#5c4633` |
| **Hidden** | Set to `TRUE` to keep the row but not show the event on the site. Leave blank to show it. | `TRUE` |

---

## How to format dates

The Performance Dates column uses this format:

```
2026-09-11 19:30
```

- `2026-09-11` is September 11, 2026 (year-month-day).
- `19:30` is 7:30 PM (24-hour time — add 12 to PM times: 1 PM = 13:00, 7 PM = 19:00, etc.).
- Dates are interpreted as **Utah local time** automatically. You don't need to add a timezone.

To add multiple performance dates in one cell, press **Alt + Enter** (Windows) or **Option + Enter** (Mac) between them. The cell will expand:

```
2026-09-11 19:30
2026-09-12 19:30
2026-09-18 19:30
```

That's an event with three performances.

---

## Adding an image to an event

Images are added to the site by the maintainer, who needs three things from you:

1. The **image file** (see naming rules below).
2. **Alt text** — a short description for screen readers and search engines (e.g. "Our Town — Stage Door at the Electric Theater").
3. (Optional) An **accent color** — a hex code picked from the image, e.g. `#5c4633`. Use [coolors.co/image-picker](https://coolors.co/image-picker): upload the image, click a dominant color, copy the hex.

Once the maintainer adds the file to the site, you'll fill in three cells in the event's row:

- **Image Filename** — the filename only (e.g. `our-town.jpg`)
- **Image Alt** — the description
- **Accent Color** — the hex code

### Image naming rules

When sending an image to the maintainer, name the file like this:

- **Lowercase only.** `our-town.jpg`, not `Our-Town.jpg` or `OurTown.jpg`.
- **Hyphens between words**, never spaces or underscores. `dear-evan-hansen.jpg`, not `Dear Evan Hansen.jpg` or `dear_evan_hansen.jpg`.
- **No special characters.** No apostrophes, ampersands, parentheses, accented letters. `beauty-and-the-beast.jpg`, not `Disney's Beauty & the Beast.jpg`.
- **Match the event ID where possible.** If the event ID is `encore-lion-king`, name the image `encore-lion-king.jpg`. This keeps things searchable later.

### Image specs

- **Square** (same width and height). Most posters work. Crop to square if needed.
- **800 to 1200 pixels on the long side.** Bigger is wasted; the site scales down.
- **Under 500 KB.** If a JPG is over 1 MB, run it through a free compressor like [squoosh.app](https://squoosh.app) first.
- **Format:** WebP is best (smallest file), JPG is fine, PNG only if you need transparency.

---

## Common mistakes

**Wrong date format.** Dates must be `YYYY-MM-DD HH:MM`. The most common slip-up is using `9/11/2026 7:30 PM` instead of `2026-09-11 19:30`. The first won't parse.

**Multiple dates on one line.** Multiple dates must each be on their own line within the same cell. If they're all on one line separated by commas, only one will be picked up. Use Alt+Enter / Option+Enter to add line breaks within a cell.

**Changing an ID after publishing.** Once an event is live, its ID is its URL. Changing the ID changes the URL and breaks anyone who has linked to it. Add a new row with a new ID rather than editing the ID of an existing event.

**Empty required fields.** Every row needs ID, Title, Organization, Category, Performance Dates, Description, and Short Description. If any of those are blank, that event won't appear on the site.

---

## When something goes wrong

If your save causes a build failure, the live site is unaffected. The maintainer will get an email naming the row and the field that needs fixing, e.g.:

```
✗ Sheet has 1 problem:
  • Row 7 (sgdc-spring-concert-2026-04): Could not parse performance date
    "4/15/2026 7:30 PM". Use format "YYYY-MM-DD HH:MM" (24-hour clock),
    e.g. "2026-09-11 19:30".
```

Fix the named cell in the sheet. The next build will succeed.

If you're not sure what's wrong, send the error message to the maintainer.
