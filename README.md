# Manlourd & Claire — wedding website

A static site (plain HTML, CSS and JavaScript, no build step) in the
**Golden Hour Heirloom** brand: parchment, espresso browns, antique gold,
Pinyon Script + Bodoni Moda + EB Garamond + Courier Prime.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: hero, message from the couple, Save the Date, countdown, journey teaser, FAQs, RSVP |
| `story.html` | Our Story: four chapters with photos and a quote |
| `gallery.html` | Gallery: favourites carousel + full album with a photo viewer |
| `journey.html` | Our Journey: eight chapters, each with its own photo strip |
| `entourage.html` | Entourage: parents, best man & maid of honor, groomsmen & bridesmaids, bearers, sponsors, officiants |
| `qna.html` | His & Hers: seven questions, answered by each of them |

Shared files live in `assets/`:
- `assets/css/style.css` — all styles. Brand colours and fonts are at the top in `:root`.
- `assets/js/content.js` — **edit this** for the wedding date/time, the RSVP link and every photo list.
- `assets/js/main.js` — menu, countdown, carousels, photo viewer, RSVP form, scroll reveal.
- `assets/img/` — logos, ornaments, textures and the hero photo.

## Filling in the details

Everything still to come is written in **[square brackets]**. Search the
project for `[` to find them all:

- Journey chapter summaries; chapter 05 title (`journey.html`)

Already filled from the couple's documents: venues and times, dress code,
message from the couple, FAQs, the full entourage and the His & Hers answers.

The countdown target is `weddingDate` in `assets/js/content.js`
(currently 30 Dec 2026, 2:00 PM Philippine time). Change it when the
ceremony time is confirmed.

## Adding photos

1. Export photos as JPG, about 1600 px on the long side (under ~400 KB each).
2. Put them in `assets/img/photos/` (create the folder).
3. In `assets/js/content.js`, replace a `{ src: null, caption: "…" }`
   entry with the file path, e.g.
   `{ src: "assets/img/photos/proposal-01.jpg", caption: "She said yes" }`.
   Add `pos: "50% 30%"` to move the crop if a face is cut off.

Gallery, Journey and the favourites carousel build themselves from those
lists. Photos placed directly in the HTML (home letter, story chapters,
collage) are swapped by replacing the `<div class="ph">…</div>` with an
`<img src="…" alt="…">`.

Keep **alt text** meaningful ("Claire laughing during the proposal"),
it is what screen readers announce.

## Gallery photos

The prenup photos live in `assets/img/gallery/`, in two sizes:
`thumb/` (760 px, used in the grid) and `full/` (1800 px, used in the
photo viewer). Both folders hold the same file names.

The lists are in `assets/js/content.js` under `gallery`:
- `favorites`: the swipeable row (one photo from each look).
- `sets`: the full album, one block per look, in shoot order. Each block
  matches a section in `gallery.html` (`gallery.sets.0.photos` is the first).

To add a photo: save both sizes under the same name, then copy an
existing line in the right set and change the file names (and `w`/`h`
to the large file's width and height). To remove one, delete its line.
If you change how many photos a set has, update its "… photos" count in
`gallery.html`.

## Collecting RSVPs in a Google Sheet

The RSVP form sends replies to a Google Apps Script web app (`Code.gs`),
which saves them in a Google Sheet, updates a guest's row if they reply
again, closes the form after the deadline, and emails the couple a daily
summary. `Code.gs` is kept **outside** this folder because it holds the
couple's email addresses.

Until `rsvpEndpoint` in `assets/js/content.js` is set, the form runs in
preview mode: it shows the thank-you note but saves nothing.

The deadline and the seat limit are set in `Code.gs` (CONFIG), not here.

## Publishing on GitHub Pages

1. Create a new repository and upload everything in this folder
   (keep the folder structure).
2. **Settings → Pages → Deploy from a branch → `main` / root**.
3. The site appears at `https://<username>.github.io/<repository>/`.

All links are relative, so the site also works from any other static host.

## Notes

- Fonts load from Google Fonts. Without internet they fall back to
  Georgia / Courier.
- The Save the Date background (`glow.jpg`) is a softened crop of the
  hero photo. To use a painted landscape like the inspiration boards,
  replace it with a public-domain painting (e.g. from a museum's
  open-access collection) of similar size.
- Animations respect the visitor's "reduce motion" setting.
