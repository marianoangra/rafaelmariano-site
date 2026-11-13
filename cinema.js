/* Camada cinematográfica — branch preview-cinematografico.
   Roda depois do script original do index.html e não muda nenhum texto. */
(() => {
  const d = document;
  const $ = (s, el = d) => el.querySelector(s);
  const $$ = (s, el = d) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const desk = matchMedia("(min-width: 900px)");

  /* atmosfera */
  for (const cls of ["vignette", "grain"]) {
    const el = d.createElement("div");
    el.className = cls;
    el.setAttribute("aria-hidden", "true");
    d.body.append(el);
  }

  /* galerias: cada foto ganha uma moldura (Ken Burns, letterbox, rolo de filme) */
  $$(".gal img, .strip img").forEach((img) => {
    const w = d.createElement("span");
    w.className = "kb" + (img.classList.contains("tall") ? " tall" : "");
    img.classList.remove("tall");
    img.before(w);
    w.append(img);
    w.tabIndex = 0;
    w.setAttribute("role", "button");
    w.setAttribute("aria-label", "Ampliar foto: " + img.alt);
    w.dataset.cap = img.alt;
    const r = () => (Math.random() * 2 - 1).toFixed(2);
    w.style.setProperty("--ox", 30 + Math.random() * 40 + "%");
    w.style.setProperty("--oy", 30 + Math.random() * 40 + "%");
    w.style.setProperty("--tx", r() * 1.6 + "%");
    w.style.setProperty("--ty", r() * 1.6 + "%");
    img.style.animationDelay = -(Math.random() * 18).toFixed(1) + "s";
  });
  const aboutImg = $(".about img.p");
  if (aboutImg) {
    aboutImg.tabIndex = 0;
    aboutImg.setAttribute("role", "button");
  }

  /* livro em 3D */
  const bookImg = $(".book img");
  if (bookImg) {
    const c = d.createElement("span");
    c.className = "cover";
    bookImg.before(c);
    c.append(bookImg);
  }

  /* revelação ao rolar (com escalonamento) */
  const rv = (els, step = 0) =>
    els.filter(Boolean).forEach((el, i) => {
      el.classList.add("rv");
      if (step) el.style.setProperty("--d", i * step + "ms");
    });
  rv($$("main section:not(.hero) h2"));
  rv($$("main section:not(.hero) .lead, .note, .fine, #receba .wrap > p:not(.lead)"));
  rv($$(".proof .lead"));
  rv($$(".proof .chips span"), 80);
  rv($$(".deliver > div"), 120);
  rv([$(".gal + h3")]);
  rv($$(".gal .kb"), 55);
  rv($$(".strip .kb"), 50);
  rv([aboutImg, ...$$(".about .wrap > div > *")], 90);
  rv($$(".rows .row"), 70);
  rv($$(".final p, .final .btn"), 120);

  const done = (el) => {
    // depois de aparecer, devolve o elemento aos estilos próprios (hover sem atraso)
    el.classList.remove("rv", "in");
    el.style.removeProperty("--d");
  };
  if (reduce || !("IntersectionObserver" in window)) {
    $$(".rv").forEach(done);
  } else {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          io.unobserve(el);
          el.classList.add("in");
          el.addEventListener("transitionend", (ev) => ev.propertyName === "opacity" && done(el));
          setTimeout(() => done(el), 2500);
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    $$(".rv").forEach((el) => io.observe(el));

    // Ken Burns só anda com a foto na tela
    const kbio = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("play", e.isIntersecting)));
    $$(".kb").forEach((el) => kbio.observe(el));
  }

  /* menu: seção atual sublinhada */
  const links = $$("nav a[href^='#']:not(.btn)");
  if ("IntersectionObserver" in window && links.length) {
    const nio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    links.forEach((a) => {
      const s = $(a.getAttribute("href"));
      if (s) nio.observe(s);
    });
  }

  /* +314 mil seguidores reais: contagem */
  const chip = $(".stage .chip");
  if (chip && !reduce) {
    const final = chip.textContent;
    const m = final.match(/\d+/);
    if (m) {
      chip.setAttribute("aria-label", final);
      chip.style.minWidth = chip.offsetWidth + "px";
      chip.textContent = final.replace(m[0], "0");
      const target = +m[0];
      const t0 = performance.now() + 1150;
      const tick = (now) => {
        const t = clamp((now - t0) / 1700, 0, 1);
        chip.textContent = final.replace(m[0], String(Math.round(target * (1 - Math.pow(1 - t, 3)))));
        if (t < 1) requestAnimationFrame(tick);
        else chip.textContent = final;
      };
      requestAnimationFrame(tick);
    }
  }

  /* pilares: holofote passando de um em um */
  const pills = $$(".proof .chips span");
  if (pills.length && !reduce) {
    let k = 0;
    setInterval(() => {
      if (d.hidden) return;
      pills.forEach((p, i) => p.classList.toggle("on", i === k));
      k = (k + 1) % pills.length;
    }, 1400);
  }

  /* cards da proposta: inclinação 3D seguindo o cursor */
  if (finePointer && !reduce) {
    $$(".deliver > div").forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        c.classList.add("tilting");
        c.style.transform = `perspective(900px) rotateX(${((0.5 - y) * 9).toFixed(2)}deg) rotateY(${((x - 0.5) * 11).toFixed(2)}deg) translateY(-6px)`;
        c.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        c.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      c.addEventListener("pointerleave", () => {
        c.classList.remove("tilting");
        c.style.transform = "";
      });
    });

    // foto do hero inclina levemente com o mouse
    const hero = $(".hero");
    const stage = $(".stage");
    if (hero && stage) {
      hero.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        const x = clamp((e.clientX - (r.left + r.width / 2)) / innerWidth, -0.5, 0.5);
        const y = clamp((e.clientY - (r.top + r.height / 2)) / innerHeight, -0.5, 0.5);
        stage.style.transform = `perspective(1100px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg)`;
      });
      hero.addEventListener("pointerleave", () => (stage.style.transform = ""));
    }
  }

  /* rolagem: header, progresso, parallax e linha do tempo */
  const header = $("header");
  const hero = $(".hero");
  const stage = $(".stage");
  const steps = $(".steps");
  const lis = steps ? $$("li", steps) : [];

  function timeline() {
    if (!steps) return;
    const vh = innerHeight;
    if (desk.matches) {
      const r = steps.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (vh * 0.5), 0, 1);
      steps.style.setProperty("--p", p.toFixed(3));
      lis.forEach((li, i) => li.classList.toggle("lit", r.top < vh * 0.85 && p >= i / (lis.length - 1) - 0.001));
    } else {
      const line = vh * 0.7;
      lis.forEach((li) => {
        const r = li.getBoundingClientRect();
        li.classList.toggle("lit", r.top + 20 < line);
        li.style.setProperty("--fill", (clamp((line - (r.top + 22)) / r.height, 0, 1) * 100).toFixed(1) + "%");
      });
    }
  }

  let queued = false;
  function frame() {
    queued = false;
    const y = scrollY;
    const max = d.documentElement.scrollHeight - innerHeight;
    header?.classList.toggle("scrolled", y > 8);
    header?.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : "0");
    timeline();
    if (reduce) return;
    if (stage && y < innerHeight * 1.3) stage.style.translate = `0 ${(y * (desk.matches ? 0.12 : 0.05)).toFixed(1)}px`;
    if (hero && y < innerHeight * 1.3) hero.style.setProperty("--gy", (y * 0.3).toFixed(1) + "px");
    if (aboutImg) {
      const r = aboutImg.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) aboutImg.style.translate = `0 ${((r.top + r.height / 2 - innerHeight / 2) * -0.06).toFixed(1)}px`;
    }
  }
  const request = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(frame);
    }
  };
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request);
  frame();

  /* lightbox: legenda, contador, anterior/próxima, teclado e swipe */
  const lb = $("#lb");
  const lbi = $("#lbi");
  const pics = $$(".gal img, .strip img, .about img.p");
  if (lb && lbi && pics.length) {
    lb.classList.add("cine");
    lb.setAttribute("aria-label", "Foto ampliada");
    const cap = d.createElement("p");
    cap.className = "lb-cap";
    const count = d.createElement("span");
    count.className = "lb-count";
    const mk = (cls, label, path) => {
      const b = d.createElement("button");
      b.type = "button";
      b.className = cls;
      b.setAttribute("aria-label", label);
      b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      return b;
    };
    const prev = mk("lb-nav lb-prev", "Foto anterior", "M15 5l-7 7 7 7");
    const next = mk("lb-nav lb-next", "Próxima foto", "M9 5l7 7-7 7");
    const close = mk("lb-close", "Fechar", "M6 6l12 12M18 6L6 18");
    close.autofocus = true; // foco inicial no "Fechar", não na seta
    lb.append(cap, count, prev, next, close);

    let cur = 0;
    const show = (i, dir = 0) => {
      cur = (i + pics.length) % pics.length;
      const p = pics[cur];
      lbi.classList.remove("swap");
      void lbi.offsetWidth;
      lbi.src = p.src;
      lbi.alt = p.alt;
      cap.textContent = p.alt;
      count.textContent = `${String(cur + 1).padStart(2, "0")} / ${String(pics.length).padStart(2, "0")}`;
      lbi.style.setProperty("--dir", String(dir));
      lbi.classList.add("swap");
    };
    const open = (img) => {
      show(pics.indexOf(img));
      if (!lb.open) lb.showModal();
    };
    const target = (el) => el.closest?.(".kb, .about img.p");

    // captura no document: impede o handler antigo de abrir o dialog duas vezes
    d.addEventListener(
      "click",
      (e) => {
        const t = target(e.target);
        if (!t) return;
        e.stopPropagation();
        open(t.matches("img") ? t : $("img", t));
      },
      true,
    );
    d.addEventListener("keydown", (e) => {
      if (lb.open) {
        if (e.key === "ArrowRight") show(cur + 1, 1);
        if (e.key === "ArrowLeft") show(cur - 1, -1);
        return;
      }
      const t = target(e.target);
      if (t && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        open(t.matches("img") ? t : $("img", t));
      }
    });
    prev.addEventListener("click", (e) => (e.stopPropagation(), show(cur - 1, -1)));
    next.addEventListener("click", (e) => (e.stopPropagation(), show(cur + 1, 1)));
    close.addEventListener("click", (e) => (e.stopPropagation(), lb.close()));
    let sx = null;
    lb.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50) {
        e.preventDefault(); // não deixa o toque virar o clique que fecha
        dx < 0 ? show(cur + 1, 1) : show(cur - 1, -1);
      }
    });
  }
})();
