import { CalendarClock, Plus, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { dateToMonthName } from '../lib/sheets';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, PaymentRecord, STORE_NAME } from '../types';

interface Props {
  editing: PaymentRecord | null;
  editingSheet: string;
  onSave: (
    record: Omit<PaymentRecord, 'rowIndex'>,
    editRowIndex?: number,
    editSheet?: string
  ) => Promise<void>;
  onCancelEdit: () => void;
}

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  storeName: '',
  storeId: '',
  amount: '',
  due: '',
  parcelCost: '',
  companyAmount: '',
  riderAmount: '',
  method: '',
  expense: '',
  remarks: '',
};

export default function PaymentForm({ editing, editingSheet, onSave, onCancelEdit }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const amount = parseFloat(form.amount) || 0;

  let transactionType: 'Collection' | 'Expense' | 'Transfer' = 'Collection';

  if (form.expense) {
    if (['bKash', 'Nagad', 'Rocket', 'Bank'].includes(form.method)) {
      transactionType = 'Transfer';
    } else {
      transactionType = 'Expense';
    }
  }

  useEffect(() => {
    if (editing) {
      const [storeName, storeId] = editing.store.split(' / ');
      setForm({
        date: editing.date,
        storeName: storeName || '',
        storeId: storeId || '',
        amount: String(editing.amount),
        due: String(editing.due),
        parcelCost: String(editing.parcelCost ?? ''),
        companyAmount: String(editing.companyAmount ?? ''),
        riderAmount: String(editing.riderAmount ?? ''),
        method: editing.method,
        expense: editing.expense,
        remarks: editing.remarks,
      });
    }
  }, [editing]);

  const set = useCallback((key: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  const reset = () => setForm(emptyForm);

  const handleCancel = () => {
    reset();
    onCancelEdit();
  };

  const parcelCostVal = parseFloat(form.parcelCost) || 0;
  const isOnlineMethod = ['bKash', 'Nagad', 'Rocket', 'Bank'].includes(form.method);

  // Contextual cash flow hint
  const parcelHint = (() => {
    if (!parcelCostVal || !form.method) return null;
    if (isOnlineMethod) {
      return `৳${parcelCostVal} deducted from Hand Cash → transferred to Online`;
    }
    return `৳${parcelCostVal} will be recorded as Cash Expense`;
  })();

  const handleSubmit = async () => {
    const store = [form.storeName.trim(), form.storeId.trim()].filter(Boolean).join(' / ');
    const amount = parseFloat(form.amount) || 0;

    if (!form.date || !form.method) {
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          date: form.date,
          store,
          amount,
          method: form.method,
          expense: form.expense,
          transactionType,
          due: parseFloat(form.due) || 0,
          parcelCost: parcelCostVal,
          companyAmount: parseFloat(form.companyAmount) || 0,
          riderAmount: parseFloat(form.riderAmount) || 0,
          remarks: form.remarks.trim(),
          received: editing?.received ?? false,
        },
        editing?.rowIndex,
        editingSheet
      );
      reset();
      onCancelEdit();
    } finally {
      setSaving(false);
    }
  };

  const monthHint = form.date ? dateToMonthName(form.date) : '';
  const inputCls =
    'w-full bg-card border border-border rounded-md px-2.5 py-2 text-[13px] outline-none transition-colors focus:border-teal focus:ring-[3px] focus:ring-teal-dim';

  return (
    <div className="flex flex-col gap-3.5">
      <div className="text-[11px] font-semibold text-faint uppercase tracking-wide flex items-center gap-1.5 pb-2 border-b border-border">
        {editing ? <Save size={13} /> : <Plus size={13} />}
        <span>{editing ? 'Edit Payment' : 'New Payment'}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-medium text-muted">Date</label>
        <input
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
          className={inputCls}
        />
      </div>

      {form.date && (
        <div className="text-[11px] text-teal bg-teal-dim rounded-md px-2 py-1.5 flex items-center gap-1.5">
          <CalendarClock size={13} />
          <span>Saves to sheet: {monthHint}</span>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11.5px] font-medium text-muted">Store Name</label>
          <select
            value={form.storeName}
            onChange={e => set('storeName', e.target.value)}
            className={inputCls}
          >
            <option value="">Select Store Name…</option>
            {STORE_NAME.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11.5px] font-medium text-muted">Store ID</label>
          <input
            type="text"
            value={form.storeId}
            onChange={e => set('storeId', e.target.value)}
            placeholder="STR-001"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11.5px] font-medium text-muted">Amount (৳)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint font-mono text-[12px] pointer-events-none">
              ৳
            </span>
            <input
              type="number"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`${inputCls} pl-[22px] font-mono`}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11.5px] font-medium text-muted">Expense / Balance (৳)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint font-mono text-[12px] pointer-events-none">
              ৳
            </span>
            <input
              type="number"
              value={form.due}
              onChange={e => set('due', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`${inputCls} pl-[22px] font-mono`}
            />
          </div>
        </div>
      </div>

      {/* Parcel Cost */}
      <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-medium text-muted">Parcel Cost (৳)</label>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint font-mono text-[12px] pointer-events-none">
            ৳
          </span>
          <input
            type="number"
            value={form.parcelCost}
            onChange={e => set('parcelCost', e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={`${inputCls} pl-[22px] font-mono`}
          />
        </div>
        {parcelHint && (
          <div className="text-[11px] text-amber bg-amber/10 rounded-md px-2 py-1.5 flex items-start gap-1.5 mt-0.5">
            <span className="mt-0.5">⚡</span>
            <span>{parcelHint}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11.5px] font-medium text-muted">Company Amount (৳)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint font-mono text-[12px] pointer-events-none">
              ৳
            </span>
            <input
              type="number"
              value={form.companyAmount}
              onChange={e => set('companyAmount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`${inputCls} pl-[22px] font-mono`}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11.5px] font-medium text-muted">Rider Amount (৳)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint font-mono text-[12px] pointer-events-none">
              ৳
            </span>
            <input
              type="number"
              value={form.riderAmount}
              onChange={e => set('riderAmount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`${inputCls} pl-[22px] font-mono`}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-medium text-muted">Payment Method</label>
        <select
          value={form.method}
          onChange={e => set('method', e.target.value)}
          className={inputCls}
        >
          <option value="">Select method…</option>
          {PAYMENT_METHODS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-medium text-muted">Transaction Type</label>
        <select
          value={form.transactionType}
          onChange={e => set('transactionType', e.target.value as TransactionType)}
          className={inputCls}
        >
          <option value="Collection">Collection</option>
          <option value="Expense">Expense</option>
          <option value="Transfer">Transfer</option>
        </select>
      </div> */}

      <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-medium text-muted">Expense Category</label>
        <select
          value={form.expense}
          onChange={e => set('expense', e.target.value)}
          className={inputCls}
        >
          <option value="">Select category…</option>
          {EXPENSE_CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-medium text-muted">Remarks</label>
        <textarea
          value={form.remarks}
          onChange={e => set('remarks', e.target.value)}
          placeholder="Optional notes…"
          rows={3}
          className={`${inputCls} resize-y min-h-[60px]`}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving || !form.date || !form.method}
        className="w-full py-2.5 bg-teal text-bg rounded-lg font-bold text-[13.5px] flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Save size={15} />
        {saving ? 'Saving…' : editing ? 'Update Payment' : 'Save Payment'}
      </button>

      {editing && (
        <button
          onClick={handleCancel}
          className="w-full py-2 bg-transparent border border-border-hi text-muted rounded-md text-[13px] hover:border-rose hover:text-rose transition-colors"
        >
          Cancel edit
        </button>
      )}
    </div>
  );
}
