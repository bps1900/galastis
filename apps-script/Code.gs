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
      case "deleteKonten":
        requireAdmin(body);
        return jsonOut(deleteKonten(body));
      case "addPegawai":
        requireAdmin(body);
        return jsonOut(addPegawai(body));
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
