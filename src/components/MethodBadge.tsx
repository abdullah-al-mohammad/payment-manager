import React from 'react';

const COLOR_MAP: Record<string, string> = {
  Cash: 'bg-emerald/10 text-emerald',
  Card: 'bg-sky/10 text-sky',
  'Bank Transfer': 'bg-violet/10 text-violet',
  bKash: 'bg-pink-500/10 text-pink-400',
  Nagad: 'bg-orange-500/10 text-orange-400',
  Rocket: 'bg-violet/10 text-violet',
  Cheque: 'bg-amber/10 text-amber',
};

export default function MethodBadge({ method }: { method: string }) {
  if (!method) return <span className="text-faint">—</span>;
  const cls = COLOR_MAP[method] || 'bg-slate-500/10 text-slate-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${cls}`}>
      {method}
    </span>
  );
}
