// ============================================================
//  Payment Manager — Multi-User Apps Script Backend
//  Deploy: Extensions → Apps Script → Deploy → New Deployment
//          Type: Web App | Execute as: Me | Access: Anyone
//
//  ALL requests go through doGet() to avoid CORS preflight.
//  Mutating actions are sent as GET with ?payload=<JSON>.
// ============================================================

const MASTER_ID           = SpreadsheetApp.getActiveSpreadsheet().getId();
const USERS_SHEET         = "Users";
const SESSIONS_SHEET      = "Sessions";
const COLLECTIONS_SHEET   = "Collections";
const HEADER_ROW          = ["Date","Store Name / ID","Amount","Payment Method","Expense","Due Amount","Company Amount","Rider Amount","Remarks","Received"];
const USERS_HEADER        = ["Email","PasswordHash","Salt","Role","SpreadsheetId","CreatedAt"];
const SESSIONS_HEADER     = ["Token","Email","CreatedAt","ExpiresAt"];
const COLLECTIONS_HEADER  = ["Date","Total Amount","Details"];
const SESSION_TTL_MS      = 1000 * 60 * 60 * 24 * 7; // 7 days
const ADMIN_BOOTSTRAP_EMAIL = "";

// ── Single entry point — everything is a GET ────────────────
function doGet(e) {
  try {
    // If a "payload" param exists, it's a mutating action sent as GET
    const p = e.parameter.payload
      ? JSON.parse(decodeURIComponent(e.parameter.payload))
      : e.parameter;

    const result = dispatch(p);
    return respond(result);
  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

// Keep doPost as a fallback (won't be called by our client, but harmless)
function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    return respond(dispatch(p));
  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Dispatcher ───────────────────────────────────────────────
function dispatch(p) {
  const action = p.action;

  // Public actions (no auth required)
  if (action === "signup") return signup(p.email, p.password);
  if (action === "login")  return login(p.email, p.password);
  if (action === "logout") return logout(p.token);

  // Authenticated read actions
  if (action === "listSheets") return auth(p.token, (u) => ({ ok: true, sheets: listMonthlySheets(resolveId(u, p)) }));
  if (action === "getRecords") return auth(p.token, (u) => ({ ok: true, records: getRecords(resolveId(u, p), p.sheet) }));
  if (action === "listUsers")  return auth(p.token, (u) => { requireAdmin(u); return { ok: true, users: listUsers() }; });
  if (action === "getCollectionHistory") return auth(p.token, (u) => { requireAdmin(u); return { ok: true, history: getCollectionHistory() }; });

  // Authenticated write actions
  if (action === "addRecord")      return auth(p.token, (u) => addRecord(resolveId(u, p), p.sheetName, parseRecord(p.record)));
  if (action === "updateRecord")   return auth(p.token, (u) => { requireAdmin(u); return updateRecord(resolveId(u, p), p.sheetName, Number(p.rowIndex), parseRecord(p.record)); });
  if (action === "deleteRecord")   return auth(p.token, (u) => { requireAdmin(u); return deleteRecord(resolveId(u, p), p.sheetName, Number(p.rowIndex)); });
  if (action === "toggleReceived") return auth(p.token, (u) => { requireAdmin(u); return toggleReceived(resolveId(u, p), p.sheetName, Number(p.rowIndex), p.received === true || p.received === "true"); });

  return { ok: false, error: "Unknown action: " + action };
}

// When payload comes through URL params, nested objects arrive as JSON strings
function parseRecord(r) {
  if (typeof r === "string") r = JSON.parse(r);
  return r;
}

// ── Auth helpers ─────────────────────────────────────────────
function auth(token, fn) {
  const user = getUserFromToken(token);
  if (!user) return { ok: false, error: "Not authenticated. Please log in again." };
  return fn(user);
}

function requireAdmin(user) {
  if (user.role !== "admin") throw new Error("Admin access required");
}

function resolveId(user, params) {
  if (user.role === "admin" && params.targetEmail) {
    const target = findUserByEmail(params.targetEmail);
    if (!target) throw new Error("Target user not found");
    return target.spreadsheetId;
  }
  return user.spreadsheetId;
}

// ── Password / token helpers ─────────────────────────────────
function hashPassword(password, salt) {
  const raw = Utilities.computeHmacSha256Signature(password, salt);
  return raw.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0")).join("");
}

function makeSalt()  { return Utilities.getUuid(); }
function makeToken() { return Utilities.getUuid() + Utilities.getUuid(); }

// ── Master spreadsheet ───────────────────────────────────────
function getMaster() { return SpreadsheetApp.openById(MASTER_ID); }

function ensureMasterSheets() {
  const ss = getMaster();
  let users = ss.getSheetByName(USERS_SHEET);
  if (!users) {
    users = ss.insertSheet(USERS_SHEET);
    users.appendRow(USERS_HEADER);
    users.getRange(1,1,1,USERS_HEADER.length).setFontWeight("bold");
  }
  let sessions = ss.getSheetByName(SESSIONS_SHEET);
  if (!sessions) {
    sessions = ss.insertSheet(SESSIONS_SHEET);
    sessions.appendRow(SESSIONS_HEADER);
    sessions.getRange(1,1,1,SESSIONS_HEADER.length).setFontWeight("bold");
  }
  return { users, sessions };
}

function findUserByEmail(email) {
  const { users } = ensureMasterSheets();
  const data = users.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(email).toLowerCase()) {
      return { rowIndex: i+1, email: data[i][0], passwordHash: data[i][1],
               salt: data[i][2], role: data[i][3], spreadsheetId: data[i][4], createdAt: data[i][5] };
    }
  }
  return null;
}

function listUsers() {
  const { users } = ensureMasterSheets();
  return users.getDataRange().getValues().slice(1).map(r => ({
    email: r[0], role: r[3], spreadsheetId: r[4], createdAt: r[5]
  }));
}

function countUsers() {
  return Math.max(0, ensureMasterSheets().users.getLastRow() - 1);
}

// ── Auth actions ─────────────────────────────────────────────
function signup(email, password) {
  if (!email || !password) return { ok: false, error: "Email and password are required" };
  email = String(email).trim().toLowerCase();
  if (String(password).length < 6) return { ok: false, error: "Password must be at least 6 characters" };
  if (findUserByEmail(email)) return { ok: false, error: "An account with this email already exists" };

  const isFirst = countUsers() === 0;
  const role = isFirst || (ADMIN_BOOTSTRAP_EMAIL && email === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()) ? "admin" : "user";

  const ss = SpreadsheetApp.create("Payment Manager — " + email);
  const welcome = ss.getSheets()[0];
  welcome.setName("Welcome");
  welcome.getRange("A1").setValue("Your monthly payment sheets will appear here automatically.");

  const salt = makeSalt();
  const hash = hashPassword(String(password), salt);
  ensureMasterSheets().users.appendRow([email, hash, salt, role, ss.getId(), new Date().toISOString()]);

  const token = createSession(email);
  return { ok: true, token, user: { email, role, spreadsheetId: ss.getId() } };
}

function login(email, password) {
  if (!email || !password) return { ok: false, error: "Email and password are required" };
  email = String(email).trim().toLowerCase();
  const u = findUserByEmail(email);
  if (!u) return { ok: false, error: "No account found with this email" };
  if (hashPassword(String(password), u.salt) !== u.passwordHash) return { ok: false, error: "Incorrect password" };
  const token = createSession(email);
  return { ok: true, token, user: { email: u.email, role: u.role, spreadsheetId: u.spreadsheetId } };
}

function logout(token) {
  if (!token) return { ok: true };
  const { sessions } = ensureMasterSheets();
  const data = sessions.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) { sessions.deleteRow(i + 1); break; }
  }
  return { ok: true };
}

function createSession(email) {
  const { sessions } = ensureMasterSheets();
  const token = makeToken();
  const now = Date.now();
  sessions.appendRow([token, email, new Date(now).toISOString(), new Date(now + SESSION_TTL_MS).toISOString()]);
  return token;
}

function getUserFromToken(token) {
  if (!token) return null;
  const { sessions } = ensureMasterSheets();
  const data = sessions.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      if (Date.now() > new Date(data[i][3]).getTime()) { sessions.deleteRow(i+1); return null; }
      return findUserByEmail(data[i][1]);
    }
  }
  return null;
}

// ── Per-user Sheets CRUD ─────────────────────────────────────
function ensureSheet(spreadsheetId, sheetName) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(HEADER_ROW);
    const hr = sheet.getRange(1, 1, 1, HEADER_ROW.length);
    hr.setFontWeight("bold");
    hr.setBackground("#1E2D45");
    hr.setFontColor("#00D4AA");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADER_ROW.length - 1, 120);
    sheet.setColumnWidth(HEADER_ROW.length, 90);
    const welcome = ss.getSheetByName("Welcome");
    if (welcome && ss.getSheets().length > 1) ss.deleteSheet(welcome);
  }
  return sheet;
}

function listMonthlySheets(spreadsheetId) {
  return SpreadsheetApp.openById(spreadsheetId).getSheets()
    .map(s => s.getName())
    .filter(n => /^[A-Za-z]+ \d{4}$/.test(n))
    .sort((a, b) => new Date(b) - new Date(a));
}

function migrateSheetIfNeeded(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 8) {
    // Old format. Insert 2 columns after column 6 (Due Amount, which is index 6, 1-based)
    sheet.insertColumnsAfter(6, 2);
    // Now set the new headers
    sheet.getRange(1, 7).setValue("Company Amount");
    sheet.getRange(1, 8).setValue("Rider Amount");
    // Ensure formatting
    const hr = sheet.getRange(1, 1, 1, HEADER_ROW.length);
    hr.setFontWeight("bold");
    hr.setBackground("#1E2D45");
    hr.setFontColor("#00D4AA");
    // Fill existing empty cells with 0
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const companyRange = sheet.getRange(2, 7, lastRow - 1, 1);
      const riderRange = sheet.getRange(2, 8, lastRow - 1, 1);
      companyRange.setValue(0);
      riderRange.setValue(0);
    }
  }
}

function getRecords(spreadsheetId, sheetName) {
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) return [];
  migrateSheetIfNeeded(sheet);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map((row, i) => ({
    rowIndex: i + 2,
    date:     row[0] instanceof Date ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(row[0]),
    store:    String(row[1] || ""),
    amount:   parseFloat(row[2]) || 0,
    method:   String(row[3] || ""),
    expense:  String(row[4] || ""),
    due:      parseFloat(row[5]) || 0,
    companyAmount: parseFloat(row[6]) || 0,
    riderAmount:   parseFloat(row[7]) || 0,
    remarks:  String(row[8] || ""),
    received: row[9] === true || String(row[9]).toUpperCase() === "TRUE"
  }));
}

function addRecord(spreadsheetId, sheetName, record) {
  const sheet = ensureSheet(spreadsheetId, sheetName);
  migrateSheetIfNeeded(sheet);
  sheet.appendRow([
    record.date,
    record.store,
    record.amount,
    record.method,
    record.expense,
    record.due,
    record.companyAmount || 0,
    record.riderAmount || 0,
    record.remarks,
    !!record.received
  ]);
  return { ok: true };
}

function updateRecord(spreadsheetId, sheetName, rowIndex, record) {
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: "Sheet not found" };
  migrateSheetIfNeeded(sheet);
  sheet.getRange(rowIndex, 1, 1, 10).setValues([[
    record.date, record.store, record.amount, record.method,
    record.expense, record.due, record.companyAmount || 0, record.riderAmount || 0,
    record.remarks, !!record.received
  ]]);
  return { ok: true };
}

function deleteRecord(spreadsheetId, sheetName, rowIndex) {
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: "Sheet not found" };
  sheet.deleteRow(rowIndex);
  return { ok: true };
}

function toggleReceived(spreadsheetId, sheetName, rowIndex, received) {
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: "Sheet not found" };
  migrateSheetIfNeeded(sheet);

  if (received) {
    // Retrieve record's current values
    const row = sheet.getRange(rowIndex, 1, 1, 10).getValues()[0];
    const store = String(row[1] || "");
    const amount = parseFloat(row[2]) || 0;
    const due = parseFloat(row[5]) || 0;
    const companyAmount = parseFloat(row[6]) || 0;
    const riderAmount = parseFloat(row[7]) || 0;

    // Total amount collected
    const totalCollected = amount + due + companyAmount + riderAmount;

    // Retrieve user email
    const userEmail = findEmailBySpreadsheetId(spreadsheetId);
    const dateStr = row[0] instanceof Date ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(row[0]);
    const details = `User: ${userEmail || 'Unknown'}, Store: ${store}, Bill Date: ${dateStr}, Original: Amount=${amount.toFixed(2)}, Due=${due.toFixed(2)}, Company=${companyAmount.toFixed(2)}, Rider=${riderAmount.toFixed(2)}`;

    // Log to Collection History
    saveCollectionHistory(new Date(), totalCollected, details);

    // Reset financial amounts to 0.00 and set Received to true
    sheet.getRange(rowIndex, 3).setValue(0);
    sheet.getRange(rowIndex, 6).setValue(0);
    sheet.getRange(rowIndex, 7).setValue(0);
    sheet.getRange(rowIndex, 8).setValue(0);
    sheet.getRange(rowIndex, 10).setValue(true);
  } else {
    sheet.getRange(rowIndex, 10).setValue(false);
  }
  return { ok: true };
}

function findEmailBySpreadsheetId(spreadsheetId) {
  const { users } = ensureMasterSheets();
  const data = users.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][4] === spreadsheetId) {
      return data[i][0];
    }
  }
  return null;
}

function ensureCollectionsSheet() {
  const ss = getMaster();
  let collections = ss.getSheetByName(COLLECTIONS_SHEET);
  if (!collections) {
    collections = ss.insertSheet(COLLECTIONS_SHEET);
    collections.appendRow(COLLECTIONS_HEADER);
    const hr = collections.getRange(1, 1, 1, COLLECTIONS_HEADER.length);
    hr.setFontWeight("bold");
    hr.setBackground("#1E2D45");
    hr.setFontColor("#00D4AA");
    collections.setFrozenRows(1);
    collections.setColumnWidth(1, 150);
    collections.setColumnWidth(2, 120);
    collections.setColumnWidth(3, 400);
  }
  return collections;
}

function saveCollectionHistory(date, totalAmount, details) {
  const sheet = ensureCollectionsSheet();
  const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone() || "GMT+6", "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([dateStr, totalAmount, details]);
}

function getCollectionHistory() {
  const sheet = ensureCollectionsSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map((row) => ({
    date: String(row[0]),
    totalAmount: parseFloat(row[1]) || 0,
    details: String(row[2] || "")
  })).reverse();
}
