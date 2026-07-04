import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Inbox, AlertTriangle, Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { PaymentRecord, SortField, SortDir, PAYMENT_METHODS, EXPENSE_CATEGORIES } from '../types';
import { formatAmount } from '../lib/sheets';
import MethodBadge from './MethodBadge';

interface Props {
  records: PaymentRecord[];
  activeSheet: string;
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  onRefresh: () => void;
  onEdit: (rec: PaymentRecord) => void;
  onDelete: (rowIndex: number) => void;
  onToggleReceived: (rowIndex: number, received: boolean) => void;
  isAdmin: boolean;
}

const PER_PAGE = 20;

export default function PaymentTable({
  records, activeSheet, loading, error, lastSync, onRefresh, onEdit, onDelete, onToggleReceived, isAdmin,
}: Props) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [expenseFilter, setExpenseFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>(-1);
  const [page, setPage] = useState(1);
  const totalCols = isAdmin ? 11 : 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((r) => {
      const matchQ = !q || [r.store, r.method, r.expense, r.remarks, r.date]
        .some((v) => v.toLowerCase().includes(q));
      const matchM = !methodFilter || r.method === methodFilter;
      const matchE = !expenseFilter || r.expense === expenseFilter;
      return matchQ && matchM && matchE;
    });
  }, [records, search, methodFilter, expenseFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = a[sortField];
      let bv: string | number = b[sortField];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return av < bv ? -sortDir : av > bv ? sortDir : 0;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 1 ? -1 : 1) as SortDir);
    else { setSortField(field); setSortDir(-1); }
  };

  const SortArrow = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === 1 ? <ArrowUp size={11} className="inline text-teal ml-1" /> : <ArrowDown size={11} className="inline text-teal ml-1" />
    ) : null;

  const th = (field: SortField, label: string) => (
    <th
      onClick={() => handleSort(field)}
      className="px-3.5 py-2.5 text-left text-[10.5px] font-semibold text-faint uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-teal transition-colors"
    >
      {label}<SortArrow field={field} />
    </th>
  );

  return (
    <main className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search store, method, expense, remarks…"
            className="w-full bg-card border border-border rounded-md py-1.5 pl-[30px] pr-2.5 text-[13px] outline-none focus:border-teal transition-colors"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded-md px-2.5 py-1.5 text-muted text-[12.5px] cursor-pointer outline-none"
        >
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select
          value={expenseFilter}
          onChange={(e) => { setExpenseFilter(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded-md px-2.5 py-1.5 text-muted text-[12.5px] cursor-pointer outline-none"
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={onRefresh}
          className="bg-card border border-border rounded-md text-muted px-2.5 py-1.5 text-[12.5px] flex items-center gap-1.5 hover:border-teal hover:text-teal transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync
        </button>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-[11.5px] text-faint">
        <span>
          {sorted.length} record{sorted.length !== 1 ? 's' : ''}
          {sorted.length < records.length ? ` (filtered from ${records.length})` : ''} · {activeSheet}
        </span>
        <span>Synced: {lastSync ? lastSync.toLocaleTimeString() : '—'}</span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead className="bg-card">
            <tr>
              {th('date', 'Date')}
              {th('store', 'Store')}
              {th('amount', 'Amount')}
              <th className="px-3.5 py-2.5 text-left text-[10.5px] font-semibold text-faint uppercase tracking-wide">Method</th>
              <th className="px-3.5 py-2.5 text-left text-[10.5px] font-semibold text-faint uppercase tracking-wide">Expense</th>
              {th('due', 'Due')}
              <th className="px-3.5 py-2.5 text-left text-[10.5px] font-semibold text-faint uppercase tracking-wide">Company</th>
              <th className="px-3.5 py-2.5 text-left text-[10.5px] font-semibold text-faint uppercase tracking-wide">Rider</th>
              <th className="px-3.5 py-2.5 text-left text-[10.5px] font-semibold text-faint uppercase tracking-wide">Remarks</th>
              <th className="px-3.5 py-2.5 text-center text-[10.5px] font-semibold text-faint uppercase tracking-wide">Received</th>
              {isAdmin && <th className="px-3.5 py-2.5 text-left text-[10.5px] font-semibold text-faint uppercase tracking-wide">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={totalCols}>
                <div className="text-center py-14 text-faint">
                  <div className="w-8 h-8 border-[3px] border-border border-t-teal rounded-full animate-spin mx-auto mb-3" />
                  <p>Loading records…</p>
                </div>
              </td></tr>
            ) : error ? (
              <tr><td colSpan={totalCols}>
                <div className="text-center py-14 text-faint">
                  <AlertTriangle size={42} className="mx-auto mb-3 text-rose" />
                  <h3 className="text-[15px] text-rose mb-1">Failed to load</h3>
                  <p>{error}</p>
                </div>
              </td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={totalCols}>
                <div className="text-center py-14 text-faint">
                  <Inbox size={42} className="mx-auto mb-3" />
                  <h3 className="text-[15px] text-muted mb-1">
                    {records.length ? 'No matching records' : 'No records this month'}
                  </h3>
                  <p>{records.length ? 'Clear your search filters' : 'Add a payment using the form on the left'}</p>
                </div>
              </td></tr>
            ) : (
              pageRows.map((r) => (
                <tr
                  key={r.rowIndex}
                  className={`border-t border-border transition-colors ${
                    r.received
                      ? 'bg-emerald/5 hover:bg-emerald/10'
                      : 'hover:bg-card-hi'
                  }`}
                >
                  <td className={`px-3.5 py-2.5 text-[12px] font-mono ${r.received ? 'line-through text-faint' : 'text-muted'}`}>{r.date}</td>
                  <td className={`px-3.5 py-2.5 ${r.received ? 'line-through text-faint' : ''}`}>
                    <span className="font-medium">{r.store}</span>
                  </td>
                  <td className={`px-3.5 py-2.5 font-mono font-semibold ${r.received ? 'line-through text-faint' : 'text-teal'}`}>
                    ৳{formatAmount(r.amount)}
                  </td>
                  <td className="px-3.5 py-2.5"><MethodBadge method={r.method} /></td>
                  <td className={`px-3.5 py-2.5 text-[12px] ${r.received ? 'line-through text-faint' : 'text-muted'}`}>{r.expense}</td>
                  <td className={`px-3.5 py-2.5 font-mono font-semibold ${r.received ? 'line-through text-faint' : r.due > 0 ? 'text-amber' : 'text-emerald'}`}>
                    ৳{formatAmount(r.due)}
                  </td>
                  <td className={`px-3.5 py-2.5 font-mono font-semibold ${r.received ? 'line-through text-faint' : 'text-teal'}`}>
                    ৳{formatAmount(r.companyAmount ?? 0)}
                  </td>
                  <td className={`px-3.5 py-2.5 font-mono font-semibold ${r.received ? 'line-through text-faint' : 'text-teal'}`}>
                    ৳{formatAmount(r.riderAmount ?? 0)}
                  </td>
                  <td className={`px-3.5 py-2.5 text-[12px] max-w-[130px] truncate ${r.received ? 'line-through text-faint' : 'text-muted'}`} title={r.remarks}>
                    {r.remarks || '—'}
                  </td>

                  {/* ── Cash Received checkbox ── */}
                  <td className="px-3.5 py-2.5 text-center">
                    {isAdmin ? (
                      <label className="inline-flex items-center justify-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={r.received}
                          onChange={(e) => {
                            const val = e.target.checked;
                            if (val) {
                              const ok = window.confirm(
                                'Are you sure you want to mark this bill as received?\nThis will reset all related financial amounts (Amount, Due, Company, Rider) to 0.00 and log the collection to history.'
                              );
                              if (ok) onToggleReceived(r.rowIndex, true);
                            } else {
                              const ok = window.confirm(
                                'Unmarking this bill as received will not restore its original financial amounts (they will remain 0.00).\nDo you want to proceed?'
                              );
                              if (ok) onToggleReceived(r.rowIndex, false);
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                          ${r.received
                            ? 'bg-emerald border-emerald'
                            : 'border-border group-hover:border-emerald bg-transparent'
                          }`}
                        >
                          {r.received && (
                            <svg viewBox="0 0 10 8" className="w-3 h-3 text-bg fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 4l2.5 2.5L9 1" />
                            </svg>
                          )}
                        </div>
                      </label>
                    ) : (
                      <div className="inline-flex items-center justify-center">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                          ${r.received
                            ? 'bg-emerald border-emerald'
                            : 'border-border bg-transparent'
                          }`}
                        >
                          {r.received && (
                            <svg viewBox="0 0 10 8" className="w-3 h-3 text-bg fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 4l2.5 2.5L9 1" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {isAdmin && (
                    <td className="px-3.5 py-2.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onEdit(r)}
                          title="Edit"
                          className="w-7 h-7 rounded-md bg-sky/10 text-sky flex items-center justify-center hover:bg-sky/20 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(r.rowIndex)}
                          title="Delete"
                          className="w-7 h-7 rounded-md bg-rose/10 text-rose flex items-center justify-center hover:bg-rose/20 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
            className="w-[30px] h-[30px] bg-card border border-border rounded-md text-muted flex items-center justify-center hover:border-teal hover:text-teal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-faint px-1">…</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`w-[30px] h-[30px] border rounded-md text-[12.5px] flex items-center justify-center transition-colors ${
                    p === safePage ? 'border-teal text-teal bg-teal-dim' : 'bg-card border-border text-muted hover:border-teal hover:text-teal'
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}
          <button
            disabled={safePage === totalPages}
            onClick={() => setPage(safePage + 1)}
            className="w-[30px] h-[30px] bg-card border border-border rounded-md text-muted flex items-center justify-center hover:border-teal hover:text-teal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </main>
  );
}
