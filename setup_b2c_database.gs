/**
 * ==========================================================================
 * SAE AQIQAH (B2C) - GOOGLE APPS SCRIPT DATABASE SETUP & REST API
 * Google Drive Folder: https://drive.google.com/drive/folders/1dFHToGSnaBnwOoA4md7zvMaz7LgkfQ2w
 * ==========================================================================
 */

// Gantilah ini dengan password admin Anda untuk keamanan update harga
const ADMIN_PASSWORD = "saeb2c123"; 

/**
 * PENTING: Jalankan fungsi ini pertama kali untuk setup sheet database secara otomatis.
 * Di menu atas Apps Script, pilih "setupDatabase", lalu klik tombol "Run" (Jalankan).
 */
function setupDatabase() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName("aqiqah_prices");
  
  if (sheet) {
    // Bersihkan sheet jika sudah ada untuk menghindari tumpang tindih
    sheet.clear();
  } else {
    // Buat sheet baru jika belum ada
    sheet = doc.insertSheet("aqiqah_prices");
    
    // Hapus sheet default bawaan spreadsheet kosong ("Sheet1" atau "Sheet 1")
    const sheet1 = doc.getSheetByName("Sheet1") || doc.getSheetByName("Sheet 1");
    if (sheet1 && doc.getSheets().length > 1) {
      doc.deleteSheet(sheet1);
    }
  }
  
  // Judul kolom (Header)
  const headers = ["id", "name", "basePrice", "priceWithNasi", "description"];
  sheet.appendRow(headers);
  
  // Data Awal (Seeding) dari Web sae_aqiqahweb
  const defaultData = [
    ["A", "Paket A", 2000000, 2480000, "Sate 200 tusuk · Gule 40 porsi"],
    ["B", "Paket B", 2300000, 3020000, "Sate 300 tusuk · Gule 60 porsi"],
    ["C", "Paket C (Terlaris)", 2700000, 3540000, "Sate 400 tusuk · Gule 70 porsi"],
    ["D", "Paket D", 3000000, 4080000, "Sate 500 tusuk · Gule 90 porsi"],
    ["E", "Paket E", 3500000, 4700000, "Sate 600 tusuk · Gule 100 porsi"],
    ["kg-jantan", "Kambing Jantan Qurban", 3000000, 0, "Kambing Jantan Qurban Satuan"],
    ["kg-bundle", "Bundle Kambing Qurban", 3750000, 0, "Kambing Jantan + FREE Betina"],
    ["db-jantan", "Domba Jantan Qurban", 2000000, 0, "Domba Jantan Qurban Satuan"],
    ["db-bundle", "Bundle Domba Qurban", 3500000, 0, "Domba Jantan + FREE Betina"]
  ];
  
  // Tulis data secara massal
  sheet.getRange(2, 1, defaultData.length, headers.length).setValues(defaultData);
  
  // Gaya tampilan (Formatting)
  sheet.setFrozenRows(1);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold")
             .setBackground("#c41e3a") // Merah khas B2C
             .setFontColor("#ffffff")
             .setHorizontalAlignment("center");
             
  // Auto wrap text & align center untuk ID
  sheet.getRange(2, 1, defaultData.length, 1).setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange(2, 3, defaultData.length, 2).setNumberFormat("#,##0"); // Format rupiah angka
  
  sheet.autoResizeColumns(1, headers.length);
  
  Logger.log("B2C Database setup sukses! Silakan lakukan Deploy sekarang.");
}

/**
 * ENDPOINT API: Mendapatkan data harga (GET request)
 * Dipanggil website pengunjung saat render tabel
 */
function doGet(e) {
  const sheetName = e.parameter.sheet || "aqiqah_prices";
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const data = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    data.push(row);
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ENDPOINT API: Memperbarui data harga (POST request)
 * Dipanggil halaman admin (/admin.html)
 */
function doPost(e) {
  let postData;
  try {
    postData = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Format request harus JSON valid" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Validasi Password Keamanan
  if (postData.password !== ADMIN_PASSWORD) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Gagal: Password admin tidak sah!" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  const sheetName = postData.sheet || "aqiqah_prices";
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Gagal: Sheet tidak ditemukan" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  const idToUpdate = postData.id;
  const updatedFields = postData.data; // Object key-value berisi field yang diupdate
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  let rowIdx = -1;
  
  // Cari baris dengan ID yang cocok
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === idToUpdate.toString()) {
      rowIdx = i + 1; // Google Sheets adalah 1-indexed
      break;
    }
  }
  
  if (rowIdx === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Gagal: ID tidak ditemukan" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Tulis data update ke kolom yang sesuai
  for (let key in updatedFields) {
    const colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      sheet.getRange(rowIdx, colIdx + 1).setValue(updatedFields[key]);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Harga berhasil diperbarui" }))
                       .setMimeType(ContentService.MimeType.JSON);
}
