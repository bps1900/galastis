const API_URL = "https://script.google.com/macros/s/AKfycbw4-Fi9SaSTB1Ain86-9xEGVjqLmLtnjXGv1jf-BZI79yKDTE39F5PdWPCfrFYCe6ZABQ/exec";

async function doLogin() {
  const msg = document.getElementById("login-msg");
  const val = document.getElementById("login-input").value.trim();
  if (!val) {
    msg.textContent = "Masukkan NIP Anda.";
    msg.className = "status-msg err";
    return;
  }
  msg.textContent = "Memeriksa...";
  msg.className = "status-msg";

  // Coba admin dulu
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "loginAdmin", secret: val })
    });
    const json = await res.json();
    if (!json.error) {
      sessionStorage.setItem("galastis_user", JSON.stringify({ role: "admin", secret: val }));
      window.location.href = "admin.html";
      return;
    }
  } catch (_) {}

  // Coba NIP pegawai
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "loginPegawai", nip: val })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    sessionStorage.setItem("galastis_user", JSON.stringify({
      role: "pegawai", nama: json.nama, nip: json.nip
    }));
    window.location.href = "index.html";
  } catch (err) {
    msg.textContent = "NIP tidak ditemukan. Hubungi admin jika belum terdaftar.";
    msg.className = "status-msg err";
  }
}

document.getElementById("btn-login-unified").addEventListener("click", doLogin);
document.getElementById("login-input").addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
});
