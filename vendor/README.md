# Third-party code bundled here

Everything this project needs is vendored: it loads no script, style, font, map
or module from anywhere but its own origin — no CDN, no network, no account.
That is the point of the tool, and it makes the licences below *this project's*
responsibility rather than a package manager's.

**Every library here has its licence text in this directory.** Naming a licence
is not the same as shipping it: MIT and BSD both require the permission text
itself to travel with a copy, and most minified bundles drop it. Where a bundle
does carry the full text inline, the row says so and no separate file is needed.

One library: HLS playback for streams the browser will not play natively.

## What is here, and under what licence

| File | Package | Licence | Licence text |
| --- | --- | --- | --- |
| `hls/hls.min.js` | [hls.js](https://github.com/video-dev/hls.js) 1.5.13 | Apache-2.0 | [`hls/LICENSE-hls.js.txt`](hls/LICENSE-hls.js.txt) — no header in the minified build |

Apache-2.0 §4 requires that a redistribution carry a copy of the licence and
reproduce any upstream NOTICE file. The bundle here is unmodified; if you ever
patch it, §4 also requires the modified files be marked as changed.

## The rule

Adding a file to this directory means adding a row here **in the same commit**.
A record kept from the first vendored file is trivial; one reconstructed two
years later is not.
