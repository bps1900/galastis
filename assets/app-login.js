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

  // Coba admin & pegawai SEKALIGUS (paralel), bukan gantian, supaya lebih cepat.
  const adminPromise = fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "loginAdmin", secret: val })
  }).then(res => res.json()).catch(() => ({ error: "network" }));

  const pegawaiPromise = fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "loginPegawai", nip: val })
  }).then(res => res.json()).catch(() => ({ error: "network" }));

  const [adminJson, pegawaiJson] = await Promise.all([adminPromise, pegawaiPromise]);

  if (!adminJson.error) {
    sessionStorage.setItem("gamma_user", JSON.stringify({ role: "admin", secret: val }));
    window.location.href = "admin.html";
    return;
  }

  if (!pegawaiJson.error) {
    sessionStorage.setItem("gamma_user", JSON.stringify({
      role: "pegawai", nama: pegawaiJson.nama, nip: pegawaiJson.nip
    }));
    window.location.href = "index.html";
    return;
  }

  msg.textContent = "NIP tidak ditemukan. Hubungi admin jika belum terdaftar.";
  msg.className = "status-msg err";
}

document.getElementById("btn-login-unified").addEventListener("click", doLogin);
document.getElementById("login-input").addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
});
