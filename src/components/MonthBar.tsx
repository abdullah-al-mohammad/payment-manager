import React from 'react';
import { currentMonthName } from '../lib/sheets';

interface Props {
  sheets: string[];
  active: string;
  loading: boolean;
  onSwitch: (name: string) => void;
}

export default function MonthBar({ sheets, active, loading, onSwitch }: Props) {
  const cur = currentMonthName();

  if (loading) {
    return (
      <nav className="bg-surface border-b border-border px-5 flex items-center h-[42px]">
        <span className="text-faint text-[12px]">Loading sheets…</span>
      </nav>
    );
  }

  if (!sheets.length) {
    return (
      <nav className="bg-surface border-b border-border px-5 flex items-center h-[42px]">
        <span className="text-faint text-[12px]">No monthly sheets yet — save your first record.</span>
      </nav>
    );
  }

  return (
    <nav className="bg-surface border-b border-border px-5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0">
      {sheets.map((s) => (
        <div
          key={s}
          onClick={() => onSwitch(s)}
          className={`px-3.5 py-2.5 text-[12.5px] font-medium cursor-pointer whitespace-nowrap border-b-2 transition-colors select-none ${
            s === active
              ? 'text-teal border-teal'
              : 'text-muted border-transparent hover:text-slate-100'
          }`}
        >
          {s}
          {s === cur && (
            <span className="text-[10px] text-teal bg-teal-dim rounded-full px-1.5 py-0.5 ml-1.5">
              now
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
