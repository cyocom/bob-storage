/**
 * Live availability loader.
 *
 * Shows a loading state until inventory loads from INVENTORY_URL.
 * On timeout or error, each row falls back to "call or text for more information."
 *
 * Google Sheet setup:
 * 1. Sheet headers: id | available | price  (rows: vehicle, small, medium, large, xl, xxl)
 * 2. Extensions → Apps Script → paste google-apps-script/Code.gs → Deploy as web app
 * 3. Paste the web-app URL below.
 */
const INVENTORY_URL =
  "https://script.google.com/macros/s/AKfycbwVWTwWL_cD5NYV37Fu18bBIersfC-vaNLwEpg5ClIR94CZepGJs0JnbWqT8Is381C5/exec";
const INVENTORY_TIMEOUT_MS = 8000;
const LOW_AVAIL_THRESHOLD = 3;

function spaceRows() {
  return document.querySelectorAll("[data-space]");
}

function setRowState(row, state) {
  row.dataset.state = state;
  const priceEl = row.querySelector("[data-price]");
  const availEl = row.querySelector("[data-available]");
  const fallbackEl = row.querySelector("[data-fallback]");

  if (priceEl) priceEl.hidden = state === "fallback";
  if (availEl) availEl.hidden = state === "fallback";
  if (fallbackEl) fallbackEl.hidden = state !== "fallback";

  if (priceEl) priceEl.setAttribute("aria-busy", state === "loading" ? "true" : "false");
  if (availEl) availEl.setAttribute("aria-busy", state === "loading" ? "true" : "false");
}

function setAvailability(el, count) {
  const n = Math.max(0, Number(count) || 0);
  el.innerHTML =
    n === 1
      ? `<strong>${n}</strong> <span class="avail-label">space available</span>`
      : `<strong>${n}</strong> <span class="avail-label">spaces available</span>`;

  el.classList.toggle("rate-avail--low", n <= LOW_AVAIL_THRESHOLD);
  el.classList.toggle("rate-avail--none", n <= 0);
}

function setPrice(el, price) {
  el.innerHTML = `<span class="price-value">$${Number(price)}</span> <span class="price-suffix">/ month</span>`;
}

function applyInventory(data) {
  const spaces = data.spaces || data;
  let applied = 0;

  spaceRows().forEach((row) => {
    const id = row.getAttribute("data-space");
    const entry = spaces[id];

    if (!entry || entry.available == null || entry.price == null) {
      setRowState(row, "fallback");
      return;
    }

    const availEl = row.querySelector("[data-available]");
    const priceEl = row.querySelector("[data-price]");
    setAvailability(availEl, Number(entry.available));
    setPrice(priceEl, entry.price);
    setRowState(row, "ready");
    applied += 1;
  });

  if (applied === 0) throw new Error("Inventory payload had no usable rows");
}

function showAllFallback() {
  spaceRows().forEach((row) => setRowState(row, "fallback"));
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadInventory() {
  spaceRows().forEach((row) => setRowState(row, "loading"));

  try {
    const data = await fetchWithTimeout(INVENTORY_URL, INVENTORY_TIMEOUT_MS);
    applyInventory(data);
  } catch (err) {
    console.warn("Inventory unavailable; showing call-for-info fallback.", err);
    showAllFallback();
  }
}

document.getElementById("year").textContent = String(new Date().getFullYear());
loadInventory();
