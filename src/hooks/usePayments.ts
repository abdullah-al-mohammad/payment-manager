import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PaymentRecord } from '../types';
import * as api from '../lib/sheets';

export function usePayments(connected: boolean, viewingEmail?: string) {
  const [monthSheets, setMonthSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadRecords = useCallback(async (sheetName: string) => {
    if (!sheetName) return;
    setLoadingRecords(true);
    setError(null);
    try {
      const recs = await api.getRecords(sheetName, viewingEmail);
      setRecords(recs);
      setLastSync(new Date());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load records';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingRecords(false);
    }
  }, [viewingEmail]);

  const loadSheets = useCallback(async () => {
    setLoadingSheets(true);
    setError(null);
    try {
      let sheets = await api.listSheets(viewingEmail);
      const cur = api.currentMonthName();
      if (!sheets.length) sheets = [cur];
      setMonthSheets(sheets);
      const target = sheets.includes(cur) ? cur : sheets[0];
      setActiveSheet(target);
      await loadRecords(target);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load sheets';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingSheets(false);
    }
  }, [loadRecords, viewingEmail]);

  useEffect(() => {
    if (connected) loadSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, viewingEmail]);

  const switchSheet = useCallback((name: string) => {
    setActiveSheet(name);
    loadRecords(name);
  }, [loadRecords]);

  const saveRecord = useCallback(async (
    record: Omit<PaymentRecord, 'rowIndex'>,
    editRowIndex?: number,
    editSheet?: string
  ) => {
    const targetSheet = editRowIndex && editSheet ? editSheet : api.dateToMonthName(record.date);
    if (editRowIndex && editSheet) {
      await api.updateRecord(editSheet, editRowIndex, record, viewingEmail);
      toast.success('Payment updated');
    } else {
      await api.addRecord(targetSheet, record, viewingEmail);
      toast.success(`Saved to ${targetSheet}`);
    }
    const sheets = await api.listSheets(viewingEmail);
    setMonthSheets(sheets.length ? sheets : [api.currentMonthName()]);
    setActiveSheet(targetSheet);
    await loadRecords(targetSheet);
  }, [loadRecords, viewingEmail]);

  const removeRecord = useCallback(async (rowIndex: number) => {
    await api.deleteRecord(activeSheet, rowIndex, viewingEmail);
    toast.success('Record deleted');
    await loadRecords(activeSheet);
  }, [activeSheet, loadRecords, viewingEmail]);

  const toggleReceivedRecord = useCallback(async (rowIndex: number, received: boolean) => {
    // Optimistic update so the strikethrough feels instant
    setRecords((prev) => prev.map((r) => (r.rowIndex === rowIndex ? { ...r, received } : r)));
    try {
      await api.toggleReceived(activeSheet, rowIndex, received, viewingEmail);
    } catch (e) {
      // Revert on failure
      setRecords((prev) => prev.map((r) => (r.rowIndex === rowIndex ? { ...r, received: !received } : r)));
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    }
  }, [activeSheet, viewingEmail]);

  return {
    monthSheets,
    activeSheet,
    records,
    loadingSheets,
    loadingRecords,
    error,
    lastSync,
    switchSheet,
    saveRecord,
    removeRecord,
    toggleReceivedRecord,
    refresh: () => loadRecords(activeSheet),
  };
}
