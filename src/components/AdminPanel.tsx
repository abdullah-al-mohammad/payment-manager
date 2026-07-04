import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, ExternalLink, Users as UsersIcon, History } from 'lucide-react';
import { AdminUserRow } from '../types';
import * as api from '../lib/sheets';

interface Props {
  open: boolean;
  onClose: () => void;
  onImpersonate: (email: string) => void;
  currentEmail: string;
}

export default function AdminPanel({ open, onClose, onImpersonate, currentEmail }: Props) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');
  const [history, setHistory] = useState<{ date: string; totalAmount: number; details: string }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (activeTab === 'users') {
      setLoading(true);
      setError('');
      api.listUsers()
        .then(setUsers)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load users'))
        .finally(() => setLoading(false));
    } else {
      setLoadingHistory(true);
      setHistoryError('');
      api.getCollectionHistory()
        .then(setHistory)
        .catch((e) => setHistoryError(e instanceof Error ? e.message : 'Failed to load history'))
        .finally(() => setLoadingHistory(false));
    }
  }, [open, activeTab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-[640px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-teal" />
            <h2 className="text-[15px] font-bold">Admin Control Panel</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border px-5 pt-2 gap-4 bg-card-hi/30">
          <button
            onClick={() => setActiveTab('users')}
            className={`text-[13px] font-medium pb-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'users' ? 'border-teal text-teal' : 'border-transparent text-muted hover:text-slate-200'
            }`}
          >
            <UsersIcon size={14} />
            Users
            <span className="text-[10px] text-faint bg-surface rounded-full px-1.5 py-0.2 ml-1">{users.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`text-[13px] font-medium pb-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'history' ? 'border-teal text-teal' : 'border-transparent text-muted hover:text-slate-200'
            }`}
          >
            <History size={14} />
            Collection History
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'users' ? (
            loading ? (
              <div className="text-center py-10 text-faint">
                <div className="w-7 h-7 border-[3px] border-border border-t-teal rounded-full animate-spin mx-auto mb-3" />
                Loading users…
              </div>
            ) : error ? (
              <div className="text-center py-10 text-rose text-[13px]">{error}</div>
            ) : !users.length ? (
              <div className="text-center py-10 text-faint">
                <UsersIcon size={32} className="mx-auto mb-2" />
                No users yet
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[10.5px] text-faint uppercase tracking-wide">
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Joined</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.email} className="border-t border-border hover:bg-card-hi transition-colors">
                      <td className="px-3 py-2.5 text-[13px]">
                        {u.email}
                        {u.email === currentEmail && (
                          <span className="text-[10px] text-teal bg-teal-dim rounded-full px-1.5 py-0.5 ml-1.5">you</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            u.role === 'admin' ? 'bg-amber/10 text-amber' : 'bg-sky/10 text-sky'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-muted font-mono">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => { onImpersonate(u.email); onClose(); }}
                          className="text-[11.5px] text-teal hover:underline flex items-center gap-1 ml-auto"
                        >
                          View data <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            loadingHistory ? (
              <div className="text-center py-10 text-faint">
                <div className="w-7 h-7 border-[3px] border-border border-t-teal rounded-full animate-spin mx-auto mb-3" />
                Loading history…
              </div>
            ) : historyError ? (
              <div className="text-center py-10 text-rose text-[13px]">{historyError}</div>
            ) : !history.length ? (
              <div className="text-center py-10 text-faint">
                No collection records found
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[10.5px] text-faint uppercase tracking-wide">
                    <th className="px-3 py-2 w-[160px]">Date Collected</th>
                    <th className="px-3 py-2 w-[100px]">Total</th>
                    <th className="px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-t border-border hover:bg-card-hi transition-colors">
                      <td className="px-3 py-2.5 text-[12px] text-muted font-mono whitespace-nowrap">
                        {h.date}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-teal font-semibold font-mono whitespace-nowrap">
                        ৳{api.formatAmount(h.totalAmount)}
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-muted leading-relaxed max-w-[300px] break-words whitespace-pre-wrap">
                        {h.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
