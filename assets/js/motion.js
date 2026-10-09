(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const root = document.documentElement;
  root.classList.add("motion");

  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const REVEAL = [
    ".head-copy > *",
    ".chips > li",
    ".rail > *",
    ".panel",
    ".foot-row",
    ".tile",
    ".slot",
    ".about__lead",
    ".about__text",
    ".day",
    ".photo-slot",
    ".cv-button",
    ".toolbox",
    ".ai-note",
    ".playground li",
    ".steps li",
    ".work-list > li",
    ".riwayat__row",
    ".cv-head > *",
    ".cv-kontak > div",
    ".kontak__inner > *",
    ".ak-compare__card",
    ".ak-feature",
    ".ak-role",
    ".ak-benefit",
  ].join(",");

  const init = () => {
    splitHeadline();
    reveals();
    scrollEffects();
    countUp();
    if (finePointer) {
      pointerParallax();
      tilt();
      magnetic();
    }
  };

  /* Headline: letters rise one by one, then the plain text is restored so
     kerning and screen-reader output stay untouched. */
  function splitHeadline() {
    const headline = document.querySelector(".headline");
    if (!headline) return;
    let i = 0;
    const lines = $$(".headline__line, .headline__serif", headline).map((line) => {
      const text = line.textContent;
      const chars = document.createElement("span");
      chars.setAttribute("aria-hidden", "true");
      for (const word of text.split(" ")) {
        const w = document.createElement("span");
        w.className = "word";
        for (const ch of word) {
          const c = document.createElement("span");
          c.className = "char";
          c.style.setProperty("--i", i++);
          c.textContent = ch;
          w.append(c);
        }
        chars.append(w, " ");
      }
      line.textContent = "";
      line.append(chars);
      return { chars, text };
    });
    headline.setAttribute("aria-label", lines.map((l) => l.text).join(" "));

    const serif = headline.querySelector(".headline__serif");
    if (serif) {
      serif.insertAdjacentHTML(
        "beforeend",
        '<svg class="headline__squiggle" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M2 7C20 1 35 11 55 6S90 2 110 7s40 4 60-2 45-3 65 2 45 3 63-3"/></svg>',
      );
    }
    headline.classList.add("is-split");

    setTimeout(() => {
      for (const { chars, text } of lines) {
        chars.removeAttribute("aria-hidden");
        chars.textContent = text;
      }
      headline.removeAttribute("aria-label");
    }, 350 + i * 32 + 1000);
  }

  function reveals() {
    const peeks = $$(".head-illo, .rail__illo");
    peeks.forEach((el) => el.classList.add("peek"));
    const targets = $$(REVEAL).filter((el) => !el.closest(".hero"));
    targets.forEach((el) => el.classList.add("reveal"));

    const io = new IntersectionObserver(
      (entries) => {
        const shown = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target)
          .sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1));
        shown.forEach((el, n) => {
          el.style.setProperty("--d", `${Math.min(n * 70, 490)}ms`);
          el.classList.add("is-in");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach((el) => io.observe(el));
  }

  /* Progress thread along the top, plus a light parallax on project visuals. */
  function scrollEffects() {
    const thread = document.createElement("div");
    thread.className = "scroll-thread";
    thread.setAttribute("aria-hidden", "true");
    document.body.append(thread);

    const visuals = $$(".panel__visual");
    const hero = document.querySelector(".hero__illo");
    let queued = false;

    const update = () => {
      queued = false;
      const max = root.scrollHeight - innerHeight;
      thread.style.setProperty("--progress", max > 0 ? clamp(scrollY / max, 0, 1) : 0);
      if (hero && scrollY < innerHeight) hero.style.setProperty("--sy", scrollY);
      for (const el of visuals) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const offset = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.setProperty("--par", clamp(offset, -1, 1).toFixed(3));
      }
    };
    const queue = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    update();
  }

  /* "Cari nafkah · 8 jam" counts up from zero when the bar fills. */
  function countUp() {
    const day = document.querySelector(".day");
    if (!day) return;
    const segs = $$(".day__seg", day).map((el) => {
      const match = el.textContent.match(/^(.*?)(\d+)(.*)$/);
      return match && { el, pre: match[1], to: +match[2], post: match[3] };
    });
    new MutationObserver((_, mo) => {
      if (!day.classList.contains("is-in")) return;
      mo.disconnect();
      const start = performance.now() + 300;
      const tick = (now) => {
        const t = clamp((now - start) / 1200, 0, 1);
        const eased = 1 - (1 - t) ** 3;
        for (const s of segs) {
          if (s) s.el.textContent = s.pre + Math.round(s.to * eased) + s.post;
        }
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }).observe(day, { attributes: true, attributeFilter: ["class"] });
  }

  /* The cats lean toward the cursor. */
  function pointerParallax() {
    const els = $$(".hero__illo, .head-illo");
    if (!els.length) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let running = false;
    const step = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      for (const el of els) {
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      }
      running = Math.abs(tx - x) + Math.abs(ty - y) > 0.002;
      if (running) requestAnimationFrame(step);
    };
    addEventListener(
      "pointermove",
      (e) => {
        tx = (e.clientX / innerWidth) * 2 - 1;
        ty = (e.clientY / innerHeight) * 2 - 1;
        if (!running) {
          running = true;
          requestAnimationFrame(step);
        }
      },
      { passive: true },
    );
  }

  function tilt() {
    for (const el of $$(".tile:not(.tile--neko), .photo-slot")) {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.classList.add("is-tilting");
        el.style.setProperty("--tx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        el.style.setProperty("--ty", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      el.addEventListener("pointerleave", () => {
        el.classList.remove("is-tilting");
        el.style.setProperty("--tx", 0);
        el.style.setProperty("--ty", 0);
      });
    }
  }

  function magnetic() {
    for (const el of $$(".talk, .kontak__cta, .cv-button, .print-button")) {
      el.classList.add("magnetic");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${(dx * 0.22).toFixed(1)}px ${(dy * 0.35).toFixed(1)}px`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.translate = "";
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
