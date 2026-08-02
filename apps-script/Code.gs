/**
 * GALASTIS — Backend Google Apps Script
 * Sheet yang dibutuhkan (buat tab dengan nama persis ini):
 *  - Konten   : ID | Kategori | Seri | Mahasiswa | EmbedLink | Thumbnail
 *  - Pegawai  : Nama | NIP
 *  - Likes    : KaryaId | NIP | Nama
 *  - Comments : ID | KaryaId | NIP | Nama | Text | Waktu
 *
 * Ganti ADMIN_SECRET di bawah dengan password admin kamu.
 */

const ADMIN_SECRET = "GANTI_PASSWORD_ADMIN_DI_SINI";

function doGet(e) {
  const action = e.parameter.action;
  if (action === "getData") {
    return jsonOut(getAllData());
  }
  return jsonOut({ error: "Aksi tidak dikenal." });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  try {
    switch (action) {
      case "loginAdmin":
        return jsonOut(loginAdmin(body));
      case "loginPegawai":
        return jsonOut(loginPegawai(body));
      case "addKonten":
        requireAdmin(body);
        return jsonOut(addKonten(body));
      case "updateKonten":
        requireAdmin(body);
        return jsonOut(updateKonten(body));
      case "syncKonten":
        requireAdmin(body);
        return jsonOut(syncFromPengumpulan());
      case "deleteKonten":
        requireAdmin(body);
        return jsonOut(deleteKonten(body));
      case "addPegawai":
        requireAdmin(body);
        return jsonOut(addPegawai(body));
      case "deletePegawai":
        requireAdmin(body);
        return jsonOut(deletePegawai(body));
      case "toggleLike":
        return jsonOut(toggleLike(body));
      case "addComment":
        return jsonOut(addComment(body));
      default:
        return jsonOut({ error: "Aksi tidak dikenal." });
    }
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function requireAdmin(body) {
  if (!body.secret || body.secret !== ADMIN_SECRET) {
    throw new Error("Password admin salah.");
  }
}

function loginAdmin(body) {
  if (!body.secret || body.secret !== ADMIN_SECRET) {
    return { error: "Password admin salah." };
  }
  return { ok: true };
}

function loginPegawai(body) {
  const sheet = getSheet("Pegawai");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const nama = String(rows[i][0]);
    const nip = String(rows[i][1]);
    if (nip === String(body.nip)) {
      return { nama: nama, nip: nip };
    }
  }
  return { error: "NIP tidak ditemukan. Pastikan NIP sesuai dengan nama yang dipilih." };
}

function getAllData() {
  return {
    konten: sheetToObjects("Konten"),
    pegawai: sheetToObjects("Pegawai"),
    likes: sheetToObjects("Likes"),
    comments: sheetToObjects("Comments")
  };
}

function addKonten(body) {
  const sheet = getSheet("Konten");
  const id = Utilities.getUuid().slice(0, 8);
  sheet.appendRow([id, body.kategori, body.seri, body.mahasiswa, body.embedLink, body.thumbnail || ""]);
  return { ok: true, id: id };
}

function updateKonten(body) {
  const sheet = getSheet("Konten");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.id)) {
      sheet.getRange(i + 1, 2).setValue(body.kategori);
      sheet.getRange(i + 1, 3).setValue(body.seri);
      sheet.getRange(i + 1, 4).setValue(body.mahasiswa);
      sheet.getRange(i + 1, 5).setValue(body.embedLink);
      sheet.getRange(i + 1, 6).setValue(body.thumbnail || "");
      return { ok: true };
    }
  }
  return { error: "Karya tidak ditemukan." };
}

function deleteKonten(body) {
  const sheet = getSheet("Konten");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.id)) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { error: "Karya tidak ditemukan." };
}

function addPegawai(body) {
  const sheet = getSheet("Pegawai");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(body.nip)) {
      throw new Error("NIP sudah terdaftar.");
    }
  }
  sheet.appendRow([body.nama, body.nip]);
  return { ok: true };
}

function deletePegawai(body) {
  const sheet = getSheet("Pegawai");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(body.nip)) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { error: "Pegawai tidak ditemukan." };
}

function toggleLike(body) {
  if (!body.nip) throw new Error("Anda harus login sebagai pegawai untuk like.");
  const sheet = getSheet("Likes");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.karyaId) && String(rows[i][1]) === String(body.nip)) {
      sheet.deleteRow(i + 1);
      return { ok: true, liked: false };
    }
  }
  sheet.appendRow([body.karyaId, body.nip, body.nama || ""]);
  return { ok: true, liked: true };
}

function addComment(body) {
  if (!body.nip) throw new Error("Anda harus login sebagai pegawai untuk berkomentar.");
  if (!body.text || !body.text.trim()) throw new Error("Komentar tidak boleh kosong.");
  const sheet = getSheet("Comments");
  const id = Utilities.getUuid().slice(0, 8);
  const waktu = new Date().toISOString();
  sheet.appendRow([id, body.karyaId, body.nip, body.nama || "", body.text.trim(), waktu]);
  return { ok: true, id: id };
}

// ====== Helpers ======

/**
 * Sync otomatis dari sheet pengumpulan (O1-O4) ke sheet Konten.
 * Jalankan fungsi ini manual dari Apps Script editor, atau pasang trigger otomatis.
 * 
 * Mapping tab:
 *   O1 → Infografis
 *   O2 → Videografis
 *   O3 → Flyer
 *   O4 → Join Riset
 *
 * Kolom yang dibaca (baris 2 ke bawah):
 *   C = Nama mahasiswa
 *   D = Seri (infografis ke-berapa)
 *   E = Link Google Drive (embed + thumbnail otomatis)
 */
function syncFromPengumpulan() {
  const MAPPING = [
    { tab: "O1", kategori: "Infografis" },
    { tab: "O2", kategori: "Videografis" },
    { tab: "O3", kategori: "Flyer" },
    { tab: "O4", kategori: "Join Riset" },
  ];

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const kontenSheet = getSheet("Konten");

  // Ambil semua data Konten yang sudah ada (untuk cek duplikat)
  const kontenRows = kontenSheet.getDataRange().getValues();
  // Buat key unik dari kombinasi kategori|seri|nama|link untuk deteksi duplikat
  const existing = new Set(
    kontenRows.slice(1).map(r => `${r[1]}|${r[2]}|${r[3]}|${r[4]}`.toLowerCase())
  );

  let totalAdded = 0;

  MAPPING.forEach(({ tab, kategori }) => {
    const sheet = ss.getSheetByName(tab);
    if (!sheet) {
      Logger.log(`Sheet "${tab}" tidak ditemukan, dilewati.`);
      return;
    }

    const rows = sheet.getDataRange().getValues();
    // Baris 1 = header, mulai dari baris 2 (index 1)
    for (let i = 1; i < rows.length; i++) {
      const nama = String(rows[i][2] || "").trim();   // Kolom C
      const seri = String(rows[i][3] || "").trim();   // Kolom D
      const link = String(rows[i][4] || "").trim();   // Kolom E

      // Skip baris kosong
      if (!nama && !link) continue;
      if (!link) continue;

      const key = `${kategori}|${seri}|${nama}|${link}`.toLowerCase();
      if (existing.has(key)) continue; // sudah ada, skip

      const id = Utilities.getUuid().slice(0, 8);
      kontenSheet.appendRow([id, kategori, seri, nama, link, ""]); // thumbnail kosong = otomatis dari Drive
      existing.add(key);
      totalAdded++;
    }
  });

  Logger.log(`Sync selesai. ${totalAdded} karya baru ditambahkan.`);
  return { ok: true, added: totalAdded };
}


function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" tidak ditemukan.`);
  return sheet;
}

function sheetToObjects(sheetName) {
  const sheet = getSheet(sheetName);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter(r => r.join("") !== "")
    .map(r => {
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = r[idx]));
      return obj;
    });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
