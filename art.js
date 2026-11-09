// Flat vector art kit: icons, portraits, floor map, evidence cards. Palette comes from style.css tokens.
window.ART = (function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const I = {
    key: '<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H21M17 12v3M20 12v2"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    camera: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2.5h5L16 7"/>',
    cupcake: '<path d="M6 12h12l-1.6 8H7.6z"/><path d="M5.5 12a3.5 3.5 0 0 1 3-4.5 3.5 3.5 0 0 1 7 0 3.5 3.5 0 0 1 3 4.5"/><path d="M12 4.5V3"/>',
    coffee: '<path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3v3M12 3v3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    receipt: '<path d="M6 3h12v18l-2.5-1.8L13 21l-2.5-1.8L8 21l-2-1.5z"/><path d="M9 8h6M9 12h6"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
    window: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M12 4v16M4 12h16"/>',
    desk: '<path d="M3 9h18v3H3z"/><path d="M5 12v8M19 12v8M9 12v4h6v-4"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.8c.6.5 1 1.2 1 2V16h5v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
    book: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12 8h4M12 12h4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    ask: '<path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 17.5v.5"/>',
    pin: '<path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z"/><circle cx="12" cy="10" r="2"/>',
    door: '<path d="M6 21V4h9l3 2v15M3 21h18"/><circle cx="13" cy="13" r=".8"/>',
  };
  const icon = (n, cls) => `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ""}</svg>`;

  // ---- portraits (flat head-and-shoulders) ----
  function portrait(p, cls) {
    p = p || {};
    const skin = p.skin || "#d9a67c", hair = p.hair || "#2b1c14", top = p.top || "#8a6244";
    const cap = `<path d="M34 42C33 24 44 20 50 20C58 20 67 25 66 42C62 34 56 31 50 31C44 31 38 34 34 42z" fill="${hair}"/>`;
    const style = {
      short: cap,
      bun: cap + `<circle cx="50" cy="16" r="7" fill="${hair}"/>`,
      long: cap + `<path d="M33 40C30 62 33 72 39 74L41 50zM67 40C70 62 67 72 61 74L59 50z" fill="${hair}"/>`,
    }[p.style || "short"];
    const prop = {
      badge: `<rect x="58" y="80" width="11" height="8" rx="1.5" fill="#f6efe3" stroke="#3d2b20" stroke-width="1"/>`,
      apron: `<path d="M35 100L40 76H60L65 100z" fill="#efe6d8"/><path d="M40 76L50 70L60 76" fill="none" stroke="#d9ccb8" stroke-width="1.5"/>`,
      camera: `<path d="M33 69L63 100" stroke="#1c1410" stroke-width="4"/><rect x="55" y="84" width="19" height="13" rx="2.5" fill="#1c1410"/><circle cx="64.5" cy="90.5" r="4" fill="#b98d6c"/>`,
    }[p.prop] || "";
    return `<svg class="pt ${cls || ""}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="#e4d7c1"/><g clip-path="circle(50px at 50px 50px)"><path d="M10 100C10 76 28 68 50 68C72 68 90 76 90 100z" fill="${top}"/>${prop}<rect x="44" y="55" width="12" height="16" rx="4" fill="${skin}"/><ellipse cx="50" cy="44" rx="16" ry="18" fill="${skin}"/>${style}<circle cx="43.5" cy="46" r="1.9" fill="#2b2018"/><circle cx="56.5" cy="46" r="1.9" fill="#2b2018"/><path d="M45 54Q50 58 55 54" fill="none" stroke="#2b2018" stroke-width="1.8" stroke-linecap="round"/></g></svg>`;
  }

  // ---- top-down floor map ----
  function floorMap(map, spots, selected, seen) {
    const dot = (s) => {
      const hot = !seen[s.id] ? '<circle class="pulse" r="14"/>' : "";
      return `<g class="spot${selected === s.id ? " sel" : ""}" data-spot="${s.id}" transform="translate(${s.x} ${s.y})" role="button" tabindex="0" aria-label="${esc(s.label)}"><circle r="24" fill="transparent"/>${hot}<circle class="dot" r="14"/><g transform="translate(-9 -9) scale(.75)" class="ico">${I[s.icon] || ""}</g></g>`;
    };
    const floor = [40, 80, 120, 160, 200, 240].map((y) => `<path d="M12 ${y}H308" stroke="#d9ccb8" stroke-width="1" opacity=".55"/>`).join("");
    const flecks = spots.some((s) => s.id === "flecks")
      ? [[196, 140], [208, 146], [220, 150], [232, 158], [244, 163], [255, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#c8a45e"/>`).join("") : "";
    return `<svg class="map" viewBox="0 0 320 280" role="group" aria-label="Floor map">
      <rect x="10" y="10" width="300" height="260" rx="10" fill="#fbf7f0" stroke="#3d2b20" stroke-width="4"/>
      ${floor}
      <rect x="306" y="34" width="8" height="212" rx="3" fill="#8a6244"/><path d="M306 105H314M306 175H314" stroke="#f2eadc" stroke-width="2"/>
      <rect x="136" y="262" width="48" height="16" fill="#f2eadc"/><path d="M140 268V232A38 38 0 0 1 178 268" fill="none" stroke="#b9a68c" stroke-width="1.5" stroke-dasharray="4 3"/>
      <rect x="28" y="30" width="74" height="38" rx="5" fill="#8a6244"/><rect x="38" y="38" width="22" height="14" rx="2" fill="#3d2b20"/>
      <rect x="26" y="82" width="58" height="36" rx="8" fill="#b98d6c"/><circle cx="40" cy="92" r="5" fill="#f6efe3"/><circle cx="60" cy="92" r="5" fill="#f6efe3"/>
      <rect x="140" y="110" width="50" height="50" rx="5" fill="#efe6d8" stroke="#3d2b20" stroke-width="2.5"/><path d="M146 116L184 154" stroke="#fbf7f0" stroke-width="3" opacity=".9"/>
      <rect x="258" y="148" width="34" height="28" rx="9" fill="#c9b79e"/><rect x="258" y="182" width="34" height="28" rx="9" fill="#c9b79e"/>
      ${flecks}
      ${spots.map(dot).join("")}
    </svg>`;
  }

  function strip(items) {
    return `<div class="strip">${items.map((s) => `<div class="node"><span class="nd">${icon(s.icon)}</span><b>${esc(s.t)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>`;
  }

  // ---- evidence cards ----
  const EV = { log: "note", report: "search", text: "phone", receipt: "receipt", note: "note" };
  function evidence(type, title, lines, pinned, delay, img) {
    const body = lines.slice(0, 2).map((l) => `<p>${esc(l)}</p>`).join("");
    const bubble = type === "text" ? `<div class="bubble">${body}</div>` : body;
    return `<article class="ev ev-${type}" style="animation-delay:${delay || 0}s">${img ? `<img class="evimg" src="${esc(img)}" alt="" loading="lazy">` : ""}<div class="evh">${icon(EV[type] || "note")}<h3>${esc(title)}</h3><button class="pinbtn${pinned ? " on" : ""}" data-pin="${esc(title)}" aria-label="Pin to notebook" aria-pressed="${!!pinned}">${icon("pin")}</button></div>${bubble}</article>`;
  }

  return { icon, portrait, floorMap, strip, evidence, esc };
})();
