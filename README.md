# Carino TV

A live **news video wall**: watch many live streams from around the world at the
same time, organized by country/category. Add any YouTube live or embeddable
stream, arrange the grid, and share your exact wall with a link.

Live: [tv.carino.systems](https://tv.carino.systems/) · part of [carino.systems](https://carino.systems/)

## Features
- **Watch N streams at once**, with four layout modes:
  - **Single** — one channel full screen. Step through your on-air streams with
    **‹ / ›**, or enable **⟳ Auto-rotate** to channel-surf (~60s). Only the
    on-screen channel is loaded, so the rest use no bandwidth.
  - **Grid** (default) — fills the whole stage, every stream visible, **no scroll /
    no hidden overflow**, tiles sized as close to 16:9 as the viewport allows.
  - **Focus** — one big spotlight stream with the others wrapped around it in an
    **L (a column on the right + a row below)**. Click ★ on any tile to promote it,
    or enable **⟳ Auto-rotate** to cycle the spotlight through every stream (~60s).
  - **Motion** — an auto-scrolling wall where the channel **streams play in place**.
    Embeds are mounted lazily as each card scrolls into view (and torn down when it
    leaves), so even a 100+ channel wall only runs the on-screen few. Click **＋ Add**
    on any card to put it on your wall. Pause/resume and All/On-air toggle.
- **Autoplay** — every tile autoplays (muted, per browser policy) the moment it loads.
- **Dynamic load / unload** — a stream's `<iframe>`/`<video>` is created when you
  enable it and destroyed when you disable it, so off-air channels use no bandwidth.
- **Register any stream** — paste a YouTube video/live/channel/`@handle`, a
  Twitch/VK/Rutube/Odysee link, an `.m3u8` HLS stream, or any embeddable page. Give
  it a title, logo and category (or a brand-new one). Saved in the browser.
- **IPTV / M3U** — import a whole `.m3u`/`.m3u8` playlist (URL or local file) via the
  📡 button; HLS streams play through [hls.js](https://github.com/video-dev/hls.js).
  (Cross-origin playlists are often CORS-blocked — use the file import if a URL fails.)
- **130+ built-in channels** across ~30 countries/regions, plus thematic sections:
  **Weather**, **Earthquakes**, **Live Cams**, **Air Traffic**, and **Space** (ISS).
- **Shareable walls** — the URL hash encodes the on-air streams, layout mode, and any
  custom channels, so opening a link reopens the exact wall (`#v=int01,usa01&m=focus`).
- **Optional YouTube Data API key** (Settings) — detects whether a channel is
  *live*, shows the real video title/thumbnail, and resolves `@handles`. Without a
  key, channels still play via YouTube's live-embed.
- **Per-tile controls** — mute/unmute, reload, pop out to source, fullscreen,
  close, and drag-to-reorder (reorders via CSS `order`, so videos don't reload).
- **Control room** with search, collapsible country groups, an "on air" strip,
  mute-all, export/import config, and the shared **Carino** navbar with live clock.

## Composition
Pure **HTML + CSS + vanilla JavaScript** — no build step, no framework, no jQuery
or Bootstrap. Deployable as static files (GitHub Pages).

| File | Purpose |
|------|---------|
| `index.html` | App shell: navbar, control room, stage, modals |
| `css/styles.css` | Carino design system (gold-on-black, IBM Plex) |
| `js/catalog.js` | Built-in channel catalog (editable seed data) |
| `js/app.js` | All app logic (state, grid, providers, URL sync, API) |
| `logos/` | Channel logos |

## Adding channels permanently
Quick additions from the UI are stored per-browser. To bake a channel into the
shipped catalog, add an entry to `js/catalog.js` (see the shape documented at the
top of that file).

## YouTube API key
Optional. Create one in the
[Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
(enable "YouTube Data API v3"), then paste it into **Settings**. It is stored only
in your browser's `localStorage` and used solely for live-status, titles and
handle resolution. The classic `live_stream?channel=…` embed is used as a fallback
when no key is set (note: it only renders while a channel is actually live).

## Licensing

**Mine — GNU Affero General Public License v3.0 or later.** Everything in this
repository *except* the paths listed below. Copyright © 2026 Miguel Carino.
Full terms in [LICENSE](LICENSE).

**Not mine.** The files below are third-party works redistributed here. This
project's licence does not cover them and could not: they are not mine to
relicense. Each keeps its own terms, and each carries its own notice.

| Path | What it is | Licence | Notice |
| --- | --- | --- | --- |
| [`fonts/`](fonts/) | IBM Plex Mono, IBM Plex Sans, Red Hat Display | SIL OFL 1.1 | [`fonts/OFL.txt`](fonts/OFL.txt) |
| [`vendor/`](vendor/) | third-party JavaScript | per package — see the notice | [`vendor/README.md`](vendor/README.md) |

Those files travel with any fork, mirror or repackaging of this repository, and
their notices must travel with them.
