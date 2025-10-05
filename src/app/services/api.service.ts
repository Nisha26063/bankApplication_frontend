import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Account, Transaction, DepositWithdrawRequest, Customer, CustomerDTO } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Account endpoints
  getAccountsByCustomerId(customerId: number): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.baseUrl}/accounts/customer/${customerId}/getAccounts`);
  }

  getAccount(accountNo: number): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/accounts/${accountNo}`);
  }

  getBalance(accountNo: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/accounts/${accountNo}/balance`);
  }

  deposit(accountNo: number, request: DepositWithdrawRequest): Observable<Account> {
    return this.http.post<Account>(`${this.baseUrl}/accounts/${accountNo}/deposit`, request);
  }

  withdraw(accountNo: number, request: DepositWithdrawRequest): Observable<Account> {
    return this.http.post<Account>(`${this.baseUrl}/accounts/${accountNo}/withdraw`, request);
  }

  // Transaction endpoints
  getAccountTransactions(accountNo: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/transactions/account/${accountNo}`);
  }

  getCustomerTransactions(customerId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/transactions/customer/${customerId}`);
  }

  // Simplified authentication - Using customer ID for now
  // You should add proper authentication endpoints to your backend:
  // POST /api/customers/authenticate { email, password } -> returns Customer with ID
  // GET /api/customers/email/{email} -> returns Customer by email
  authenticateCustomer(email: string, password: string): Observable<Customer> {
    // First try to authenticate by email if endpoint exists, otherwise search by IDs
    // This is a workaround until proper authentication endpoints are added to backend
    
    // Try to get customer by email first (this will fail if endpoint doesn't exist)
    return this.getCustomerByEmail(email).pipe(
      map((customerDTO: CustomerDTO) => {
        console.log('Found customer by email:', customerDTO);
        
        if (customerDTO.password === password) {
          const customer: Customer = {
            id: customerDTO.id || 0, // Assuming CustomerDTO has id field
            firstName: customerDTO.firstName,
            lastName: customerDTO.lastName,
            email: email,
            phone: customerDTO.phone,
            address: customerDTO.address,
            accountIds: customerDTO.accountIds
          };
          console.log('Authentication successful for customer:', customer);
          return customer;
        } else {
          throw new Error('Invalid password');
        }
      }),
      catchError((error: any) => {
        console.log('Email-based authentication failed, trying ID-based search:', error);
        // Fallback to ID-based search - check known IDs first, then broader range
        const sequentialIds = Array.from({length: 50}, (_, i) => i + 1);
        const highIds = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000, 50000, 100000];
        // Prioritize known customer IDs from recent registrations
        const allIds = [...this.knownCustomerIds, ...sequentialIds, ...highIds];
        // Remove duplicates
        const uniqueIds = [...new Set(allIds)];
        console.log('Searching customer IDs:', uniqueIds);
        return this.tryAuthenticateWithIds(email, password, uniqueIds);
      })
    );
  }

  private tryAuthenticateWithIds(email: string, password: string, ids: number[]): Observable<Customer> {
    if (ids.length === 0) {
      throw new Error('Customer not found with provided email');
    }

    const currentId = ids[0];
    const remainingIds = ids.slice(1);

    return this.getCustomerById(currentId).pipe(
      map((customerDTO: CustomerDTO) => {
        console.log('Checking customer ID:', currentId, 'DTO:', customerDTO);
        
        // Your backend CustomerDTO doesn't include email field in convertToDTO method
        // So we'll just check password for now
        if (customerDTO.password === password) {
          const customer: Customer = {
            id: currentId,
            firstName: customerDTO.firstName,
            lastName: customerDTO.lastName,
            email: email, // Use the provided email since backend doesn't return it
            phone: customerDTO.phone,
            address: customerDTO.address,
            accountIds: customerDTO.accountIds
          };
          console.log('Authentication successful for customer:', customer);
          return customer;
        } else {
          console.log('Password mismatch. Expected:', password, 'Got:', customerDTO.password);
          throw new Error('Try next ID');
        }
      }),
      catchError((error: any) => {
        console.log('Error authenticating customer ID', currentId, ':', error);
        
        if (error.message === 'Try next ID' && remainingIds.length > 0) {
          return this.tryAuthenticateWithIds(email, password, remainingIds);
        } else if (error.status === 404 && remainingIds.length > 0) {
          console.log('Customer ID', currentId, 'not found, trying next...');
          return this.tryAuthenticateWithIds(email, password, remainingIds);
        } else if (remainingIds.length > 0) {
          // Any other error, try next ID
          return this.tryAuthenticateWithIds(email, password, remainingIds);
        } else {
          throw new Error('Invalid email or password - no more customers to check');
        }
      })
    );
  }

  // Get customer by ID
  getCustomerById(customerId: number): Observable<CustomerDTO> {
    return this.http.get<CustomerDTO>(`${this.baseUrl}/customers/${customerId}`);
  }

  // Alternative: Get customer by email (you'll need to add this endpoint)
  getCustomerByEmail(email: string): Observable<CustomerDTO> {
    return this.http.get<CustomerDTO>(`${this.baseUrl}/customers/email/${email}`);
  }

  // Customer registration endpoints
  createCustomer(customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }): Observable<Customer> {
    return this.http.post<Customer>(`${this.baseUrl}/customers`, customerData).pipe(
      map((customer: Customer) => {
        console.log('Customer created with ID:', customer.id);
        // Add this ID to our known customer IDs for future authentication
        if (customer.id) {
          this.addToKnownCustomerIds(customer.id);
        }
        return customer;
      })
    );
  }

  private knownCustomerIds: number[] = [];

  private addToKnownCustomerIds(id: number): void {
    if (!this.knownCustomerIds.includes(id)) {
      this.knownCustomerIds.push(id);
      console.log('Added customer ID to known list:', id);
    }
  }

  // Account creation endpoint - matches your backend: POST /api/accounts/customer/{customerId}
  createAccount(customerId: number, accountData: {
    accountType: string;
    balance: number;
  }): Observable<Account> {
    // Match your backend endpoint: POST /api/accounts/customer/{customerId}
    return this.http.post<Account>(`${this.baseUrl}/accounts/customer/${customerId}`, accountData);
  }
}