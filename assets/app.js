// ====== KONFIGURASI ======
// Ganti dengan URL Web App Google Apps Script kamu (lihat README.md)
const API_URL = "https://script.google.com/macros/s/AKfycbxxwqnB9rvuoGjVNcMeH-IHLW7cWjRd0uGAVVnI_FQY3wOya4k5XiwUcu6Rgmcn6lfbXw/exec";

const KATEGORI = [
  { key: "Infografis", label: "Infografis", icon: iconChart() },
  { key: "Videografis", label: "Videografis", icon: iconPlay() },
  { key: "Flyer", label: "Flyer", icon: iconFlyer() },
  { key: "Mini Paper", label: "Mini Paper", icon: iconDoc() }
];

let STATE = {
  data: null,
  activeKategori: KATEGORI[0].key,
  view: "katalog" // "katalog" | "leaderboard"
};

// ====== ICONS (inline svg, no external deps) ======
function iconChart() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>`;
}
function iconPlay() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/></svg>`;
}
function iconFlyer() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`;
}
function iconDoc() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l3 3v17H6z"/><path d="M15 2v4h4M9 12h6M9 16h6M9 8h2"/></svg>`;
}
function iconTrophy() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4"/></svg>`;
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
  loadData();
});

function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = `
    <div class="sidebar-label">Kategori Karya</div>
    ${KATEGORI.map(
      k => `
      <button class="cat-btn ${STATE.view === "katalog" && STATE.activeKategori === k.key ? "active" : ""}" data-cat="${k.key}">
        <span class="icon-wrap">${k.icon}</span> ${k.label}
      </button>`
    ).join("")}
    <div class="sidebar-divider"></div>
    <button class="leaderboard-link" id="btn-leaderboard">
      <span class="icon-wrap">${iconTrophy()}</span> Leaderboard
    </button>
  `;

  sidebar.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      STATE.view = "katalog";
      STATE.activeKategori = btn.dataset.cat;
      renderSidebar();
      renderMain();
    });
  });
  document.getElementById("btn-leaderboard").addEventListener("click", () => {
    STATE.view = "leaderboard";
    renderSidebar();
    renderMain();
  });
}

async function loadData() {
  renderLoading();
  try {
    const res = await fetch(`${API_URL}?action=getData`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    STATE.data = json;
    renderMain();
  } catch (err) {
    document.getElementById("main").innerHTML = `
      <div class="empty-state">
        Gagal memuat data. Pastikan API_URL di assets/app.js sudah diisi dengan URL Web App Apps Script yang benar.<br>
        <small>${err.message}</small>
      </div>`;
  }
}

function renderLoading() {
  document.getElementById("main").innerHTML = `
    <div class="loading-row"><span class="spinner"></span> Memuat galeri karya...</div>`;
}

function renderMain() {
  if (STATE.view === "leaderboard") return renderLeaderboard();
  renderKatalog();
}

function renderKatalog() {
  const main = document.getElementById("main");
  const kat = STATE.activeKategori;
  const items = (STATE.data.konten || []).filter(k => k.Kategori === kat);

  const seriList = [...new Set(items.map(i => i.Seri))].sort();

  main.innerHTML = `
    <div class="section-title">
      <h2>${kat}</h2>
      <span class="count">${items.length} karya</span>
    </div>
    <p class="section-sub">Klik salah satu karya untuk melihat tampilan penuh dan memberikan vote.</p>
    ${
      items.length === 0
        ? `<div class="empty-state">Belum ada karya ${kat} yang ditambahkan. Admin bisa menambahkannya melalui halaman admin.</div>`
        : seriList
            .map(
              seri => `
        <div class="seri-block">
          <div class="seri-title">Seri ${seri}</div>
          <div class="grid">
            ${items
              .filter(i => i.Seri === seri)
              .map(cardHtml)
              .join("")}
          </div>
        </div>`
            )
            .join("")
    }
  `;

  main.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openModal(card.dataset.id));
  });
}

function cardHtml(item) {
  const thumb = item.Thumbnail
    ? `<img src="${item.Thumbnail}" alt="${escapeHtml(item.Mahasiswa)}" loading="lazy">`
    : `<div class="placeholder-icon">${iconByKategori(item.Kategori)}</div>`;
  return `
    <div class="card" data-id="${item.ID}">
      <div class="card-thumb">${thumb}</div>
      <div class="card-body">
        <p class="card-title">${escapeHtml(item.Mahasiswa)}</p>
      </div>
    </div>
  `;
}

function iconByKategori(kat) {
  const found = KATEGORI.find(k => k.key === kat);
  return found ? found.icon : iconDoc();
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

// ====== MODAL VIEWER + VOTING ======

function openModal(id) {
  const item = STATE.data.konten.find(k => String(k.ID) === String(id));
  if (!item) return;

  const overlay = document.getElementById("modal-overlay");
  const embedUrl = toEmbeddableUrl(item.EmbedLink);
  const pegawaiOptions = (STATE.data.pegawai || [])
    .map(nama => `<option value="${escapeHtml(nama)}">${escapeHtml(nama)}</option>`)
    .join("");

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div>
          <h3>${escapeHtml(item.Mahasiswa)}</h3>
          <p>${escapeHtml(item.Kategori)} · Seri ${escapeHtml(item.Seri)}</p>
        </div>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>
      <div class="modal-frame-wrap">
        <iframe src="${embedUrl}" allow="autoplay" allowfullscreen></iframe>
      </div>
      <div class="modal-footer">
        <select class="vote-select" id="vote-select">
          <option value="">Pilih nama Anda untuk vote...</option>
          ${pegawaiOptions}
        </select>
        <button class="btn btn-primary" id="btn-vote">Vote Karya Ini</button>
        <a class="btn btn-outline" href="${item.EmbedLink}" target="_blank" rel="noopener">Buka di Drive</a>
        <p class="vote-msg" id="vote-msg"></p>
      </div>
    </div>
  `;

  overlay.classList.add("open");
  document.getElementById("modal-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

  document.getElementById("btn-vote").addEventListener("click", () => submitVote(item));
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("modal-overlay").innerHTML = "";
}

function toEmbeddableUrl(link) {
  if (!link) return "";
  // Konversi link Google Drive biasa jadi link /preview agar bisa di-embed
  const match = link.match(/\/d\/([^/]+)/) || link.match(/id=([^&]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return link;
}

async function submitVote(item) {
  const select = document.getElementById("vote-select");
  const msg = document.getElementById("vote-msg");
  const btn = document.getElementById("btn-vote");
  const nama = select.value;

  if (!nama) {
    msg.textContent = "Silakan pilih nama Anda terlebih dahulu.";
    msg.className = "vote-msg err";
    return;
  }

  btn.disabled = true;
  msg.textContent = "Mengirim vote...";
  msg.className = "vote-msg";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "vote",
        namaPegawai: nama,
        karyaId: item.ID,
        kategori: item.Kategori
      })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    msg.textContent = "Terima kasih, vote Anda berhasil dicatat!";
    msg.className = "vote-msg ok";
    select.disabled = true;
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "vote-msg err";
    btn.disabled = false;
  }
}

// ====== LEADERBOARD ======

function renderLeaderboard() {
  const main = document.getElementById("main");
  const all = (STATE.data.leaderboard || []).filter(i => i.jumlahVote > 0);

  main.innerHTML = `
    <div class="section-title"><h2>Leaderboard</h2></div>
    <p class="section-sub">Peringkat karya berdasarkan jumlah vote dari pegawai, dikelompokkan per kategori dan seri.</p>
    ${
      all.length === 0
        ? `<div class="empty-state">Belum ada vote yang masuk.</div>`
        : KATEGORI.map(kat => leaderboardKategoriBlock(kat, all)).join("")
    }
  `;
}

function leaderboardKategoriBlock(kat, all) {
  const items = all.filter(i => i.Kategori === kat.key);
  if (items.length === 0) return "";

  const seriList = [...new Set(items.map(i => i.Seri))].sort();

  return `
    <div class="section-title" style="margin-top:28px;">
      <h2 style="font-size:19px;">${kat.label}</h2>
    </div>
    ${seriList.map(seri => leaderboardSeriBlock(seri, items.filter(i => i.Seri === seri))).join("")}
  `;
}

function leaderboardSeriBlock(seri, items) {
  const sorted = [...items].sort((a, b) => b.jumlahVote - a.jumlahVote);
  const maxVote = Math.max(1, ...sorted.map(i => i.jumlahVote));

  return `
    <div class="seri-block">
      <div class="seri-title">Seri ${escapeHtml(seri)}</div>
      <div class="leaderboard-list">
        ${sorted
          .map(
            (item, idx) => `
          <div class="lb-row">
            <div class="lb-rank">${idx + 1}</div>
            <div class="lb-info">
              <p class="t">${escapeHtml(item.Mahasiswa)}</p>
            </div>
            <div class="lb-bar-wrap"><div class="lb-bar" style="width:${(item.jumlahVote / maxVote) * 100}%"></div></div>
            <div class="lb-count">${item.jumlahVote}</div>
          </div>`
          )
          .join("")}
      </div>
    </div>
  `;
}
