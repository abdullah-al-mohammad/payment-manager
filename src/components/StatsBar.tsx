import { formatAmount } from '../lib/sheets';
import { PaymentRecord } from '../types';

interface Props {
  records: PaymentRecord[];
}

export default function StatsBar({ records }: Props) {
  // const total = records.reduce((sum, r) => sum + r.amount, 0);

  // const due = records.reduce((sum, r) => sum + r.due, 0);

  // const company = records.reduce((sum, r) => sum + (r.companyAmount ?? 0), 0);

  // const rider = records.reduce((sum, r) => sum + (r.riderAmount ?? 0), 0);

  // let handCash = 0;
  // let totalCash = 0;
  // let onlinePaid = 0;
  // let cashExpense = 0;

  // records.forEach(r => {
  //   switch (r.transactionType) {
  //     case 'Collection':
  //       totalCash += r.amount;

  //       if (r.method === 'Cash') {
  //         handCash += r.amount;
  //       }
  //       break;

  //     case 'Expense':
  //       totalCash += r.amount;
  //       handCash += r.amount - r.due;
  //       cashExpense += r.due;
  //       break;

  //     case 'Transfer':
  //       totalCash += r.amount;
  //       handCash -= r.amount;
  //       onlinePaid += r.amount;
  //       break;
  //   }
  // });
  const due     = records.reduce((sum, r) => sum + r.due, 0);
  const company = records.reduce((sum, r) => sum + (r.companyAmount ?? 0), 0);
  const rider   = records.reduce((sum, r) => sum + (r.riderAmount ?? 0), 0);

  let handCash  = 0;
  let onlinePaid = 0;
  let cashExpense = 0;

  records.forEach(r => {
    const isOnline = ['bKash', 'Nagad', 'Rocket', 'Bank'].includes(r.method);

    // 1. Accumulate collections based on payment method
    if (isOnline) {
      onlinePaid += r.amount;
    } else if (r.method === 'Cash') {
      handCash += r.amount;
    }

    // 2. Deduct expenses from Hand Cash first (and add to cashExpense)
    // An expense is either a parcelCost or a standalone/order expense recorded in r.due
    const expenseAmt = (r.expense ? r.due : 0) + (r.parcelCost ?? 0);
    handCash -= expenseAmt;
    cashExpense += expenseAmt;
  });

  // Total Cash = Hand Cash + Online — always the true net position.
  // (parcel costs reduce handCash, so they are already excluded here)
  const totalCash = handCash + onlinePaid;

  const stats = [
    {
      label: 'Total Cash',
      value: `৳${formatAmount(totalCash)}`,
      color: 'text-cyan',
    },
    {
      label: 'Hand Cash',
      value: `৳${formatAmount(handCash)}`,
      color: handCash >= 0 ? 'text-emerald' : 'text-rose',
    },
    {
      label: 'Online Paid',
      value: `৳${formatAmount(onlinePaid)}`,
      color: 'text-sky',
    },
    {
      label: 'Cash Expense',
      value: `৳${formatAmount(cashExpense)}`,
      color: 'text-rose',
    },
    {
      label: 'Total Expense',
      value: `৳${formatAmount(due)}`,
      color: 'text-rose',
    },
    {
      label: 'Total Company',
      value: `৳${formatAmount(company)}`,
      color: 'text-teal',
    },
    {
      label: 'Total Rider',
      value: `৳${formatAmount(rider)}`,
      color: 'text-teal',
    },
    {
      label: 'Records',
      value: String(records.length),
      color: 'text-slate-100',
    },
  ];

  return (
    <div className="bg-surface border-b border-border px-5 py-2.5 flex gap-2.5 overflow-x-auto scrollbar-hide">
      {stats.map(s => (
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
