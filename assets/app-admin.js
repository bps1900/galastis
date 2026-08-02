const API_URL = "https://script.google.com/macros/s/AKfycbxxwqnB9rvuoGjVNcMeH-IHLW7cWjRd0uGAVVnI_FQY3wOya4k5XiwUcu6Rgmcn6lfbXw/exec";

let ADMIN_SECRET_INPUT = "";

document.getElementById("btn-login").addEventListener("click", login);
document.getElementById("admin-password").addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

function login() {
  const pass = document.getElementById("admin-password").value;
  if (!pass) return;
  ADMIN_SECRET_INPUT = pass;
  // Password akan divalidasi oleh Apps Script saat aksi pertama (tambah/hapus) dijalankan.
  document.getElementById("login-view").style.display = "none";
  document.getElementById("admin-view").style.display = "block";
  loadKontenTable();
}

document.getElementById("btn-add").addEventListener("click", async () => {
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
    ["f-seri", "f-mahasiswa", "f-embed", "f-thumb"].forEach(id => (document.getElementById(id).value = ""));
    loadKontenTable();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "status-msg err";
  }
});

document.getElementById("btn-add-pegawai").addEventListener("click", async () => {
  const msg = document.getElementById("pegawai-msg");
  const nama = val("f-pegawai");
  if (!nama) return;
  try {
    const json = await postApi({ action: "addPegawai", secret: ADMIN_SECRET_INPUT, nama });
    if (json.error) throw new Error(json.error);
    msg.textContent = `Pegawai "${nama}" ditambahkan.`;
    msg.className = "status-msg ok";
    document.getElementById("f-pegawai").value = "";
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "status-msg err";
  }
});

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
      <table>
        <thead><tr><th>ID</th><th>Kategori</th><th>Seri</th><th>Mahasiswa</th><th></th></tr></thead>
        <tbody>
          ${items
            .map(
              i => `<tr>
                <td>${i.ID}</td><td>${i.Kategori}</td><td>${i.Seri}</td><td>${i.Mahasiswa || ""}</td>
                <td><button class="del-btn" data-id="${i.ID}">Hapus</button></td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
    wrap.querySelectorAll(".del-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteKonten(btn.dataset.id));
    });
  } catch (err) {
    wrap.innerHTML = `<p class="status-msg err">${err.message}</p>`;
  }
}

async function deleteKonten(id) {
  if (!confirm("Hapus karya ini?")) return;
  try {
    const json = await postApi({ action: "deleteKonten", secret: ADMIN_SECRET_INPUT, id });
    if (json.error) throw new Error(json.error);
    loadKontenTable();
  } catch (err) {
    alert(err.message);
  }
}

async function postApi(payload) {
  const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
  return res.json();
}

function val(id) {
  return document.getElementById(id).value.trim();
}
