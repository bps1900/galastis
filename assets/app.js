// ====== KONFIGURASI ======
const API_URL = "https://script.google.com/macros/s/AKfycbw4-Fi9SaSTB1Ain86-9xEGVjqLmLtnjXGv1jf-BZI79yKDTE39F5PdWPCfrFYCe6ZABQ/exec";

const KATEGORI = [
  { key: "Infografis", label: "Infografis", icon: iconChart() },
  { key: "Videografis", label: "Videografis", icon: iconPlay() },
  { key: "Flyer", label: "Flyer", icon: iconFlyer() },
  { key: "Join Riset", label: "Join Riset", icon: iconDoc() }
];

let STATE = {
  data: null,
  activeKategori: KATEGORI[0].key,
  view: "katalog" // "katalog" | "leaderboard"
};

function currentUser() {
  const raw = sessionStorage.getItem("galastis_user");
  if (!raw) return null;
  const u = JSON.parse(raw);
  return u.role === "pegawai" ? u : null;
}

// ====== ICONS ======
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
function iconLike(filled) {
  return `<svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h12.5a2 2 0 0 0 2-1.6l1.2-6A2 2 0 0 0 17.7 12H14V6a2 2 0 0 0-2-2l-2 5v11"/></svg>`;
}
function iconComment() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.4 8.5 8.5 0 0 1-4-1L3 20l1.1-3.5A8.38 8.38 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/></svg>`;
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderSidebar();
  loadData();
  setupLoginModal();
});

function setupLoginModal() {
  const overlay = document.getElementById("login-overlay");
  const link = document.getElementById("login-link");

  document.body.addEventListener("click", e => {
    const trigger = e.target.closest("#login-link");
    if (trigger) {
      e.preventDefault();
      document.getElementById("login-msg").textContent = "";
      overlay.classList.add("open");
    }
  });

  document.getElementById("login-modal-close").addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("open"); });

  document.querySelectorAll(".login-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".login-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".login-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
      document.getElementById("login-msg").textContent = "";
    });
  });

  document.getElementById("btn-login-pegawai").addEventListener("click", async () => {
    const msg = document.getElementById("login-msg");
    const nip = document.getElementById("p-nip").value.trim();
    if (!nip) {
      msg.textContent = "Masukkan NIP Anda.";
      msg.className = "status-msg err";
      return;
    }
    msg.textContent = "Memeriksa...";
    msg.className = "status-msg";
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "loginPegawai", nip })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      sessionStorage.setItem("galastis_user", JSON.stringify({
        role: "pegawai", nama: json.nama, nip: json.nip
      }));
      overlay.classList.remove("open");
      document.getElementById("p-nip").value = "";
      renderHeader();
      renderMain();
    } catch (err) {
      msg.textContent = err.message || "NIP tidak ditemukan.";
      msg.className = "status-msg err";
    }
  });

  document.getElementById("btn-login-admin").addEventListener("click", async () => {
    const msg = document.getElementById("login-msg");
    const pass = document.getElementById("a-password").value;
    if (!pass) return;
    msg.textContent = "Memeriksa...";
    msg.className = "status-msg";
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "loginAdmin", secret: pass })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      sessionStorage.setItem("galastis_user", JSON.stringify({ role: "admin", secret: pass }));
      window.location.href = "admin.html";
    } catch (err) {
      msg.textContent = err.message || "Password admin salah.";
      msg.className = "status-msg err";
    }
  });

  document.getElementById("p-nip").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("btn-login-pegawai").click();
  });
  document.getElementById("a-password").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("btn-login-admin").click();
  });
}

function renderHeader() {
  const wrap = document.getElementById("header-actions");
  const user = currentUser();
  const rawAdmin = sessionStorage.getItem("galastis_user");
  const isAdmin = rawAdmin && JSON.parse(rawAdmin).role === "admin";

  if (user) {
    wrap.innerHTML = `
      <span class="header-user">Halo, ${escapeHtml(user.nama)}</span>
      <button id="btn-logout">Logout</button>
    `;
    document.getElementById("btn-logout").addEventListener("click", () => {
      sessionStorage.removeItem("galastis_user");
      renderHeader();
    });
  } else if (isAdmin) {
    wrap.innerHTML = `
      <a href="admin.html">Buka Admin</a>
      <button id="btn-logout">Logout</button>
    `;
    document.getElementById("btn-logout").addEventListener("click", () => {
      sessionStorage.removeItem("galastis_user");
      renderHeader();
    });
  } else {
    wrap.innerHTML = `<a href="#" id="login-link">Login</a>`;
  }
}

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

// ====== Helpers untuk hitung like & comment per karya ======
function likeCountFor(karyaId) {
  return (STATE.data.likes || []).filter(l => String(l.KaryaId) === String(karyaId)).length;
}
function commentsFor(karyaId) {
  return (STATE.data.comments || []).filter(c => String(c.KaryaId) === String(karyaId));
}
function isLikedByMe(karyaId) {
  const user = currentUser();
  if (!user) return false;
  return (STATE.data.likes || []).some(
    l => String(l.KaryaId) === String(karyaId) && String(l.NIP) === String(user.nip)
  );
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
    <p class="section-sub">Klik salah satu karya untuk melihat tampilan penuh, like, dan berkomentar.</p>
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
  const thumbUrl = resolveThumbnail(item);
  const thumb = thumbUrl
    ? `<img src="${thumbUrl}" alt="${escapeHtml(item.Mahasiswa)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=&quot;placeholder-icon&quot;>${iconByKategori(item.Kategori).replace(/"/g, "&quot;")}</div>'">`
    : `<div class="placeholder-icon">${iconByKategori(item.Kategori)}</div>`;
  const likes = likeCountFor(item.ID);
  const comments = commentsFor(item.ID).length;
  return `
    <div class="card" data-id="${item.ID}">
      <div class="card-thumb">${thumb}</div>
      <div class="card-body">
        <p class="card-title">${namesDisplay(item.Mahasiswa)}</p>
        <div class="card-stats">
          <span>${iconLike(false)} ${likes}</span>
          <span>${iconComment()} ${comments}</span>
        </div>
      </div>
    </div>
  `;
}

function iconByKategori(kat) {
  const found = KATEGORI.find(k => k.key === kat);
  return found ? found.icon : iconDoc();
}

// Ambil ID file Google Drive dari berbagai format link
function driveFileId(link) {
  if (!link) return null;
  const m = link.match(/\/d\/([^/]+)/) || link.match(/id=([^&]+)/);
  return m ? m[1] : null;
}

// Kalau Thumbnail kosong, coba generate otomatis dari link Drive
function resolveThumbnail(item) {
  if (item.Thumbnail) return item.Thumbnail;
  const id = driveFileId(item.EmbedLink);
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w500`;
  return null;
}

// Pisahkan nama jadi daftar (untuk karya kelompok, dipisah koma)
function splitNames(str) {
  return String(str || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function namesDisplay(str) {
  const names = splitNames(str);
  if (names.length <= 1) return escapeHtml(names[0] || "");
  return names.map(escapeHtml).join(", ");
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

function timeAgo(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (isNaN(d)) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

// ====== MODAL VIEWER + LIKE/COMMENT ======

function openModal(id) {
  const item = STATE.data.konten.find(k => String(k.ID) === String(id));
  if (!item) return;

  const overlay = document.getElementById("modal-overlay");
  const embedUrl = toEmbeddableUrl(item.EmbedLink);
  const user = currentUser();
  const liked = isLikedByMe(item.ID);
  const likeCount = likeCountFor(item.ID);
  const comments = commentsFor(item.ID).sort((a, b) => new Date(a.Waktu) - new Date(b.Waktu));

  overlay.innerHTML = `
    <div class="modal-box modal-box-split">
      <div class="modal-header">
        <div>
          <h3>${namesDisplay(item.Mahasiswa)}</h3>
          <p>${escapeHtml(item.Kategori)} · Seri ${escapeHtml(item.Seri)}</p>
        </div>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>
      <div class="modal-split-body">
        <div class="modal-preview-col">
          <div class="modal-frame-wrap">
            <iframe src="${embedUrl}" allow="autoplay" allowfullscreen></iframe>
          </div>
          <div class="modal-footer">
            <a class="btn btn-outline" href="${item.EmbedLink}" target="_blank" rel="noopener">Buka di Drive</a>
          </div>
        </div>
        <div class="modal-side-col">
          <div class="social-bar">
            <button class="like-btn ${liked ? "liked" : ""}" id="btn-like">
              ${iconLike(liked)} <span id="like-label">${liked ? "Disukai" : "Suka"}</span>
            </button>
            <span class="like-count" id="like-count">${likeCount} suka</span>
          </div>
          ${!user ? `<p class="login-required">Login sebagai pegawai untuk bisa like &amp; berkomentar. <a href="#" id="modal-login-link">Login di sini</a>.</p>` : ""}
          <div class="comment-section">
            <h4>Komentar (${comments.length})</h4>
            ${
              user
                ? `<div class="comment-form">
                    <textarea id="comment-text" placeholder="Tulis komentar sebagai ${escapeHtml(user.nama)}..."></textarea>
                    <button class="btn btn-primary" id="btn-comment">Kirim</button>
                  </div>`
                : ""
            }
            <div class="comment-list" id="comment-list">
              ${
                comments.length === 0
                  ? `<p class="comment-empty">Belum ada komentar. Jadilah yang pertama!</p>`
                  : comments
                      .map(
                        c => `
                  <div class="comment-item">
                    <div class="c-head">
                      <span class="c-name">${escapeHtml(c.Nama)}</span>
                      <span class="c-time">${timeAgo(c.Waktu)}</span>
                    </div>
                    <p class="c-text">${escapeHtml(c.Text)}</p>
                  </div>`
                      )
                      .join("")
              }
            </div>
            <p class="status-msg" id="comment-msg"></p>
          </div>
        </div>
      </div>
    </div>
  `;

  overlay.classList.add("open");
  document.getElementById("modal-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
  const loginLink = document.getElementById("modal-login-link");
  if (loginLink) {
    loginLink.addEventListener("click", e => {
      e.preventDefault();
      closeModal();
      document.getElementById("login-link").click();
    });
  }

  document.getElementById("btn-like").addEventListener("click", () => toggleLike(item));
  const btnComment = document.getElementById("btn-comment");
  if (btnComment) btnComment.addEventListener("click", () => submitComment(item));
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("modal-overlay").innerHTML = "";
}

function toEmbeddableUrl(link) {
  if (!link) return "";
  const match = link.match(/\/d\/([^/]+)/) || link.match(/id=([^&]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return link;
}

async function toggleLike(item) {
  const user = currentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const btn = document.getElementById("btn-like");
  btn.disabled = true;
  const wasLiked = isLikedByMe(item.ID);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "toggleLike",
        karyaId: item.ID,
        nip: user.nip,
        nama: user.nama
      })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    // Perbarui state lokal secara optimis
    if (wasLiked) {
      STATE.data.likes = STATE.data.likes.filter(
        l => !(String(l.KaryaId) === String(item.ID) && String(l.NIP) === String(user.nip))
      );
    } else {
      STATE.data.likes = STATE.data.likes || [];
      STATE.data.likes.push({ KaryaId: item.ID, NIP: user.nip, Nama: user.nama });
    }

    const nowLiked = !wasLiked;
    btn.classList.toggle("liked", nowLiked);
    btn.innerHTML = `${iconLike(nowLiked)} <span id="like-label">${nowLiked ? "Disukai" : "Suka"}</span>`;
    document.getElementById("like-count").textContent = `${likeCountFor(item.ID)} suka`;
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
}

async function submitComment(item) {
  const user = currentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const textarea = document.getElementById("comment-text");
  const msg = document.getElementById("comment-msg");
  const text = textarea.value.trim();
  if (!text) {
    msg.textContent = "Komentar tidak boleh kosong.";
    msg.className = "status-msg err";
    return;
  }

  const btn = document.getElementById("btn-comment");
  btn.disabled = true;
  msg.textContent = "Mengirim...";
  msg.className = "status-msg";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addComment",
        karyaId: item.ID,
        nip: user.nip,
        nama: user.nama,
        text
      })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    STATE.data.comments = STATE.data.comments || [];
    STATE.data.comments.push({
      KaryaId: item.ID,
      NIP: user.nip,
      Nama: user.nama,
      Text: text,
      Waktu: new Date().toISOString()
    });
    textarea.value = "";
    msg.textContent = "";
    openModal(item.ID); // re-render dengan komentar terbaru
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "status-msg err";
  } finally {
    btn.disabled = false;
  }
}

// ====== LEADERBOARD (berdasarkan jumlah like) ======

function renderLeaderboard() {
  const main = document.getElementById("main");
  const konten = STATE.data.konten || [];
  const all = konten
    .map(item => ({ ...item, jumlahLike: likeCountFor(item.ID) }))
    .filter(i => i.jumlahLike > 0);

  main.innerHTML = `
    <div class="section-title"><h2>Leaderboard</h2></div>
    <p class="section-sub">Peringkat karya berdasarkan jumlah like dari pegawai, dikelompokkan per kategori dan seri.</p>
    ${
      all.length === 0
        ? `<div class="empty-state">Belum ada like yang masuk.</div>`
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
  const sorted = [...items].sort((a, b) => b.jumlahLike - a.jumlahLike);
  const maxLike = Math.max(1, ...sorted.map(i => i.jumlahLike));

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
              <p class="t">${namesDisplay(item.Mahasiswa)}</p>
            </div>
            <div class="lb-bar-wrap"><div class="lb-bar" style="width:${(item.jumlahLike / maxLike) * 100}%"></div></div>
            <div class="lb-count">${item.jumlahLike}</div>
          </div>`
          )
          .join("")}
      </div>
    </div>
  `;
}
