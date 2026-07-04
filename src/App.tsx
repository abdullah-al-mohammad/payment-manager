import React, { useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import MonthBar from './components/MonthBar';
import StatsBar from './components/StatsBar';
import PaymentForm from './components/PaymentForm';
import PaymentTable from './components/PaymentTable';
import AdminPanel from './components/AdminPanel';
import { useAuth } from './hooks/useAuth';
import { usePayments } from './hooks/usePayments';
import { setWebAppUrl } from './lib/sheets';
import { PaymentRecord } from './types';

const URL_KEY = 'pmWebAppUrl';

// ── Boot: restore URL into the API client immediately (before any render) ──
const savedUrl = localStorage.getItem(URL_KEY) || '';
if (savedUrl) setWebAppUrl(savedUrl);

export default function App() {
  const { user, ready, signup, login, logout } = useAuth();
  const [webAppUrl, setWebAppUrlState] = useState(() => localStorage.getItem(URL_KEY) || '');
  const [editing, setEditing] = useState<PaymentRecord | null>(null);
  const [editingSheet, setEditingSheet] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [viewingEmail, setViewingEmail] = useState<string | undefined>(undefined);

  const {
    monthSheets, activeSheet, records,
    loadingSheets, loadingRecords, error, lastSync,
    switchSheet, saveRecord, removeRecord, toggleReceivedRecord, refresh,
  } = usePayments(!!user, viewingEmail);

  const handleUrlChange = useCallback((url: string) => {
    localStorage.setItem(URL_KEY, url);
    setWebAppUrlState(url);
    setWebAppUrl(url);
  }, []);

  const handleSave = useCallback(async (
    record: Omit<PaymentRecord, 'rowIndex'>,
    editRowIndex?: number,
    editSheet?: string
  ) => {
    try {
      await saveRecord(record, editRowIndex, editSheet);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
      throw e;
    }
  }, [saveRecord]);

  const handleEdit = useCallback((rec: PaymentRecord) => {
    setEditing(rec);
    setEditingSheet(activeSheet);
  }, [activeSheet]);

  const handleCancelEdit = useCallback(() => {
    setEditing(null);
    setEditingSheet('');
  }, []);

  const handleDelete = useCallback(async (rowIndex: number) => {
    const rec = records.find((r) => r.rowIndex === rowIndex);
    if (!rec) return;
    if (!window.confirm(`Delete this payment record?\n${rec.date} \u00b7 ${rec.store} \u00b7 \u09f3${rec.amount}`)) return;
    try {
      await removeRecord(rowIndex);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  }, [records, removeRecord]);

  const handleExport = useCallback(() => {
    if (!records.length) { toast.error('No records to export'); return; }
    const header = ['Date', 'Store', 'Amount', 'Method', 'Expense', 'Due', 'Remarks'];
    const rows = records.map((r) =>
      [r.date, r.store, r.amount, r.method, r.expense, r.due, r.remarks]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `payments_${activeSheet.replace(/ /g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`CSV exported \u00b7 ${activeSheet}`);
  }, [records, activeSheet]);

  const handleLogout = useCallback(async () => {
    setViewingEmail(undefined);
    await logout();
  }, [logout]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-[3px] border-border border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        webAppUrl={webAppUrl}
        onUrlChange={handleUrlChange}
        onLogin={login}
        onSignup={signup}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A2535',
            color: '#E2E8F0',
            border: '1px solid #253044',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#34D399', secondary: '#1A2535' } },
          error: { iconTheme: { primary: '#F87171', secondary: '#1A2535' } },
        }}
      />
      <Header
        user={user}
        viewingEmail={viewingEmail}
        onExport={handleExport}
        onLogout={handleLogout}
        onOpenAdmin={() => setAdminOpen(true)}
        onStopViewing={() => setViewingEmail(undefined)}
      />
      <MonthBar
        sheets={monthSheets}
        active={activeSheet}
        loading={loadingSheets}
        onSwitch={switchSheet}
      />
      <StatsBar records={records} />
      <div className="flex flex-1 overflow-hidden">
        <PaymentForm
          editing={editing}
          editingSheet={editingSheet}
          onSave={handleSave}
          onCancelEdit={handleCancelEdit}
        />
        <PaymentTable
          records={records}
          activeSheet={activeSheet}
          loading={loadingRecords}
          error={error}
          lastSync={lastSync}
          onRefresh={refresh}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleReceived={toggleReceivedRecord}
          isAdmin={user.role === 'admin'}
        />
      </div>

      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        onImpersonate={(email) => setViewingEmail(email)}
        currentEmail={user.email}
      />
    </div>
  );
}
