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
