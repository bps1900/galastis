const API_URL = "https://script.google.com/macros/s/AKfycbw4-Fi9SaSTB1Ain86-9xEGVjqLmLtnjXGv1jf-BZI79yKDTE39F5PdWPCfrFYCe6ZABQ/exec";

let ADMIN_SECRET_INPUT = "";
let editingId = null; // null = mode tambah, ada id = mode edit

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
    thumbnail: val("f-thumb")
  };
  if (!payload.seri || !payload.mahasiswa || !payload.embedLink) {
    msg.textContent = "Seri, nama mahasiswa, dan link Drive wajib diisi.";
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
    loadKontenTable();
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
    thumbnail: val("f-thumb")
  };
  if (!payload.seri || !payload.mahasiswa || !payload.embedLink) {
    msg.textContent = "Seri, nama mahasiswa, dan link Drive wajib diisi.";
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
    loadKontenTable();
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
    msg.textContent = `Selesai! ${json.added} karya baru ditambahkan.`;
    msg.className = "status-msg ok";
    loadKontenTable();
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
    const items = json.konten || [];
    if (items.length === 0) {
      wrap.innerHTML = `<p style="color:var(--abu)">Belum ada karya.</p>`;
      return;
    }
    wrap.innerHTML = `
      <div class="admin-grid">
        ${items.map(i => `
          <div class="admin-card">
            <div class="admin-card-info">
              <span class="admin-card-badge">${i.Kategori} · Seri ${i.Seri}</span>
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
        const item = items.find(i => String(i.ID) === String(btn.dataset.id));
        if (item) startEdit(item);
      });
    });
    wrap.querySelectorAll(".del-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteKonten(btn.dataset.id));
    });
  } catch (err) {
    wrap.innerHTML = `<p class="status-msg err">${err.message}</p>`;
  }
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

async function deleteKonten(id) {
  if (!confirm("Hapus karya ini?")) return;
  try {
    const json = await postApi({ action: "deleteKonten", secret: ADMIN_SECRET_INPUT, id });
    if (json.error) throw new Error(json.error);
    if (editingId === id) resetForm();
    loadKontenTable();
  } catch (err) {
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
