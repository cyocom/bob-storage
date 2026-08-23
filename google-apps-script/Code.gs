/**
 * Paste into: Google Sheet → Extensions → Apps Script
 *
 * Sheet tab name: Inventory
 * Headers in row 1: id | available | price
 * Example rows:
 *   vehicle | 12 | 50
 *   small   | 20 | 65
 *   medium  | 12 | 75
 *   large   | 8  | 85
 *   xl      | 8  | 95
 *   xxl     | 2  | 125
 *
 * Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Then set INVENTORY_URL in inventory.js to the web-app URL.
 */
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  if (!sheet) {
    return json_({ error: 'Missing sheet tab named "Inventory"' });
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idIdx = headers.indexOf("id");
  const availIdx = headers.indexOf("available");
  const priceIdx = headers.indexOf("price");

  if (idIdx < 0 || availIdx < 0) {
    return json_({ error: 'Sheet needs "id" and "available" columns' });
  }

  const spaces = {};
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = String(row[idIdx] || "").trim();
    if (!id) continue;

    const entry = { available: Number(row[availIdx]) || 0 };
    if (priceIdx >= 0 && row[priceIdx] !== "" && row[priceIdx] != null) {
      entry.price = Number(row[priceIdx]);
    }
    spaces[id] = entry;
  }

  return json_({
    updated: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    spaces: spaces,
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
