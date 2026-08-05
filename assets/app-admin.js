const API_URL = "https://script.google.com/macros/s/AKfycbw4-Fi9SaSTB1Ain86-9xEGVjqLmLtnjXGv1jf-BZI79yKDTE39F5PdWPCfrFYCe6ZABQ/exec";

let ADMIN_SECRET_INPUT = "";
let editingId = null; // null = mode tambah, ada id = mode edit
let LAST_KONTEN_ITEMS = [];
let ADMIN_FILTER_TAHUN = "all";

document.addEventListener("DOMContentLoaded", init);
document.getElementById("btn-logout").addEventListener("click", () => {
  sessionStorage.removeItem("gamma_user");
  window.location.href = "index.html";
});

function init() {
  const raw = sessionStorage.getItem("gamma_user");
  const user = raw ? JSON.parse(raw) : null;
  if (!user || user.role !== "admin") {
    document.getElementById("login-view").style.display = "block";
    document.getElementById("admin-view").style.display = "none";
    return;
  }
  ADMIN_SECRET_INPUT = user.secret;
  document.getElementById("login-view").style.display = "none";
  document.getElementById("admin-view").style.display = "grid";
  loadKontenTable();
  loadPegawaiTable();
}

// ====== DROPDOWN KUSTOM (modern) ======
function buildDropdown(container, options, value, onChange, theme, labelPrefix) {
  const dd = document.createElement("div");
  dd.className = `dd ${theme}`;

  const caret = `<svg class="dd-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "dd-toggle";
  toggle.innerHTML = `<span class="dd-toggle-label">${labelPrefix}${escHtml(value)}</span>${caret}`;

  const menu = document.createElement("div");
  menu.className = "dd-menu";
  menu.innerHTML = options.map(opt => `
    <button type="button" class="dd-option ${opt === value ? "active" : ""}" data-val="${escHtml(opt)}">${labelPrefix}${escHtml(opt)}</button>
  `).join("");

  dd.appendChild(toggle);
  dd.appendChild(menu);
  container.innerHTML = "";
  container.appendChild(dd);

  function closeDd() { dd.classList.remove("open"); }
  toggle.addEventListener("click", e => {
    e.stopPropagation();
    const willOpen = !dd.classList.contains("open");
    document.querySelectorAll(".dd.open").forEach(el => el.classList.remove("open"));
    if (willOpen) dd.classList.add("open");
  });
  menu.querySelectorAll(".dd-option").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      closeDd();
      onChange(btn.dataset.val);
    });
  });
  document.addEventListener("click", closeDd);
}

function escHtml(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

// Kalau ada karya duplikat (kategori + seri + nama sama persis), ambil baris PALING TERAKHIR
// di database (dianggap paling update/valid).
function dedupeKontenKeepLast(items) {
  const map = new Map();
  items.forEach(item => {
    const key = [
      String(item.Kategori || "").trim().toLowerCase(),
      String(item.Seri || "").trim().toLowerCase(),
      String(item.Mahasiswa || "").trim().toLowerCase()
    ].join("|");
    map.set(key, item);
  });
  return items.filter(item => {
    const key = [
      String(item.Kategori || "").trim().toLowerCase(),
      String(item.Seri || "").trim().toLowerCase(),
      String(item.Mahasiswa || "").trim().toLowerCase()
    ].join("|");
    return map.get(key) === item;
  });
}

// ====== FORM KARYA: Tambah / Edit (via modal popup) ======

const karyaOverlay = document.getElementById("karya-modal-overlay");

document.getElementById("btn-open-add").addEventListener("click", () => {
  resetForm();
  openKaryaModal();
});

document.getElementById("karya-modal-close").addEventListener("click", closeKaryaModal);
karyaOverlay.addEventListener("click", e => { if (e.target === karyaOverlay) closeKaryaModal(); });

document.getElementById("btn-add").addEventListener("click", async () => {
  if (editingId) {
    await saveEdit();
  } else {
    await addKonten();
  }
});

document.getElementById("btn-cancel-edit").addEventListener("click", () => {
  closeKaryaModal();
});

function openKaryaModal() {
  karyaOverlay.classList.add("open");
}

function closeKaryaModal() {
  karyaOverlay.classList.remove("open");
  resetForm();
}

async function addKonten() {
  const msg = document.getElementById("add-msg");
  const payload = {
    action: "addKonten",
    secret: ADMIN_SECRET_INPUT,
    kategori: val("f-kategori"),
    seri: val("f-seri"),
    mahasiswa: val("f-mahasiswa"),
    embedLink: val("f-embed"),
    thumbnail: val("f-thumb"),
    tahun: val("f-tahun")
  };
  if (!payload.seri || !payload.mahasiswa || !payload.embedLink) {
    msg.textContent = "Seri, nama mahasiswa, dan link Drive wajib diisi.";
    msg.className = "status-msg err";
    return;
  }
  if (!payload.tahun) {
    msg.textContent = "Tahun wajib diisi.";
    msg.className = "status-msg err";
    return;
  }
  msg.textContent = "Menyimpan...";
  msg.className = "status-msg";
  try {
    const json = await postApi(payload);
    if (json.error) throw new Error(json.error);
    msg.textContent = "Karya berhasil ditambahkan.";
    msg.className = "status-msg ok";
    await fadeReloadKontenTable();
    setTimeout(closeKaryaModal, 500);
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "status-msg err";
  }
}

async function saveEdit() {
  const msg = document.getElementById("add-msg");
  const payload = {
    action: "updateKonten",
    secret: ADMIN_SECRET_INPUT,
    id: editingId,
    kategori: val("f-kategori"),
    seri: val("f-seri"),
    mahasiswa: val("f-mahasiswa"),
    embedLink: val("f-embed"),
    thumbnail: val("f-thumb"),
    tahun: val("f-tahun")
  };
  if (!payload.seri || !payload.mahasiswa || !payload.embedLink) {
    msg.textContent = "Seri, nama mahasiswa, dan link Drive wajib diisi.";
    msg.className = "status-msg err";
    return;
  }
  if (!payload.tahun) {
    msg.textContent = "Tahun wajib diisi.";
    msg.className = "status-msg err";
    return;
  }
  msg.textContent = "Menyimpan perubahan...";
  msg.className = "status-msg";
  try {
    const json = await postApi(payload);
    if (json.error) throw new Error(json.error);
    msg.textContent = "Karya berhasil diperbarui.";
    msg.className = "status-msg ok";
    await fadeReloadKontenTable();
    setTimeout(closeKaryaModal, 500);
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "status-msg err";
  }
}

function startEdit(item) {
  editingId = item.ID;
  document.getElementById("form-title").textContent = "Edit Karya";
  document.getElementById("f-kategori").value = item.Kategori;
  document.getElementById("f-seri").value = item.Seri;
  document.getElementById("f-mahasiswa").value = item.Mahasiswa || "";
  document.getElementById("f-embed").value = item.EmbedLink || "";
  document.getElementById("f-thumb").value = item.Thumbnail || "";
  document.getElementById("f-tahun").value = item.Tahun || new Date().getFullYear();
  document.getElementById("btn-add").textContent = "Simpan Perubahan";
  document.getElementById("add-msg").textContent = "";
  openKaryaModal();
  document.getElementById("f-seri").focus();
}

function resetForm() {
  editingId = null;
  document.getElementById("form-title").textContent = "Tambah Karya Baru";
  document.getElementById("btn-add").textContent = "Tambah Karya";
  document.getElementById("add-msg").textContent = "";
  ["f-seri", "f-mahasiswa", "f-embed", "f-thumb"].forEach(id => (document.getElementById(id).value = ""));
  document.getElementById("f-kategori").selectedIndex = 0;
  document.getElementById("f-tahun").value = new Date().getFullYear();
}

// ====== SYNC DARI PENGUMPULAN ======

document.getElementById("btn-sync").addEventListener("click", async () => {
  const msg = document.getElementById("sync-msg");
  if (!confirm("Sync data dari sheet O1-O4 ke Gamma? Data yang sudah ada tidak akan duplikat.")) return;
  msg.textContent = "Sedang sync...";
  msg.className = "status-msg";
  try {
    const json = await postApi({ action: "syncKonten", secret: ADMIN_SECRET_INPUT });
    if (json.error) throw new Error(json.error);
    msg.textContent = `Selesai. ${json.added} karya baru ditambahkan.`;
    msg.className = "status-msg ok";
    // Beri jeda sebentar supaya perubahan di Google Sheet konsisten sebelum dibaca ulang,
    // lalu refresh otomatis dengan efek kedip halus (tanpa reload halaman).
    await new Promise(r => setTimeout(r, 700));
    await fadeReloadKontenTable();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "status-msg err";
  }
});

// ====== PEGAWAI ======

document.getElementById("btn-add-pegawai").addEventListener("click", async () => {
  const msg = document.getElementById("pegawai-msg");
  const nama = val("f-pegawai");
  const nip = val("f-nip");
  if (!nama || !nip) {
    msg.textContent = "Nama dan NIP wajib diisi.";
    msg.className = "status-msg err";
    return;
  }
  try {
    const json = await postApi({ action: "addPegawai", secret: ADMIN_SECRET_INPUT, nama, nip });
    if (json.error) throw new Error(json.error);
    msg.textContent = `Pegawai "${nama}" ditambahkan.`;
    msg.className = "status-msg ok";
    document.getElementById("f-pegawai").value = "";
    document.getElementById("f-nip").value = "";
    loadPegawaiTable();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "status-msg err";
  }
});

// ====== LOAD TABLES ======

async function loadKontenTable() {
  const wrap = document.getElementById("konten-table");
  try {
    const res = await fetch(`${API_URL}?action=getData`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    LAST_KONTEN_ITEMS = dedupeKontenKeepLast(json.konten || []);
    populateFilterTahunAdmin(LAST_KONTEN_ITEMS);
    renderKontenTable();
  } catch (err) {
    wrap.innerHTML = `<p class="status-msg err">${err.message}</p>`;
  }
}

// Reload data dengan animasi fade halus (dipakai setelah tambah/edit/sync karya)
async function fadeReloadKontenTable() {
  const wrap = document.getElementById("konten-table");
  wrap.classList.add("fade-out");
  await new Promise(r => setTimeout(r, 180));
  try {
    const res = await fetch(`${API_URL}?action=getData`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    LAST_KONTEN_ITEMS = dedupeKontenKeepLast(json.konten || []);
    populateFilterTahunAdmin(LAST_KONTEN_ITEMS);
    renderKontenTable();
  } catch (err) {
    wrap.innerHTML = `<p class="status-msg err">${err.message}</p>`;
  }
  wrap.classList.remove("fade-out");
}

function populateFilterTahunAdmin(items) {
  const container = document.getElementById("filter-tahun-admin");
  const tahunList = [...new Set(items.map(i => String(i.Tahun || "").trim()).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  const options = ["Semua Tahun", ...tahunList];

  if (!options.includes(ADMIN_FILTER_TAHUN)) {
    ADMIN_FILTER_TAHUN = "Semua Tahun";
  }

  buildDropdown(container, options, ADMIN_FILTER_TAHUN, (val) => {
    ADMIN_FILTER_TAHUN = val;
    populateFilterTahunAdmin(LAST_KONTEN_ITEMS);
    renderKontenTable();
  }, "light", "");
}

function renderKontenTable() {
  const wrap = document.getElementById("konten-table");
  const items = ADMIN_FILTER_TAHUN === "Semua Tahun" || !ADMIN_FILTER_TAHUN
    ? LAST_KONTEN_ITEMS
    : LAST_KONTEN_ITEMS.filter(i => String(i.Tahun || "").trim() === ADMIN_FILTER_TAHUN);

  if (items.length === 0) {
    wrap.innerHTML = `<p style="color:var(--abu)">Belum ada karya.</p>`;
    return;
  }
  wrap.innerHTML = `
    <div class="admin-grid">
      ${items.map(i => `
        <div class="admin-card">
          <div class="admin-card-info">
            <span class="admin-card-badge">${i.Kategori} · Seri ${i.Seri} · ${i.Tahun || "-"}</span>
            <p class="admin-card-name">${i.Mahasiswa || "-"}</p>
          </div>
          <div class="admin-card-actions">
            <button class="edit-btn" data-id="${i.ID}">Edit</button>
            <button class="del-btn" data-id="${i.ID}">Hapus</button>
          </div>
        </div>`).join("")}
    </div>
  `;
  wrap.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = LAST_KONTEN_ITEMS.find(i => String(i.ID) === String(btn.dataset.id));
      if (item) startEdit(item);
    });
  });
  wrap.querySelectorAll(".del-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteKonten(btn.dataset.id, btn));
  });
}

async function loadPegawaiTable() {
  const wrap = document.getElementById("pegawai-table");
  try {
    const res = await fetch(`${API_URL}?action=getData`);
    const json = await res.json();
    const items = json.pegawai || [];
    if (items.length === 0) {
      wrap.innerHTML = `<p style="color:var(--abu); font-size:13px;">Belum ada pegawai.</p>`;
      return;
    }
    wrap.innerHTML = `
      <div class="admin-grid">
        ${items.map(p => `
          <div class="admin-card">
            <div class="admin-card-info">
              <p class="admin-card-name">${p.Nama}</p>
              <span class="admin-card-badge">${p.NIP}</span>
            </div>
            <div class="admin-card-actions">
              <button class="del-btn" data-nip="${p.NIP}">Hapus</button>
            </div>
          </div>`).join("")}
      </div>
    `;
    wrap.querySelectorAll(".del-btn").forEach(btn => {
      btn.addEventListener("click", () => deletePegawai(btn.dataset.nip));
    });
  } catch (err) {
    wrap.innerHTML = `<p class="status-msg err">${err.message}</p>`;
  }
}

// ====== DELETE ======

async function deletePegawai(nip) {
  if (!confirm("Hapus pegawai ini?")) return;
  try {
    const json = await postApi({ action: "deletePegawai", secret: ADMIN_SECRET_INPUT, nip });
    if (json.error) throw new Error(json.error);
    loadPegawaiTable();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteKonten(id, btn) {
  if (!confirm("Hapus karya ini?")) return;
  // Tampilkan loading state di tombol & card
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="like-spinner"></span>`;
    const card = btn.closest(".admin-card");
    if (card) card.style.opacity = "0.5";
  }
  try {
    const json = await postApi({ action: "deleteKonten", secret: ADMIN_SECRET_INPUT, id });
    if (json.error) throw new Error(json.error);
    if (editingId === id) resetForm();
    await fadeReloadKontenTable();
  } catch (err) {
    // Restore tombol jika gagal
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Hapus";
      const card = btn.closest(".admin-card");
      if (card) card.style.opacity = "";
    }
    alert(err.message);
  }
}

// ====== HELPERS ======

async function postApi(payload) {
  const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
  return res.json();
}

function val(id) {
  return document.getElementById(id).value.trim();
}
