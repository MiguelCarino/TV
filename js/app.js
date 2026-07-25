/* =====================================================================
   app.js — Carino Newswall
   Vanilla JS. No frameworks. Plays N live streams at once, loads/unloads
   them dynamically, persists to localStorage, and shares the wall via URL.
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Storage helpers
   * ------------------------------------------------------------------ */
  var LS = {
    custom:   'mv_custom',     // [channel,…] user-added
    hidden:   'mv_hidden',     // [id,…] seed channels the user hid
    active:   'mv_active',     // [id,…] last on-air set
    apikey:   'mv_apikey',     // string
    remember: 'mv_remember',   // '1' | '0'
    layout:   'mv_layout',     // 'grid'|'focus'|'motion'
    open:     'mv_opencats',   // [catId,…]
    live:     'mv_livecache',  // {channelId:{ts,live,videoId,title,thumb}} live-resolution cache
  };
  function lsGet(k, dflt) {
    try { var v = localStorage.getItem(k); return v == null ? dflt : JSON.parse(v); }
    catch (e) { return dflt; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */
  // Layout modes: single (one channel full screen) · grid (fill the stage, no
  // scroll/overflow) · focus (spotlight with others on the side AND below) ·
  // motion (auto-scrolling wall of live channels).
  var MODES = { single: 1, grid: 1, focus: 1, motion: 1 };
  function migrateMode(v) {
    if (MODES[v]) return v;
    return 'grid';                            // legacy big/fit/auto/1-4 → grid
  }
  var state = {
    active: [],                 // ordered list of channel ids on air
    layout: migrateMode(lsGet(LS.layout, 'grid')),
    focusId: null,              // which tile is the spotlight in focus mode
    focusAuto: false,           // auto-rotate the spotlight every ~minute
    motionAll: true,            // motion wall shows all channels (vs on-air only)
    motionPaused: false,
    apikey: lsGet(LS.apikey, ''),
    remember: lsGet(LS.remember, true),
    custom: lsGet(LS.custom, []),
    hidden: lsGet(LS.hidden, []),
    openCats: new Set(lsGet(LS.open, [])),
    muted: {},                  // id -> bool (default true)
    query: '',
  };
  var tiles = {};               // id -> tile element (live iframes)
  // Live-resolution cache. A search.list call costs 100 quota units (of a default
  // 10,000/day), so we cache results — and PERSIST them to localStorage — to avoid
  // re-burning quota on every reload. Entries older than LIVE_TTL are dropped on load.
  var LIVE_TTL = 5 * 60 * 1000;
  var liveCache = loadLiveCache();
  var liveInflight = {};        // channelId -> Promise, dedupes concurrent lookups
  function loadLiveCache() {
    var raw = lsGet(LS.live, {}), out = {}, now = nowMs();
    if (raw && typeof raw === 'object') {
      Object.keys(raw).forEach(function (k) {
        var e = raw[k];
        if (e && typeof e.ts === 'number' && (now - e.ts) < LIVE_TTL) out[k] = e;
      });
    }
    return out;
  }
  // new Date()/Date.now() are fine in the app (only the workflow sandbox forbids them);
  // wrap so the call site reads intent.
  function nowMs() { return Date.now(); }
  var persistLiveTimer = null;
  function persistLiveCache() {
    clearTimeout(persistLiveTimer);
    persistLiveTimer = setTimeout(function () { lsSet(LS.live, liveCache); }, 250);
  }

  /* ------------------------------------------------------------------ *
   * Channel registry (seed + custom − hidden), indexed
   * ------------------------------------------------------------------ */
  var CATS = MV_CATALOG.categories.slice();
  var byId = {};
  function rebuildIndex() {
    byId = {};
    var seed = MV_CATALOG.channels.filter(function (c) { return state.hidden.indexOf(c.id) < 0; });
    seed.concat(state.custom).forEach(function (c) { byId[c.id] = c; });
    // ensure categories referenced by custom channels exist
    state.custom.forEach(function (c) {
      if (!CATS.some(function (k) { return k.id === c.category; })) {
        CATS.push({ id: c.category, name: prettyCat(c.category), flag: '📺' });
      }
    });
  }
  function prettyCat(id) { return id ? id.charAt(0).toUpperCase() + id.slice(1).replace(/[-_]/g, ' ') : 'Other'; }
  function allChannels() { return Object.keys(byId).map(function (id) { return byId[id]; }); }
  function channelsIn(catId) {
    var out = [];
    // seed order first, then custom, preserving declaration order
    MV_CATALOG.channels.forEach(function (c) { if (c.category === catId && byId[c.id]) out.push(byId[c.id]); });
    state.custom.forEach(function (c) { if (c.category === catId) out.push(c); });
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Provider detection + embed URLs
   * ------------------------------------------------------------------ */
  // Parse a pasted URL into {provider, source, name?} or {error}
  function detectProvider(raw) {
    var url = (raw || '').trim();
    if (!url) return { error: 'Enter a URL.' };

    // bare 11-char video id or UC… channel id
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return { provider: 'yt-video', source: url };
    if (/^UC[A-Za-z0-9_-]{22}$/.test(url)) return { provider: 'yt-channel', source: url };

    var u;
    try { u = new URL(url.indexOf('http') === 0 ? url : 'https://' + url); }
    catch (e) { return { error: 'That does not look like a valid URL.' }; }

    var host = u.hostname.replace(/^www\./, '').toLowerCase();
    var path = u.pathname;

    // IPTV / HLS — a direct HLS stream, or an .m3u/.m3u8 playlist to expand
    if (/\.m3u8(\?|#|$)/i.test(path)) return { provider: 'hls', source: u.href };
    if (/\.m3u(\?|#|$)/i.test(path))  return { provider: 'm3u', source: u.href };
    // raw transport-stream / container files browsers can't play in-page
    if (/\.(ts|mkv|flv|avi|wmv|m2ts)(\?|#|$)/i.test(path)) return { error: 'That media format can’t play in a browser (only .m3u8 HLS streams).' };

    // YouTube
    if (host === 'youtu.be') {
      var id = path.slice(1).split('/')[0];
      if (id) return { provider: 'yt-video', source: id };
    }
    if (host.indexOf('youtube.com') >= 0) {
      var v = u.searchParams.get('v');
      if (v) return { provider: 'yt-video', source: v };
      var m;
      if ((m = path.match(/\/embed\/([A-Za-z0-9_-]{11})/))) return { provider: 'yt-video', source: m[1] };
      if ((m = path.match(/\/(?:live|shorts)\/([A-Za-z0-9_-]{11})/))) return { provider: 'yt-video', source: m[1] };
      if ((m = path.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/))) return { provider: 'yt-channel', source: m[1] };
      if ((m = path.match(/\/(@[^/]+)/))) return { provider: 'yt-handle', source: m[1] };
      if ((m = path.match(/\/user\/([^/]+)/))) return { provider: 'yt-handle', source: 'user/' + m[1] };
      if ((m = path.match(/\/c\/([^/]+)/)))    return { provider: 'yt-handle', source: 'c/' + m[1] };
      return { error: 'Could not find a video or channel in that YouTube URL.' };
    }
    // Twitch
    if (host.indexOf('twitch.tv') >= 0) {
      var ch = path.split('/').filter(Boolean)[0];
      if (ch) return { provider: 'twitch', source: ch };
    }
    // VK / Rutube / Odysee → normalise to the embeddable form where we can
    if (host.indexOf('vk.com') >= 0) {
      if (path.indexOf('/video_ext.php') === 0) return { provider: 'vk', source: u.href };
      var vk = path.match(/\/video(-?\d+)_(\d+)/);
      if (vk) return { provider: 'vk', source: 'https://vk.com/video_ext.php?oid=' + vk[1] + '&id=' + vk[2] };
      return { provider: 'vk', source: u.href };
    }
    if (host.indexOf('rutube.ru') >= 0) {
      var rt = path.match(/\/(?:video|play\/embed)\/([A-Za-z0-9]+)/);
      return { provider: 'rutube', source: rt ? 'https://rutube.ru/play/embed/' + rt[1] : u.href };
    }
    if (host.indexOf('odysee.com') >= 0) return { provider: 'odysee', source: toOdyseeEmbed(u) };
    // anything else → generic iframe, but only for a plausible domain
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return { provider: 'iframe', source: u.href };
    return { error: 'That does not look like a valid URL.' };
  }
  function toOdyseeEmbed(u) {
    if (u.pathname.indexOf('/$/embed/') === 0) return u.href;
    return 'https://odysee.com/$/embed' + u.pathname + u.search;
  }

  var PROVIDER_LABEL = {
    'yt-channel': 'YouTube channel (live)', 'yt-video': 'YouTube video / live',
    'yt-handle': 'YouTube handle', 'twitch': 'Twitch', 'vk': 'VK',
    'rutube': 'Rutube', 'odysee': 'Odysee', 'iframe': 'Embedded page',
    'hls': 'HLS / IPTV stream', 'm3u': 'IPTV playlist (M3U)'
  };

  function embedUrl(ch, muted) {
    var ap = '1', mu = muted ? '1' : '0';
    switch (ch.provider) {
      case 'yt-video':
        // If a live videoId was resolved via API, ch._videoId overrides source
        return 'https://www.youtube.com/embed/' + (ch._videoId || ch.source) +
               '?autoplay=' + ap + '&mute=' + mu + '&playsinline=1&rel=0';
      case 'yt-channel':
        if (ch._videoId) return 'https://www.youtube.com/embed/' + ch._videoId +
               '?autoplay=' + ap + '&mute=' + mu + '&playsinline=1&rel=0';
        return 'https://www.youtube.com/embed/live_stream?channel=' + ch.source +
               '&autoplay=' + ap + '&mute=' + mu + '&playsinline=1&rel=0';
      case 'twitch':
        return 'https://player.twitch.tv/?channel=' + encodeURIComponent(ch.source) +
               '&parent=' + encodeURIComponent(location.hostname || 'localhost') +
               '&autoplay=true&muted=' + (muted ? 'true' : 'false');
      default:
        // vk / rutube / odysee / iframe — only ever embed http(s) to block
        // javascript:/data: injection from crafted shared links.
        return /^https?:\/\//i.test(ch.source) ? ch.source : 'about:blank';
    }
  }
  function sourceLink(ch) {
    switch (ch.provider) {
      case 'yt-video':   return 'https://www.youtube.com/watch?v=' + (ch._videoId || ch.source);
      case 'yt-channel': return 'https://www.youtube.com/channel/' + ch.source + '/live';
      case 'twitch':     return 'https://www.twitch.tv/' + ch.source;
      default:           return ch.source;
    }
  }

  /* ------------------------------------------------------------------ *
   * YouTube Data API (optional) — live detection + handle resolution
   * ------------------------------------------------------------------ */
  function apiReady() { return !!state.apikey; }

  function ytFetch(path) {
    return fetch('https://www.googleapis.com/youtube/v3/' + path + '&key=' + encodeURIComponent(state.apikey))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.error) throw new Error((j.error.errors && j.error.errors[0] && j.error.errors[0].reason) || j.error.message || 'API error');
        return j;
      });
  }

  function resolveHandle(handle) {
    // "@name" and legacy /user/Name resolve exactly (1 unit); /c/Name has no
    // exact resolver, so fall back to a (fuzzy, 100-unit) channel search.
    var q;
    if (handle.charAt(0) === '@') q = 'channels?part=id&forHandle=' + encodeURIComponent(handle);
    else if (handle.indexOf('user/') === 0) q = 'channels?part=id&forUsername=' + encodeURIComponent(handle.slice(5));
    else q = 'search?part=snippet&type=channel&maxResults=1&q=' + encodeURIComponent(handle.replace(/^c\//, ''));
    return ytFetch(q).then(function (j) {
      if (j.items && j.items.length) {
        var it = j.items[0];
        return it.id && it.id.channelId ? it.id.channelId : it.id;
      }
      throw new Error('Channel not found');
    });
  }

  function getLiveInfo(channelId, force) {
    var c = liveCache[channelId];
    var fresh = c && (nowMs() - c.ts) < LIVE_TTL;
    if (c && fresh && !force) {
      // A cached error means a prior lookup hit quota/failure — back off and don't
      // re-spend 100 units every render until the entry expires.
      return c.error ? Promise.reject(new Error(c.error)) : Promise.resolve(c);
    }
    if (!apiReady()) return Promise.resolve(null);
    // Dedupe: many tiles (or a re-render) can ask for the same channel at once;
    // issue a single search.list and share its promise.
    if (liveInflight[channelId]) return liveInflight[channelId];
    var p = ytFetch('search?part=snippet&channelId=' + channelId + '&eventType=live&type=video&maxResults=1')
      .then(function (j) {
        var it = j.items && j.items[0];
        var info = it
          ? { ts: nowMs(), live: true, videoId: it.id.videoId, title: it.snippet.title, thumb: (it.snippet.thumbnails.medium || it.snippet.thumbnails.default).url }
          : { ts: nowMs(), live: false };
        liveCache[channelId] = info;
        persistLiveCache();
        return info;
      })
      .catch(function (err) {
        liveCache[channelId] = { ts: nowMs(), error: String(err && err.message || err) };
        persistLiveCache();
        throw err;
      })
      .then(function (v) { delete liveInflight[channelId]; return v; },
            function (e) { delete liveInflight[channelId]; throw e; });
    liveInflight[channelId] = p;
    return p;
  }

  /* ------------------------------------------------------------------ *
   * URL state (shareable wall)
   * ------------------------------------------------------------------ */
  function b64e(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64d(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  }
  var suppressHash = false;
  function syncHash() {
    if (suppressHash) return;
    var parts = [];
    if (state.active.length) parts.push('v=' + state.active.join(','));
    if (state.layout !== 'grid') parts.push('m=' + state.layout);   // 'grid' is the default
    // embed defs of any *active custom* channels so shared links work for others
    var customActive = state.active
      .map(function (id) { return byId[id]; })
      .filter(function (c) { return c && c._custom; })
      .map(function (c) { return { id: c.id, name: c.name, desc: c.desc, category: c.category, logo: c.logo, provider: c.provider, source: c.source, note: c.note }; });
    if (customActive.length) parts.push('c=' + b64e(customActive));
    var hash = parts.length ? '#' + parts.join('&') : '';
    if (('#' + location.hash.replace(/^#/, '')) !== hash && location.hash !== hash) {
      history.replaceState(null, '', location.pathname + location.search + hash);
    }
  }
  function readHash() {
    var h = location.hash.replace(/^#/, '');
    if (!h) return null;
    var out = { v: [], mode: null, custom: [] };
    h.split('&').forEach(function (kv) {
      var i = kv.indexOf('='); if (i < 0) return;
      var k = kv.slice(0, i), val = kv.slice(i + 1);
      if (k === 'v') out.v = decodeURIComponent(val).split(',').filter(Boolean);
      else if (k === 'm' || k === 'cols') { var c = migrateMode(decodeURIComponent(val)); out.mode = MODES[c] ? c : null; }
      else if (k === 'c') { try { out.custom = b64d(val); } catch (e) {} }
    });
    return out;
  }

  /* ------------------------------------------------------------------ *
   * DOM helpers
   * ------------------------------------------------------------------ */
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function initials(name) {
    var clean = String(name || '').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/);
    var s = clean.slice(0, 2).map(function (w) { return w[0]; }).join('');
    return (s || '?').toUpperCase();
  }
  function hueOf(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  function avatarHTML(ch) {
    var bg = 'hsl(' + hueOf(ch.name) + ',45%,38%)';
    var img = ch.logo ? '<img src="' + esc(ch.logo) + '" alt="" onerror="this.remove()">' : '';
    return '<div class="avatar" style="background:' + bg + '">' + esc(initials(ch.name)) + img + '</div>';
  }

  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ------------------------------------------------------------------ *
   * Sidebar rendering
   * ------------------------------------------------------------------ */
  function renderSidebar() {
    var root = $('#catalog');
    root.innerHTML = '';
    var q = state.query.toLowerCase();
    var anyMatch = false;

    CATS.forEach(function (cat) {
      var chans = channelsIn(cat.id);
      if (!chans.length) return;
      var matches = q
        ? chans.filter(function (c) { return (c.name + ' ' + (c.desc || '') + ' ' + cat.name).toLowerCase().indexOf(q) >= 0; })
        : chans;
      if (!matches.length) return;
      anyMatch = true;

      var open = q ? true : state.openCats.has(cat.id);
      var group = el('div', 'cat-group' + (open ? ' open' : ''));
      group.dataset.cat = cat.id;

      var head = el('button', 'cat-head',
        '<span class="chevron">▶</span>' +
        '<span class="flag">' + (cat.flag || '📺') + '</span>' +
        '<span class="cat-name">' + esc(cat.name) + '</span>' +
        '<span class="cat-count">' + matches.length + '</span>');
      head.addEventListener('click', function () {
        if (q) return; // while searching, stay expanded
        group.classList.toggle('open');
        if (group.classList.contains('open')) state.openCats.add(cat.id); else state.openCats.delete(cat.id);
        lsSet(LS.open, Array.from(state.openCats));
      });
      group.appendChild(head);

      var body = el('div', 'cat-body');
      matches.forEach(function (ch) { body.appendChild(renderChannelRow(ch)); });
      group.appendChild(body);
      root.appendChild(group);
    });

    $('#noResults').hidden = anyMatch;
    renderActiveStrip();
    updateDiag();
  }

  function renderChannelRow(ch) {
    var on = state.active.indexOf(ch.id) >= 0;
    var row = el('div', 'chan' + (on ? ' active' : ''));
    row.dataset.id = ch.id;
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.setAttribute('aria-pressed', on ? 'true' : 'false');
    row.setAttribute('aria-label', ch.name + (ch.desc ? ' — ' + ch.desc : ''));

    var badges = '';
    if (ch.note) badges += '<span class="badge note">' + esc(ch.note) + '</span>';
    var lc = liveCache[ch.source];
    // only badge on a definitive result — skip error entries (unknown, not off)
    if (ch.provider === 'yt-channel' && lc && !lc.error) badges += lc.live ? '<span class="badge live">LIVE</span>' : '<span class="badge off">OFF</span>';

    row.innerHTML =
      avatarHTML(ch) +
      '<div class="meta"><div class="nm">' + esc(ch.name) + '</div><div class="ds">' + esc(ch.desc || PROVIDER_LABEL[ch.provider] || '') + '</div></div>' +
      '<div class="badges">' + badges + '</div>' +
      '<div class="row-actions">' +
        '<button class="r-pop" aria-label="Open ' + esc(ch.name) + ' source in a new tab" title="Open source in a new tab">↗</button>' +
        '<button class="r-del" aria-label="' + (ch._custom ? 'Delete ' : 'Hide ') + esc(ch.name) + '" title="' + (ch._custom ? 'Delete' : 'Hide') + '">✕</button>' +
      '</div>';

    row.addEventListener('click', function (e) {
      if (e.target.closest('.row-actions')) return;
      toggleChannel(ch.id);
    });
    row.addEventListener('keydown', function (e) {
      if (e.target.closest('.row-actions')) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChannel(ch.id); }
    });
    $('.r-pop', row).addEventListener('click', function (e) { e.stopPropagation(); window.open(sourceLink(ch), '_blank', 'noopener'); });
    $('.r-del', row).addEventListener('click', function (e) { e.stopPropagation(); removeFromCatalog(ch); });
    return row;
  }

  function renderActiveStrip() {
    var strip = $('#activeStrip'), wrap = $('#activeChips');
    if (!state.active.length) { strip.hidden = true; return; }
    strip.hidden = false;
    $('#activeCount').textContent = state.active.length;
    wrap.innerHTML = '';
    state.active.forEach(function (id) {
      var ch = byId[id]; if (!ch) return;
      var chip = el('div', 'active-chip', '<span>' + esc(ch.name) + '</span><button title="Remove" aria-label="Remove ' + esc(ch.name) + '">×</button>');
      $('button', chip).addEventListener('click', function () { toggleChannel(id); });
      wrap.appendChild(chip);
    });
  }

  /* ------------------------------------------------------------------ *
   * Grid rendering (dynamic load / unload)
   * ------------------------------------------------------------------ */
  function createTile(ch) {
    var muted = state.muted[ch.id] !== false; // default muted
    state.muted[ch.id] = muted;
    var tile = el('div', 'tile');
    tile.dataset.id = ch.id;
    tile.draggable = false;

    var media;
    if (ch.provider === 'hls') {
      media = el('video');
      media.muted = muted; media.autoplay = true; media.controls = true;
      media.setAttribute('playsinline', ''); media.title = ch.name;
      attachHls(media, ch.source);
    } else {
      media = el('iframe');
      media.src = embedUrl(ch, muted);
      media.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
      media.setAttribute('allowfullscreen', '');
      media.setAttribute('referrerpolicy', 'origin-when-cross-origin');
      // sandbox untrusted generic pages: lets the embed run but blocks it from
      // navigating our top window, opening popups, or submitting forms.
      if (ch.provider === 'iframe') media.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      media.title = ch.name;
    }

    var bar = el('div', 'tile-bar',
      '<span class="drag" title="Drag to reorder" draggable="true" aria-hidden="true">⠿</span>' +
      '<span class="t-title">' + esc(ch.name) + '</span>' +
      '<button class="t-btn b-focus" aria-label="Make this the main/spotlight stream" title="Spotlight">★</button>' +
      '<button class="t-btn b-mute" aria-label="Mute or unmute" title="Mute / unmute">' + (muted ? '🔇' : '🔊') + '</button>' +
      '<button class="t-btn b-reload" aria-label="Reload stream" title="Reload">⟳</button>' +
      '<button class="t-btn b-pop" aria-label="Open source in a new tab" title="Open source">↗</button>' +
      '<button class="t-btn b-full" aria-label="Fullscreen" title="Fullscreen">⛶</button>' +
      '<button class="t-btn b-close" aria-label="Close stream" title="Close">✕</button>');

    tile.appendChild(bar);
    tile.appendChild(media);

    $('.b-focus', bar).addEventListener('click', function () { setFocus(ch.id); });
    $('.b-mute', bar).addEventListener('click', function () { toggleMute(ch.id); });
    $('.b-reload', bar).addEventListener('click', function () { reloadTile(ch.id); });
    $('.b-pop', bar).addEventListener('click', function () { window.open(sourceLink(ch), '_blank', 'noopener'); });
    $('.b-full', bar).addEventListener('click', function () { if (tile.requestFullscreen) tile.requestFullscreen(); });
    $('.b-close', bar).addEventListener('click', function () { toggleChannel(ch.id); });

    setupDrag(tile, $('.drag', bar));

    $('#grid').appendChild(tile);
    tiles[ch.id] = tile;

    // If API key set & a YouTube channel, resolve the actual live video for reliability + title/thumb
    if (apiReady() && ch.provider === 'yt-channel') {
      getLiveInfo(ch.source).then(function (info) {
        if (!info || !tiles[ch.id]) return;
        if (info.live && info.videoId) {
          ch._videoId = info.videoId;
          var f = $('iframe', tile);
          f.src = embedUrl(ch, state.muted[ch.id] !== false);
          if (info.title) { $('.t-title', tile).textContent = info.title; f.title = info.title; }
        }
        renderSidebar();
      }).catch(function (err) { apiError(err); });
    }
  }

  // ---- HLS / IPTV playback (hls.js loaded lazily, only when first needed) ----
  function loadHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (loadHls._p) return loadHls._p;
    loadHls._p = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = 'vendor/hls/hls.min.js'; // hls.js 1.5.13, self-hosted (no external CDN)
      s.onload = function () { resolve(window.Hls); };
      s.onerror = function () { loadHls._p = null; resolve(null); }; // allow a later retry
      document.head.appendChild(s);
    });
    return loadHls._p;
  }
  function attachHls(video, url) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = url; return; } // Safari native
    loadHls().then(function (Hls) {
      // tile may have been closed while the CDN script was loading
      if (video._dead || !video.isConnected) return;
      if (Hls && Hls.isSupported()) {
        try { if (video._hls) video._hls.destroy(); } catch (e) {}
        var hls = new Hls({ liveSyncDurationCount: 3 });
        video._hls = hls;
        hls.loadSource(url); hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, function (ev, data) {
          if (!data || !data.fatal) return;
          hls._retries = (hls._retries || 0) + 1;
          if (hls._retries > 3) { try { hls.destroy(); } catch (e) {} video._hls = null; toast('Stream failed to load — likely offline or CORS-blocked.'); return; }
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else { try { hls.destroy(); } catch (e) {} video._hls = null; }
        });
      } else { toast('Could not load HLS support (hls.js) — try Safari, or check your connection.'); }
    });
  }

  function setTileMute(id, muted) {
    var tile = tiles[id]; if (!tile) return;
    state.muted[id] = muted;
    var v = tile.querySelector('video');
    if (v) { v.muted = muted; }                                  // no reload for <video>
    else { var f = tile.querySelector('iframe'); if (f) f.src = embedUrl(byId[id], muted); }
    var b = $('.b-mute', tile);
    if (b) { b.textContent = muted ? '🔇' : '🔊'; b.classList.toggle('on', !muted); }
  }
  function toggleMute(id) { setTileMute(id, !(state.muted[id] !== false)); }
  function reloadTile(id) {
    var tile = tiles[id]; if (!tile) return;
    var v = tile.querySelector('video');
    if (v) { try { if (v._hls) { v._hls.destroy(); v._hls = null; } } catch (e) {} attachHls(v, byId[id].source); return; }
    var f = tile.querySelector('iframe'); if (f) { var s = f.src; f.src = 'about:blank'; setTimeout(function () { f.src = s; }, 60); }
  }
  function destroyTile(id) {
    var t = tiles[id]; if (!t) return;
    var v = t.querySelector('video');
    if (v) { v._dead = true; if (v._hls) { try { v._hls.destroy(); } catch (e) {} } } // _dead: cancel any in-flight attachHls
    t.remove(); delete tiles[id];
  }

  // Choose the column count that makes tiles closest to 16:9 for the *current*
  // stage size — so it adapts to portrait phones and wide monitors alike, and
  // fills the whole stage (no fixed grid that ignores the viewport).
  function bestCols(n, W, H) {
    if (n <= 1) return 1;
    var target = 16 / 9, best = 1, bestScore = Infinity;
    for (var c = 1; c <= n; c++) {
      var rows = Math.ceil(n / c);
      var tw = (W - (c - 1) * 8) / c, th = (H - (rows - 1) * 8) / rows;
      if (tw <= 0 || th <= 0) continue;
      var ar = tw / th;
      var score = Math.abs(Math.log(ar / target));   // deviation from 16:9
      score += (rows * c - n) * 0.06;                 // mild penalty for empty cells
      if (score < bestScore) { bestScore = score; best = c; }
    }
    return best;
  }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function setPlace(id, col, row) { var t = tiles[id]; if (!t) return; t.style.gridColumn = col; t.style.gridRow = row; }

  // Focus / spotlight: one big "main" tile, with the others wrapped around it in
  // an L — a column on the RIGHT and a row BELOW the main. Click ★ to promote a tile.
  // Size of the secondary strips relative to a main column/row. Bigger = the
  // side/bottom companion tiles are larger (the spotlight stays dominant).
  var FOCUS_SEC = 0.85;     // L-shape right column + bottom row
  var FOCUS_BESIDE = 0.66;  // lone companion when there's only one other stream
  function layoutFocus(g, ids) {
    var mainId = (state.focusId && ids.indexOf(state.focusId) >= 0) ? state.focusId : ids[0];
    var others = ids.filter(function (id) { return id !== mainId; });
    if (tiles[mainId]) tiles[mainId].classList.add('tile-main');
    var k = others.length;
    if (k === 0) { g.style.gridTemplateColumns = '1fr'; g.style.gridTemplateRows = '1fr'; setPlace(mainId, '1', '1'); return; }
    if (k === 1) {                                   // main + one beside it
      g.style.gridTemplateColumns = 'minmax(0,1fr) minmax(0,' + FOCUS_BESIDE + 'fr)';
      g.style.gridTemplateRows = '1fr';
      setPlace(mainId, '1', '1'); setPlace(others[0], '2', '1');
      return;
    }
    // L-shape: bottom row + right column, main spans the top-left block
    var botN = Math.ceil(k / 2), sideN = k - botN;   // sideN ≤ botN
    var cols = []; for (var c = 0; c < botN; c++) cols.push('minmax(0,1fr)'); cols.push('minmax(0,' + FOCUS_SEC + 'fr)');
    var rows = []; for (var r = 0; r < sideN; r++) rows.push('minmax(0,1fr)'); rows.push('minmax(0,' + FOCUS_SEC + 'fr)');
    g.style.gridTemplateColumns = cols.join(' ');
    g.style.gridTemplateRows = rows.join(' ');
    setPlace(mainId, '1 / span ' + botN, '1 / span ' + Math.max(sideN, 1));
    others.slice(0, sideN).forEach(function (id, i) { setPlace(id, String(botN + 1), String(i + 1)); });        // right column
    others.slice(sideN).forEach(function (id, i) { setPlace(id, String(i + 1), String(sideN + 1)); });          // bottom row
  }

  function applyLayout() {
    var g = $('#grid'), ids = state.active, mode = state.layout;
    // reset per-tile placement so modes don't bleed into each other
    Object.keys(tiles).forEach(function (id) { var t = tiles[id]; t.style.order = ''; t.style.gridColumn = ''; t.style.gridRow = ''; t.classList.remove('tile-main'); });
    document.body.classList.toggle('mode-grid', mode === 'grid');
    document.body.classList.toggle('mode-focus', mode === 'focus');
    document.body.classList.toggle('mode-single', mode === 'single');
    g.style.gridTemplateColumns = ''; g.style.gridTemplateRows = '';
    if (!ids.length) { $('#diagLayout').textContent = capitalize(mode); return; }

    if (mode === 'single') {
      // one channel, full stage (renderGrid keeps only the primary tile loaded)
      g.style.gridTemplateColumns = '1fr'; g.style.gridTemplateRows = '1fr';
      $('#diagLayout').textContent = 'Single' + (state.focusAuto ? ' (auto)' : '');
    } else if (mode === 'focus') {
      layoutFocus(g, ids);
      $('#diagLayout').textContent = 'Focus' + (state.focusAuto ? ' (auto)' : '');
    } else {
      // grid: fill the whole stage, no scroll/overflow; best columns for ~16:9
      var wrap = $('#gridWrap');
      var W = Math.max(wrap.clientWidth - 16, 100), H = Math.max(wrap.clientHeight - 16, 100);
      var cols = bestCols(ids.length, W, H) || 1, rows = Math.ceil(ids.length / cols);
      g.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
      g.style.gridTemplateRows = 'repeat(' + rows + ',1fr)';
      ids.forEach(function (id, i) { if (tiles[id]) tiles[id].style.order = i; });
      $('#diagLayout').textContent = 'Grid (' + cols + '×' + rows + ')';
    }
  }

  // The "primary" channel: the spotlight in Focus, the single channel in Single.
  function currentPrimaryId() {
    if (state.focusId && state.active.indexOf(state.focusId) >= 0) return state.focusId;
    return state.active[0] || null;
  }

  /* ---- Auto-rotate: cycle the primary channel every ~minute (spotlight in
     Focus, the on-screen channel in Single) ---- */
  var focusTimer = null;
  function advancePrimary() {
    if (state.active.length < 2) return;
    if (state.layout !== 'focus' && state.layout !== 'single') return;
    var i = state.active.indexOf(currentPrimaryId());
    if (i < 0) i = 0;
    state.focusId = state.active[(i + 1) % state.active.length];
    if (state.layout === 'single') renderGrid();   // swap the single tile
    else applyLayout();                             // focus: just re-place tiles
  }
  function syncFocusRotate() {
    if (focusTimer) { clearInterval(focusTimer); focusTimer = null; }
    if (state.focusAuto && (state.layout === 'focus' || state.layout === 'single')) focusTimer = setInterval(advancePrimary, 60000);
  }
  // Step the single-mode channel manually (‹ prev / next ›)
  function stepSingle(dir) {
    if (state.layout !== 'single' || state.active.length < 2) return;
    var n = state.active.length;
    var i = state.active.indexOf(currentPrimaryId());
    if (i < 0) i = 0;
    state.focusId = state.active[((i + dir) % n + n) % n];
    renderGrid();
  }
  function updateSingleControls() {
    if (state.layout !== 'single') return;
    var n = state.active.length;
    var pid = currentPrimaryId();
    var ch = pid ? byId[pid] : null;
    var idx = pid ? state.active.indexOf(pid) : -1;
    var label = $('#singleLabel');
    if (label) label.textContent = ch ? ((idx + 1) + ' / ' + n + ' · ' + ch.name) : 'No streams on air';
    var dis = n < 2;
    var p = $('#singlePrev'), nx = $('#singleNext');
    if (p) p.disabled = dis;
    if (nx) nx.disabled = dis;
  }

  function updateChromeLabels() {
    var n = state.active.length;
    $('#onAirLabel').textContent = n ? (n + ' stream' + (n > 1 ? 's' : '') + ' on air') : 'No streams on air';
    updateMuteAllBtn();
  }

  function renderGrid() {
    var motion = state.layout === 'motion';
    document.body.classList.toggle('mode-motion', motion);
    syncFocusRotate();   // reconcile the auto-rotate timer with the current state on every render
    if (motion) {
      // live wall: tear down the grid's tiles (the wall mounts its own embeds)
      // and keep modes mutually exclusive on <body>
      Object.keys(tiles).forEach(destroyTile);
      document.body.classList.remove('mode-grid', 'mode-focus', 'mode-single');
      state.motionPaused = false; $('#motionPause').textContent = '⏸ Pause';
      $('#grid').style.display = 'none';
      $('#empty').style.display = 'none';
      $('#motionGrid').style.display = 'grid';
      renderMotion();
      updateChromeLabels(); updateDiag();
      $('#diagLayout').textContent = 'Motion';
      return;
    }
    $('#motionGrid').style.display = 'none';
    teardownMotion();   // disconnect the wall's observer & free its embeds
    if (state.layout === 'single') {
      // keep ONLY the primary channel loaded — a true single-channel view that
      // wastes no bandwidth on the streams you're not watching
      var pid = currentPrimaryId();
      Object.keys(tiles).forEach(function (id) { if (id !== pid) destroyTile(id); });
      if (pid && byId[pid] && !tiles[pid]) createTile(byId[pid]);
    } else {
      // grid / focus: unload removed (frees iframes / hls.js instances), load new
      Object.keys(tiles).forEach(function (id) { if (state.active.indexOf(id) < 0) destroyTile(id); });
      state.active.forEach(function (id) { if (!tiles[id] && byId[id]) createTile(byId[id]); });
    }
    applyLayout();
    $('#empty').style.display = state.active.length ? 'none' : 'flex';
    $('#grid').style.display = state.active.length ? 'grid' : 'none';
    updateChromeLabels();
    updateSingleControls();
  }

  /* ---- Motion: auto-scrolling wall where the channel STREAMS play in-place.
     Embeds are mounted lazily as a card scrolls into view (and torn down when
     it leaves), so even a 100+ channel wall only ever runs the on-screen few. */
  var motionTimer = null;
  var motionIO = null;     // IntersectionObserver driving the lazy play/pause
  function motionPool() {
    var pool = allChannels();
    if (!state.motionAll) pool = pool.filter(function (c) { return state.active.indexOf(c.id) >= 0; });
    return pool;
  }
  function shuffleArr(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function motionToggle(id) {
    if (!byId[id]) return;
    var i = state.active.indexOf(id);
    if (i >= 0) state.active.splice(i, 1); else state.active.push(id);
    persistActive(); syncHash();
    renderActiveStrip(); updateChromeLabels(); updateDiag();
    var on = state.active.indexOf(id) >= 0;
    var r = document.querySelector('.chan[data-id="' + id + '"]');
    if (r) { r.classList.toggle('active', on); r.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    // reflect on-air state across every card for this channel (the wall dupes them)
    document.querySelectorAll('#motionGrid .m-card[data-id="' + id + '"]').forEach(function (c) {
      c.classList.toggle('on', on);
      var add = $('.m-add', c); if (add) add.textContent = on ? '✓ On air' : '＋ Add';
      var st = $('.m-state', c); if (st) st.textContent = on ? '● ON AIR' : '▶ PLAY';
    });
  }
  function buildMotionCard(ch) {
    var on = state.active.indexOf(ch.id) >= 0;
    var card = el('div', 'm-card' + (on ? ' on' : ''));
    card.dataset.id = ch.id;
    card.innerHTML =
      '<div class="m-media"><div class="m-poster" style="background:hsl(' + hueOf(ch.name) + ',45%,28%)">' +
        (ch.logo ? '<img src="' + esc(ch.logo) + '" alt="" loading="lazy" onerror="this.remove()">' : '<span>' + esc(initials(ch.name)) + '</span>') +
      '</div></div>' +
      '<div class="m-overlay">' +
        '<div class="m-bar">' +
          '<span class="m-nm">' + esc(ch.name) + '</span>' +
          '<button class="m-pop" title="Open source in a new tab" aria-label="Open ' + esc(ch.name) + ' source in a new tab">↗</button>' +
        '</div>' +
        '<div class="m-foot">' +
          '<button class="m-add" aria-label="' + (on ? 'Remove ' : 'Add ') + esc(ch.name) + (on ? ' from' : ' to') + ' your wall">' + (on ? '✓ On air' : '＋ Add') + '</button>' +
        '</div>' +
      '</div>' +
      (ch.note ? '<span class="m-badge">' + esc(ch.note) + '</span>' : '') +
      '<span class="m-state">' + (on ? '● ON AIR' : '▶ PLAY') + '</span>';
    $('.m-add', card).addEventListener('click', function (e) {
      e.stopPropagation();
      motionToggle(ch.id);
      toast((state.active.indexOf(ch.id) >= 0 ? 'Added ' : 'Removed ') + ch.name + ' · switch to Single/Grid/Focus to watch');
    });
    $('.m-pop', card).addEventListener('click', function (e) { e.stopPropagation(); window.open(sourceLink(ch), '_blank', 'noopener'); });
    return card;
  }
  // Mount a live embed into a card (called by the observer when it nears view)
  function mountMotionMedia(card) {
    if (card._media || !card.isConnected) return;   // skip cards detached by a torn-down render
    var ch = byId[card.dataset.id]; if (!ch) return;
    var holder = $('.m-media', card); if (!holder) return;
    var media;
    if (ch.provider === 'hls') {
      media = el('video');
      media.muted = true; media.autoplay = true; media.setAttribute('playsinline', ''); media.title = ch.name;
      attachHls(media, ch.source);
    } else {
      media = el('iframe');
      media.src = embedUrl(ch, true);   // always muted: autoplay policy + many at once
      media.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      media.setAttribute('referrerpolicy', 'origin-when-cross-origin');
      media.setAttribute('tabindex', '-1');
      if (ch.provider === 'iframe') media.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      media.title = ch.name;
    }
    card._media = media;
    card.classList.add('playing');
    holder.appendChild(media);
  }
  function unmountMotionMedia(card) {
    var media = card._media; if (!media) return;
    card._media = null;
    card.classList.remove('playing');
    if (media.tagName === 'VIDEO') { media._dead = true; if (media._hls) { try { media._hls.destroy(); } catch (e) {} media._hls = null; } }
    media.remove();
  }
  function teardownMotion() {
    stopMotionScroll();
    if (motionIO) { motionIO.disconnect(); motionIO = null; }
    var mg = $('#motionGrid');
    if (mg) mg.querySelectorAll('.m-card').forEach(unmountMotionMedia);
  }
  function renderMotion() {
    teardownMotion();
    var mg = $('#motionGrid'); mg.innerHTML = '';
    var pool = motionPool();
    if (!pool.length) { mg.innerHTML = '<div class="motion-empty">Nothing on air yet. Switch the source to “All” to browse every channel.</div>'; return; }
    var cellW = 240, cellH = 150;   // ~matches the CSS grid track sizes
    var cols = Math.max(1, Math.floor((mg.clientWidth || window.innerWidth) / cellW));
    var rows = Math.max(1, Math.ceil((mg.clientHeight || window.innerHeight) / cellH));
    var need = Math.max(20, cols * rows * 2);             // ~2 viewports so it scrolls
    if (need > pool.length * 4) need = Math.max(pool.length, cols);  // don't over-dupe a tiny pool
    var s = shuffleArr(pool);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < need; i++) { if (i > 0 && i % s.length === 0) s = shuffleArr(pool); frag.appendChild(buildMotionCard(s[i % s.length])); }
    mg.appendChild(frag);
    mg.scrollTop = 0;
    var cards = mg.querySelectorAll('.m-card');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (motionIO !== io) return;   // ignore late callbacks from a replaced/torn-down observer
        entries.forEach(function (e) { if (e.isIntersecting) mountMotionMedia(e.target); else unmountMotionMedia(e.target); });
      }, { root: mg, rootMargin: '200px 0px', threshold: 0.01 });
      motionIO = io;
      cards.forEach(function (c) { io.observe(c); });
    } else {
      for (var j = 0; j < Math.min(cards.length, 8); j++) mountMotionMedia(cards[j]);   // no-IO fallback: just the first few
    }
    startMotionScroll();
  }
  function startMotionScroll() {
    stopMotionScroll();
    var mg = $('#motionGrid');
    motionTimer = setInterval(function () {
      if (state.motionPaused || !document.body.classList.contains('mode-motion')) return;
      mg.scrollTop += 1;
      if (mg.scrollTop + mg.clientHeight >= mg.scrollHeight - 2) mg.scrollTop = 0;
    }, 40);
  }
  function stopMotionScroll() { if (motionTimer) { clearInterval(motionTimer); motionTimer = null; } }

  /* ------------------------------------------------------------------ *
   * Drag to reorder (uses CSS order, no iframe reload)
   * ------------------------------------------------------------------ */
  var dragId = null;
  function setupDrag(tile, handle) {
    handle.addEventListener('dragstart', function (e) {
      dragId = tile.dataset.id; tile.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragId); } catch (x) {}
    });
    handle.addEventListener('dragend', function () { tile.classList.remove('dragging'); clearDropTargets(); dragId = null; });
    tile.addEventListener('dragover', function (e) { if (dragId && dragId !== tile.dataset.id) { e.preventDefault(); tile.classList.add('drop-target'); } });
    tile.addEventListener('dragleave', function () { tile.classList.remove('drop-target'); });
    tile.addEventListener('drop', function (e) {
      e.preventDefault(); tile.classList.remove('drop-target');
      if (!dragId || dragId === tile.dataset.id) return;
      var from = state.active.indexOf(dragId), to = state.active.indexOf(tile.dataset.id);
      if (from < 0 || to < 0) return;
      state.active.splice(to, 0, state.active.splice(from, 1)[0]);
      state.active.forEach(function (id, i) { if (tiles[id]) tiles[id].style.order = i; });
      persistActive(); syncHash(); renderActiveStrip();
    });
  }
  function clearDropTargets() { document.querySelectorAll('.tile.drop-target').forEach(function (t) { t.classList.remove('drop-target'); }); }

  /* ------------------------------------------------------------------ *
   * Activation
   * ------------------------------------------------------------------ */
  function toggleChannel(id) {
    if (!byId[id]) return;
    var i = state.active.indexOf(id);
    if (i >= 0) {
      state.active.splice(i, 1);
      if (id === state.focusId) state.focusId = state.active[0] || null;
    } else {
      state.active.push(id);
      // in single mode, jump straight to the channel you just turned on
      if (state.layout === 'single') state.focusId = id;
    }
    afterActiveChange();
  }
  function afterActiveChange() {
    persistActive(); syncHash(); renderGrid();
    // update row active states cheaply
    document.querySelectorAll('.chan').forEach(function (r) {
      var on = state.active.indexOf(r.dataset.id) >= 0;
      r.classList.toggle('active', on);
      r.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderActiveStrip(); updateDiag();
  }
  function persistActive() { if (state.remember) lsSet(LS.active, state.active); }

  function clearAll() {
    if (!state.active.length) return;
    state.active = []; afterActiveChange();
    document.querySelectorAll('.chan.active').forEach(function (r) { r.classList.remove('active'); });
  }

  /* ------------------------------------------------------------------ *
   * Catalog mutation (add / remove)
   * ------------------------------------------------------------------ */
  function removeFromCatalog(ch) {
    if (state.active.indexOf(ch.id) >= 0) toggleChannel(ch.id);
    if (ch._custom) {
      state.custom = state.custom.filter(function (c) { return c.id !== ch.id; });
      persistCustom();
      toast('Removed “' + ch.name + '”');
    } else {
      if (state.hidden.indexOf(ch.id) < 0) state.hidden.push(ch.id);
      lsSet(LS.hidden, state.hidden);
      toast('Hidden “' + ch.name + '” — restore via Settings → Reset');
    }
    rebuildIndex(); state.custom.forEach(function (c) { c._custom = true; }); renderSidebar();
  }

  function genId() { return 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36); }

  var KNOWN_PROVIDERS = { 'yt-channel': 1, 'yt-video': 1, 'twitch': 1, 'vk': 1, 'rutube': 1, 'odysee': 1, 'iframe': 1, 'hls': 1 };
  // Validate/clean a channel definition coming from an untrusted source
  // (shared URL or imported file) before it touches the DOM or an iframe.
  function sanitizeDef(def) {
    if (!def || typeof def !== 'object') return null;
    if (!KNOWN_PROVIDERS[def.provider]) return null;
    if (typeof def.source !== 'string' || !def.source) return null;
    if (['vk', 'rutube', 'odysee', 'iframe', 'hls'].indexOf(def.provider) >= 0 && !/^https?:\/\//i.test(def.source)) return null;
    var logo = String(def.logo || '');
    return {
      id: (String(def.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40)) || genId(),
      name: String(def.name || 'Stream').slice(0, 80),
      desc: String(def.desc || '').slice(0, 140),
      category: (String(def.category || 'other').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40)) || 'other',
      logo: (/^https?:\/\//i.test(logo) || /^logos\//.test(logo)) ? logo : '',
      provider: def.provider,
      source: String(def.source).slice(0, 600),
      note: String(def.note || '').slice(0, 30),
    };
  }
  function persistCustom() {
    lsSet(LS.custom, state.custom.map(function (c) {
      var x = {}; for (var k in c) if (k !== '_custom' && k !== '_videoId') x[k] = c[k]; return x;
    }));
  }
  function applySharedCustoms(list) {
    if (!list || !list.length) return;
    var defs = list.map(sanitizeDef).filter(Boolean).filter(function (d) { return !byId[d.id]; });
    if (!defs.length) return;
    // A shared link can carry generic-page embeds chosen by the sender, not the
    // viewer. Require explicit opt-in before framing arbitrary external origins.
    var risky = defs.filter(function (d) { return d.provider === 'iframe'; });
    if (risky.length) {
      var hosts = risky.map(function (d) { try { return new URL(d.source).hostname; } catch (e) { return d.source; } });
      var ok = window.confirm('This shared link wants to embed ' + risky.length + ' external page(s):\n\n' +
        hosts.join('\n') + '\n\nOnly continue if you trust whoever sent this link. Embed them?');
      if (!ok) defs = defs.filter(function (d) { return d.provider !== 'iframe'; });
    }
    defs.forEach(function (def) { def._custom = true; state.custom.push(def); });
    persistCustom();
    rebuildIndex();
    state.custom.forEach(function (c) { c._custom = true; });
  }

  function addCustomChannel(def, andPlay) {
    def.id = def.id || genId();
    while (byId[def.id]) def.id = genId();   // never collide with an existing channel
    def._custom = true;
    state.custom.push(def);
    persistCustom();
    rebuildIndex(); state.custom.forEach(function (c) { c._custom = true; });
    state.openCats.add(def.category);
    renderSidebar();
    if (andPlay && state.active.indexOf(def.id) < 0) toggleChannel(def.id);
    return def;
  }

  /* ------------------------------------------------------------------ *
   * Modals
   * ------------------------------------------------------------------ */
  var lastFocused = null;
  function focusables(container) {
    return [].slice.call(container.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(function (e) { return e.offsetParent !== null; });
  }
  function openModal(sel) {
    var m = $(sel);
    lastFocused = document.activeElement;
    m.classList.add('open');
    var f = focusables(m);
    if (f.length) setTimeout(function () { f[0].focus(); }, 30);
  }
  function restoreFocus() { if (lastFocused && lastFocused.focus) { lastFocused.focus(); } lastFocused = null; }
  function closeModal(sel) { $(sel).classList.remove('open'); restoreFocus(); }
  function closeAllModals() {
    var any = document.querySelectorAll('.modal-overlay.open');
    any.forEach(function (m) { m.classList.remove('open'); });
    if (any.length) restoreFocus();
  }

  function fillCatSelect() {
    var sel = $('#f-cat'); sel.innerHTML = '';
    CATS.forEach(function (c) {
      var o = el('option'); o.value = c.id; o.textContent = (c.flag || '') + ' ' + c.name; sel.appendChild(o);
    });
  }

  function openAddModal() {
    fillCatSelect();
    $('#f-url').value = ''; $('#f-name').value = ''; $('#f-newcat').value = '';
    $('#f-logo').value = ''; $('#f-note').value = ''; $('#f-detected').textContent = ''; $('#f-detected').className = 'detected';
    openModal('#addModal'); setTimeout(function () { $('#f-url').focus(); }, 50);
  }

  function openIptvModal() {
    $('#iptv-url').value = ''; $('#iptv-cat').value = '';
    openModal('#iptvModal'); setTimeout(function () { $('#iptv-url').focus(); }, 50);
  }

  function onUrlInput() {
    var raw = $('#f-url').value.trim();
    var d = $('#f-detected');
    if (!raw) { d.textContent = ''; d.className = 'detected'; return; }
    var r = detectProvider(raw);
    if (r.error) { d.textContent = '✕ ' + r.error; d.className = 'detected err'; return; }
    if (r.provider === 'iframe') {
      d.textContent = '⚠ Will try to embed — many sites (YouTube watch pages, Twitch, social media, most news sites) block embedding and will show a blank tile.';
      d.className = 'detected warn';
    } else {
      d.textContent = '✓ Detected: ' + (PROVIDER_LABEL[r.provider] || r.provider);
      d.className = 'detected';
    }
    // try to prefill a name for YouTube videos via oEmbed (no key needed)
    if (!$('#f-name').value && r.provider === 'yt-video') prefillYtName(r.source);
  }
  function prefillYtName(videoId) {
    fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + videoId))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.title && !$('#f-name').value) $('#f-name').value = j.title; })
      .catch(function () {});
  }

  function saveAdd() {
    var raw = $('#f-url').value.trim();
    var r = detectProvider(raw);
    if (r.error) { toast(r.error); return; }
    var name = $('#f-name').value.trim();
    var newCat = $('#f-newcat').value.trim();
    var cat = newCat ? newCat.toLowerCase().replace(/\s+/g, '-') : $('#f-cat').value;
    var note = $('#f-note').value.trim();
    var logo = $('#f-logo').value.trim();

    if (r.provider === 'm3u') {   // a playlist, not a single stream → expand it
      closeModal('#addModal');
      importPlaylistFromUrl(r.source, cat || 'iptv');
      return;
    }

    function finish(provider, source) {
      if (!name) name = defaultName(provider, source);
      if (!logo && provider === 'yt-video') logo = 'https://i.ytimg.com/vi/' + source + '/mqdefault.jpg';
      // run user input through the same validator as shared/imported defs
      var def = sanitizeDef({ name: name, desc: PROVIDER_LABEL[provider], category: cat, logo: logo, provider: provider, source: source, note: note });
      if (!def) { toast('That stream could not be added.'); return; }
      if (newCat && !CATS.some(function (c) { return c.id === def.category; })) CATS.push({ id: def.category, name: newCat, flag: '📺' });
      addCustomChannel(def, true);
      closeModal('#addModal');
      toast('Added “' + def.name + '” and put it on air');
    }

    if (r.provider === 'yt-handle') {
      if (!apiReady()) { toast('Add a YouTube API key in Settings to resolve @handles, or paste the channel’s UC… URL or a video link.'); return; }
      toast('Resolving handle…');
      resolveHandle(r.source).then(function (cid) { finish('yt-channel', cid); }).catch(function (e) { toast('Could not resolve handle: ' + e.message); });
      return;
    }
    finish(r.provider, r.source);
  }
  function defaultName(provider, source) {
    if (provider === 'twitch') return source;
    if (provider === 'yt-channel') return 'YouTube channel';
    if (provider === 'yt-video') return 'YouTube live';
    try { return new URL(source).hostname.replace(/^www\./, ''); } catch (e) { return 'Stream'; }
  }

  /* ------------------------------------------------------------------ *
   * IPTV / M3U playlists  — parse a playlist and bulk-add its channels
   * (HLS streams play via hls.js; CORS on the playlist/segments is the
   * usual blocker, hence the file-import fallback.)
   * ------------------------------------------------------------------ */
  function parseM3U(text) {
    var lines = String(text).split(/\r?\n/), out = [], cur = null;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      if (line.indexOf('#EXTINF') === 0) {
        // the name is after the LAST comma that isn't inside a quoted attribute,
        // so strip key="..."/key='...' attrs (which may contain commas) first
        var rest = line.slice(line.indexOf(':') + 1);
        var nameStr = rest.replace(/[\w-]+="[^"]*"/g, '').replace(/[\w-]+='[^']*'/g, '');
        var ci = nameStr.indexOf(',');
        cur = {
          name: (ci >= 0 ? nameStr.slice(ci + 1) : nameStr).trim(),
          logo: (line.match(/tvg-logo="([^"]*)"/) || [])[1] || '',
          group: (line.match(/group-title="([^"]*)"/) || [])[1] || '',
        };
      } else if (line.charAt(0) === '#') {
        continue;
      } else {
        var entry = cur || { name: '', logo: '', group: '' };
        entry.url = line; out.push(entry); cur = null;
      }
    }
    return out;
  }
  function addPlaylistEntries(entries, fallbackCat, baseUrl) {
    var added = 0, skipped = 0;
    entries.forEach(function (e) {
      var u = e.url;
      if (baseUrl) { try { u = new URL(e.url, baseUrl).href; } catch (x) { skipped++; return; } } // resolve relative entries
      else if (!/^https?:\/\//i.test(u)) { skipped++; return; }   // file import: can't resolve relative URLs
      var r = detectProvider(u);
      if (r.error || r.provider === 'm3u') { skipped++; return; }
      var catName = e.group || '';
      var catId = (catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)) || (fallbackCat || 'iptv');
      if (!CATS.some(function (c) { return c.id === catId; })) CATS.push({ id: catId, name: catName || 'IPTV', flag: '📡' });
      var def = sanitizeDef({ name: e.name || r.source, desc: 'IPTV', category: catId, logo: e.logo || '', provider: r.provider, source: r.source, note: '' });
      if (!def) { skipped++; return; }
      def.id = genId(); while (byId[def.id]) def.id = genId();
      def._custom = true; state.custom.push(def); byId[def.id] = def;
      added++;
    });
    persistCustom(); rebuildIndex(); state.custom.forEach(function (c) { c._custom = true; });
    renderSidebar();
    toast('Imported ' + added + ' channel' + (added !== 1 ? 's' : '') + (skipped ? ' (' + skipped + ' skipped)' : '') + ' — find them in the Control Room');
    return { added: added, skipped: skipped };
  }
  function importPlaylistFromText(text, fallbackCat, baseUrl) {
    var entries = parseM3U(text);
    if (!entries.length) { toast('No channels found in that playlist.'); return; }
    addPlaylistEntries(entries, fallbackCat, baseUrl);
  }
  function importPlaylistFromUrl(url, fallbackCat) {
    toast('Fetching playlist…');
    fetch(url).then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.text(); })
      .then(function (t) { importPlaylistFromText(t, fallbackCat, url); })   // pass playlist URL as base
      .catch(function () { toast('Could not fetch that playlist (usually CORS-blocked). Download the .m3u and use “Import file” instead.'); });
  }

  /* ----- Settings ----- */
  function openSettings() {
    $('#f-apikey').value = state.apikey || '';
    $('#f-remember').checked = !!state.remember;
    openModal('#settingsModal');
  }
  function saveSettings() {
    var key = $('#f-apikey').value.trim();
    var changed = key !== state.apikey;
    state.apikey = key; lsSet(LS.apikey, key);
    state.remember = $('#f-remember').checked; lsSet(LS.remember, state.remember);
    if (!state.remember) lsSet(LS.active, []);
    closeModal('#settingsModal');
    updateDiag();
    toast('Settings saved');
    if (changed && key) { liveCache = {}; liveInflight = {}; lsSet(LS.live, {}); renderGrid(); renderSidebar(); }
  }
  function exportConfig() {
    var data = { version: 1, custom: state.custom, hidden: state.hidden, layout: state.layout, remember: state.remember };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'carino-multiviewer-config.json'; a.click();
    URL.revokeObjectURL(a.href);
  }
  function importConfig(file) {
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result);
        if (Array.isArray(d.custom)) { state.custom = d.custom.map(sanitizeDef).filter(Boolean); persistCustom(); }
        if (Array.isArray(d.hidden)) { state.hidden = d.hidden.filter(function (x) { return typeof x === 'string'; }); lsSet(LS.hidden, state.hidden); }
        if (d.layout) { state.layout = migrateMode(d.layout); lsSet(LS.layout, state.layout); setLayoutButtons(); }
        rebuildIndex(); state.custom.forEach(function (c) { c._custom = true; });
        // an imported catalog may no longer contain a currently on-air id
        state.active = state.active.filter(function (id) { return byId[id]; });
        persistActive(); syncHash();
        renderSidebar(); renderGrid();
        toast('Config imported');
      } catch (e) { toast('Invalid config file'); }
    };
    rd.readAsText(file);
  }
  function resetAll() {
    if (!confirm('Reset all custom channels, hidden channels and settings? This cannot be undone.')) return;
    [LS.custom, LS.hidden, LS.layout, LS.open].forEach(function (k) { localStorage.removeItem(k); });
    state.custom = []; state.hidden = []; state.openCats = new Set(); state.layout = 'grid'; state.focusId = null;
    state.focusAuto = false;
    var fab = $('#focusAutoBtn'); if (fab) { fab.classList.remove('on'); fab.setAttribute('aria-pressed', 'false'); fab.textContent = '⟳ Auto-rotate'; }
    CATS = MV_CATALOG.categories.slice();
    rebuildIndex();
    // drop any on-air streams that no longer exist, then re-render the wall
    state.active = state.active.filter(function (id) { return byId[id]; });
    persistActive(); syncHash();
    renderSidebar(); setLayoutButtons(); renderGrid();
    closeModal('#settingsModal'); toast('Reset complete');
  }

  /* ------------------------------------------------------------------ *
   * Share
   * ------------------------------------------------------------------ */
  function shareWall() {
    if (!state.active.length) { toast('Turn on some streams first, then share.'); return; }
    syncHash();
    var url = location.href;
    function done() { toast('Wall link copied to clipboard'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this wall link:', url); });
    } else { prompt('Copy this wall link:', url); }
  }

  /* ------------------------------------------------------------------ *
   * Mute all
   * ------------------------------------------------------------------ */
  function muteAll() {
    // if anything is unmuted, mute everything; otherwise unmute everything
    var shouldMute = state.active.some(function (id) { return state.muted[id] === false; });
    state.active.forEach(function (id) {
      if ((state.muted[id] !== false) !== shouldMute) setTileMute(id, shouldMute); // only change tiles that differ
      else state.muted[id] = shouldMute;
    });
    updateMuteAllBtn();
  }
  function updateMuteAllBtn() {
    var anyUnmuted = state.active.some(function (id) { return state.muted[id] === false; });
    var b = $('#muteAllBtn');
    b.textContent = (!state.active.length || anyUnmuted) ? '🔇 Mute all' : '🔊 Unmute all';
    b.disabled = !state.active.length;
  }

  /* ------------------------------------------------------------------ *
   * Navbar clock + greeting + diagnostics
   * ------------------------------------------------------------------ */
  // Header clock (#clockLocal/#tzName + click-to-cycle) is owned by the shared
  // module carino-clock.js; here we only keep #diagClock and the greeting fresh.
  function tick() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    var local = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    var dc = $('#diagClock'); if (dc) dc.textContent = local;
    var h = d.getHours();
    var g = h < 5 ? 'Burning the midnight oil.' : h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';
    $('#greeting').textContent = g;
  }
  function updateDiag() {
    $('#diagActive').textContent = state.active.length;
    $('#diagTotal').textContent = allChannels().length;
    $('#diagCustom').textContent = state.custom.length;
    var api = $('#diagApi'), live = $('#diagLive');
    if (apiReady()) { api.textContent = 'Active'; api.className = 'diag-val good'; live.textContent = 'On (Data API v3)'; live.className = 'diag-val good'; }
    else { api.textContent = 'Not set'; api.className = 'diag-val'; live.textContent = 'Embed fallback'; live.className = 'diag-val warn'; }
  }
  function apiError(err) {
    var msg = String(err && err.message || err);
    if (/quota/i.test(msg)) toast('YouTube API quota exceeded — using embed fallback.');
    else if (/keyInvalid|API key/i.test(msg)) toast('YouTube API key invalid — check Settings.');
    else toast('YouTube API error: ' + msg);
  }

  /* ------------------------------------------------------------------ *
   * Layout buttons
   * ------------------------------------------------------------------ */
  function setLayoutButtons() {
    document.querySelectorAll('#layoutSeg button').forEach(function (b) {
      var on = b.dataset.mode === state.layout;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    // Control-strip visibility is driven by the mode-* body classes that
    // applyLayout()/renderGrid() set on every render (single source of truth).
  }
  function setMode(mode) {
    if (!MODES[mode]) return;
    state.layout = mode; lsSet(LS.layout, mode);
    setLayoutButtons(); syncHash(); renderGrid(); syncFocusRotate();
  }
  function setFocus(id) {
    state.focusId = id;
    // ★ keeps the current mode if it already has a primary (single/focus),
    // otherwise it promotes the tile into Focus.
    if (state.layout === 'focus' || state.layout === 'single') { applyLayout(); syncFocusRotate(); }
    else setMode('focus');
  }

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */
  function wire() {
    // navbar
    function syncDiagAria() { $('#diagToggle').setAttribute('aria-expanded', $('#diagBox').classList.contains('open') ? 'true' : 'false'); }
    $('#diagToggle').addEventListener('click', function (e) { e.stopPropagation(); $('#diagBox').classList.toggle('open'); syncDiagAria(); });
    document.addEventListener('click', function (e) {
      var box = $('#diagBox');
      if (box.classList.contains('open') && !box.contains(e.target) && !$('#diagToggle').contains(e.target)) { box.classList.remove('open'); syncDiagAria(); }
    });

    // Motion's CSS grid (auto-fill) reflows columns on its own, so a resize/
    // sidebar-toggle must NOT rebuild the wall (that resets scroll & churns DOM).
    function relayout() { if (state.layout !== 'motion') applyLayout(); }

    // sidebar
    $('#sbToggle').addEventListener('click', function () {
      document.body.classList.toggle('sidebar-collapsed');
      setTimeout(relayout, 280); // stage width changes after the slide transition
    });

    // keep the wall filling the stage on viewport changes
    var rT;
    window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(relayout, 150); });
    $('#addBtn').addEventListener('click', openAddModal);
    $('#iptvBtn').addEventListener('click', openIptvModal);
    $('#emptyAddBtn').addEventListener('click', openAddModal);
    $('#settingsBtn').addEventListener('click', openSettings);
    $('#shareBtn').addEventListener('click', shareWall);
    $('#clearBtn').addEventListener('click', clearAll);
    $('#muteAllBtn').addEventListener('click', muteAll);

    // search
    var search = $('#search');
    search.addEventListener('input', function () {
      state.query = search.value.trim();
      $('#searchBox').classList.toggle('has-text', !!state.query);
      renderSidebar();
    });
    $('#searchClear').addEventListener('click', function () { search.value = ''; state.query = ''; $('#searchBox').classList.remove('has-text'); renderSidebar(); search.focus(); });

    // layout modes
    document.querySelectorAll('#layoutSeg button').forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.dataset.mode); });
    });
    // motion controls
    $('#motionPause').addEventListener('click', function () {
      state.motionPaused = !state.motionPaused;
      $('#motionPause').textContent = state.motionPaused ? '▶ Resume' : '⏸ Pause';
    });
    $('#motionSource').addEventListener('click', function () {
      state.motionAll = !state.motionAll;
      $('#motionSource').textContent = state.motionAll ? 'All channels' : 'On air only';
      if (state.layout === 'motion') renderMotion();
    });
    // single-mode channel stepper
    $('#singlePrev').addEventListener('click', function () { stepSingle(-1); });
    $('#singleNext').addEventListener('click', function () { stepSingle(1); });

    // focus auto-rotate
    $('#focusAutoBtn').addEventListener('click', function () {
      state.focusAuto = !state.focusAuto;
      var fab = $('#focusAutoBtn');
      fab.classList.toggle('on', state.focusAuto);
      fab.setAttribute('aria-pressed', state.focusAuto ? 'true' : 'false');
      fab.textContent = state.focusAuto ? '⟳ Auto-rotate: on' : '⟳ Auto-rotate';
      syncFocusRotate();
      applyLayout();   // refresh the (auto) hint in the diag label
    });

    // add modal
    $('#f-url').addEventListener('input', onUrlInput);
    $('#addSave').addEventListener('click', saveAdd);

    // IPTV modal
    $('#iptvImportUrl').addEventListener('click', function () {
      var url = $('#iptv-url').value.trim();
      if (!url) { toast('Paste an .m3u / .m3u8 playlist URL first.'); return; }
      closeModal('#iptvModal'); importPlaylistFromUrl(url, $('#iptv-cat').value.trim().toLowerCase().replace(/\s+/g, '-') || 'iptv');
    });
    $('#iptvFile').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { closeModal('#iptvModal'); importPlaylistFromText(rd.result, $('#iptv-cat').value.trim().toLowerCase().replace(/\s+/g, '-') || 'iptv'); };
      rd.readAsText(f); e.target.value = '';
    });
    $('#iptvPickFile').addEventListener('click', function () { $('#iptvFile').click(); });

    // settings modal
    $('#settingsSave').addEventListener('click', saveSettings);
    $('#exportBtn').addEventListener('click', exportConfig);
    $('#importBtn').addEventListener('click', function () { $('#importFile').click(); });
    $('#importFile').addEventListener('change', function (e) { if (e.target.files[0]) importConfig(e.target.files[0]); e.target.value = ''; });
    $('#resetBtn').addEventListener('click', resetAll);

    // modal close buttons + overlay click
    document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { closeModal('#' + b.closest('.modal-overlay').id); }); });
    document.querySelectorAll('.modal-overlay').forEach(function (m) {
      m.addEventListener('click', function (e) { if (e.target === m) closeModal('#' + m.id); });
      m.addEventListener('keydown', function (e) {            // trap Tab inside the open modal
        if (e.key !== 'Tab') return;
        var f = focusables(m); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    });

    // keyboard
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeAllModals(); $('#diagBox').classList.remove('open'); syncDiagAria(); }
      var ae = document.activeElement;
      if (e.key === '/' && ae && ae.tagName !== 'INPUT' && ae.tagName !== 'TEXTAREA' && ae.tagName !== 'SELECT' && !ae.isContentEditable) {
        e.preventDefault(); search.focus();
      }
    });

    // react to hash changes (back/forward, pasted link in same tab)
    window.addEventListener('hashchange', function () { applyHash(readHash(), false); });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function applyHash(h, isInitial) {
    if (!h) return;
    // merge any shared custom channel defs into the catalog (sanitized)
    applySharedCustoms(h.custom);
    if (h.mode) { state.layout = h.mode; lsSet(LS.layout, state.layout); }
    var ids = (h.v || []).filter(function (id) { return byId[id]; });
    state.active = ids;
    suppressHash = true;
    setLayoutButtons(); renderSidebar(); renderGrid();
    suppressHash = false;
    syncHash();
  }

  function boot() {
    rebuildIndex();
    state.custom.forEach(function (c) { c._custom = true; });

    // open categories that have active channels (resolved below) or default International
    var hash = readHash();
    var initialActive;
    if (hash && hash.v && hash.v.length) {
      // hash wins
      applySharedCustoms(hash.custom);
      if (hash.mode) state.layout = hash.mode;
      initialActive = hash.v.filter(function (id) { return byId[id]; });
    } else if (state.remember) {
      initialActive = (lsGet(LS.active, []) || []).filter(function (id) { return byId[id]; });
    } else {
      initialActive = [];
    }
    state.active = initialActive;

    // always expand categories that have streams on air (so shared walls reveal them),
    // then fall back to International if nothing is open at all.
    state.active.forEach(function (id) { if (byId[id]) state.openCats.add(byId[id].category); });
    if (!state.openCats.size) state.openCats.add('international');

    // On phones, start with the control room collapsed so the wall is visible.
    if (window.innerWidth < 820) document.body.classList.add('sidebar-collapsed');

    fillCatSelect();
    setLayoutButtons();
    renderSidebar();
    renderGrid();
    updateDiag();
    tick(); setInterval(tick, 1000);
    syncHash();
    wire();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
