(function () {
  const root = document.getElementById("sections");

  function section(title, hint) {
    const el = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = title;
    el.appendChild(h2);
    if (hint) {
      const p = document.createElement("p");
      p.className = "hint";
      p.textContent = hint;
      el.appendChild(p);
    }
    root.appendChild(el);
    return el;
  }

  function table(container, rows) {
    if (!rows.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Nothing found.";
      container.appendChild(p);
      return;
    }
    const t = document.createElement("table");
    rows.forEach(([key, value]) => {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      td1.className = "key";
      td1.textContent = key;
      const td2 = document.createElement("td");
      td2.className = "val";
      td2.textContent = value;
      tr.appendChild(td1);
      tr.appendChild(td2);
      t.appendChild(tr);
    });
    container.appendChild(t);
  }

  function parseCookies() {
    return document.cookie
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf("=");
        if (idx === -1) return [c, ""];
        return [decodeURIComponent(c.slice(0, idx)), decodeURIComponent(c.slice(idx + 1))];
      });
  }

  function storageEntries(storage) {
    const rows = [];
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        rows.push([key, storage.getItem(key)]);
      }
    } catch (e) {
      // storage may be unavailable (private mode, disabled, etc.)
    }
    return rows;
  }

  // --- Cookies ---
  const cookieSection = section(
    "Cookies",
    "Only cookies without the HttpOnly flag are visible to JavaScript."
  );
  table(cookieSection, parseCookies());

  const setCookieBtn = document.createElement("button");
  setCookieBtn.textContent = "Set a test cookie";
  setCookieBtn.addEventListener("click", () => {
    document.cookie = "demo_cookie=" + Date.now() + "; path=/; max-age=3600";
    location.reload();
  });
  cookieSection.appendChild(setCookieBtn);

  // --- Local & Session Storage ---
  const localSection = section("Local Storage");
  table(localSection, storageEntries(window.localStorage));

  const sessionSection = section("Session Storage");
  table(sessionSection, storageEntries(window.sessionStorage));

  // --- Browser & Device ---
  const nav = navigator;
  const browserRows = [
    ["User agent", nav.userAgent],
    ["Platform", nav.platform || "n/a"],
    ["Vendor", nav.vendor || "n/a"],
    ["Languages", (nav.languages || [nav.language]).join(", ")],
    ["Cookies enabled", String(nav.cookieEnabled)],
    ["Do Not Track", nav.doNotTrack || "unspecified"],
    ["Online", String(nav.onLine)],
    ["Hardware concurrency (CPU cores)", nav.hardwareConcurrency ?? "n/a"],
    ["Device memory (GB, approx.)", nav.deviceMemory ?? "n/a"],
    ["Max touch points", nav.maxTouchPoints ?? "n/a"],
    ["PDF viewer enabled", String(nav.pdfViewerEnabled ?? "n/a")],
  ];
  table(section("Browser & Device"), browserRows);

  // --- Client Hints (userAgentData), if supported ---
  if (nav.userAgentData) {
    const uad = nav.userAgentData;
    const uadRows = [
      ["Brands", uad.brands.map((b) => `${b.brand} ${b.version}`).join(", ")],
      ["Mobile", String(uad.mobile)],
      ["Platform", uad.platform],
    ];
    table(section("Client Hints"), uadRows);
  }

  // --- Screen & Window ---
  const scr = window.screen;
  const screenRows = [
    ["Screen size", `${scr.width} x ${scr.height}`],
    ["Available screen size", `${scr.availWidth} x ${scr.availHeight}`],
    ["Color depth", `${scr.colorDepth}-bit`],
    ["Pixel ratio", window.devicePixelRatio],
    ["Viewport size", `${window.innerWidth} x ${window.innerHeight}`],
    ["Orientation", scr.orientation ? scr.orientation.type : "n/a"],
  ];
  table(section("Screen & Window"), screenRows);

  // --- Locale & Time ---
  const now = new Date();
  const timeRows = [
    ["Local time", now.toString()],
    ["Timezone", Intl.DateTimeFormat().resolvedOptions().timeZone],
    ["UTC offset (minutes)", now.getTimezoneOffset() * -1],
    ["Locale", Intl.DateTimeFormat().resolvedOptions().locale],
  ];
  table(section("Locale & Time"), timeRows);

  // --- Network (best-effort; not all browsers expose this) ---
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (conn) {
    const connRows = [
      ["Effective type", conn.effectiveType ?? "n/a"],
      ["Downlink (Mbps, approx.)", conn.downlink ?? "n/a"],
      ["RTT (ms, approx.)", conn.rtt ?? "n/a"],
      ["Data saver", String(conn.saveData ?? "n/a")],
    ];
    table(section("Network"), connRows);
  }

  // --- Referrer / URL ---
  const pageRows = [
    ["Current URL", location.href],
    ["Referrer", document.referrer || "(none)"],
  ];
  table(section("Page"), pageRows);
})();
