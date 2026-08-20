/* =========================================================================
   Claude ที่ AP — Recap & Prompt Playbook
   Renderer + presenter controls (no build step, no dependencies)
   ========================================================================= */

(() => {
  "use strict";

  const deck = window.AP_CLAUDE_DECK;
  if (!deck) {
    document.getElementById("stage").innerHTML =
      '<p style="color:#fff;font-size:18px;padding:40px">ไม่พบข้อมูลสไลด์ — ตรวจสอบไฟล์ data/deck-data.js</p>';
    return;
  }

  const FONT_STEPS = [0.9, 1, 1.1, 1.2, 1.35, 1.5];
  const FONT_KEY = "ap-claude-deck:font-scale";
  const LOGO_DARK = "assets/img/ap-logo-dark.png";
  const LOGO_LIGHT = "assets/img/ap-logo-light.png";
  const FOOT_LABEL = deck.meta.footer;

  const slides = deck.slides;
  const tracks = deck.tracks;
  const trackById = new Map(tracks.map((t) => [t.id, t]));

  const el = {
    stage: document.getElementById("stage"),
    shell: document.getElementById("shell"),
    chapter: document.getElementById("chapter-label"),
    counter: document.getElementById("slide-counter"),
    progress: document.getElementById("progress-fill"),
    hint: document.getElementById("control-hint"),
    prev: document.getElementById("prev-button"),
    next: document.getElementById("next-button"),
    home: document.getElementById("home-button"),
    fullscreen: document.getElementById("fullscreen-button"),
    fontDown: document.getElementById("font-down"),
    fontUp: document.getElementById("font-up"),
    fontLevel: document.getElementById("font-level"),
    toc: document.getElementById("toc"),
    tocButton: document.getElementById("toc-button"),
    tocClose: document.getElementById("toc-close"),
    tocList: document.getElementById("toc-list"),
    promptModal: document.getElementById("prompt-modal"),
    promptBackdrop: document.getElementById("prompt-backdrop"),
    promptClose: document.getElementById("prompt-close"),
    promptKicker: document.getElementById("prompt-kicker"),
    promptTitle: document.getElementById("prompt-title"),
    promptBody: document.getElementById("prompt-body"),
    guideModal: document.getElementById("guide-modal"),
    guideBackdrop: document.getElementById("guide-backdrop"),
    guideClose: document.getElementById("guide-close"),
    guideKicker: document.getElementById("guide-kicker"),
    guideTitle: document.getElementById("guide-title"),
    guideBody: document.getElementById("guide-body"),
    libraryModal: document.getElementById("library-modal"),
    libraryBackdrop: document.getElementById("library-backdrop"),
    libraryClose: document.getElementById("library-close"),
    libraryButton: document.getElementById("library-button"),
    librarySearch: document.getElementById("library-search"),
    libraryFilter: document.getElementById("library-filter"),
    libraryCount: document.getElementById("library-count"),
    libraryBody: document.getElementById("library-body"),
    toast: document.getElementById("toast"),
  };

  let index = 0;
  let fontStep = 1;
  let libraryTrack = "all";
  let toastTimer = null;
  let lastFocus = null;

  /* ---------------------------------------------------------------- utils */

  const esc = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const pad2 = (n) => String(n).padStart(2, "0");

  /** ทำให้ [ตัวแปร] ใน prompt เด่นขึ้น */
  const markVars = (text) =>
    esc(text).replace(/\[([^\][]+)\]/g, (_, inner) => `<mark>[${inner}]</mark>`);

  const iconCopy =
    '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      el.toast.hidden = true;
    }, 1900);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label || "คัดลอก prompt แล้ว");
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand && document.execCommand("copy");
      document.body.removeChild(area);
      showToast(ok ? label || "คัดลอก prompt แล้ว" : "คัดลอกไม่สำเร็จ — กดเลือกข้อความแล้ว Ctrl+C");
    }
  }

  /* ------------------------------------------------------- slide fragments */

  const footer = (page, note) => `
    <div class="s-foot">
      <span>${esc(FOOT_LABEL)}${note ? ` &nbsp;·&nbsp; <em class="s-foot__note">${esc(note)}</em>` : ""}</span>
      <span class="s-foot__page">${pad2(page)}</span>
    </div>`;

  const head = (slide, logo = LOGO_DARK) => `
    <div class="s-head">
      <p class="kicker reveal" style="--i:0">${esc(slide.kicker)}</p>
      <h1 class="s-title reveal" style="--i:1">${esc(slide.title)}</h1>
      ${slide.lead ? `<p class="s-lead reveal" style="--i:2">${esc(slide.lead)}</p>` : ""}
      <img class="s-logo" src="${logo}" alt="AP Thailand" />
    </div>`;

  /* --------------------------------------------------------- slide renders */

  const renderers = {
    cover(slide, page) {
      return `
        <article class="slide slide--cover" role="group" aria-label="${esc(slide.title)}">
          <span class="cover__glow cover__glow--a" aria-hidden="true"></span>
          <span class="cover__glow cover__glow--b" aria-hidden="true"></span>
          <div class="cover__top">
            <p class="kicker reveal" style="--i:0">${esc(slide.kicker)}</p>
            <img class="s-logo" src="${LOGO_LIGHT}" alt="AP Thailand" />
          </div>
          <div class="cover__main">
            <h1 class="cover__title reveal" style="--i:1">${esc(slide.title)}<em>${esc(slide.titleAccent || "")}</em></h1>
            <p class="cover__sub reveal" style="--i:2">${esc(slide.sub)}</p>
            ${slide.desc ? `<p class="cover__desc reveal" style="--i:3">${esc(slide.desc)}</p>` : ""}
            <div class="cover__facts reveal" style="--i:4">
              ${slide.facts
                .map((f) => `<div class="cover__fact"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`)
                .join("")}
            </div>
          </div>
          <div class="cover__band">
            <b>${esc(deck.meta.slogan)}</b>
            <span>${esc(slide.stamp)}</span>
          </div>
        </article>`;
    },

    agenda(slide, page) {
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body">
            <div class="agenda grow">
              ${slide.items
                .map(
                  (item, i) => `
                <div class="agenda__row reveal" style="--i:${i + 3}">
                  <span class="num">${pad2(i + 1)}</span>
                  <span class="agenda__label">${esc(item.label)}</span>
                  <span class="agenda__time">${esc(item.time)}</span>
                </div>`
                )
                .join("")}
            </div>
          </div>
          ${footer(page)}
        </article>`;
    },

    duo(slide, page) {
      const card = (c, i) => {
        const tone = c.tone === "dark" ? "card card--dark" : "card card--fill";
        const rows = c.rows
          ? `<div class="flow">${c.rows
              .map(
                (r) => `
            <div class="flowrow">
              <span class="flowrow__pill">${esc(r.pill)}</span>
              <p class="flowrow__text">${esc(r.text)}</p>
            </div>`
              )
              .join("")}</div>`
          : "";
        const list = c.list
          ? `<ul class="dashlist">${c.list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
          : "";
        return `
          <div class="${tone} reveal" style="--i:${i + 3}">
            ${c.eyebrow ? `<p class="card__eyebrow">${esc(c.eyebrow)}</p>` : ""}
            <h2 class="card__title">${esc(c.title)}</h2>
            <div class="card__rule"></div>
            ${c.text ? `<p class="card__text">${esc(c.text)}</p>` : ""}
            ${c.text && (list || rows) ? '<div style="height:calc(20 * var(--px))"></div>' : ""}
            ${list}${rows}
            ${
              c.footnote
                ? `<div class="card__rule" style="margin-top:auto"></div><p class="note" ${
                    c.tone === "dark" ? 'style="color:var(--sand-3)"' : ""
                  }>${esc(c.footnote)}</p>`
                : ""
            }
          </div>`;
      };
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body">
            <div class="duo grow">${slide.cards.map(card).join("")}</div>
          </div>
          ${footer(page)}
        </article>`;
    },

    highlights(slide, page) {
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body">
            <div class="hl-grid grow">
              ${slide.items
                .map(
                  (h, i) => `
                <div class="hl reveal" style="--i:${i + 3}">
                  <div class="hl__top">
                    <span class="num">${pad2(i + 1)}</span>
                    <p class="hl__en">${esc(h.nameEn)}</p>
                  </div>
                  <h3 class="hl__name">${esc(h.name)}</h3>
                  <p class="hl__what">${esc(h.what)}</p>
                  <p class="hl__why">${esc(h.why)}</p>
                </div>`
                )
                .join("")}
            </div>
          </div>
          ${footer(page)}
        </article>`;
    },

    anatomy(slide, page) {
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body s-body--center">
            <div class="anatomy reveal" style="--i:3">
              ${slide.items
                .map(
                  (a, i) => `
                <div class="anatomy__col">
                  <span class="num">${pad2(i + 1)}</span>
                  <h3 class="anatomy__name">${esc(a.name)}</h3>
                  <p class="anatomy__ask">${esc(a.ask)}</p>
                  <p class="anatomy__ex">“${esc(a.example)}”</p>
                </div>`
                )
                .join("")}
            </div>
            <div class="formula reveal" style="--i:5">
              ${slide.formula
                .map(
                  (f, i) =>
                    `${i ? '<span class="formula__plus">+</span>' : ""}<span class="formula__chip">${esc(f)}</span>`
                )
                .join("")}
            </div>
            ${slide.note ? `<p class="note reveal" style="--i:6">${esc(slide.note)}</p>` : ""}
          </div>
          ${footer(page)}
        </article>`;
    },

    compare(slide, page) {
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body">
            <div class="compare grow">
              ${slide.items
                .map(
                  (c, i) => `
                <div class="compare__row reveal" style="--i:${i + 3}">
                  <div class="compare__who">
                    <b>${esc(c.track)}</b>
                    <span>${esc(c.why)}</span>
                  </div>
                  <div class="compare__side">
                    <span class="compare__tag compare__tag--bad">✕ ยังใช้ไม่ได้</span>
                    <p class="compare__txt compare__txt--bad">“${esc(c.bad)}”</p>
                  </div>
                  <div class="compare__side">
                    <span class="compare__tag compare__tag--good">✓ ใช้ได้จริง</span>
                    <p class="compare__txt compare__txt--good">“${esc(c.good)}”</p>
                  </div>
                </div>`
                )
                .join("")}
            </div>
          </div>
          ${footer(page)}
        </article>`;
    },

    divider(slide, page) {
      return `
        <article class="slide slide--divider" role="group" aria-label="${esc(slide.title)}">
          <span class="divider__glow" aria-hidden="true"></span>
          <div class="s-head">
            <p class="kicker kicker--onDark reveal" style="--i:0">${esc(slide.kicker)}</p>
            <img class="s-logo" src="${LOGO_LIGHT}" alt="AP Thailand" />
          </div>
          <div class="divider__body">
            <h1 class="divider__title reveal" style="--i:1">${esc(slide.title)}</h1>
            <p class="divider__sub reveal" style="--i:2">${esc(slide.sub)}</p>
            <div class="divider__tracks">
              ${slide.items
                .map(
                  (t, i) => `
                <div class="dtrack reveal" style="--i:${i + 3}">
                  <b>${esc(t.name)}</b><span>${esc(t.count)}</span>
                </div>`
                )
                .join("")}
            </div>
          </div>
          <div class="s-foot" style="color:var(--muted-3)">
            <span>${esc(FOOT_LABEL)}</span>
            <span class="s-foot__page">${pad2(page)}</span>
          </div>
        </article>`;
    },

    track(slide, page) {
      const t = trackById.get(slide.trackId);
      return `
        <article class="slide" role="group" aria-label="${esc(t.titleTh)}">
          <div class="s-head">
            <p class="kicker reveal" style="--i:0">${esc(t.kicker)}</p>
            <h1 class="s-title reveal" style="--i:1">${esc(t.titleTh)}</h1>
            <div class="track__meta reveal" style="--i:2">
              <span class="badge">${esc(t.label)} · ${t.headcount} คน</span>
              <p class="track__roles">${esc(t.roles)}</p>
            </div>
            <img class="s-logo" src="${LOGO_DARK}" alt="AP Thailand" />
          </div>
          <div class="s-body">
            <div class="uc-grid grow">
              ${t.useCases
                .map(
                  (u, i) => `
                <div class="uc reveal" style="--i:${i + 3}">
                  <div class="uc__head">
                    <span class="num">${pad2(i + 1)}</span>
                    <h3 class="uc__title">${esc(u.title)}</h3>
                  </div>
                  <dl class="uc__flow">
                    <div class="uc__step"><dt>แนบ</dt><dd>${esc(u.input)}</dd></div>
                    <div class="uc__step"><dt>สั่ง</dt><dd>${esc(u.action)}</dd></div>
                    <div class="uc__step uc__step--out"><dt>ได้</dt><dd>${esc(u.output)}</dd></div>
                  </dl>
                  <p class="uc__time">
                    <s>${esc(u.before)}</s><i>→</i><b>${esc(u.after)}</b>
                  </p>
                </div>`
                )
                .join("")}
            </div>
            <div class="track__foot reveal" style="--i:6">
              <div class="track__caution">
                <b>ระวัง</b>
                <p>${esc(t.caution)}</p>
              </div>
              <div class="track__actions">
                <button class="keybtn" type="button" data-open-prompt="${esc(t.id)}">
                  <kbd>P</kbd>Prompt พร้อมใช้ ${t.prompts.length} ชุด
                </button>
                <button class="keybtn" type="button" data-open-guide="${esc(t.id)}">
                  <kbd>G</kbd>คู่มือ 4 ขั้น
                </button>
              </div>
            </div>
          </div>
          ${footer(page, "* เวลาเป็นค่าประมาณ (estimate) เพื่อให้เห็นขนาดของผล ไม่ใช่ตัวเลขที่วัดจากงานจริง")}
        </article>`;
    },

    deliver(slide, page) {
      const p = slide.preview;
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body">
            <div class="deliver grow">
              <div class="steps reveal" style="--i:3">
                ${slide.steps
                  .map(
                    (s, i) => `
                  <div class="step">
                    <span class="num">${pad2(i + 1)}</span>
                    <div class="step__txt"><b>${esc(s.title)}</b><span>${esc(s.detail)}</span></div>
                  </div>`
                  )
                  .join("")}
              </div>
              <div class="promptpreview reveal" style="--i:4">
                <p class="promptpreview__label">${esc(p.label)}</p>
                <h3 class="promptpreview__title">${esc(p.title)}</h3>
                <p class="promptpreview__body">${markVars(p.body)}</p>
              </div>
            </div>
            ${
              slide.cta
                ? `<div class="track__foot reveal" style="--i:5">
                    <div class="track__caution"><b>ใช้เลย</b><p>${esc(slide.cta.text)}</p></div>
                    <div class="track__actions">
                      <button class="keybtn" type="button" data-open-library="1"><kbd>L</kbd>${esc(slide.cta.button)}</button>
                    </div>
                  </div>`
                : ""
            }
          </div>
          ${footer(page)}
        </article>`;
    },

    guides(slide, page) {
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body">
            <div class="hl-grid grow">
              ${tracks
                .map(
                  (t, i) => `
                <button class="hl reveal" style="--i:${i + 3};cursor:pointer;text-align:left;border:0;font-family:inherit" type="button" data-open-guide="${esc(t.id)}">
                  <div class="hl__top">
                    <span class="num">${pad2(i + 1)}</span>
                    <p class="hl__en">${esc(t.kickerShort)}</p>
                  </div>
                  <h3 class="hl__name">${esc(t.label)}</h3>
                  <p class="hl__what">${esc(t.quickGuide[0].step)} → ${esc(t.quickGuide[1].step)} → ${esc(
                    t.quickGuide[2].step
                  )} → ${esc(t.quickGuide[3].step)}</p>
                  <p class="hl__why">กดเพื่อเปิดคู่มือ 4 ขั้นของสายงานนี้</p>
                </button>`
                )
                .join("")}
            </div>
            ${slide.note ? `<p class="note reveal" style="--i:9">${esc(slide.note)}</p>` : ""}
          </div>
          ${footer(page)}
        </article>`;
    },

    safety(slide, page) {
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body">
            <div class="safety grow">
              ${slide.items
                .map(
                  (s, i) => `
                <div class="safety__item reveal" style="--i:${i + 3}">
                  <span class="num">${pad2(i + 1)}</span>
                  <div><b>${esc(s.rule)}</b><span>${esc(s.detail)}</span></div>
                </div>`
                )
                .join("")}
            </div>
            ${
              slide.callout
                ? `<div class="track__foot reveal" style="--i:7"><div class="track__caution"><b>จำง่ายๆ</b><p>${esc(
                    slide.callout
                  )}</p></div></div>`
                : ""
            }
          </div>
          ${footer(page)}
        </article>`;
    },

    week(slide, page) {
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body">
            <div class="week">
              ${slide.items
                .map(
                  (w, i) => `
                <div class="week__card reveal" style="--i:${i + 3}">
                  <p class="week__day">${esc(w.day)}</p>
                  <p class="week__action">${esc(w.action)}</p>
                  <p class="week__outcome">${esc(w.outcome)}</p>
                </div>`
                )
                .join("")}
            </div>
            <div class="workshop grow">
              <div class="card card--fill reveal" style="--i:7">
                <p class="card__eyebrow">${esc(slide.workshop.eyebrow)}</p>
                <h2 class="card__title">${esc(slide.workshop.title)}</h2>
                <div class="card__rule"></div>
                <ul class="dashlist">${slide.workshop.list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
              </div>
              <div class="card card--dark reveal" style="--i:8">
                <p class="card__eyebrow">${esc(slide.deliverables.eyebrow)}</p>
                <h2 class="card__title">${esc(slide.deliverables.title)}</h2>
                <div class="card__rule"></div>
                <ul class="dashlist">${slide.deliverables.list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
              </div>
            </div>
          </div>
          ${footer(page)}
        </article>`;
    },

    closing(slide, page) {
      return `
        <article class="slide slide--divider" role="group" aria-label="${esc(slide.title)}">
          <span class="divider__glow" aria-hidden="true"></span>
          <div class="s-head">
            <p class="kicker kicker--onDark reveal" style="--i:0">${esc(slide.kicker)}</p>
            <img class="s-logo" src="${LOGO_LIGHT}" alt="AP Thailand" />
          </div>
          <div class="closing">
            <div class="closing__text">
              <h1 class="closing__title reveal" style="--i:1">${esc(slide.title)}</h1>
              <p class="closing__sub reveal" style="--i:2">${esc(slide.sub)}</p>
              <ul class="dashlist closing__list reveal" style="--i:3">
                ${slide.gets.map((t) => `<li>${esc(t)}</li>`).join("")}
              </ul>
              <p class="closing__url reveal" style="--i:4">${esc(slide.url)}</p>
            </div>
            <figure class="qr reveal" style="--i:2">
              <span class="qr__frame">
                <img src="${esc(slide.qr)}" alt="QR code ไปยัง ${esc(slide.url)}" />
              </span>
              <figcaption class="qr__caption">${esc(slide.qrCaption)}</figcaption>
            </figure>
          </div>
          <div class="s-foot" style="color:var(--muted-3)">
            <span>${esc(FOOT_LABEL)}</span>
            <span class="s-foot__page">${pad2(page)}</span>
          </div>
        </article>`;
    },

    contacts(slide, page) {
      return `
        <article class="slide" role="group" aria-label="${esc(slide.title)}">
          ${head(slide)}
          <div class="s-body s-body--center">
            <div class="contacts">
              ${slide.people
                .map(
                  (c, i) => `
                <div class="contact reveal" style="--i:${i + 3}">
                  <p class="contact__nick">${esc(c.nick)}</p>
                  <p class="contact__name">${esc(c.name)}</p>
                  <p class="contact__role">${esc(c.role)}</p>
                  <p class="contact__line">Email: <b>${esc(c.email)}</b></p>
                  <p class="contact__line">Tel: ${esc(c.tel)}</p>
                </div>`
                )
                .join("")}
            </div>
            <div class="track__foot reveal" style="--i:6">
              <div class="track__caution"><b>ต่อจากนี้</b><p>${esc(slide.closing)}</p></div>
              <div class="track__actions">
                <button class="keybtn" type="button" data-open-library="1"><kbd>L</kbd>เปิดคลัง Prompt</button>
              </div>
            </div>
          </div>
          ${footer(page)}
        </article>`;
    },
  };

  /* -------------------------------------------------------------- rendering */

  function render() {
    const slide = slides[index];
    const renderer = renderers[slide.type];
    el.stage.innerHTML = renderer ? renderer(slide, index + 1) : "";

    el.chapter.textContent = slide.chapter;
    el.counter.textContent = `${pad2(index + 1)} / ${pad2(slides.length)}`;
    el.progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    el.prev.disabled = index === 0;
    el.next.disabled = index === slides.length - 1;

    const t = slide.trackId ? trackById.get(slide.trackId) : null;
    el.hint.textContent = t
      ? `P — Prompt ของ ${t.label} · G — คู่มือ · L — คลังทั้งหมด · +/− ขยายตัวอักษร`
      : "← → เปลี่ยนสไลด์ · L คลัง Prompt · O สารบัญ · F เต็มจอ · +/− ขยายตัวอักษร";

    el.stage.querySelectorAll("[data-open-prompt]").forEach((b) =>
      b.addEventListener("click", () => openPrompt(b.dataset.openPrompt))
    );
    el.stage.querySelectorAll("[data-open-guide]").forEach((b) =>
      b.addEventListener("click", () => openGuide(b.dataset.openGuide))
    );
    el.stage.querySelectorAll("[data-open-library]").forEach((b) =>
      b.addEventListener("click", () => openLibrary())
    );

    if (!el.toc.hidden) renderToc();
    const hash = slide.id ? `#${slide.id}` : "";
    if (hash && window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }

  function goTo(next) {
    const bounded = Math.max(0, Math.min(slides.length - 1, next));
    if (bounded === index) return;
    index = bounded;
    render();
  }

  const move = (delta) => goTo(index + delta);

  /* ------------------------------------------------------------ font scale */

  function applyFontScale() {
    const value = FONT_STEPS[fontStep];
    document.documentElement.style.setProperty("--fs", String(value));
    el.fontLevel.textContent = `${Math.round(value * 100)}%`;
    el.fontDown.disabled = fontStep === 0;
    el.fontUp.disabled = fontStep === FONT_STEPS.length - 1;
    try {
      window.localStorage.setItem(FONT_KEY, String(fontStep));
    } catch {
      /* storage ปิดอยู่ — ข้ามได้ */
    }
  }

  function setFontStep(next, announce) {
    const bounded = Math.max(0, Math.min(FONT_STEPS.length - 1, next));
    const changed = bounded !== fontStep;
    fontStep = bounded;
    applyFontScale();
    if (announce && changed) showToast(`ขนาดตัวอักษร ${Math.round(FONT_STEPS[fontStep] * 100)}%`);
    else if (announce && !changed) showToast(`ขนาดตัวอักษรสุดทางแล้ว (${Math.round(FONT_STEPS[fontStep] * 100)}%)`);
  }

  /* ---------------------------------------------------------------- drawers */

  function openDialog(node) {
    lastFocus = document.activeElement;
    node.hidden = false;
  }

  function closeDialog(node) {
    node.hidden = true;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    else el.stage.focus();
  }

  const anyDialogOpen = () =>
    !el.toc.hidden || !el.promptModal.hidden || !el.guideModal.hidden || !el.libraryModal.hidden;

  function closeAllDialogs() {
    [el.toc, el.promptModal, el.guideModal, el.libraryModal].forEach((n) => {
      if (!n.hidden) n.hidden = true;
    });
  }

  /* --- table of contents --- */
  function renderToc() {
    let html = "";
    let group = null;
    slides.forEach((slide, i) => {
      if (slide.chapter !== group) {
        group = slide.chapter;
        html += `<p class="toc-group">${esc(group)}</p>`;
      }
      const label = slide.trackId ? trackById.get(slide.trackId).label : slide.title;
      const sub = slide.trackId ? trackById.get(slide.trackId).kickerShort : slide.kicker;
      html += `
        <button class="toc-item" type="button" data-goto="${i}" ${i === index ? 'aria-current="true"' : ""}>
          <span class="toc-item__no">${pad2(i + 1)}</span>
          <span class="toc-item__txt"><b>${esc(label)}</b><span>${esc(sub)}</span></span>
        </button>`;
    });
    el.tocList.innerHTML = html;
    el.tocList.querySelectorAll("[data-goto]").forEach((b) =>
      b.addEventListener("click", () => {
        goTo(Number(b.dataset.goto));
        closeDialog(el.toc);
      })
    );
  }

  function openToc() {
    closeAllDialogs();
    renderToc();
    openDialog(el.toc);
    el.tocList.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "center" });
  }

  /* --- prompt modal --- */
  function promptCardHTML(prompt, i, trackLabel) {
    const id = `p-${trackLabel}-${i}`;
    return `
      <div class="pcard">
        <div class="pcard__head">
          <div class="pcard__id">
            <span class="pcard__no">${pad2(i + 1)}</span>
            <div>
              <p class="pcard__label">${esc(prompt.label)}</p>
              ${trackLabel ? `<p class="pcard__track">${esc(trackLabel)}</p>` : ""}
            </div>
          </div>
          <button class="copybtn" type="button" data-copy-for="${esc(id)}">${iconCopy}คัดลอก</button>
        </div>
        <div class="pcard__body">
          <p class="pcard__attach"><b>แนบ</b>${esc(prompt.attach)}</p>
          <p class="pcard__text" id="${esc(id)}">${markVars(prompt.body)}</p>
        </div>
      </div>`;
  }

  function wireCopyButtons(scope) {
    scope.querySelectorAll("[data-copy-for]").forEach((b) =>
      b.addEventListener("click", () => {
        const target = scope.querySelector(`#${CSS.escape(b.dataset.copyFor)}`);
        if (target) copyText(target.textContent);
      })
    );
  }

  function openPrompt(trackId) {
    const t = trackById.get(trackId) || trackById.get(currentTrackId());
    if (!t) {
      showToast("สไลด์นี้ไม่มี prompt template — กด L เพื่อเปิดคลังทั้งหมด");
      return;
    }
    closeAllDialogs();
    el.promptKicker.textContent = `PROMPT TEMPLATES · ${t.kickerShort}`;
    el.promptTitle.textContent = `Prompt พร้อมใช้ — ${t.label}`;
    el.promptBody.innerHTML =
      t.prompts.map((p, i) => promptCardHTML(p, i, "")).join("") +
      `<p class="empty">คัดลอกไปวางใน Claude แล้วแก้ค่าใน [วงเล็บเหลี่ยม] ให้ตรงงานของคุณ</p>`;
    wireCopyButtons(el.promptBody);
    openDialog(el.promptModal);
    el.promptClose.focus();
  }

  function openGuide(trackId) {
    const t = trackById.get(trackId) || trackById.get(currentTrackId());
    if (!t) {
      showToast("เปิดคู่มือได้จากสไลด์ของสายงาน หรือหน้าคู่มือพร้อมใช้");
      return;
    }
    closeAllDialogs();
    el.guideKicker.textContent = `QUICK GUIDE · ${t.kickerShort}`;
    el.guideTitle.textContent = `คู่มือพร้อมใช้ — ${t.label}`;
    el.guideBody.innerHTML = `
      <div class="gsteps">
        ${t.quickGuide
          .map(
            (g, i) => `
          <div class="gstep">
            <span class="gstep__no">${pad2(i + 1)}</span>
            <div class="gstep__txt"><b>${esc(g.step)}</b><span>${esc(g.detail)}</span></div>
          </div>`
          )
          .join("")}
      </div>
      <p class="gnote"><b>ระวัง</b>${esc(t.caution)}</p>`;
    openDialog(el.guideModal);
    el.guideClose.focus();
  }

  /* --- prompt library --- */
  function renderLibrary() {
    const term = el.librarySearch.value.trim().toLowerCase();
    const rows = [];
    tracks.forEach((t) => {
      if (libraryTrack !== "all" && libraryTrack !== t.id) return;
      t.prompts.forEach((p) => {
        const haystack = `${p.label} ${p.body} ${p.attach} ${t.label}`.toLowerCase();
        if (!term || haystack.includes(term)) rows.push({ p, t });
      });
    });
    el.libraryCount.textContent = `${rows.length} PROMPT TEMPLATES`;
    el.libraryBody.innerHTML = rows.length
      ? rows.map(({ p, t }, i) => promptCardHTML(p, i, t.label)).join("")
      : '<p class="empty">ไม่พบ prompt ที่ตรงกับคำค้น — ลองคำอื่น เช่น BOQ, ปิดงบ, survey</p>';
    wireCopyButtons(el.libraryBody);
  }

  function renderLibraryFilter() {
    const options = [{ id: "all", label: `ทุกสายงาน (${tracks.reduce((n, t) => n + t.prompts.length, 0)})` }].concat(
      tracks.map((t) => ({ id: t.id, label: `${t.label} (${t.prompts.length})` }))
    );
    el.libraryFilter.innerHTML = options
      .map(
        (o) =>
          `<button class="chip" type="button" data-track="${esc(o.id)}" aria-pressed="${
            o.id === libraryTrack
          }">${esc(o.label)}</button>`
      )
      .join("");
    el.libraryFilter.querySelectorAll("[data-track]").forEach((b) =>
      b.addEventListener("click", () => {
        libraryTrack = b.dataset.track;
        renderLibraryFilter();
        renderLibrary();
      })
    );
  }

  function openLibrary(trackId) {
    closeAllDialogs();
    if (trackId) libraryTrack = trackId;
    renderLibraryFilter();
    renderLibrary();
    openDialog(el.libraryModal);
    el.librarySearch.focus();
  }

  const currentTrackId = () => slides[index].trackId || null;

  /* -------------------------------------- fullscreen / presentation mode */

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      showToast("เบราว์เซอร์นี้ไม่อนุญาตโหมดเต็มจอ");
    }
  }

  /* เต็มจอ = โหมดนำเสนอ: แถบเครื่องมือลอยและซ่อนตัวเอง สไลด์ใช้พื้นที่ทั้งจอ */
  let chromeTimer = null;

  function revealChrome() {
    if (!document.documentElement.classList.contains("presenting")) return;
    document.documentElement.classList.add("chrome-visible");
    window.clearTimeout(chromeTimer);
    chromeTimer = window.setTimeout(() => {
      document.documentElement.classList.remove("chrome-visible");
    }, 2600);
  }

  document.addEventListener("fullscreenchange", () => {
    const presenting = Boolean(document.fullscreenElement);
    document.documentElement.classList.toggle("presenting", presenting);
    if (presenting) {
      revealChrome();
      showToast("โหมดนำเสนอ — ขยับเมาส์เพื่อเรียกแถบเครื่องมือ · Esc ออกจากเต็มจอ");
    } else {
      window.clearTimeout(chromeTimer);
      document.documentElement.classList.remove("chrome-visible");
    }
  });

  window.addEventListener("mousemove", revealChrome, { passive: true });

  /* ---------------------------------------------------------------- events */

  el.prev.addEventListener("click", () => move(-1));
  el.next.addEventListener("click", () => move(1));
  el.home.addEventListener("click", () => goTo(0));
  el.fullscreen.addEventListener("click", toggleFullscreen);
  el.fontDown.addEventListener("click", () => setFontStep(fontStep - 1, true));
  el.fontUp.addEventListener("click", () => setFontStep(fontStep + 1, true));
  el.fontLevel.addEventListener("click", () => setFontStep(1, true));
  el.tocButton.addEventListener("click", openToc);
  el.tocClose.addEventListener("click", () => closeDialog(el.toc));
  el.promptClose.addEventListener("click", () => closeDialog(el.promptModal));
  el.promptBackdrop.addEventListener("click", () => closeDialog(el.promptModal));
  el.guideClose.addEventListener("click", () => closeDialog(el.guideModal));
  el.guideBackdrop.addEventListener("click", () => closeDialog(el.guideModal));
  el.libraryButton.addEventListener("click", () => openLibrary());
  el.libraryClose.addEventListener("click", () => closeDialog(el.libraryModal));
  el.libraryBackdrop.addEventListener("click", () => closeDialog(el.libraryModal));
  el.librarySearch.addEventListener("input", renderLibrary);
  document.getElementById("portrait-library").addEventListener("click", () => openLibrary());
  document.getElementById("portrait-toc").addEventListener("click", openToc);

  document.addEventListener("keydown", (event) => {
    const typing =
      event.target instanceof HTMLElement &&
      (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA");

    if (event.key === "Escape") {
      if (anyDialogOpen()) {
        event.preventDefault();
        closeAllDialogs();
        el.stage.focus();
      }
      return;
    }
    if (typing) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    switch (event.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        event.preventDefault();
        move(1);
        break;
      case "ArrowLeft":
      case "PageUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        event.preventDefault();
        goTo(0);
        break;
      case "End":
        event.preventDefault();
        goTo(slides.length - 1);
        break;
      case "+":
      case "=":
        event.preventDefault();
        setFontStep(fontStep + 1, true);
        break;
      case "-":
      case "_":
        event.preventDefault();
        setFontStep(fontStep - 1, true);
        break;
      case "0":
        event.preventDefault();
        setFontStep(1, true);
        break;
      default:
        break;
    }

    const key = event.key.toLowerCase();
    if (key === "o") {
      event.preventDefault();
      el.toc.hidden ? openToc() : closeDialog(el.toc);
    } else if (key === "p") {
      event.preventDefault();
      openPrompt(currentTrackId());
    } else if (key === "g") {
      event.preventDefault();
      openGuide(currentTrackId());
    } else if (key === "l") {
      event.preventDefault();
      openLibrary();
    } else if (key === "f") {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  /* --- touch: ปัดเปลี่ยนสไลด์ --- */
  let touchX = null;
  let touchY = null;
  el.stage.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    },
    { passive: true }
  );
  el.stage.addEventListener(
    "touchend",
    (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) move(dx < 0 ? 1 : -1);
      touchX = null;
      touchY = null;
    },
    { passive: true }
  );

  /* ------------------------------------------------------------------ boot */

  try {
    const saved = window.localStorage.getItem(FONT_KEY);
    if (saved != null) fontStep = Math.max(0, Math.min(FONT_STEPS.length - 1, Number(saved)));
  } catch {
    /* storage ปิดอยู่ — ใช้ค่าเริ่มต้น */
  }
  applyFontScale();

  const initial = window.location.hash.replace("#", "");
  if (initial) {
    const found = slides.findIndex((s) => s.id === initial);
    if (found >= 0) index = found;
  }
  render();
  el.stage.focus();
})();
