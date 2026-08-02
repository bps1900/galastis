const API_URL = "https://script.google.com/macros/s/AKfycbw4-Fi9SaSTB1Ain86-9xEGVjqLmLtnjXGv1jf-BZI79yKDTE39F5PdWPCfrFYCe6ZABQ/exec";

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
