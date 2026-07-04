export interface PaymentRecord {
  rowIndex: number;
  date: string;
  store: string;
  amount: number;
  method: string;
  expense: string;
  due: number;
  companyAmount: number;
  riderAmount: number;
  remarks: string;
  received: boolean;
}

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  email: string;
  role: UserRole;
  spreadsheetId: string;
}

export interface AdminUserRow {
  email: string;
  role: UserRole;
  spreadsheetId: string;
  createdAt: string;
}

export type SortField = 'date' | 'store' | 'amount' | 'due';
export type SortDir = 1 | -1;

export interface ApiResponse<T = unknown> {
  ok: boolean;
  error?: string;
  token?: string;
  user?: AuthUser;
  sheets?: string[];
  records?: PaymentRecord[];
  users?: AdminUserRow[];
  data?: T;
}

export const PAYMENT_METHODS = [
  'Cash', 'Card', 'Bank Transfer', 'bKash', 'Nagad', 'Rocket', 'Cheque', 'Other',
] as const;

export const EXPENSE_CATEGORIES = [
  'Inventory', 'Salary', 'Rent', 'Utilities',
  'Marketing', 'Logistics', 'Maintenance', 'Miscellaneous',
] as const;
