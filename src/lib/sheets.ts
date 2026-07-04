// ── All requests are GET to avoid CORS preflight ────────────
// Read actions:  GET ?action=X&param=Y
// Write actions: GET ?payload=<encodeURIComponent(JSON)>
//
// Apps Script only triggers a CORS preflight for POST with
// Content-Type: application/json — GET requests go straight
// through with no preflight and the ACAO:* header is enough.

import { ApiResponse, PaymentRecord, AuthUser, AdminUserRow } from '../types';

let BASE_URL = '';
let TOKEN    = '';

export function setWebAppUrl(url: string) { BASE_URL = url; }
export function setToken(token: string)   { TOKEN = token; }
export function clearToken()              { TOKEN = ''; }

// ── Transport ────────────────────────────────────────────────

/** Simple GET with named query params (reads, public auth actions). */
async function get<T = unknown>(params: Record<string, string>): Promise<ApiResponse<T>> {
  if (!BASE_URL) throw new Error('Web App URL not configured');
  const url = new URL(BASE_URL);
  if (TOKEN) params = { ...params, token: TOKEN };
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Write action — sends payload as a single encoded JSON GET param. */
async function send<T = unknown>(body: Record<string, unknown>): Promise<ApiResponse<T>> {
  if (!BASE_URL) throw new Error('Web App URL not configured');
  if (TOKEN) body = { ...body, token: TOKEN };
  const url = new URL(BASE_URL);
  url.searchParams.set('payload', encodeURIComponent(JSON.stringify(body)));
  const res = await fetch(url.toString(), { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────

export async function signup(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const r = await send({ action: 'signup', email, password });
  if (!r.ok || !r.token || !r.user) throw new Error(r.error || 'Signup failed');
  return { token: r.token, user: r.user };
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const r = await send({ action: 'login', email, password });
  if (!r.ok || !r.token || !r.user) throw new Error(r.error || 'Login failed');
  return { token: r.token, user: r.user };
}

export async function logout(token: string): Promise<void> {
  await send({ action: 'logout', token });
}

// ── Admin ─────────────────────────────────────────────────────

export async function listUsers(): Promise<AdminUserRow[]> {
  const r = await get({ action: 'listUsers' });
  if (!r.ok) throw new Error(r.error || 'Failed to list users');
  return r.users ?? [];
}

// ── Payment data ──────────────────────────────────────────────

export async function listSheets(targetEmail?: string): Promise<string[]> {
  const p: Record<string, string> = { action: 'listSheets' };
  if (targetEmail) p.targetEmail = targetEmail;
  const r = await get(p);
  if (!r.ok) throw new Error(r.error || 'Failed to list sheets');
  return r.sheets ?? [];
}

export async function getRecords(sheetName: string, targetEmail?: string): Promise<PaymentRecord[]> {
  const p: Record<string, string> = { action: 'getRecords', sheet: sheetName };
  if (targetEmail) p.targetEmail = targetEmail;
  const r = await get(p);
  if (!r.ok) throw new Error(r.error || 'Failed to fetch records');
  return r.records ?? [];
}

export async function addRecord(
  sheetName: string,
  record: Omit<PaymentRecord, 'rowIndex'>,
  targetEmail?: string
): Promise<void> {
  const r = await send({ action: 'addRecord', sheetName, record, ...(targetEmail && { targetEmail }) });
  if (!r.ok) throw new Error(r.error || 'Failed to add record');
}

export async function updateRecord(
  sheetName: string,
  rowIndex: number,
  record: Omit<PaymentRecord, 'rowIndex'>,
  targetEmail?: string
): Promise<void> {
  const r = await send({ action: 'updateRecord', sheetName, rowIndex, record, ...(targetEmail && { targetEmail }) });
  if (!r.ok) throw new Error(r.error || 'Failed to update record');
}

export async function deleteRecord(sheetName: string, rowIndex: number, targetEmail?: string): Promise<void> {
  const r = await send({ action: 'deleteRecord', sheetName, rowIndex, ...(targetEmail && { targetEmail }) });
  if (!r.ok) throw new Error(r.error || 'Failed to delete record');
}

export async function toggleReceived(
  sheetName: string,
  rowIndex: number,
  received: boolean,
  targetEmail?: string
): Promise<void> {
  const r = await send({ action: 'toggleReceived', sheetName, rowIndex, received, ...(targetEmail && { targetEmail }) });
  if (!r.ok) throw new Error(r.error || 'Failed to update received status');
}

export async function getCollectionHistory(): Promise<{ date: string; totalAmount: number; details: string }[]> {
  const r = await get({ action: 'getCollectionHistory' });
  if (!r.ok) throw new Error(r.error || 'Failed to fetch collection history');
  return (r as any).history ?? [];
}

// ── Helpers ───────────────────────────────────────────────────

export function dateToMonthName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function currentMonthName(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatAmount(n: number): string {
  return parseFloat(String(n)).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
