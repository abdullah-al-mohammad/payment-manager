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
  parcelCost: number;
  transactionType: 'Collection' | 'Expense' | 'Transfer';
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

export const PAYMENT_METHODS = ['Cash', 'bKash', 'Nagad', 'Rocket'] as const;

export const EXPENSE_CATEGORIES = ['fuel', 'bajar', 'rent', 'buy parcel', 'other'] as const;
export const STORE_NAME = [
  'Heshel Cafe',
  'Fif Restaurant',
  'Cafe Blust',
  'Plateform',
  'Burgerganj',
  'Chileghuri',
  'Food Lovers',
  'Woodfire Live Pizza',
  'Bake & Bites',
  'Tasty Cart',
  'Meatfod',
  'Rajdhani Cafe',
  'Cafe Highway',
  'Dhaka Biriyani',
  'Haji Kacchi',
  'T.F.C',
  'A.F.C',
  'Shawpna Super Shop',
  'Delowar Vaiyer Chotpoti',
  'Gaang Restaurant',
  'Rayhan Chotpoti',
  'Roof 360',
  'Food Heaven',
  'Seven Days',
  'Fisher Village',
  'Bokkor Vaiyer Chotpoti',
  'Moha Raja Chotpoti',
  'fatafat Custom order',
] as const;
