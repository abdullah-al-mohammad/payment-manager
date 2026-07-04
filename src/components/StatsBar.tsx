import React from 'react';
import { PaymentRecord } from '../types';
import { formatAmount } from '../lib/sheets';

interface Props {
  records: PaymentRecord[];
}

export default function StatsBar({ records }: Props) {
  const total = records.reduce((s, r) => s + r.amount, 0);
  const due = records.reduce((s, r) => s + r.due, 0);
  const company = records.reduce((s, r) => s + (r.companyAmount ?? 0), 0);
  const rider = records.reduce((s, r) => s + (r.riderAmount ?? 0), 0);
  const paid = Math.max(0, total - due);

  const stats = [
    { label: 'Total Amount', value: `৳${formatAmount(total)}`, color: 'text-teal' },
    { label: 'Outstanding Due', value: `৳${formatAmount(due)}`, color: 'text-amber' },
    { label: 'Total Company', value: `৳${formatAmount(company)}`, color: 'text-teal' },
    { label: 'Total Rider', value: `৳${formatAmount(rider)}`, color: 'text-teal' },
    { label: 'Paid / Cleared', value: `৳${formatAmount(paid)}`, color: 'text-emerald' },
    { label: 'Records', value: String(records.length), color: 'text-slate-100' },
  ];

  return (
    <div className="bg-surface border-b border-border px-5 py-2.5 flex gap-2.5 overflow-x-auto scrollbar-hide">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-card border border-border rounded-lg px-4 py-2.5 min-w-[130px] flex-1"
        >
          <div className="text-[10.5px] text-faint uppercase tracking-wide">{s.label}</div>
          <div className={`text-[20px] font-bold font-mono mt-0.5 ${s.color}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
