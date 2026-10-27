const MEDIA_BASE = "https://pub-156a980147924e48b583cf785ef4142f.r2.dev"; // your R2 public URL
const mediaUrl = (p) => `${MEDIA_BASE}/${p}`;

const MAP_IMAGES = {
  dust2: "images/maps/dust2.jpg",
  mirage: "images/maps/mirage.jpg",
  nuke: "images/maps/nuke.jpg",
  ancient: "images/maps/ancient.jpg",
  inferno: "images/maps/inferno.jpg",
  overpass: "images/maps/overpass.jpg",
  anubis: "images/maps/anubis.jpg",
  cache: "images/maps/cache.jpeg",
};

const MAP_NAMES = {
  dust2: "Dust II", mirage: "Mirage", nuke: "Nuke", ancient: "Ancient",
  inferno: "Inferno", overpass: "Overpass", anubis: "Anubis", cache: "Cache",
};

const esc = (s = "") =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Use the lineup's R2 image if it has one, otherwise the map image
const thumb = (l) => (l.image ? mediaUrl(l.image) : MAP_IMAGES[l.mapId]);

// If an image fails to load (e.g. not uploaded to R2 yet), swap in the map image
function attachImageFallbacks(container) {
  container.querySelectorAll("img[data-map]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const fallback = MAP_IMAGES[img.dataset.map];
        if (fallback) img.src = fallback;
      },
      { once: true }
    );
  });
}

const raw = await (await fetch("lineups.json")).json();
const all = Object.entries(raw).flatMap(([mapId, list]) =>
  list.map((l) => ({ ...l, mapId, mapName: MAP_NAMES[mapId] ?? mapId }))
);

const app = document.getElementById("app");
let query = localStorage.getItem("query") ?? "";
let results = all;

function filter() {
  const q = query.toLowerCase().trim();
  results = all.filter(
    (l) => l.title.toLowerCase().includes(q) || l.mapName.toLowerCase().includes(q)
  );
}

function showSearch() {
  filter();
  app.innerHTML = `
    <input id="search" class="search" type="text" placeholder="Search lineups..." value="${esc(query)}" />
    <div id="results" class="results"></div>
  `;
  const input = document.getElementById("search");
  input.focus();
  input.addEventListener("input", () => {
    query = input.value;
    localStorage.setItem("query", query);
    renderResults();
  });
  renderResults();
}

function renderResults() {
  filter();
  const box = document.getElementById("results");
  if (results.length === 0) {
    box.innerHTML = `<p class="muted">No lineups found.</p>`;
    return;
  }
  box.innerHTML = results
    .map(
      (l, i) => `
      <button class="result" data-index="${i}">
        <img src="${thumb(l)}" data-map="${l.mapId}" alt="" loading="lazy" />
        <div>
          <div class="result-title">${esc(l.title)}</div>
          <div class="muted">${esc(l.mapName)} · ${l.side} · ${l.nadeType}</div>
        </div>
      </button>`
    )
    .join("");
  attachImageFallbacks(box);
  box.querySelectorAll(".result").forEach((btn) =>
    btn.addEventListener("click", () => showDetail(Number(btn.dataset.index)))
  );
}

function showDetail(index) {
  const l = results[index];
  const media = l.video
    ? `<video src="${mediaUrl(l.video)}" controls autoplay loop muted></video>`
    : `<img class="hero" src="${thumb(l)}" data-map="${l.mapId}" alt="" />`;
  const extras = (l.detailImages ?? [])
    .map((p) => `<a href="${mediaUrl(p)}" target="_blank"><img src="${mediaUrl(p)}" alt="" /></a>`)
    .join("");

  app.innerHTML = `
    <div class="detail-nav">
      <button id="back">← Back</button>
      <span>
        <button id="prev">‹</button>
        <button id="next">›</button>
      </span>
    </div>
    <span class="badge ${l.side.toLowerCase()}">${l.side} · ${l.nadeType}</span>
    <h2>${esc(l.title)}</h2>
    <p class="muted">${esc(l.mapName)}${l.description ? " — " + esc(l.description) : ""}</p>
    ${media}
    <div class="extras">${extras}</div>
  `;
  attachImageFallbacks(app);
  document.getElementById("back").onclick = showSearch;
  document.getElementById("prev").onclick = () =>
    showDetail(index === 0 ? results.length - 1 : index - 1);
  document.getElementById("next").onclick = () => showDetail((index + 1) % results.length);
}

showSearch();