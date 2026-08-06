const API_URL = "https://script.google.com/macros/s/AKfycbw4-Fi9SaSTB1Ain86-9xEGVjqLmLtnjXGv1jf-BZI79yKDTE39F5PdWPCfrFYCe6ZABQ/exec";

async function doLogin() {
  const msg = document.getElementById("login-msg");
  const btn = document.getElementById("btn-login-unified");
  const input = document.getElementById("login-input");
  const val = input.value.trim();
  if (!val) {
    msg.textContent = "Masukkan NIP Anda.";
    msg.className = "status-msg err";
    return;
  }
  msg.textContent = "";
  msg.className = "status-msg";

  // Tampilkan animasi loading di tombol & kunci input selama proses login
  const originalBtnHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="like-spinner"></span> Memeriksa...`;
  input.disabled = true;

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

  // Gagal keduanya: kembalikan tombol & input ke kondisi semula, tampilkan pesan error
  btn.disabled = false;
  btn.innerHTML = originalBtnHtml;
  input.disabled = false;
  msg.textContent = "NIP tidak ditemukan. Hubungi admin jika belum terdaftar.";
  msg.className = "status-msg err";
}

document.getElementById("btn-login-unified").addEventListener("click", doLogin);
document.getElementById("login-input").addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
});
