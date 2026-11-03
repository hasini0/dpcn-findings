/* Shared chrome (top bar, footer, pager), highlight chips, theme toggle and charts. */
(function () {
  "use strict";
  const D = window.FINDINGS;
  const DASHBOARD = "https://hasini0.github.io/dpcn_a2/";

  const SECTIONS = [
    ["data", "data.html", "How we built the data", "Downloading, attributing, verifying faculty and merging names"],
    ["output", "output.html", "Output and quality", "How much the four institutes publish, and in which journals"],
    ["faculty", "faculty.html", "The faculty", "Who counts as faculty, and how much of the work is theirs"],
    ["teams", "teams.html", "Big teams", "What CERN-style author lists do to every number"],
    ["collaboration", "collaboration.html", "The collaboration network", "Who writes with whom, and the people who bridge groups"],
    ["citations", "citations.html", "The citation network", "Which of our papers cite which, and what PageRank picks out"],
    ["india", "india.html", "Connections across India", "Partner institutes, Kolkata neighbours, and citations in and out"],
    ["compare", "compare.html", "Four institutes compared", "Size-adjusted and field-normalised, side by side"],
    ["explore", "explore.html", "Explore it yourself", "The full dashboard, the author explorer and the data files"],
  ];
  const INST = Object.fromEntries(D.insts.map((i) => [i.id, i]));
  const IDS = D.insts.map((i) => i.id);

  // ---------- small helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const h = (tag, attrs = {}, html = "") => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    el.innerHTML = html;
    return el;
  };
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), D);
  const fmt = (v, f) => {
    if (v == null) return "–";
    if (f === "pct") return v + "%";
    if (f === "x") return v + "×";
    if (typeof v === "number") return v.toLocaleString("en-US");
    return String(v);
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  const dot = (id) => `<span class="dot" style="background:var(--${id})"></span>`;

  const page = document.body.dataset.page || "home";

  // ---------- top bar ----------
  const logo = `<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
    <line x1="5" y1="6" x2="16" y2="5" stroke="var(--ink-3)" stroke-width="1.5"/>
    <line x1="5" y1="6" x2="11" y2="16" stroke="var(--ink-3)" stroke-width="1.5"/>
    <line x1="16" y1="5" x2="11" y2="16" stroke="var(--ink-3)" stroke-width="1.5"/>
    <circle cx="5" cy="6" r="3" fill="var(--SNB)"/><circle cx="16" cy="5" r="3" fill="var(--BI)"/>
    <circle cx="11" cy="16" r="3" fill="var(--SINP)"/><circle cx="18.5" cy="15" r="2" fill="var(--NCBS)"/></svg>`;
  const sun = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
  const moon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;

  const bar = h("header", { class: "topbar" }, `
    <div class="topbar-inner">
      <a class="brand" href="index.html">${logo}Research Mapping</a>
      <div class="contents">
        <button type="button" aria-expanded="false" aria-haspopup="true">Contents
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
        <nav class="contents-menu" aria-label="Sections">
          <a href="index.html"${page === "home" ? ' aria-current="page"' : ""}><span></span><span>Overview</span></a>
          ${SECTIONS.map(([id, href, t], i) => `<a href="${href}"${page === id ? ' aria-current="page"' : ""}><span>${i + 1}</span><span>${t}</span></a>`).join("")}
        </nav>
      </div>
      <div class="hl" role="group" aria-label="Highlight an institute">
        <span class="hl-label">Highlight</span>
        <div class="chips">
          <button type="button" class="chip" data-hl="ALL">all</button>
          ${D.insts.map((i) => `<button type="button" class="chip" data-hl="${i.id}">${dot(i.id)}${i.name}</button>`).join("")}
        </div>
      </div>
      <button type="button" class="theme-btn" aria-label="Switch to light theme"></button>
    </div>`);
  document.body.prepend(bar);

  const contents = $(".contents", bar);
  const cbtn = $("button", contents);
  cbtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = contents.classList.toggle("open");
    cbtn.setAttribute("aria-expanded", open);
  });
  document.addEventListener("click", (e) => {
    if (!contents.contains(e.target)) { contents.classList.remove("open"); cbtn.setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { contents.classList.remove("open"); cbtn.setAttribute("aria-expanded", "false"); }
  });

  // ---------- theme ----------
  const themeBtn = $(".theme-btn", bar);
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    themeBtn.innerHTML = t === "dark" ? sun : moon;
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  setTheme(document.documentElement.dataset.theme || "dark");
  themeBtn.addEventListener("click", () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(t);
    store.set("rm-theme", t);
    renderCharts(); // svg colours read from CSS variables
  });

  // ---------- highlight ----------
  function setHL(id) {
    if (!INST[id]) id = "ALL";
    document.body.dataset.hl = id;
    $$(".chip", bar).forEach((c) => c.setAttribute("aria-pressed", c.dataset.hl === id));
    $$("[data-headline]").forEach((el) => {
      const s = D.headline[el.dataset.headline][id];
      el.innerHTML = `<b>${esc(s.v)}</b>${esc(s.c)}`;
    });
    $$(".inst-card").forEach((b) => b.setAttribute("aria-pressed", b.dataset.pick === id));
    $$(".hl-note").forEach((el) => { el.textContent = id === "ALL" ? "" : `Highlighting ${INST[id].name}.`; });
  }
  $$(".chip", bar).forEach((c) => c.addEventListener("click", () => { setHL(c.dataset.hl); store.set("rm-hl", c.dataset.hl); }));

  // ---------- footer ----------
  document.body.append(h("footer", {}, `<div class="inner">
    Research Mapping, a DPCN (Dynamical Processes in Complex Networks) course project, IIIT Hyderabad
    (group 23, 2026) by <b class="names">Hasini, Bhavya and Eshaan</b>.
    Research output 2016–2026 of SN Bose National Centre for Basic Sciences, Bose Institute, Saha Institute of Nuclear Physics
    and NCBS Bangalore. Data from OpenAlex (downloaded October 2026; 2026 is a partial year), the four institutes'
    own faculty pages, SCImago 2023 quartiles and approximate JCR 2023 impact factors.
    Interactive dashboard: <a href="${DASHBOARD}">hasini0.github.io/dpcn_a2</a>.</div>`));

  // ---------- pager on section pages ----------
  const idx = SECTIONS.findIndex((s) => s[0] === page);
  if (idx >= 0) {
    const main = $("main");
    const eb = $(".eyebrow", main);
    if (eb && !eb.textContent.trim()) eb.textContent = `Section ${idx + 1} of ${SECTIONS.length}`;
    const prev = SECTIONS[idx - 1], next = SECTIONS[idx + 1];
    main.append(h("nav", { class: "pager", "aria-label": "Sections" },
      (prev ? `<a href="${prev[1]}"><small>Previous</small>${prev[2]}</a>` : `<a href="index.html"><small>Back to</small>Overview</a>`) +
      (next ? `<a href="${next[1]}"><small>Next</small>${next[2]}</a>` : `<a href="index.html"><small>Back to</small>Overview</a>`)));
  }

  // ---------- landing table of contents ----------
  const toc = $("#toc");
  if (toc) {
    toc.innerHTML = SECTIONS.map(([id, href, t, sub], i) => `
      <li><a href="${href}">
        <span><span class="stat" data-headline="${id}"></span>${minibars(id)}</span>
        <span><span class="num">Section ${String(i + 1).padStart(2, "0")}</span><span class="title">${t}</span><span class="sub">${sub}</span></span>
        <svg class="arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a></li>`).join("");
  }

  // Per-institute bars under a landing number, scaled to the largest of the four.
  function minibars(id) {
    const num = (i) => parseFloat(String(D.headline[id][i].v).replace(/[^0-9.]/g, ""));
    const max = Math.max(...IDS.map(num)) || 1;
    return `<span class="minibars" aria-hidden="true">${IDS.map((i) =>
      `<i data-inst="${i}" style="height:${Math.max(12, (100 * num(i)) / max)}%;background:var(--${i})" data-tip="${INST[i].name}: ${esc(D.headline[id][i].v)}"></i>`).join("")}</span>`;
  }

  // ---------- institutes at a glance (landing) ----------
  const glance = $("#glance");
  if (glance) {
    const CITY = { SNB: "Kolkata", BI: "Kolkata", SINP: "Kolkata", NCBS: "Bangalore" };
    const FULL = { SNB: "SN Bose Centre", BI: "Bose Institute", SINP: "Saha Institute (SINP)", NCBS: "NCBS" };
    glance.innerHTML = IDS.map((i) => {
      const c = D.compare.inst[i];
      return `<button type="button" class="inst-card" data-pick="${i}" aria-pressed="false">
        <span class="band" style="background:var(--${i})"></span>
        <span class="name">${FULL[i]}</span><span class="city">${CITY[i]}</span>
        <dl><dt>Papers</dt><dd>${fmt(D.output.papers[i])}</dd>
        <dt>Citations</dt><dd>${fmt(D.output.citations[i])}</dd>
        <dt>Q1 share</dt><dd>${D.output.q1[i]}%</dd>
        <dt>Verified faculty</dt><dd>${D.faculty.verified[i]}</dd></dl>
        <span class="field">Main field: ${esc(c.top_field)} (${c.top_field_share}%)</span></button>`;
    }).join("");
    $$(".inst-card", glance).forEach((b) => b.addEventListener("click", () => {
      const id = document.body.dataset.hl === b.dataset.pick ? "ALL" : b.dataset.pick;
      setHL(id); store.set("rm-hl", id);
    }));
  }

  // ---------- fill numbers in prose ----------
  $$("[data-n]").forEach((el) => { el.textContent = fmt(get(el.dataset.n), el.dataset.f); });

  // ---------- tooltip ----------
  const tip = h("div", { id: "tip", role: "tooltip" });
  document.body.append(tip);
  document.addEventListener("pointermove", (e) => {
    const t = e.target.closest && e.target.closest("[data-tip]");
    if (!t) { tip.style.display = "none"; return; }
    tip.innerHTML = t.dataset.tip;
    tip.style.display = "block";
    const w = tip.offsetWidth, hgt = tip.offsetHeight;
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    if (y + hgt > innerHeight - 8) y = e.clientY - hgt - 14;
    tip.style.left = Math.max(8, x) + "px";
    tip.style.top = Math.max(8, y) + "px";
  });

  // ---------- chart builders ----------
  // rows: [{label, value, inst, text, tip, ghost}] — horizontal bars, values labelled.
  function bars(el, rows, opts = {}) {
    const max = opts.max || Math.max(...rows.map((r) => r.value)) || 1;
    el.className = "bars";
    el.innerHTML = rows.map((r) => `
      <div class="bar-row" ${r.inst ? `data-inst="${r.inst}"` : ""} data-tip="${esc(r.tip || `${r.label}: ${r.text ?? fmt(r.value)}`)}">
        <span class="bar-label">${r.inst && opts.dots !== false ? dot(r.inst) + " " : ""}${esc(r.label)}</span>
        <span class="bar-track"><span class="bar${r.ghost ? " ghost" : ""}" style="width:${(100 * r.value) / max}%;${r.inst && !r.ghost ? `background:var(--${r.inst})` : ""}"></span>
        <span class="bar-val">${esc(r.text ?? fmt(r.value))}</span></span>
      </div>`).join("");
  }

  // Paired bars per institute: [all papers, < 10 authors].
  function pairBars(el, key, f) {
    const R = D.teams.rows;
    const max = Math.max(...IDS.flatMap((i) => R[i][key]));
    el.className = "bars";
    el.innerHTML = IDS.map((i) => {
      const [a, b] = R[i][key];
      return `<div class="bar-row" data-inst="${i}">
        <span class="bar-label">${dot(i)} ${INST[i].name}</span>
        <span class="pair">
          <span class="bar-track" data-tip="${INST[i].name}, all papers: ${fmt(a, f)}"><span class="bar" style="width:${(100 * a) / max}%;background:var(--${i})"></span><span class="bar-val">${fmt(a, f)}</span></span>
          <span class="bar-track" data-tip="${INST[i].name}, &lt; 10 authors: ${fmt(b, f)}"><span class="bar ghost" style="width:${(100 * b) / max}%;border-color:var(--${i})"></span><span class="bar-val">${fmt(b, f)}</span></span>
        </span></div>`;
    }).join("");
  }

  // Multi-line chart. series: [{id, values, label}], x labels = years.
  function lines(el, series, xs, opts = {}) {
    const W = Math.max(280, el.clientWidth), H = opts.height || 260;
    const m = { t: 12, r: W < 500 ? 12 : 92, b: 26, l: 46 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const all = series.flatMap((s) => s.values);
    const max = opts.max || Math.ceil(Math.max(...all) / 100) * 100;
    const x = (i) => m.l + (iw * i) / (xs.length - 1);
    const y = (v) => m.t + ih - (ih * v) / max;
    const css = getComputedStyle(document.documentElement);
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
    let s = `<svg width="${W}" height="${H}" role="img" aria-label="${esc(opts.label || "")}">`;
    s += `<g class="grid">${ticks.map((t) => `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(t)}" y2="${y(t)}"/>`).join("")}</g>`;
    s += `<g class="axis">${ticks.map((t) => `<text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${t.toLocaleString("en-US")}</text>`).join("")}`;
    s += xs.map((v, i) => (W < 500 && i % 2 ? "" : `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${W < 500 ? "’" + String(v).slice(2) : v}</text>`)).join("") + "</g>";
    // End labels: start at each line's last point, then push apart so none overlap.
    const ends = series.map((se, k) => ({ k, y: y(se.values[se.values.length - 1]) + 4 })).sort((a, b) => a.y - b.y);
    for (let j = 1; j < ends.length; j++) ends[j].y = Math.max(ends[j].y, ends[j - 1].y + 14);
    const labelY = Object.fromEntries(ends.map((e) => [e.k, e.y]));
    for (const [k, se] of series.entries()) {
      const col = css.getPropertyValue("--" + (se.color || se.id)).trim();
      const pts = se.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
      s += `<g data-inst="${se.id}"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" ${se.dash ? 'stroke-dasharray="5 4"' : ""}/>`;
      s += se.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="9" fill="transparent" data-tip="${esc(se.label)}, ${xs[i]}: ${v.toLocaleString("en-US")}"/><circle cx="${x(i)}" cy="${y(v)}" r="2.5" fill="${col}" pointer-events="none"/>`).join("");
      if (W >= 500) s += `<text class="lbl" x="${x(se.values.length - 1) + 8}" y="${labelY[k]}">${esc(se.short || se.label)}</text>`;
      s += "</g>";
    }
    el.innerHTML = s + "</svg>";
    el.classList.add("svgchart");
  }

  // Square matrix as a shaded table. M[row][col]
  function heat(el, M, opts = {}) {
    const vals = IDS.flatMap((a) => IDS.filter((b) => opts.diag || a !== b).map((b) => M[a][b])).filter((v) => v != null);
    const max = Math.max(...vals) || 1;
    el.innerHTML = `<table class="heat"><thead><tr><th>${opts.corner || ""}</th>${IDS.map((b) => `<th class="n">${INST[b].name}</th>`).join("")}</tr></thead><tbody>` +
      IDS.map((a) => `<tr data-inst="${a}"><th>${dot(a)}${INST[a].name}</th>` + IDS.map((b) => {
        const v = M[a][b];
        if (v == null || (!opts.diag && a === b)) return `<td class="n muted">${a === b && v != null ? fmt(v, opts.f) : "–"}</td>`;
        const alpha = (0.08 + 0.72 * (v / max)).toFixed(2);
        return `<td class="n" style="background:rgba(var(--heat),${alpha})" data-tip="${INST[a].name} → ${INST[b].name}: ${fmt(v, opts.f)}">${fmt(v, opts.f)}</td>`;
      }).join("") + "</tr>").join("") + "</tbody></table>";
    el.classList.add("table-wrap");
  }

  // ---------- page charts ----------
  const CHARTS = {
    "output-trend": (el) => lines(el, IDS.map((i) => ({ id: i, label: INST[i].name, values: D.output.trend[i] })), D.years, { label: "Papers per year by institute" }),
    "output-q1": (el) => bars(el, IDS.map((i) => ({ label: INST[i].name, value: D.output.q1[i], inst: i, text: D.output.q1[i] + "%" })), { max: 100 }),
    "output-quartiles": (el) => {
      const q = D.output.quartiles.ALL, tot = Object.values(q).reduce((a, b) => a + b, 0);
      bars(el, ["Q1", "Q2", "Q3", "Q4", "Unknown"].map((k) => ({ label: k, value: q[k], text: `${q[k].toLocaleString("en-US")} (${((100 * q[k]) / tot).toFixed(1)}%)` })));
    },
    "output-fields": (el) => bars(el, D.output.fields.map(([f, n]) => ({ label: f, value: n }))),
    "output-journals": (el) => bars(el, D.output.top_journals.map(([j, n]) => ({ label: j, value: n }))),
    "faculty-share": (el) => bars(el, IDS.map((i) => ({ label: INST[i].name, value: D.faculty.view[i].share, inst: i, text: `${D.faculty.view[i].share}% (${D.faculty.verified[i]} faculty)` })), { max: 100 }),
    "faculty-h": (el) => bars(el, D.faculty.h_bins.map((b, k) => ({ label: "h " + b, value: D.faculty.h_hist[k], text: D.faculty.h_hist[k] + " faculty" }))),
    "teams-share": (el) => bars(el, IDS.map((i) => ({ label: INST[i].name, value: D.teams.big_share[i], inst: i, text: D.teams.big_share[i] + "%" })), { max: 100 }),
    "teams-q1": (el) => pairBars(el, "q1", "pct"),
    "teams-cpp": (el) => pairBars(el, "cpp"),
    "teams-papers": (el) => pairBars(el, "papers"),
    "collab-mod": (el) => bars(el, IDS.map((i) => ({ label: INST[i].name, value: D.collaboration.auth[i].modularity, inst: i, text: `${D.collaboration.auth[i].modularity} (${D.collaboration.auth[i].communities} groups)` })), { max: 1 }),
    "collab-shared": (el) => heat(el, D.collaboration.shared, { corner: "Joint papers" }),
    "collab-comm": (el) => bars(el, D.collaboration.largest_communities.map((n, k) => ({ label: `Group ${k + 1}`, value: n, text: n + " authors" }))),
    "cit-matrix": (el) => heat(el, D.citations.flow_matrix, { diag: true, corner: "Citing ↓ · cited →" }),
    "cit-indeg": (el) => bars(el, D.citations.indeg_hist.map((n, k) => ({ label: k === 10 ? "10 or more" : `${k} citation${k === 1 ? "" : "s"}`, value: n, text: n.toLocaleString("en-US") + " papers" }))),
    "cit-never": (el) => bars(el, IDS.map((i) => ({ label: INST[i].name, value: D.citations.never_cited[i], inst: i, text: D.citations.never_cited[i] + "%" })), { max: 100 }),
    "india-years": (el) => lines(el, [
      { id: "ALL", color: "SNB", label: "Cited by other Indian institutes", short: "In", values: Object.values(D.india.year_in) },
      { id: "ALL", color: "BI", label: "Our papers citing them", short: "Out", values: Object.values(D.india.year_out), dash: true },
    ], Object.keys(D.india.year_in), { label: "Citation links with other Indian institutes per year" }),
    "india-ratio": (el) => bars(el, IDS.map((i) => ({ label: INST[i].name, value: D.india.flow[i].ratio, inst: i, text: `${D.india.flow[i].ratio}× (${D.india.flow[i].in.toLocaleString("en-US")} in, ${D.india.flow[i].out.toLocaleString("en-US")} out)` }))),
    "india-in": (el) => bars(el, D.india.in_top.map(([n, v, big]) => ({ label: n, value: v, text: `${v.toLocaleString("en-US")} · ${big}% via 10+ author papers` }))),
    "india-partners": (el) => bars(el, IDS.map((i) => ({ label: INST[i].name, value: D.india.partners[i], inst: i }))),
    "cmp-mncs": (el) => bars(el, IDS.map((i) => ({ label: INST[i].name, value: D.compare.inst[i].mncs, inst: i, text: String(D.compare.inst[i].mncs) }))),
    "cmp-topics": (el) => heat(el, D.compare.topic_sim, { corner: "Topic similarity" }),
  };

  // Tables rendered from data.
  const TABLES = {
    "collab-deg": () => personTable(D.collaboration.deg_top, "Co-authors", (r) => r.deg),
    "collab-btw": () => personTable(D.collaboration.btw_top, "Betweenness", (r) => r.v.toFixed(3)),
    "cit-pr-all": () => paperTable(D.citations.pagerank_all),
    "cit-pr-lt10": () => paperTable(D.citations.pagerank_lt10),
    "output-cited": () => `<table><thead><tr><th>Paper</th><th class="n">Year</th><th class="n">Authors</th><th class="n">Citations</th></tr></thead><tbody>` +
      D.output.top_cited.map((p) => `<tr><td><a href="${esc(p.doi)}">${esc(p.title)}</a><br><span class="muted">${esc(p.journal)}</span></td><td class="n">${p.year}</td><td class="n">${p.n_authors.toLocaleString("en-US")}</td><td class="n">${p.cites.toLocaleString("en-US")}</td></tr>`).join("") + "</tbody></table>",
    "india-kolkata": () => `<table><thead><tr><th>Institute</th><th class="n">They cite us</th><th class="n">We cite them</th></tr></thead><tbody>` +
      Object.entries(D.india.watch).filter(([, v]) => v[0] + v[1] > 0).map(([n, v]) => `<tr><td>${esc(n)}</td><td class="n">${v[0].toLocaleString("en-US")}</td><td class="n">${v[1].toLocaleString("en-US")}</td></tr>`).join("") + "</tbody></table>",
    "india-top-partners": () => `<table><thead><tr><th>Institute</th><th>Top partner</th><th class="n">Joint papers</th><th class="n">Their citations</th></tr></thead><tbody>` +
      IDS.flatMap((i) => D.india.top_partners[i].slice(0, 3).map((c, k) => `<tr data-inst="${i}"><td>${k ? "" : dot(i) + INST[i].name}</td><td>${esc(c.partner)}</td><td class="n">${c.shared}</td><td class="n">${c.cites.toLocaleString("en-US")}</td></tr>`)).join("") + "</tbody></table>",
    "cmp-table": () => {
      const rows = [
        ["Papers, 2016–2026", "papers"], ["Verified faculty", "faculty"], ["Papers per faculty member", "papers_per_faculty"],
        ["Citations per paper", "cites_per_paper"], ["Median citations", "median_cites"], ["Field-normalised impact", "mncs"],
        ["Top-10% cited share (%)", "top10pct"], ["Q1 share (%)", "q1"], ["Q1 · IF>10 papers per 100", "q1if10_per100"],
        ["Papers with 10+ authors (%)", "big_share"], ["Median team size", "median_team"], ["International papers (%)", "intl_share"],
        ["Faculty-authored papers (%)", "faculty_share"], ["Median faculty h-index", "h_median"], ["Indian partner institutes", "partners"],
        ["Citations in / out (India)", "inout"], ["Isolated faculty in faculty network (%)", "fac_isolated"], ["Growth per year, 2016–2025 (%)", "cagr"],
      ];
      return `<table><thead><tr><th>Measure</th>${IDS.map((i) => `<th class="n" data-inst="${i}">${dot(i)}${INST[i].name}</th>`).join("")}</tr></thead><tbody>` +
        rows.map(([lab, k]) => {
          const vals = IDS.map((i) => D.compare.inst[i][k]);
          const best = k === "fac_isolated" || k === "big_share" ? null : Math.max(...vals);
          return `<tr><td>${lab}</td>${IDS.map((i, j) => `<td class="n" data-inst="${i}">${vals[j] === best ? `<b>${fmt(vals[j])}</b>` : fmt(vals[j])}</td>`).join("")}</tr>`;
        }).join("") + "</tbody></table>";
    },
  };
  function personTable(rows, col, val) {
    return `<table><thead><tr><th>Author</th><th>Institute</th><th class="n">${col}</th></tr></thead><tbody>` +
      rows.map((r) => `<tr data-inst="${r.inst}"><td>${esc(r.name)}</td><td>${dot(r.inst)}${INST[r.inst].name}</td><td class="n">${val(r)}</td></tr>`).join("") + "</tbody></table>";
  }
  function paperTable(rows) {
    return `<table><thead><tr><th>Paper</th><th>Institute</th><th class="n">Cited by our papers</th></tr></thead><tbody>` +
      rows.map((r) => `<tr data-inst="${r.inst}"><td><a href="${esc(r.doi)}">${esc(r.title)}</a></td><td style="white-space:nowrap">${dot(r.inst)}${INST[r.inst].name}</td><td class="n">${r.in}</td></tr>`).join("") + "</tbody></table>";
  }

  function renderCharts() {
    $$("[data-chart]").forEach((el) => { const f = CHARTS[el.dataset.chart]; if (f) f(el); });
  }
  $$("[data-table]").forEach((el) => { el.classList.add("table-wrap"); el.innerHTML = TABLES[el.dataset.table](); });
  $$("[data-legend]").forEach((el) => {
    el.className = "legend";
    el.innerHTML = el.dataset.legend === "pair"
      ? `<span><i class="box" style="background:var(--ink-2)"></i>All papers</span><span><i class="box" style="border:1.5px solid var(--ink-2)"></i>Papers with fewer than 10 authors</span>`
      : D.insts.map((i) => `<span data-inst="${i.id}"><i style="background:var(--${i.id})"></i>${i.name}</span>`).join("");
  });
  renderCharts();
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(renderCharts, 150); });

  setHL(store.get("rm-hl") || "ALL");
})();
