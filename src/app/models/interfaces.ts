export interface Customer {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password?: string; // Optional for security
  accountIds?: number[];
}

export interface CustomerDTO {
  id?: number; // Customer ID should be returned by backend
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  accountIds: number[];
}

export interface Account {
  accountType: string;
  customerName: string;
  customerId: number;
  balance: number;
  transactionIds: number[];
  accountNo?: number;
  showHistory?: boolean; // For UI state management
}

export interface Transaction {
  transactionType: string;
  amount: number;
  transactionDate: string;
  accountNo: number;
  balance: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface DepositWithdrawRequest {
  amount: number;
  date: string;
}