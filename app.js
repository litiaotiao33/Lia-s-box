import { copy, works, mainWorks, experimentWorks } from "./i18n.js";

const main = document.querySelector("#main");
const langButtons = document.querySelectorAll("[data-lang]");
const navLinks = document.querySelectorAll(".nav-links a");
const brand = document.querySelector(".brand");

const state = {
  lang: localStorage.getItem("lia-lang") || "zh",
  filter: "all",
  lastRoute: null,
  /** Scroll Y to restore when leaving dashboard back to the page that opened it. */
  returnScroll: null,
  returnRoute: null,
};

function t() {
  return copy[state.lang];
}

function loc(work) {
  return work[state.lang];
}

function setLang(lang) {
  state.lang = lang;
  localStorage.setItem("lia-lang", lang);
  document.documentElement.lang = lang === "zh" ? "zh" : lang === "it" ? "it" : "en";
  document.title = copy[lang].brand;
  if (brand) brand.textContent = copy[lang].brand;
  langButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.lang === lang));
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const [group, key] = el.dataset.i18n.split(".");
    el.textContent = copy[lang][group][key];
  });
  render();
}

function route() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);
  if (parts[0] === "dashboard") return { name: "dashboard" };
  if (parts[0] === "work" && parts[1]) return { name: "detail", id: parts[1] };
  if (parts[0] === "contact") return { name: "contact" };
  if (parts[0] === "work") return { name: "dashboard" };
  return { name: "home" };
}

function setNav() {
  const current = route();
  const activeKey =
    current.name === "dashboard" || current.name === "detail"
      ? "dashboard"
      : current.name === "contact"
        ? "contact"
        : "home";
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.nav === activeKey));
}

function coverUrl(work) {
  return work.cover || null;
}

function coverStyle(work) {
  if (work.cover) {
    return `background-image:url('${work.cover}')`;
  }
  return `background:linear-gradient(135deg, ${work.colors[0]}, ${work.colors[1]})`;
}

function projectCover(work, { compact = false } = {}) {
  const l = loc(work);
  return `
    <a class="cover-card ${compact ? "cover-card-compact" : ""}" href="#/work/${work.id}">
      <span class="cover-media" style="${coverStyle(work)}"></span>
      <span class="cover-caption">
        <span class="cover-year">${work.year}</span>
        <span class="cover-title">${l.title}</span>
        <span class="cover-type">${l.typeLabel}</span>
      </span>
    </a>`;
}

function homeView() {
  const c = t();
  return `
    <section class="page about-page">
      <div class="about-hero">
        <p class="eyebrow">${c.hero.kicker}</p>
        <h1>${c.hero.title.replace("\n", "<br />")}</h1>
        <p class="lede">${c.hero.lede}</p>
      </div>
      <figure class="about-photo">
        <img src="./assets/lia-at-work.jpg" alt="${c.hero.photoAlt}" />
      </figure>
      <div class="about-body">
        ${c.hero.bio.map((p) => `<p>${p}</p>`).join("")}
        <dl class="facts">
          ${c.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}
        </dl>
        <a class="text-link" href="#/dashboard">${c.galleryCta} →</a>
      </div>
      <div class="preview-stack">
        <p class="section-label">${c.galleryTitle}</p>
        ${mainWorks.map((w) => projectCover(w)).join("")}
        <p class="section-label">${c.collectionTitle}</p>
        ${experimentWorks.map((w) => projectCover(w, { compact: true })).join("")}
      </div>
    </section>
  `;
}

function dashboardView() {
  const c = t();
  const keys = ["all", "original", "concept", "experiment"];
  const filtered = state.filter === "all" ? works : works.filter((w) => w.type === state.filter);
  return `
    <section class="page dash-page">
      <header class="dash-head">
        <p class="eyebrow">${c.nav.dashboard}</p>
        <h1>${c.dashTitle}</h1>
        <p class="lede">${c.dashIntro}</p>
        <div class="filters">
          ${c.filters
            .map(
              (label, i) =>
                `<button type="button" class="filter ${state.filter === keys[i] ? "active" : ""}" data-filter="${keys[i]}">${label}</button>`
            )
            .join("")}
        </div>
        <div class="dash-stats">
          ${c.stats.map(([n, label]) => `<div><b>${n}</b><span>${label}</span></div>`).join("")}
        </div>
      </header>
      <div class="cover-stack">
        ${filtered.map((w) => projectCover(w)).join("") || `<p class="empty">${c.comingSoon}</p>`}
      </div>
    </section>
  `;
}

function contactView() {
  const c = t();
  return `
    <section class="page contact-page">
      <p class="eyebrow">${c.nav.contact}</p>
      <h1>${c.contactTitle}</h1>
      <p class="lede">${c.contactBody}</p>
      <ul class="contact-list">
        <li><span>Email</span><a href="mailto:${c.contactMail}">${c.contactMail}</a></li>
        <li><span>Instagram</span><a href="https://instagram.com/litiaotiao33" target="_blank" rel="noreferrer">${c.contactIns}</a></li>
        <li><span>WhatsApp</span><a href="https://wa.me/393936614947" target="_blank" rel="noreferrer">${c.contactWhats}</a></li>
        <li><span>Base</span><em>${c.contactLoc}</em></li>
      </ul>
    </section>
  `;
}

function imgAlt(item) {
  if (!item.alt) return item.caption?.[state.lang] || "";
  return typeof item.alt === "string" ? item.alt : item.alt[state.lang];
}

function slideClassFor(mode) {
  if (mode === "half") return "h-slide h-slide-half";
  if (mode === "sketch") return "h-slide h-slide-sketch";
  return "h-slide h-slide-full";
}

function stripSection(strip) {
  const c = t();
  const label = c[strip.labelKey] || strip.labelKey;
  const slideClass = slideClassFor(strip.mode);
  return `
    <section class="strip-block">
      <div class="strip-bar">
        <h2>${label}</h2>
        <div class="strip-nav">
          <button type="button" data-strip-prev="${strip.id}" aria-label="${c.prev}">‹</button>
          <button type="button" data-strip-next="${strip.id}" aria-label="${c.next}">›</button>
        </div>
      </div>
      <div class="h-scroll" data-strip="${strip.id}">
        ${strip.images
          .map((img) => {
            const caption = img.caption?.[state.lang] || "";
            return `
          <figure class="${slideClass}">
            <img src="${img.src}" alt="${imgAlt(img)}" loading="lazy" />
            ${caption ? `<figcaption>${caption}</figcaption>` : ""}
          </figure>`;
          })
          .join("")}
      </div>
    </section>
  `;
}

function bindStripNav() {
  const scrollBySlide = (stripId, dir) => {
    const scroller = main.querySelector(`.h-scroll[data-strip="${stripId}"]`);
    if (!scroller) return;
    const slide = scroller.querySelector(".h-slide");
    const amount = slide ? slide.getBoundingClientRect().width : scroller.clientWidth;
    scroller.scrollBy({ left: dir * amount, behavior: "smooth" });
  };
  main.querySelectorAll("[data-strip-prev]").forEach((btn) => {
    btn.addEventListener("click", () => scrollBySlide(btn.dataset.stripPrev, -1));
  });
  main.querySelectorAll("[data-strip-next]").forEach((btn) => {
    btn.addEventListener("click", () => scrollBySlide(btn.dataset.stripNext, 1));
  });
}

function douhuaDetail(work) {
  const c = t();
  const l = loc(work);
  const g = work.gallery;
  return `
    <article class="project">
      <figure class="project-bleed">
        <img src="${g.lead.src}" alt="${imgAlt(g.lead)}" />
      </figure>
      <section class="project-intro">
        <a class="back" href="#/dashboard">← ${c.backDash}</a>
        <p class="eyebrow">${l.typeLabel}</p>
        <h1>${l.title}</h1>
        <p class="project-meta">${work.year} · ${l.role}</p>
        <div class="project-grid">
          <div>
            <h2>${c.credits}</h2>
            <dl class="credit-list">
              ${l.credits.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}
            </dl>
          </div>
          <div>
            <h2>${c.story}</h2>
            <p>${l.story}</p>
          </div>
        </div>
        <div class="text-block">
          <h2>${c.design}</h2>
          <p>${l.design}</p>
        </div>
      </section>
      <section class="project-stills">
        <h2>${c.stills}</h2>
        <div class="stills-grid">
          ${[...(g.featured || []), ...(g.stills || [])]
            .map(
              (img) => `
            <figure>
              <img src="${img.src}" alt="${imgAlt(img)}" loading="lazy" />
            </figure>`
            )
            .join("")}
        </div>
      </section>
      <section class="project-stills">
        <h2>${c.costume}</h2>
        <figure class="costume">
          <img src="${g.costume.src}" alt="${imgAlt(g.costume)}" loading="lazy" />
        </figure>
      </section>
    </article>
  `;
}

function stripDetail(work) {
  const c = t();
  const l = loc(work);
  const designParas = Array.isArray(l.design) ? l.design : l.design ? [l.design] : [];
  const designHeading = l.designHeading || c.design;
  const videoBlock = work.video
    ? `
        <div class="text-block">
          <h2>${c.modelVideo}</h2>
          <video controls playsinline preload="metadata" src="${work.video}"></video>
        </div>`
    : "";
  const authorBlock = l.author
    ? `<div class="text-block"><h2>${c.author}</h2><p class="plain">${l.author}</p></div>`
    : "";
  const designerBlock = l.designer
    ? `<div class="text-block"><h2>${c.designer}</h2><p class="plain">${l.designer}</p></div>`
    : "";
  const creditsBlock = l.credits
    ? `
        <div class="text-block">
          <h2>${c.credits}</h2>
          <dl class="credit-list">
            ${l.credits.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}
          </dl>
        </div>`
    : "";
  const storyBlock = l.story
    ? `<div class="text-block"><h2>${l.storyHeading || c.story}</h2><p>${l.story}</p></div>`
    : "";
  const designBlock = designParas.length
    ? `<div class="text-block"><h2>${designHeading}</h2>${designParas.map((p) => `<p>${p}</p>`).join("")}</div>`
    : "";

  return `
    <article class="project">
      ${
        coverUrl(work)
          ? `<figure class="project-bleed"><img src="${coverUrl(work)}" alt="${l.title}" /></figure>`
          : ""
      }
      <section class="project-intro">
        <a class="back" href="#/dashboard">← ${c.backDash}</a>
        <p class="eyebrow">${l.typeLabel}</p>
        <h1>${l.title}</h1>
        <p class="project-meta">${work.year} · ${l.role}</p>
        ${videoBlock}
        ${authorBlock}
        ${designerBlock}
        ${creditsBlock}
        ${storyBlock}
        ${designBlock}
      </section>
      ${(work.strips || []).map(stripSection).join("")}
    </article>
  `;
}

function simpleDetail(work) {
  const c = t();
  const l = loc(work);
  return `
    <section class="page">
      <a class="back" href="#/dashboard">← ${c.backDash}</a>
      <p class="eyebrow">${l.typeLabel}</p>
      <h1>${l.title}</h1>
      <p class="project-meta">${work.year} · ${l.role}</p>
      <p class="lede">${l.body || c.comingSoon}</p>
    </section>
  `;
}

function detailView(id) {
  const work = works.find((item) => item.id === id);
  const c = t();
  if (!work) {
    return `<section class="page empty"><p>Not found.</p><a class="text-link" href="#/dashboard">${c.backDash}</a></section>`;
  }
  if (work.strips) return stripDetail(work);
  if (work.gallery) return douhuaDetail(work);
  return simpleDetail(work);
}

function render({ preserveScroll = false } = {}) {
  const current = route();
  const previous = state.lastRoute;
  // Capture scroll before swapping DOM — still the outgoing page's position.
  const outgoingY = window.scrollY || window.pageYOffset || 0;

  if (
    current.name === "dashboard" &&
    previous &&
    previous.name !== "dashboard" &&
    previous.name !== "detail"
  ) {
    state.returnScroll = outgoingY;
    state.returnRoute = previous.name;
  }

  const shouldRestore =
    !preserveScroll &&
    previous?.name === "dashboard" &&
    (current.name === "home" || current.name === "contact") &&
    state.returnRoute === current.name &&
    typeof state.returnScroll === "number";

  const restoreY = shouldRestore ? state.returnScroll : null;

  setNav();
  if (current.name === "dashboard") main.innerHTML = dashboardView();
  else if (current.name === "detail") main.innerHTML = detailView(current.id);
  else if (current.name === "contact") main.innerHTML = contactView();
  else main.innerHTML = homeView();

  if (restoreY != null) {
    // Keep the entry point on the previous page (e.g. midway down 简介).
    requestAnimationFrame(() => {
      window.scrollTo({ top: restoreY, behavior: "auto" });
    });
  } else if (!preserveScroll) {
    window.scrollTo({ top: 0, behavior: previous ? "smooth" : "auto" });
  }

  state.lastRoute = { name: current.name, id: current.id || null };

  main.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      render({ preserveScroll: true });
    });
  });
  bindStripNav();
}

function ensureAboutEntry() {
  const hash = location.hash;
  if (!hash || hash === "#" || hash === "#/") {
    if (hash !== "#/") history.replaceState(null, "", `${location.pathname}${location.search}#/`);
  }
}

langButtons.forEach((btn) => btn.addEventListener("click", () => setLang(btn.dataset.lang)));
window.addEventListener("hashchange", () => render());
ensureAboutEntry();
setLang(state.lang);
