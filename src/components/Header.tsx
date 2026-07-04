import React from 'react';
import { Wallet2, Download, LogOut, ShieldCheck, Eye, X } from 'lucide-react';
import { AuthUser } from '../types';

interface Props {
  user: AuthUser;
  viewingEmail?: string;
  onExport: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onStopViewing: () => void;
}

export default function Header({ user, viewingEmail, onExport, onLogout, onOpenAdmin, onStopViewing }: Props) {
  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="h-[52px] flex items-center px-5 gap-3">
        <div className="flex items-center gap-2 font-bold text-[15px] whitespace-nowrap">
          <div className="w-7 h-7 rounded-[7px] bg-teal-dim border border-teal flex items-center justify-center text-teal">
            <Wallet2 size={15} strokeWidth={2.5} />
          </div>
          Payment Manager
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-muted mr-1">
            <span>{user.email}</span>
            {user.role === 'admin' && (
              <span className="text-[10px] text-amber bg-amber/10 rounded-full px-1.5 py-0.5">admin</span>
            )}
          </div>

          {user.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="bg-transparent border border-border-hi rounded-md text-muted px-2.5 py-1.5 text-[12px] flex items-center gap-1.5 hover:border-teal hover:text-teal transition-colors"
            >
              <ShieldCheck size={14} /> All Users
            </button>
          )}
          <button
            onClick={onExport}
            className="bg-transparent border border-border-hi rounded-md text-muted px-2.5 py-1.5 text-[12px] flex items-center gap-1.5 hover:border-teal hover:text-teal transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={onLogout}
            className="bg-transparent border border-border-hi rounded-md text-muted px-2.5 py-1.5 text-[12px] flex items-center gap-1.5 hover:border-rose hover:text-rose transition-colors"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>

      {viewingEmail && (
        <div className="bg-amber/10 border-t border-amber/30 px-5 py-1.5 flex items-center gap-2 text-[12px] text-amber">
          <Eye size={13} />
          <span>Viewing data for <strong>{viewingEmail}</strong> as admin</span>
          <button
            onClick={onStopViewing}
            className="ml-auto flex items-center gap-1 hover:underline"
          >
            <X size={12} /> Return to my data
          </button>
        </div>
      )}
    </header>
  );
}
