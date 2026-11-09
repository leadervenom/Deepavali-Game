(function () {
  const D = window.DATA;
  const $ = (s) => document.querySelector(s);
  const app = $("#app");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const buzz = (n) => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function decrypt(blob, secret) {
    try {
      const raw = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret.trim().toUpperCase()), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: unb64(blob.s), iterations: blob.n || D.iter, hash: "SHA-256" }, raw, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(blob.i) }, key, unb64(blob.c));
      return JSON.parse(new TextDecoder().decode(pt));
    } catch (e) { return null; }
  }

  // ---------- state ----------
  const STEPS = [["start", "Welcome"], ["scene", "The Scene"], ["cast", "The Suspects"], ["role", "Your Role"], ["clues", "Clues"], ["vote", "Accuse"]];
  let caseId = store.get("case") || null;
  let step = Math.max(0, STEPS.findIndex((s) => s[0] === store.get("step")));
  if (!caseId) step = 0;
  let justUnlocked = false, dir = 1;
  const unlocked = {};
  try { Object.assign(unlocked, JSON.parse(store.get("unlocked") || "{}")); } catch (e) {}
  const save = () => store.set("unlocked", JSON.stringify(unlocked));
  const cur = () => D.cases.find((c) => c.id === caseId);
  const guess = {};

  // ---------- screens ----------
  function start() {
    return `<h1>Burj Khalifa<br>Murder Mystery</h1>
    <p class="lead">Deepavali night, 124 floors above Dubai. Somebody here is a killer.</p>
    <h3>Choose your case</h3>
    ${D.cases.map((c) => `<button class="btn case-btn" data-case="${c.id}"><span>${esc(c.title)}<small>${c.players}</small></span></button>`).join("")}
    <details class="card"><summary>House rules</summary><ol style="padding-left:1.1em;margin:0">
    <li>Bell rings and "Phones down": put your phone face down.</li>
    <li>Innocents may dodge questions about their own secret, but never lie about what they saw or know.</li>
    <li>Only the killer may lie about anything.</li>
    <li>Speak in character. Say "I" and use your name.</li>
    <li>No peeking at other phones.</li></ol></details>`;
  }

  function scene() {
    const c = cur(); if (c.visual) return sceneV(c);
    return `<h2>${esc(c.title)}</h2>
    <div class="card gold"><div class="lab" style="margin:0">${esc(c.scene.victimLabel || "The victim")}</div>${esc(c.scene.victim)}</div>
    <p>${esc(c.scene.setting)}</p>
    <h3>Timeline everyone knows</h3>
    <ul class="tl">${c.scene.timeline.map(([t, w], i) => `<li style="animation-delay:${0.25 + i * 0.18}s"><b>${esc(t)}</b>${esc(w)}</li>`).join("")}</ul>
    <div class="card"><h3>Witnesses (played by the narrator)</h3><ul class="plain">${c.scene.witnesses.map((w) => `<li>${esc(w)}</li>`).join("")}</ul><p class="mute">Each player may ask one question.</p></div>`;
  }

  function cast() {
    const c = cur(); if (c.visual) return castV(c);
    return `<h2>Meet the suspects</h2><p class="mute">Swipe through. Everyone here has a secret.</p>
    <div class="car" id="car">${c.cast.map((p) => `<div class="card"><h3>${esc(p.name)}</h3><span class="tag">${esc(p.title)}</span><p>${esc(p.bio)}</p></div>`).join("")}</div>
    <div class="dots" id="dots">${c.cast.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>`;
  }

  function role() {
    const c = cur(), r = unlocked["r_" + c.id];
    if (r && r.rows) return roleV(c, r);
    if (r) return `<p class="mute">Private. Keep your screen hidden.</p><div class="${justUnlocked ? "flip" : ""}"><h2>${esc(r.name)}</h2><span class="tag">${esc(r.title)}</span>
      ${r.killerNote ? `<div class="card danger shine"><div class="lab" style="color:var(--danger);margin:0">Secret instructions</div>${esc(r.killerNote)}</div>` : ""}
      <div class="card gold shine"><div class="lab" style="margin:0">Your bio</div>${esc(r.bio)}
      <div class="lab">Your secret (you may dodge)</div>${esc(r.secret)}
      <div class="lab">What you know (never lie about it)</div>${esc(r.know)}
      <div class="lab">Your alibi</div>${esc(r.alibi)}</div></div>
      <button class="btn ghost" data-act="hiderole">Hide my card</button>`;
    return `<h2>Your role</h2><p>Enter the 4-letter code the narrator whispered to you.</p>
    <input id="code" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="····">
    <div class="err" id="err"></div><button class="btn" data-act="role" style="text-align:center">Open my card</button>`;
  }

  function clues() {
    const c = cur();
    let out = `<h2>Clues</h2>`;
    c.drops.forEach((_, n) => {
      const d = unlocked["d_" + c.id + n];
      if (d) out += `<h3>Clue drop ${n + 1}</h3>${d.clues.map((cl, i) => !Array.isArray(cl) ? A.evidence(cl.type, cl.title, cl.lines, nbGet(c.id).p.includes(cl.title), i * 0.15, cl.img) : ((([t, x]) =>  `<div class="card gold ${justUnlocked ? "enter" : ""}" style="animation-delay:${i * 0.15}s"><h3>${esc(t)}</h3>${esc(x)}</div>`)(cl))).join("")}`;
    });
    const next = c.drops.findIndex((_, n) => !unlocked["d_" + c.id + n]);
    if (next >= 0) out += `<h3>Clue drop ${next + 1} (locked)</h3><p class="mute">Waiting for the narrator's code word.</p><input id="code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODE WORD" style="font-size:1.3rem;letter-spacing:.15em">
      <div class="err" id="err"></div><button class="btn" data-act="clue" style="text-align:center">Unlock</button>`;
    return out;
  }

  function vote() {
    const c = cur(), g = guess[c.id];
    if (c.visual) return voteV(c);
    return `<h2>Who did it?</h2><p>Tap your suspect. When the narrator counts to three, point at them!</p>
    ${c.cast.map((p, i) => `<div class="card pick ${g === i ? "on" : ""}" data-pick="${i}"><div class="av">${esc(p.name[0])}</div><div><b>${esc(p.name)}</b><br><span class="mute">${esc(p.title)}</span></div></div>`).join("")}
    <button class="btn ghost" data-act="restart">Switch case / start over</button>`;
  }

  // ---------- visual case screens (art.js) ----------
  const A = window.ART;
  let selSpot = null; const seen = {};
  const nbGet = (id) => { try { const o = JSON.parse(store.get("nb." + id) || "{}"); return { m: o.m || {}, p: o.p || [] }; } catch (e) { return { m: {}, p: [] }; } };
  const nbSet = (id, o) => store.set("nb." + id, JSON.stringify(o));
  const NB = { unsure: ["ask", "Unsure"], suspect: ["search", "Suspect"], cleared: ["check", "Cleared"] };
  const chip = (st) => `<span class="chip ${st}">${A.icon(NB[st][0])}${NB[st][1]}</span>`;
  const li = (a) => a.map((b) => `<li>${esc(b)}</li>`).join("");

  function spotsFor(c) {
    const base = c.map.spots.map((s) => ({ ...s, bullets: [...s.bullets] }));
    c.drops.forEach((_, n) => {
      const d = unlocked["d_" + c.id + n]; if (!d || !d.spots) return;
      d.spots.forEach((sp) => { const b = base.find((x) => x.id === sp.id); if (b) b.bullets.push(...sp.bullets); else base.push({ ...sp, bullets: [...sp.bullets] }); });
    });
    return base;
  }
  function mapHtml(c) {
    const spots = spotsFor(c), sm = {};
    spots.forEach((s) => { sm[s.id] = !!seen[s.id + ":" + s.bullets.length]; });
    const sel = spots.find((s) => s.id === selSpot);
    return { map: A.floorMap(c.map, spots, selSpot, sm), info: sel ? `${A.icon(sel.icon)}<div><h3>${esc(sel.label)}</h3>${sel.bullets.map((b) => `<p>${esc(b)}</p>`).join("")}</div>` : `${A.icon("pin")}<div><h3>Tap a spot</h3><p class="mute">Look around the room.</p></div>` };
  }
  function sceneV(c) {
    const m = mapHtml(c);
    const im = c.images ? `<img class="sceneimg" src="${esc(c.images.map)}" alt="Floor map of the room"><img class="sceneimg strip-img" src="${esc(c.images.timeline)}" alt="Timeline: 9:00 key on the hook, 9:03 case opened, 9:05 lights flicker, 9:06 cupcake missing">` : "";
    return `<h2>${esc(c.title)}</h2>${im}
    ${c.scene.setting ? `<p>${esc(c.scene.setting)}</p>` : ""}
    <ul class="facts">${c.scene.bullets.map(([i, t]) => `<li>${A.icon(i)}<span>${esc(t)}</span></li>`).join("")}</ul>
    <div class="mapwrap" id="mapwrap">${m.map}</div>
    <div class="card spotinfo" id="spotinfo">${m.info}</div>
    <h3>Timeline</h3>${A.strip(c.strip)}
    <ul class="facts"><li>${A.icon("eye")}<span>Witness: ${esc(c.scene.witnesses[0])}</span></li><li>${A.icon("ask")}<span>${esc(c.scene.witnesses[1])}</span></li></ul>`;
  }
  function castV(c) {
    return `<h2>The suspects</h2>
    <div class="car" id="car">${c.cast.map((p) => `<div class="card pcard">${A.portrait(p.portrait)}<h3>${esc(p.name)}</h3><span class="tag">${esc(p.title)}</span>${p.bio ? `<p>${esc(p.bio)}</p>` : ""}<ul>${li(p.bullets)}</ul></div>`).join("")}</div>
    <div class="dots" id="dots">${c.cast.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>`;
  }
  function roleV(c, r) {
    const p = c.cast.find((x) => x.name === r.name);
    return `<p class="mute">Private. Keep your screen hidden.</p><div class="${justUnlocked ? "flip" : ""}">
    <div class="rhead">${A.portrait(p && p.portrait)}<div><h2>${esc(r.name)}</h2><span class="tag">${esc(r.title)}</span></div></div>
    ${r.thief ? `<div class="card danger"><div class="thief">${A.icon("alert")}<ul>${li(r.thief)}</ul></div></div>` : ""}
    <div class="card gold">${r.rows.map((w) => `<div class="rrow">${A.icon(w.icon)}<div><div class="lab">${esc(w.label)}</div><ul>${li(w.bullets)}</ul></div></div>`).join("")}</div></div>
    <button class="btn ghost" data-act="hiderole">Hide my card</button>`;
  }
  function voteV(c) {
    const g = guess[c.id], nb = nbGet(c.id);
    return `<h2>Who did it?</h2><p class="mute">Tap your suspect. On three, point at them!</p>
    ${c.cast.map((p, i) => `<div class="card pick ${g === i ? "on" : ""}" data-pick="${i}">${A.portrait(p.portrait)}<div><b>${esc(p.name)}</b><br><span class="mute">${esc(p.title)}</span></div><span style="margin-left:auto">${chip(nb.m[p.name] || "unsure")}</span></div>`).join("")}
    <button class="btn ghost" data-act="restart">Switch case / start over</button>`;
  }
  function sheetHtml(c) {
    const n = nbGet(c.id);
    return `<div class="top"><h2>Notebook</h2><button class="xbtn" data-nbact="close" aria-label="Close">${A.icon("x")}</button></div>
    <p class="mute">Private. Saved only on this phone.</p>
    ${c.cast.map((p) => `<button class="nrow" data-nb="${esc(p.name)}">${A.portrait(p.portrait)}<span class="nm">${esc(p.name)}</span>${chip(n.m[p.name] || "unsure")}</button>`).join("")}
    <h3>Pinned clues</h3>
    ${n.p.length ? `<ul class="pinlist">${n.p.map((t) => `<li>${A.icon("pin")}${esc(t)}</li>`).join("")}</ul>` : `<p class="mute">Tap the pin on a clue to keep it here.</p>`}
    <button class="btn ghost" data-nbact="clear">Clear notebook</button>`;
  }
  function openSheet() { const c = cur(); if (!c || !c.visual) return; $("#sheet").innerHTML = sheetHtml(c); $("#sheet").hidden = $("#sheetbg").hidden = false; }
  function closeSheet() { $("#sheet").hidden = $("#sheetbg").hidden = true; }
  $("#nbbtn").onclick = openSheet; $("#sheetbg").onclick = closeSheet;
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
  $("#sheet").addEventListener("click", (e) => {
    const c = cur(), b = e.target.closest("button"); if (!b || !c) return;
    const n = nbGet(c.id);
    if (b.dataset.nbact === "close") return closeSheet();
    if (b.dataset.nbact === "clear") { nbSet(c.id, { m: {}, p: [] }); document.querySelectorAll(".pinbtn.on").forEach((x) => x.classList.remove("on")); }
    if (b.dataset.nb) { const order = ["unsure", "suspect", "cleared"], cu = n.m[b.dataset.nb] || "unsure"; n.m[b.dataset.nb] = order[(order.indexOf(cu) + 1) % 3]; nbSet(c.id, n); buzz(15); }
    $("#sheet").innerHTML = sheetHtml(c);
  });

  function loadNarr() { return window.NARR ? Promise.resolve() : new Promise((res) => { const s = document.createElement("script"); s.src = "/narrator-data.js"; s.onload = s.onerror = res; document.head.appendChild(s); }); }
  // ---------- narrator (unchanged content) ----------
  function narr() {
    const n = unlocked.narr;
    if (!n) return `<h2>Narrator</h2><p>Enter the narrator passcode.</p><input id="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="PASSCODE" maxlength="16" style="font-size:1.3rem;letter-spacing:.15em"><div class="err" id="err"></div><button class="btn" data-act="narr">Unlock</button><p class="mute">Players: this page has spoilers. Eyes away!</p>`;
    const g = n.general, li = (a) => a.map((x) => `<li>${esc(x)}</li>`).join("");
    const d = (t, b, o) => `<details class="card"${o ? " open" : ""}><summary>${t}</summary>${b}</details>`;
    let o = `<h2>Run of show</h2><p class="mute">Narrator only. Spoilers.</p>`
      + `<div class="card"><div class="lab" style="margin:0">Phones down bell (all players' phones)</div><div class="bellrow"><button class="btn" data-act="bell" data-down="1"><svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>Ring: phones down</button><button class="btn ghost" data-act="bell" data-down="0">Phones up</button></div><p class="mute" id="bellmsg" style="margin:8px 0 0"></p></div>`
      + d("Clock and beats", `<ul class="plain">${g.clock.map(([a, b, c]) => `<li><b style="color:var(--accent)">${a}</b> ${esc(b)} <span class="mute">(${c})</span></li>`).join("")}</ul><div class="lab">Eight beats (Case 1 / Case 2)</div><ul class="plain">${g.beats.map(([a, b, c]) => `<li><b>${esc(a)}</b> <span class="mute">${b}</span><br>${esc(c)}</li>`).join("")}</ul>`, true)
      + d("House rules (read aloud)", `<ol>${li(g.rules)}</ol>`) + d("Casting tips", `<ul>${li(g.casting)}</ul>`) + d("Scoring", `<ul>${li(g.scoring)}</ul>`);
    n.cases.forEach((c) => {
      o += `<h2>${esc(c.title)}</h2><div class="card danger"><div class="lab" style="color:var(--danger);margin:0">The killer</div>${esc(c.killer)}</div>`;
      if (c.script) o += d("Script (read aloud)", c.script.map((b) => `<div class="lab">${esc(b.t)}</div>${b.l.map(([k, x]) => k === "say" ? `<p>${esc(x)}</p>` : `<p class="mute">Do: ${esc(x)}</p>`).join("")}`).join(""), true);
      o += d("Role codes and clue code words", `<ul class="plain">${c.codes.map(([k, nm, f]) => `<li><b style="color:var(--accent);letter-spacing:.15em">${k}</b> ${esc(nm)} ${f ? `<span class="tag">${f}</span>` : ""}</li>`).join("")}</ul><div class="lab">Announce aloud</div><ul class="plain">${c.drops.map(([a, w]) => `<li>${a}: <b style="color:var(--accent)">${w}</b></li>`).join("")}</ul>`, true);
      o += d("Witnesses (you play them)", `<ul class="plain">${c.witnesses.map(([a, b]) => `<li><b>${esc(a)}</b><br>${esc(b)}</li>`).join("")}</ul>`);
      if (c.tips.length) o += d("Tips and checks", `<ul>${li(c.tips)}</ul>`);
      o += d("Prop hunt and atmosphere", `<p>${esc(c.prop)}</p><p>${esc(c.atmosphere)}</p>`);
      o += d("Hint ladder (use in order)", `<ol>${li(c.hints)}</ol>`);
      o += d("Solution and reveal", `<ol>${li(c.solution)}</ol><div class="lab">Reveal script</div>${esc(c.reveal)}`);
    });
    return o + `<button class="btn ghost" data-act="lock">Lock narrator page</button><p class="mute" style="text-align:center"><a href="/" style="color:var(--accent)">Back to player view</a></p>`;
  }

  // ---------- render ----------
  const views = { start, scene, cast, role, clues, vote };
  function render() {
    const isN = location.hash === "#narrator" || location.pathname.replace(/\/$/, "") === "/narrator";
    $("#top").hidden = $("#foot").hidden = isN || step === 0;
    if (isN) { $("#down").hidden = true; app.className = ""; app.innerHTML = narr(); window.scrollTo(0, 0); return; }
    if (!caseId) step = 0;
    const key = STEPS[step][0];
    app.innerHTML = views[key]();
    app.className = "enter" + (dir < 0 ? " back" : "");
    $("#nbbtn").hidden = !(cur() && cur().visual);
    $("#fill").style.transform = `scaleX(${step / (STEPS.length - 1)})`;
    $("#stepname").textContent = `${step} / ${STEPS.length - 1} · ${STEPS[step][1]}`;
    $("#back").style.visibility = step <= 1 ? "hidden" : "visible";
    const nx = $("#next");
    nx.style.display = step === STEPS.length - 1 ? "none" : "";
    const nm = STEPS[step + 1] && STEPS[step + 1][1];
    nx.textContent = key === "role" && !unlocked["r_" + caseId] ? "Skip for now →" : `Next: ${nm} →`;
    window.scrollTo(0, 0);
    justUnlocked = false;
    const car = $("#car");
    if (car) car.addEventListener("scroll", () => {
      const i = Math.round(car.scrollLeft / (car.firstElementChild.offsetWidth + 12));
      document.querySelectorAll("#dots i").forEach((d, k) => d.classList.toggle("on", k === i));
    });
  }
  function go(n, d) { step = Math.max(0, Math.min(STEPS.length - 1, n)); dir = d || 1; store.set("step", STEPS[step][0]); render(); }

  $("#next").onclick = () => go(step + 1, 1);
  $("#back").onclick = () => go(step - 1, -1);

  app.addEventListener("click", async (e) => {
    const sp = e.target.closest("[data-spot]");
    if (sp) { const c = cur(), spots = spotsFor(c), s = spots.find((x) => x.id === sp.dataset.spot); selSpot = s.id; seen[s.id + ":" + s.bullets.length] = true; buzz(10); const m = mapHtml(c); $("#mapwrap").innerHTML = m.map; $("#spotinfo").innerHTML = m.info; return; }
    const pb = e.target.closest("[data-pin]");
    if (pb) { const c = cur(), n = nbGet(c.id), t = pb.dataset.pin, k = n.p.indexOf(t); if (k >= 0) n.p.splice(k, 1); else n.p.push(t); nbSet(c.id, n); pb.classList.toggle("on", k < 0); pb.setAttribute("aria-pressed", k < 0); buzz(15); return; }
    const p = e.target.closest("[data-pick]");
    if (p) { guess[caseId] = +p.dataset.pick; buzz(20); return render(); }
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.case) { selSpot = null; caseId = b.dataset.case; store.set("case", caseId); buzz(20); return go(1, 1); }
    const a = b.dataset.act;
    if (a === "lock") { delete unlocked.narr; save(); store.set("np", ""); return render(); }
    if (a === "bell") {
      const msg = $("#bellmsg"), down = b.dataset.down === "1";
      msg.textContent = "Sending…";
      try {
        const r = await fetch("/api/bell", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pass: store.get("np") || "", down }) });
        msg.textContent = r.ok ? (down ? "Bell rung. Phones will blank within a few seconds." : "Phones released.") : r.status === 401 ? "Passcode rejected. Lock and unlock the narrator page again." : "Bell not available (server error).";
        if (r.ok) buzz(30);
      } catch (e) { msg.textContent = "No connection."; }
      return;
    }
    if (a === "narr") { await loadNarr(); const pw = $("#code").value; const r = window.NARR && await decrypt(window.NARR, pw); if (r) { unlocked.narr = r; save(); store.set("np", pw.trim()); return render(); } $("#err").textContent = "Wrong passcode."; return; }
    if (a === "restart") { caseId = null; store.set("case", ""); return go(0, -1); }
    if (a === "hiderole") { delete unlocked["r_" + caseId]; save(); return render(); }
    if (a === "role" || a === "clue") {
      const v = $("#code").value.trim(); if (!v) return;
      b.disabled = true; $("#err").textContent = "Checking…";
      const c = cur();
      if (a === "role") {
        for (const blob of c.roles) { const r = await decrypt(blob, v); if (r) { unlocked["r_" + c.id] = r; save(); justUnlocked = true; buzz([30, 40, 30]); return render(); } }
      } else {
        const n = c.drops.findIndex((_, i) => !unlocked["d_" + c.id + i]);
        const r = await decrypt(c.drops[n], v);
        if (r) { unlocked["d_" + c.id + n] = r; save(); justUnlocked = true; buzz([30, 40, 30]); return render(); }
      }
      buzz(120); $("#err").textContent = "That code doesn't work. Check with the narrator."; b.disabled = false;
    }
  });
  app.addEventListener("keydown", (e) => { const sp = e.target.closest && e.target.closest("[data-spot]"); if (sp && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); sp.dispatchEvent(new MouseEvent("click", { bubbles: true })); return; } if (e.key === "Enter") { const b = app.querySelector("[data-act]:not(.ghost)"); if (b) b.click(); } });

  // ---------- phones-down bell (narrator rings it, players poll) ----------
  const isNarr = () => location.hash === "#narrator" || location.pathname.replace(/\/$/, "") === "/narrator";
  let bellId = 0, wokeId = 0, bellDown = false;
  const showDown = () => { $("#down").hidden = isNarr() || !(bellDown && bellId !== wokeId); };
  async function pollBell() {
    if (isNarr() || document.hidden) return;
    try {
      const r = await fetch("/api/bell", { cache: "no-store" }); if (!r.ok) return;
      const s = await r.json(); bellId = s.id; bellDown = s.down;
      if (s.down && s.id !== wokeId) buzz([60, 40, 60]);
      showDown();
    } catch (e) {}
  }
  setInterval(pollBell, 3000);
  document.addEventListener("visibilitychange", pollBell);
  pollBell();

  let taps = 0, tt;
  $("#down .bellbig").addEventListener("click", () => {
    taps++; clearTimeout(tt); tt = setTimeout(() => (taps = 0), 1200);
    if (taps >= 3) { taps = 0; wokeId = bellId; showDown(); }
  });
  window.addEventListener("hashchange", render);

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  render();
})();
