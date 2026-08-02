const API_URL = "https://script.google.com/macros/s/AKfycbxxwqnB9rvuoGjVNcMeH-IHLW7cWjRd0uGAVVnI_FQY3wOya4k5XiwUcu6Rgmcn6lfbXw/exec";

document.querySelectorAll(".login-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".login-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".login-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
    document.getElementById("login-msg").textContent = "";
  });
});

loadPegawaiOptions();

async function loadPegawaiOptions() {
  const sel = document.getElementById("p-nama");
  try {
    const res = await fetch(`${API_URL}?action=getData`);
    const json = await res.json();
    const pegawai = json.pegawai || [];
    if (pegawai.length === 0) {
      sel.innerHTML = `<option value="">Belum ada data pegawai</option>`;
      return;
    }
    sel.innerHTML =
      `<option value="">Pilih nama Anda...</option>` +
      pegawai.map(p => `<option value="${p.NIP}">${p.Nama}</option>`).join("");
  } catch (err) {
    sel.innerHTML = `<option value="">Gagal memuat daftar pegawai</option>`;
  }
}

document.getElementById("btn-login-pegawai").addEventListener("click", async () => {
  const msg = document.getElementById("login-msg");
  const nama = document.getElementById("p-nama");
  const nip = document.getElementById("p-nip").value.trim();
  if (!nama.value || !nip) {
    msg.textContent = "Pilih nama dan masukkan NIP Anda.";
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
    window.location.href = "index.html";
  } catch (err) {
    msg.textContent = err.message || "NIP tidak cocok dengan nama yang dipilih.";
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

document.getElementById("a-password").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("btn-login-admin").click();
});
document.getElementById("p-nip").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("btn-login-pegawai").click();
});
