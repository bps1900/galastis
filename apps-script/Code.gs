/**
 * BACKEND — Galeri Karya Magang Elastis
 * Deploy file ini sebagai "Web App" dari Google Sheets (Extensions > Apps Script).
 * Lihat README.md untuk langkah setup lengkap.
 *
 * Struktur Spreadsheet (buat 3 sheet dengan nama & kolom persis seperti ini):
 *
 * 1) Sheet "Konten"
 *    ID | Kategori | Seri | Mahasiswa | EmbedLink | Thumbnail
 *
 * 2) Sheet "Pegawai"
 *    Nama
 *
 * 3) Sheet "Votes"
 *    Timestamp | NamaPegawai | KaryaID | Kategori
 */

// Ganti dengan kata sandi admin milikmu sendiri sebelum deploy
const ADMIN_SECRET = "GANTI_PASSWORD_ADMIN_DISINI";

function doGet(e) {
  const action = e.parameter.action || "getData";
  if (action === "getData") {
    return jsonResponse(getAllData());
  }
  return jsonResponse({ error: "Aksi tidak dikenal" });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  try {
    if (action === "vote") {
      return jsonResponse(submitVote(body));
    }
    if (action === "addKonten") {
      requireAdmin(body.secret);
      return jsonResponse(addKonten(body));
    }
    if (action === "deleteKonten") {
      requireAdmin(body.secret);
      return jsonResponse(deleteKonten(body));
    }
    if (action === "addPegawai") {
      requireAdmin(body.secret);
      return jsonResponse(addPegawai(body));
    }
    return jsonResponse({ error: "Aksi tidak dikenal" });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function requireAdmin(secret) {
  if (secret !== ADMIN_SECRET) {
    throw new Error("Akses admin ditolak. Password salah.");
  }
}

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1).filter(r => r.join("") !== "");
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i]));
    return obj;
  });
}

function getAllData() {
  const konten = sheetToObjects(getSheet("Konten"));
  const pegawai = sheetToObjects(getSheet("Pegawai")).map(p => p.Nama).filter(Boolean);
  const votes = sheetToObjects(getSheet("Votes"));

  // Hitung leaderboard per karya
  const counts = {};
  votes.forEach(v => {
    const id = v.KaryaID;
    counts[id] = (counts[id] || 0) + 1;
  });
  const leaderboard = konten
    .map(k => ({ ...k, jumlahVote: counts[k.ID] || 0 }))
    .sort((a, b) => b.jumlahVote - a.jumlahVote);

  return { konten, pegawai, leaderboard };
}

function submitVote(body) {
  const { namaPegawai, karyaId, kategori } = body;
  if (!namaPegawai || !karyaId) {
    throw new Error("Nama pegawai dan karya wajib diisi.");
  }

  const votesSheet = getSheet("Votes");
  const existing = sheetToObjects(votesSheet);

  const sudahVote = existing.some(
    v => v.NamaPegawai === namaPegawai && v.KaryaID == karyaId
  );
  if (sudahVote) {
    throw new Error("Anda sudah vote untuk karya ini.");
  }

  votesSheet.appendRow([new Date(), namaPegawai, karyaId, kategori || ""]);
  return { success: true };
}

function addKonten(body) {
  const sheet = getSheet("Konten");
  const { kategori, seri, mahasiswa, embedLink, thumbnail } = body;
  const existing = sheetToObjects(sheet);
  const nextId = existing.length
    ? Math.max(...existing.map(r => Number(r.ID) || 0)) + 1
    : 1;

  sheet.appendRow([
    nextId,
    kategori,
    seri,
    mahasiswa,
    embedLink,
    thumbnail || ""
  ]);
  return { success: true, id: nextId };
}

function deleteKonten(body) {
  const sheet = getSheet("Konten");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(body.id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error("Karya tidak ditemukan.");
}

function addPegawai(body) {
  const sheet = getSheet("Pegawai");
  sheet.appendRow([body.nama]);
  return { success: true };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
