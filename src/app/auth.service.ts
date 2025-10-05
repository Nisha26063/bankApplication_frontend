import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import { Customer, Account } from './models/interfaces';

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Customer | null>(null);
  public currentUser$: Observable<Customer | null> = this.currentUserSubject.asObservable();
  
  private userAccountsSubject = new BehaviorSubject<Account[]>([]);
  public userAccounts$: Observable<Account[]> = this.userAccountsSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    const savedAccounts = localStorage.getItem('userAccounts');
    
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
    
    if (savedAccounts) {
      this.userAccountsSubject.next(JSON.parse(savedAccounts));
    }
  }

  login(credentials: LoginCredentials): Observable<Customer | null> {
    return this.apiService.authenticateCustomer(credentials.email, credentials.password).pipe(
      map((customer: Customer) => {
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(customer));
        this.currentUserSubject.next(customer);
        
        // Load user accounts after successful login
        if (customer.id) {
          this.loadUserAccounts(customer.id);
        }
        
        return customer;
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return of(null);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userAccounts');
    this.currentUserSubject.next(null);
    this.userAccountsSubject.next([]);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): Customer | null {
    return this.currentUserSubject.value;
  }

  getUserAccounts(): Account[] {
    return this.userAccountsSubject.value;
  }

  private loadUserAccounts(customerId: number): void {
    this.apiService.getAccountsByCustomerId(customerId).subscribe({
      next: (accounts: Account[]) => {
        localStorage.setItem('userAccounts', JSON.stringify(accounts));
        this.userAccountsSubject.next(accounts);
      },
      error: (error) => {
        console.error('Failed to load user accounts:', error);
      }
    });
  }

  refreshUserAccounts(): void {
    const user = this.getCurrentUser();
    if (user && user.id) {
      this.loadUserAccounts(user.id);
    }
  }

  // Helper methods for getting primary account (first account)
  getPrimaryAccount(): Account | null {
    const accounts = this.getUserAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }
}