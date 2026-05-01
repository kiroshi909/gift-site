const defaults = {
  heroTitle: "Наша маленькая история любви",
  heroText: "Здесь будут красивые фото, нежное письмо и наши самые теплые моменты.",
  text: {
    brand: "Pink Love",
    navLetter: "Письмо",
    navGallery: "Фото",
    navMoments: "Моменты",
    navReady: "Готовый сайт",
    heroKicker: "for the sweetest person",
    primaryButton: "Открыть письмо",
    secondaryButton: "Посмотреть фото",
    mascotCaption: "made with love",
    letterKicker: "love letter",
    letterTitle: "Письмо для неё",
    galleryKicker: "photo memories",
    galleryTitle: "Красивые фото",
    uploadPhotoButton: "Загрузить фото",
    clearPhotosButton: "Очистить фото",
    momentsKicker: "best moments",
    momentsTitle: "Наши лучшие моменты",
    momentTitlePlaceholder: "Название момента",
    momentDatePlaceholder: "Дата или место",
    momentPhotoButton: "Фото момента",
    addMomentButton: "Добавить",
    editorFooter: "Это твоя страница редактирования. Для отправки используй “Готовый сайт” или скачай готовую страницу.",
    viewFooter: "Для самой любимой."
  },
  letter:
    "Моя любимая,\n\nя сделал эту страницу, чтобы собрать здесь то, что невозможно сказать одним сообщением. Спасибо тебе за нежность, смех, поддержку и за каждый момент, который рядом с тобой становится особенным.\n\nПусть это будет наше маленькое место, где живут фото, воспоминания и мои самые теплые слова для тебя.",
  photos: [],
  decorations: [
    {
      id: "asset-hello-kitty",
      src: "./assets/decor/hello-kitty.webp",
      x: 13,
      y: 650,
      size: 230,
      rotate: -8
    },
    {
      id: "asset-kuromi-head",
      src: "./assets/decor/kuromi-head.jpeg",
      x: 88,
      y: 980,
      size: 160,
      rotate: -10
    },
    {
      id: "asset-yellow-plush",
      src: "./assets/decor/yellow-plush.jpg",
      x: 10,
      y: 1320,
      size: 170,
      rotate: 8
    },
    {
      id: "asset-enot",
      src: "./assets/decor/enot.jpg",
      x: 88,
      y: 1620,
      size: 170,
      rotate: 9
    }
  ],
  assetDecorSeeded: false,
  moments: [
    { title: "Наш первый особенный день", date: "самое теплое воспоминание" },
    { title: "Момент, когда мы смеялись без причины", date: "навсегда в сердце" },
    { title: "День, который хочется повторить", date: "только мы вдвоем" }
  ]
};

const storageKey = "pink-love-gift-site";

let state = loadState();
const mode = document.body.dataset.mode || "editor";
const isEditor = mode === "editor";
const isServerMode = location.protocol === "http:" || location.protocol === "https:";
let needsInitialSave = false;

state.decorations = state.decorations.filter((decor) => {
  const keep = decor.id !== "asset-kuromi-checker";
  if (!keep) needsInitialSave = true;
  return keep;
});

if (!state.moments.some((moment) => moment.id === "first-photo-2025-09-15")) {
  state.moments.unshift({
    id: "first-photo-2025-09-15",
    title: "наше первое фото",
    date: "15 сентября 2025 года",
    photo: "./assets/moments/first-photo.jpg"
  });
  needsInitialSave = true;
}

const fields = {
  heroTitleInput: document.querySelector("#heroTitleInput"),
  heroTextInput: document.querySelector("#heroTextInput"),
  letterInput: document.querySelector("#letterInput"),
  letterPreview: document.querySelector("#letterPreview"),
  photoInput: document.querySelector("#photoInput"),
  clearPhotos: document.querySelector("#clearPhotos"),
  decorInput: document.querySelector("#decorInput"),
  deleteDecor: document.querySelector("#deleteDecor"),
  clearDecor: document.querySelector("#clearDecor"),
  decorSize: document.querySelector("#decorSize"),
  backgroundDecor: document.querySelector("#backgroundDecor"),
  downloadSite: document.querySelector("#downloadSite"),
  textControls: document.querySelector("#textControls"),
  galleryGrid: document.querySelector("#galleryGrid"),
  momentForm: document.querySelector("#momentForm"),
  momentTitle: document.querySelector("#momentTitle"),
  momentDate: document.querySelector("#momentDate"),
  momentPhoto: document.querySelector("#momentPhoto"),
  timeline: document.querySelector("#timeline")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey)) || {};
    return mergeState(saved);
  } catch {
    return { ...defaults, text: { ...defaults.text } };
  }
}

function saveState() {
  if (isServerMode) {
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    }).catch((error) => console.error("Failed to save state on server:", error));
    return true;
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Failed to save gift site state:", error);
    alert("Фото слишком большое для сохранения в браузере. Я сжал новые фото, но старых данных может быть слишком много. Попробуй очистить лишние фото или фоновые картинки.");
    return false;
  }
}

if (needsInitialSave && !isServerMode) saveState();

async function hydrateServerState() {
  if (!isServerMode) return;

  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) return;

    const saved = await response.json();
    if (Object.keys(saved).length) {
      state = mergeState(saved);
    }
    ensureInitialContent();
    renderAll();
    saveState();
  } catch (error) {
    console.error("Failed to load server state:", error);
  }
}

function mergeState(saved = {}) {
  const shouldSeedDecor = !saved.assetDecorSeeded;
  return {
    ...defaults,
    ...saved,
    text: { ...defaults.text, ...(saved.text || {}) },
    moments: saved.moments || defaults.moments,
    photos: saved.photos || defaults.photos,
    decorations: shouldSeedDecor ? defaults.decorations : saved.decorations || [],
    assetDecorSeeded: true
  };
}

function ensureInitialContent() {
  state.decorations = state.decorations.filter((decor) => decor.id !== "asset-kuromi-checker");

  if (!state.moments.some((moment) => moment.id === "first-photo-2025-09-15")) {
    state.moments.unshift({
      id: "first-photo-2025-09-15",
      title: "наше первое фото",
      date: "15 сентября 2025 года",
      photo: "./assets/moments/first-photo.jpg"
    });
  }
}

function renderAll() {
  syncText();
  renderTextControls();
  renderGallery();
  renderMoments();
  renderDecorations();
}

function syncText() {
  document.querySelectorAll("[data-field='heroTitle']").forEach((node) => {
    node.textContent = state.heroTitle;
  });
  document.querySelectorAll("[data-field='heroText']").forEach((node) => {
    node.textContent = state.heroText;
  });
  if (fields.heroTitleInput) fields.heroTitleInput.value = state.heroTitle;
  if (fields.heroTextInput) fields.heroTextInput.value = state.heroText;
  if (fields.letterInput) fields.letterInput.value = state.letter;
  if (fields.letterPreview) fields.letterPreview.textContent = state.letter;

  document.querySelectorAll("[data-text]").forEach((node) => {
    const key = node.dataset.text;
    node.textContent = state.text[key] ?? defaults.text[key] ?? "";
  });

  document.querySelectorAll("[data-placeholder]").forEach((node) => {
    const key = node.dataset.placeholder;
    node.placeholder = state.text[key] ?? defaults.text[key] ?? "";
  });
}

function renderTextControls() {
  if (!fields.textControls) return;

  const labels = {
    brand: "Бренд в шапке",
    navLetter: "Меню: письмо",
    navGallery: "Меню: фото",
    navMoments: "Меню: моменты",
    navReady: "Меню: готовый сайт",
    heroKicker: "Маленькая надпись сверху",
    primaryButton: "Главная кнопка",
    secondaryButton: "Вторая кнопка",
    mascotCaption: "Подпись под котиком",
    letterKicker: "Метка секции письма",
    letterTitle: "Заголовок письма",
    galleryKicker: "Метка секции фото",
    galleryTitle: "Заголовок фото",
    uploadPhotoButton: "Кнопка загрузки фото",
    clearPhotosButton: "Кнопка очистки фото",
    momentsKicker: "Метка секции моментов",
    momentsTitle: "Заголовок моментов",
    momentTitlePlaceholder: "Подсказка названия момента",
    momentDatePlaceholder: "Подсказка даты момента",
    momentPhotoButton: "Кнопка фото момента",
    addMomentButton: "Кнопка добавления момента",
    editorFooter: "Футер редактора",
    viewFooter: "Футер готового сайта"
  };

  fields.textControls.innerHTML = "";
  Object.keys(defaults.text).forEach((key) => {
    const label = document.createElement("label");
    label.textContent = labels[key] || key;

    const input = document.createElement("input");
    input.type = "text";
    input.value = state.text[key] ?? "";
    input.addEventListener("input", () => {
      state.text[key] = input.value;
      saveState();
      syncText();
    });

    label.append(input);
    fields.textControls.append(label);
  });
}

function renderGallery() {
  fields.galleryGrid.innerHTML = "";

  if (!state.photos.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = isEditor ? "Загрузи сюда ваши красивые фото" : "Скоро здесь появятся наши фото";
    fields.galleryGrid.append(empty);
    return;
  }

  state.photos.forEach((photo) => {
    const card = document.createElement("figure");
    card.className = "photo-card";

    const img = document.createElement("img");
    img.src = photo;
    img.alt = "Наше фото";

    card.append(img);
    fields.galleryGrid.append(card);
  });
}

function renderMoments() {
  fields.timeline.innerHTML = "";

  state.moments.forEach((moment, index) => {
    const photos = getMomentPhotos(moment);
    const card = document.createElement("article");
    card.className = "moment-card";

    const dot = document.createElement("div");
    dot.className = "moment-dot";
    dot.textContent = index + 1;

    const body = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = moment.title;
    const date = document.createElement("p");
    date.textContent = moment.date || "наш момент";
    body.append(title, date);

    card.append(dot, body);

    if (isEditor) {
      const remove = document.createElement("button");
      remove.className = "delete-moment";
      remove.type = "button";
      remove.setAttribute("aria-label", `Удалить момент ${moment.title}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        state.moments.splice(index, 1);
        saveState();
        renderMoments();
      });
      card.append(remove);
    }

    if (photos.length) {
      const grid = document.createElement("div");
      grid.className = `moment-photo-grid count-${Math.min(photos.length, 4)}`;

      photos.forEach((source, photoIndex) => {
        const photo = document.createElement("img");
        photo.className = "moment-photo";
        photo.src = source;
        photo.alt = `${moment.title} ${photoIndex + 1}`;
        grid.append(photo);
      });

      card.append(grid);
    }

    fields.timeline.append(card);
  });
}

function getMomentPhotos(moment) {
  if (Array.isArray(moment.photos)) return moment.photos.filter(Boolean);
  return moment.photo ? [moment.photo] : [];
}

let selectedDecorId = null;

function renderDecorations() {
  if (!fields.backgroundDecor) return;

  fields.backgroundDecor.innerHTML = "";
  state.decorations.forEach((decor) => {
    const image = document.createElement("img");
    image.className = `decor-item${decor.id === selectedDecorId ? " is-selected" : ""}`;
    image.dataset.decorId = decor.id;
    image.src = decor.src;
    image.alt = "";
    image.draggable = false;
    image.style.left = `${decor.x}%`;
    image.style.top = `${decor.y}px`;
    image.style.setProperty("--decor-size", `${decor.size}px`);
    image.style.setProperty("--decor-rotate", `${decor.rotate || 0}deg`);

    if (isEditor) {
      image.addEventListener("pointerdown", (event) => startDecorDrag(event, decor.id));
      image.addEventListener("click", () => selectDecor(decor.id));
    }

    fields.backgroundDecor.append(image);
  });
}

function selectDecor(id) {
  selectedDecorId = id;
  const decor = state.decorations.find((item) => item.id === id);
  if (fields.decorSize && decor) fields.decorSize.value = decor.size;
  updateDecorSelection();
}

function updateDecorSelection() {
  if (!fields.backgroundDecor) return;

  fields.backgroundDecor.querySelectorAll(".decor-item").forEach((image) => {
    image.classList.toggle("is-selected", image.dataset.decorId === selectedDecorId);
  });
}

function startDecorDrag(event, id) {
  event.preventDefault();
  selectDecor(id);
  const decor = state.decorations.find((item) => item.id === id);
  if (!decor) return;
  const image = event.currentTarget;
  image.classList.add("is-dragging");
  image.setPointerCapture?.(event.pointerId);

  const move = (moveEvent) => {
    decor.x = Math.max(0, Math.min(100, (moveEvent.clientX / window.innerWidth) * 100));
    decor.y = Math.max(0, moveEvent.pageY);
    image.style.left = `${decor.x}%`;
    image.style.top = `${decor.y}px`;
  };

  const stop = () => {
    image.classList.remove("is-dragging");
    image.releasePointerCapture?.(event.pointerId);
    saveState();
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
}

function bindEvents() {
  if (!isEditor) return;

  fields.heroTitleInput.addEventListener("input", (event) => {
    state.heroTitle = event.target.value || defaults.heroTitle;
    saveState();
    syncText();
  });

  fields.heroTextInput.addEventListener("input", (event) => {
    state.heroText = event.target.value || defaults.heroText;
    saveState();
    syncText();
  });

  fields.letterInput.addEventListener("input", (event) => {
    state.letter = event.target.value;
    saveState();
    fields.letterPreview.textContent = state.letter;
  });

  fields.photoInput.addEventListener("change", async (event) => {
    try {
      const files = Array.from(event.target.files || []);
      const images = await Promise.all(files.map((file) => storeImage(file, { maxSize: 1600, quality: 0.82 }, "photos")));
      state.photos = [...state.photos, ...images].slice(0, 12);
      if (saveState()) renderGallery();
    } catch (error) {
      alert(error.message || "Не получилось загрузить фото.");
    } finally {
      fields.photoInput.value = "";
    }
  });

  fields.clearPhotos.addEventListener("click", () => {
    state.photos = [];
    saveState();
    renderGallery();
  });

  fields.decorInput.addEventListener("change", async (event) => {
    try {
      const files = Array.from(event.target.files || []);
      const images = await Promise.all(files.map((file) => storeImage(file, { maxSize: 1200, quality: 0.78 }, "decor")));
      const startY = Math.max(180, window.scrollY + window.innerHeight * 0.35);
      const added = images.map((src, index) => ({
        id: `${Date.now()}-${index}`,
        src,
        x: index % 2 === 0 ? 6 : 94,
        y: startY + Math.floor(index / 2) * 120,
        size: 180,
        rotate: index % 2 ? 8 : -8
      }));
      state.decorations = [...state.decorations, ...added];
      const lastDecor = added[added.length - 1];
      selectedDecorId = lastDecor?.id || selectedDecorId;
      if (saveState()) renderDecorations();
      if (fields.decorSize && lastDecor) fields.decorSize.value = lastDecor.size;
    } catch (error) {
      alert(error.message || "Не получилось загрузить фоновую картинку.");
    } finally {
      fields.decorInput.value = "";
    }
  });

  fields.deleteDecor.addEventListener("click", () => {
    if (!selectedDecorId) return;
    state.decorations = state.decorations.filter((decor) => decor.id !== selectedDecorId);
    selectedDecorId = null;
    saveState();
    renderDecorations();
  });

  fields.clearDecor.addEventListener("click", () => {
    state.decorations = [];
    selectedDecorId = null;
    saveState();
    renderDecorations();
  });

  fields.decorSize.addEventListener("input", () => {
    const decor = state.decorations.find((item) => item.id === selectedDecorId);
    if (!decor) return;
    decor.size = Number(fields.decorSize.value);
    saveState();
    renderDecorations();
  });

  fields.momentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = fields.momentTitle.value.trim();
    const date = fields.momentDate.value.trim();
    const photoFiles = Array.from(fields.momentPhoto.files || []);

    if (!title) return;

    try {
      const photos = await Promise.all(
        photoFiles.slice(0, 6).map((file) => storeImage(file, { maxSize: 1400, quality: 0.82 }, "moments"))
      );
      state.moments.push({ title, date, photos });

      if (saveState()) {
        renderMoments();
        fields.momentForm.reset();
      } else {
        state.moments.pop();
      }
    } catch (error) {
      alert(error.message || "Не получилось загрузить фото момента.");
    }
  });

  fields.downloadSite.addEventListener("click", downloadStandaloneSite);
}

async function prepareImageFile(file) {
  if (!isHeicFile(file)) return file;

  if (window.heic2any) {
    try {
      const converted = await window.heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9
      });
      return Array.isArray(converted) ? converted[0] : converted;
    } catch (error) {
      console.warn("HEIC conversion failed, trying native decode:", error);
    }
  }

  return file;
}

function isHeicFile(file) {
  const name = file.name.toLowerCase();
  return file.type === "image/heic" || file.type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif");
}

async function readImage(file, options = {}) {
  const { maxSize = 1600, quality = 0.82 } = options;
  const imageFile = await prepareImageFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("load", () => {
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      });
      image.addEventListener("error", () => {
        if (isHeicFile(file)) {
          reject(new Error("Не получилось преобразовать HEIC в JPG. Проверь интернет для загрузки конвертера или попробуй другой файл."));
          return;
        }
        resolve(reader.result);
      });
      image.src = reader.result;
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(imageFile);
  });
}

async function storeImage(file, options = {}, folder = "images") {
  const dataUrl = await readImage(file, options);

  if (!isServerMode) return dataUrl;

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, folder })
  });

  if (!response.ok) {
    throw new Error("Не получилось сохранить фото на сервере.");
  }

  const result = await response.json();
  return result.path;
}

async function downloadStandaloneSite() {
  const html = await buildStandaloneHtml(state);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pink-love-gift.html";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function imageToDataUrl(src) {
  if (src.startsWith("data:")) return src;

  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(src);
      }
    });
    image.addEventListener("error", () => resolve(src));
    image.src = src;
  });
}

async function buildStandaloneHtml(data) {
  const photos = data.photos
    .map((photo) => `<figure class="photo-card"><img src="${photo}" alt="Наше фото"></figure>`)
    .join("");
  const standaloneMoments = await Promise.all(
    data.moments.map(async (moment) => ({
      ...moment,
      photos: await Promise.all(getMomentPhotos(moment).map((photo) => imageToDataUrl(photo)))
    }))
  );
  const moments = standaloneMoments
    .map(
      (moment, index) => `
        <article class="moment-card">
          <div class="moment-dot">${index + 1}</div>
          <div>
            <h3>${escapeHtml(moment.title)}</h3>
            <p>${escapeHtml(moment.date || "наш момент")}</p>
          </div>
          ${
            moment.photos?.length
              ? `<div class="moment-photo-grid count-${Math.min(moment.photos.length, 4)}">${moment.photos
                  .map(
                    (photo, photoIndex) =>
                      `<img class="moment-photo" src="${photo}" alt="${escapeHtml(moment.title)} ${photoIndex + 1}">`
                  )
                  .join("")}</div>`
              : ""
          }
        </article>`
    )
    .join("");
  const standaloneDecorations = await Promise.all(
    data.decorations.map(async (decor) => ({ ...decor, src: await imageToDataUrl(decor.src) }))
  );
  const decorations = standaloneDecorations
    .map(
      (decor) =>
        `<img class="decor-item" src="${decor.src}" alt="" style="left:${decor.x}%;top:${decor.y}px;--decor-size:${decor.size}px;--decor-rotate:${decor.rotate || 0}deg">`
    )
    .join("");
  const text = { ...defaults.text, ...(data.text || {}) };

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.heroTitle)}</title>
<style>${standaloneCss()}</style>
</head>
<body>
<div class="sparkles" aria-hidden="true"></div>
<div class="background-decor" aria-hidden="true">${decorations}</div>
<header class="topbar">
  <a class="brand" href="#home"><span class="brand-mark">♡</span><span>${escapeHtml(text.brand)}</span></a>
  <nav class="nav"><a href="#letter">${escapeHtml(text.navLetter)}</a><a href="#gallery">${escapeHtml(text.navGallery)}</a><a href="#moments">${escapeHtml(text.navMoments)}</a></nav>
</header>
<main>
  <section class="hero" id="home">
    <div class="hero-copy">
      <p class="eyebrow">${escapeHtml(text.heroKicker)}</p>
      <h1>${escapeHtml(data.heroTitle)}</h1>
      <p class="hero-text">${escapeHtml(data.heroText)}</p>
      <div class="hero-actions"><a class="button primary" href="#letter">${escapeHtml(text.primaryButton)}</a><a class="button ghost" href="#gallery">${escapeHtml(text.secondaryButton)}</a></div>
    </div>
    <div class="hero-visual">
      <div class="mascot-card"><img class="hero-photo" src="./assets/decor/hero-photo.jpg" alt="Наше фото"><p>${escapeHtml(text.mascotCaption)}</p></div>
    </div>
  </section>
  <section id="letter"><div class="section-heading"><p class="section-kicker">${escapeHtml(text.letterKicker)}</p><h2>${escapeHtml(text.letterTitle)}</h2></div><div class="letter-card view-letter-card"><article class="letter-preview"><p>${escapeHtml(data.letter)}</p></article></div></section>
  <section id="gallery"><div class="section-heading"><p class="section-kicker">${escapeHtml(text.galleryKicker)}</p><h2>${escapeHtml(text.galleryTitle)}</h2></div><div class="gallery-grid">${photos || '<div class="empty-state">Скоро здесь появятся наши фото</div>'}</div></section>
  <section id="moments"><div class="section-heading"><p class="section-kicker">${escapeHtml(text.momentsKicker)}</p><h2>${escapeHtml(text.momentsTitle)}</h2></div><div class="timeline">${moments}</div></section>
</main>
<footer class="footer"><p>${escapeHtml(text.viewFooter)}</p></footer>
</body>
</html>`;
}

function standaloneCss() {
  return `
.moment-photo-grid{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.moment-photo-grid.count-1{grid-template-columns:1fr}
.moment-photo{grid-column:1/-1;width:100%;max-height:520px;display:block;border-radius:18px;object-fit:contain;background:rgba(255,228,240,.36)}
:root{--pink-50:#fff5fa;--pink-100:#ffe4f0;--pink-200:#ffc7dd;--pink-400:#ff76aa;--pink-500:#f44791;--pink-700:#bd236a;--cream:#fffaf5;--ink:#41243a;--muted:#8b647b;--line:rgba(244,71,145,.18);--shadow:0 24px 70px rgba(244,71,145,.2)}*{box-sizing:border-box}html{scroll-behavior:smooth}body{position:relative;margin:0;min-height:100vh;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 15% 5%,rgba(255,199,221,.95),transparent 28rem),radial-gradient(circle at 90% 20%,rgba(255,228,240,.95),transparent 22rem),linear-gradient(180deg,var(--pink-50),#fff 45%,var(--cream))}a{color:inherit;text-decoration:none}main,.topbar,.footer{position:relative;z-index:1;width:min(1120px,calc(100% - 32px));margin:0 auto}.sparkles{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:radial-gradient(circle,rgba(244,71,145,.25) 0 2px,transparent 3px),radial-gradient(circle,rgba(255,118,170,.22) 0 1px,transparent 2px);background-position:0 0,38px 52px;background-size:120px 120px,90px 90px;mask-image:linear-gradient(#000,transparent 78%)}.background-decor{position:absolute;inset:0;z-index:0;min-height:100%;overflow:hidden;pointer-events:none}.decor-item{position:absolute;width:var(--decor-size,180px);height:auto;opacity:.9;filter:drop-shadow(0 16px 28px rgba(244,71,145,.18));transform:translate(-50%,-50%) rotate(var(--decor-rotate,0deg));user-select:none}.topbar{position:sticky;top:14px;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:14px;padding:12px 14px;border:1px solid rgba(255,255,255,.75);border-radius:24px;background:rgba(255,255,255,.72);box-shadow:0 16px 45px rgba(244,71,145,.12);backdrop-filter:blur(18px)}.brand,.nav{display:flex;align-items:center}.brand{gap:10px;font-weight:900}.brand-mark{display:grid;width:34px;height:34px;place-items:center;border-radius:50%;color:#fff;background:var(--pink-500);box-shadow:0 8px 18px rgba(244,71,145,.28)}.nav{gap:6px}.nav a{padding:9px 12px;border-radius:999px;color:var(--muted);font-size:14px;font-weight:800}.hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);gap:44px;align-items:center;min-height:calc(100vh - 96px);padding:76px 0 54px}.eyebrow,.section-kicker{margin:0 0 12px;color:var(--pink-700);font-size:13px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}h1,h2,h3,p{margin-top:0}h1{max-width:780px;margin-bottom:20px;font-family:Georgia,"Times New Roman",serif;font-size:clamp(48px,8vw,92px);line-height:.95}h2{font-family:Georgia,"Times New Roman",serif;font-size:clamp(32px,4vw,54px)}.hero-text{max-width:620px;color:var(--muted);font-size:20px;line-height:1.7}.hero-actions{display:flex;flex-wrap:wrap;gap:12px}.button{display:inline-flex;min-height:48px;align-items:center;justify-content:center;border:0;border-radius:999px;padding:0 22px;font-weight:900}.primary{color:#fff;background:linear-gradient(135deg,var(--pink-500),#ff8ab8);box-shadow:0 16px 34px rgba(244,71,145,.3)}.ghost{color:var(--pink-700);background:#fff;border:1px solid var(--line)}.hero-visual{display:grid;place-items:center}.mascot-card{position:relative;width:min(420px,100%);aspect-ratio:1;display:grid;place-items:center;border:1px solid rgba(255,255,255,.84);border-radius:44px;background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(255,228,240,.75)),repeating-linear-gradient(45deg,transparent 0 18px,rgba(255,118,170,.1) 18px 19px);box-shadow:var(--shadow);overflow:hidden}.hero-photo{width:calc(100% - 52px);height:calc(100% - 92px);margin-bottom:44px;border:8px solid #fff;border-radius:34px;object-fit:cover;box-shadow:0 18px 44px rgba(65,36,58,.18)}.mascot-card:before,.mascot-card:after{content:"♡";position:absolute;color:rgba(244,71,145,.18);font-size:96px;font-weight:900}.mascot-card:before{top:24px;right:26px}.mascot-card:after{left:30px;bottom:10px}.mascot-card p{position:absolute;bottom:32px;margin:0;color:var(--pink-700);font-family:Georgia,"Times New Roman",serif;font-size:28px;font-weight:700}section{padding:44px 0}.letter-card,.gallery-grid,.timeline{border:1px solid rgba(244,71,145,.14);border-radius:28px;background:rgba(255,255,255,.78);box-shadow:0 18px 55px rgba(244,71,145,.12)}.letter-card{padding:22px}.letter-preview{min-height:340px;padding:34px;border-radius:24px;background:linear-gradient(180deg,rgba(255,250,245,.94),rgba(255,228,240,.64)),linear-gradient(90deg,rgba(244,71,145,.08) 1px,transparent 1px);background-size:auto,32px 32px}.letter-preview p{margin:0;white-space:pre-wrap;color:#57324c;font-family:Georgia,"Times New Roman",serif;font-size:21px;line-height:1.8}.gallery-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:18px;min-height:220px}.photo-card{position:relative;min-height:260px;overflow:hidden;border-radius:22px;background:var(--pink-100);margin:0}.photo-card img{width:100%;height:100%;min-height:260px;display:block;object-fit:cover}.photo-card:after{content:"♡";position:absolute;right:14px;bottom:8px;color:rgba(255,255,255,.88);font-size:44px;text-shadow:0 4px 12px rgba(65,36,58,.28)}.empty-state{grid-column:1/-1;display:grid;min-height:220px;place-items:center;border:2px dashed rgba(244,71,145,.22);border-radius:22px;color:var(--muted);text-align:center;font-weight:800}.timeline{display:grid;gap:14px;padding:18px}.moment-card{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;padding:16px;border:1px solid rgba(244,71,145,.12);border-radius:20px;background:linear-gradient(135deg,#fff,var(--pink-50))}.moment-dot{display:grid;width:42px;height:42px;place-items:center;border-radius:50%;color:#fff;background:var(--pink-500);font-weight:900}.moment-card h3{margin:0 0 3px;font-size:18px}.moment-card p{margin:0;color:var(--muted);font-weight:700}.footer{padding:38px 0 46px;color:var(--muted);text-align:center;font-weight:700}@keyframes floaty{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-12px) rotate(1deg)}}@media(max-width:860px){.hero{grid-template-columns:1fr;min-height:auto;padding-top:52px}.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){main,.topbar,.footer{width:min(100% - 22px,1120px)}.topbar{align-items:flex-start;border-radius:20px}.nav{flex-wrap:wrap;justify-content:flex-end}.nav a{padding:7px 9px;font-size:12px}h1{font-size:48px}.hero-text{font-size:17px}.mascot-card{border-radius:30px}.gallery-grid{grid-template-columns:1fr}}
`;
}

renderAll();
bindEvents();
hydrateServerState();
