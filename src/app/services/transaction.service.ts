import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Transaction, DepositWithdrawRequest, Account } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$: Observable<Transaction[]> = this.transactionsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAccountTransactions(accountNo: number): Observable<Transaction[]> {
    return this.apiService.getAccountTransactions(accountNo);
  }

  getCustomerTransactions(customerId: number): Observable<Transaction[]> {
    return this.apiService.getCustomerTransactions(customerId);
  }

  deposit(accountNo: number, amount: number): Observable<Account> {
    const request: DepositWithdrawRequest = {
      amount: amount,
      date: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
    };
    
    return this.apiService.deposit(accountNo, request);
  }

  withdraw(accountNo: number, amount: number): Observable<Account> {
    const request: DepositWithdrawRequest = {
      amount: amount,
      date: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
    };
    
    return this.apiService.withdraw(accountNo, request);
  }

  loadTransactionsForAccount(accountNo: number): void {
    this.getAccountTransactions(accountNo).subscribe({
      next: (transactions) => {
        this.transactionsSubject.next(transactions);
      },
      error: (error) => {
        console.error('Failed to load transactions:', error);
      }
    });
  }

  getCurrentTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }
}