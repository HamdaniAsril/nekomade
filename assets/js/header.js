/* Header island: floats once the page scrolls, opens on hover on desktop and
   drops the links into a menu on mobile. */
(() => {
  const header = document.querySelector(".header");
  if (!header) return;

  const isle = header.querySelector(".header__isle");
  const brand = header.querySelector(".brand");
  const talk = header.querySelector(".talk");
  const toggle = header.querySelector(".header__toggle");
  const nav = header.querySelector(".nav");
  const links = [...nav.querySelectorAll("a")];
  const desktop = matchMedia("(min-width: 861px)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

  /* Only the natural widths of the logo, links and CTA are measured; the CSS
     adds the spacing for each state. These sizes don't change while the
     island animates, so a running transition is never pulled to a new end. */
  const widths = new Map();
  const sum = (els) => els.reduce((total, el) => total + (widths.get(el) || 0), 0);
  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      widths.set(entry.target, entry.borderBoxSize[0].inlineSize);
    }
    header.style.setProperty("--brand-w", `${Math.ceil(widths.get(brand) || 0)}px`);
    header.style.setProperty("--links-w", `${Math.ceil(sum(links))}px`);
    header.style.setProperty("--link-gaps", links.length - 1);
    header.style.setProperty("--talk-w", `${Math.ceil(widths.get(talk) || 0)}px`);
  });
  for (const el of [brand, talk, ...links]) ro.observe(el);

  const onScroll = () => {
    const floating = scrollY > 24;
    if (floating === header.classList.contains("is-floating")) return;
    header.classList.toggle("is-floating", floating);
    if (!floating) setOpen(false);
  };

  /* Desktop: open on hover or keyboard focus. Closing waits a beat so a
     pointer that slips off the edge doesn't make the island flicker. */
  let hovered = false;
  let focused = false;
  let leaveTimer;
  const syncExpanded = () => header.classList.toggle("is-expanded", hovered || focused);

  isle.addEventListener("pointerenter", () => {
    if (!finePointer.matches) return;
    clearTimeout(leaveTimer);
    hovered = true;
    syncExpanded();
  });
  isle.addEventListener("pointerleave", () => {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      hovered = false;
      syncExpanded();
    }, 140);
  });
  isle.addEventListener("focusin", () => {
    focused = true;
    syncExpanded();
  });
  isle.addEventListener("focusout", (e) => {
    if (isle.contains(e.relatedTarget)) return;
    focused = false;
    syncExpanded();
  });

  /* Mobile menu */
  function setOpen(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  }

  toggle.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !header.classList.contains("is-open")) return;
    setOpen(false);
    toggle.focus();
  });
  desktop.addEventListener("change", () => setOpen(false));

  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

/* Liquid glass for the island, after Notching's own glass (glass_rules.rs and
   the 7 Nov prototype's shader): the owner's numbers for blur, bend, rim,
   crisp, rainbow, shine and saturation. The shine is drawn for every browser;
   the bending edge needs backdrop-filter: url(), which only Chromium has. Both
   are drawn for the island's size once it stops changing; while it animates
   they stretch with it. */
(() => {
  const header = document.querySelector(".header");
  const isle = header && header.querySelector(".header__isle");
  if (!isle) return;

  const LOOK = { blur: 3.5, bend: 18, rim: 26, crisp: 0.35, rainbow: 0.35, shine: 0.5, saturation: 1.3 };
  const SVG = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-transparency: reduce)");
  const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  const canBend = brands.some((b) => b.brand === "Chromium");
  const PAD = canBend ? Math.ceil(LOOK.bend * (1 + LOOK.rainbow / 2)) + 2 : 0;
  if (PAD) header.style.setProperty("--lens-pad", `${PAD}px`);

  let map;
  if (canBend) {
    const c = LOOK.rainbow / 2; // the kernel uses half of it
    const s = LOOK.bend * 2 * (1 + c); // the map holds ±bend·(1+c) around 0.5
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.innerHTML = `
      <filter id="isle-lens" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feImage id="isle-lens-map" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="${LOOK.blur}" edgeMode="duplicate" result="soft" />
        <feColorMatrix in="map" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0" result="weight" />
        <feComposite in="soft" in2="weight" operator="in" result="softer" />
        <feComposite in="softer" in2="SourceGraphic" operator="over" result="mixed" />
        <feDisplacementMap in="mixed" in2="map" scale="${s}" xChannelSelector="R" yChannelSelector="G" result="dr" />
        <feDisplacementMap in="mixed" in2="map" scale="${s / (1 + c)}" xChannelSelector="R" yChannelSelector="G" result="dg" />
        <feDisplacementMap in="mixed" in2="map" scale="${(s * (1 - c)) / (1 + c)}" xChannelSelector="R" yChannelSelector="G" result="db" />
        <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
        <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" result="rgb" />
        <feColorMatrix in="rgb" type="saturate" values="${LOOK.saturation}" />
      </filter>`;
    document.body.append(svg);
    map = svg.querySelector("#isle-lens-map");
  }

  /* One pass over the island's pill: the shine (white, alpha) and, for
     Chromium, the map (R, G: where each point looks; B: how blurred it is).
     The map covers the glass, PAD wider than the pill on every side. */
  function draw(w, h) {
    const k = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(w * k);
    const H = Math.round(h * k);
    const LW = Math.round((w + PAD * 2) * k);
    const LH = Math.round((h + PAD * 2) * k);
    const r = Math.min(w, h) / 2;
    const hw = w / 2 - r;
    const hh = h / 2 - r;
    const sdf = (x, y) => {
      const qx = Math.abs(x - w / 2) - hw;
      const qy = Math.abs(y - h / 2) - hh;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    };
    const lit1 = [-0.543, -0.84]; // light from the top left, y down
    const lit2 = [0.543, 0.84];
    const span = LOOK.bend * 2 * (1 + LOOK.rainbow / 2);

    const shine = new ImageData(W, H);
    const lens = canBend ? new ImageData(LW, LH) : null;
    if (lens) {
      for (let o = 0; o < lens.data.length; o += 4) {
        lens.data[o] = lens.data[o + 1] = 128;
        lens.data[o + 2] = lens.data[o + 3] = 255;
      }
    }
    const off = Math.round(PAD * k);
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const x = (i + 0.5) / k;
        const y = (j + 0.5) / k;
        const d = sdf(x, y);
        const o = (j * W + i) * 4;
        const lo = ((j + off) * LW + i + off) * 4;
        if (d > 0) continue;
        let nx = sdf(x + 0.5, y) - sdf(x - 0.5, y);
        let ny = sdf(x, y + 0.5) - sdf(x, y - 0.5);
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl;
        ny /= nl;
        const u = Math.min(Math.max(-d / LOOK.rim, 0), 1);

        const rim = (1 - u) ** 3;
        const lit = Math.max(nx * lit1[0] + ny * lit1[1], 0) + 0.55 * Math.max(nx * lit2[0] + ny * lit2[1], 0);
        const edge = Math.min(Math.max(0.5 - d * 2, 0), 1);
        const a = Math.min(Math.max(LOOK.shine * rim * lit * 0.55, 0), 1) * edge;
        shine.data[o] = shine.data[o + 1] = shine.data[o + 2] = 255;
        shine.data[o + 3] = Math.round(a * 255);

        if (lens) {
          const m = LOOK.bend * (1 - Math.sqrt(1 - (1 - u) * (1 - u)));
          const s = u / 0.85;
          const smooth = s >= 1 ? 1 : s * s * (3 - 2 * s);
          const soft = 1 + (smooth - 1) * LOOK.crisp; // mix(1, smoothstep(0, .85, u), crisp)
          lens.data[lo] = Math.round((0.5 + (nx * m) / span) * 255);
          lens.data[lo + 1] = Math.round((0.5 + (ny * m) / span) * 255);
          lens.data[lo + 2] = Math.round(soft * 255);
        }
      }
    }

    const url = (img) => {
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      cv.getContext("2d").putImageData(img, 0, 0);
      return cv.toDataURL("image/png");
    };
    header.style.setProperty("--isle-shine", `url(${url(shine)})`);
    if (lens) {
      map.setAttribute("href", url(lens));
      header.classList.toggle("has-lens", !reduce.matches);
    }
  }

  let timer;
  let drawn = "";
  const ro = new ResizeObserver(([entry]) => {
    const { inlineSize: w, blockSize: h } = entry.borderBoxSize[0];
    if (map) {
      map.setAttribute("width", w + PAD * 2);
      map.setAttribute("height", h + PAD * 2);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!header.classList.contains("is-floating")) return;
      const key = `${Math.round(w)}x${Math.round(h)}`;
      if (key === drawn) return;
      drawn = key;
      draw(w, h);
    }, 120);
  });
  ro.observe(isle);
  reduce.addEventListener("change", () => header.classList.toggle("has-lens", !!map && !reduce.matches && drawn !== ""));
})();
