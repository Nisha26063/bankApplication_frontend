import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CustomerDTO } from '../models/interfaces';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="signup-container">
      <div class="signup-card">
        <div class="logo-section">
          <h1>Bank</h1>
          <p>Create your banking account</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #signupForm="ngForm" class="signup-form">
          <h2>Create New Account</h2>
          
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                [(ngModel)]="customerData.firstName"
                required
                minlength="2"
                #firstNameInput="ngModel"
                [class.error]="firstNameInput.invalid && firstNameInput.touched"
                placeholder="Enter your first name"
              >
              <div class="error-message" *ngIf="firstNameInput.invalid && firstNameInput.touched">
                <span *ngIf="firstNameInput.errors?.['required']">First name is required</span>
                <span *ngIf="firstNameInput.errors?.['minlength']">First name must be at least 2 characters</span>
              </div>
            </div>

            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                [(ngModel)]="customerData.lastName"
                required
                minlength="2"
                #lastNameInput="ngModel"
                [class.error]="lastNameInput.invalid && lastNameInput.touched"
                placeholder="Enter your last name"
              >
              <div class="error-message" *ngIf="lastNameInput.invalid && lastNameInput.touched">
                <span *ngIf="lastNameInput.errors?.['required']">Last name is required</span>
                <span *ngIf="lastNameInput.errors?.['minlength']">Last name must be at least 2 characters</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="customerData.email"
              required
              email
              #emailInput="ngModel"
              [class.error]="emailInput.invalid && emailInput.touched"
              placeholder="Enter your email address"
            >
            <div class="error-message" *ngIf="emailInput.invalid && emailInput.touched">
              <span *ngIf="emailInput.errors?.['required']">Email is required</span>
              <span *ngIf="emailInput.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              [(ngModel)]="customerData.phone"
              required
              pattern="[0-9]{10}"
              #phoneInput="ngModel"
              [class.error]="phoneInput.invalid && phoneInput.touched"
              placeholder="Enter 10-digit phone number"
            >
            <div class="error-message" *ngIf="phoneInput.invalid && phoneInput.touched">
              <span *ngIf="phoneInput.errors?.['required']">Phone number is required</span>
              <span *ngIf="phoneInput.errors?.['pattern']">Please enter a valid 10-digit phone number</span>
            </div>
          </div>

          <div class="form-group">
            <label for="address">Address</label>
            <textarea
              id="address"
              name="address"
              [(ngModel)]="customerData.address"
              required
              minlength="10"
              #addressInput="ngModel"
              [class.error]="addressInput.invalid && addressInput.touched"
              placeholder="Enter your full address"
              rows="3"
            ></textarea>
            <div class="error-message" *ngIf="addressInput.invalid && addressInput.touched">
              <span *ngIf="addressInput.errors?.['required']">Address is required</span>
              <span *ngIf="addressInput.errors?.['minlength']">Address must be at least 10 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="customerData.password"
              required
              minlength="6"
              #passwordInput="ngModel"
              [class.error]="passwordInput.invalid && passwordInput.touched"
              placeholder="Enter your password"
            >
            <div class="error-message" *ngIf="passwordInput.invalid && passwordInput.touched">
              <span *ngIf="passwordInput.errors?.['required']">Password is required</span>
              <span *ngIf="passwordInput.errors?.['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              [(ngModel)]="confirmPassword"
              required
              #confirmPasswordInput="ngModel"
              [class.error]="(confirmPasswordInput.invalid && confirmPasswordInput.touched) || (confirmPassword !== customerData.password && confirmPasswordInput.touched)"
              placeholder="Confirm your password"
            >
            <div class="error-message" *ngIf="confirmPasswordInput.touched && confirmPassword !== customerData.password">
              Passwords do not match
            </div>
          </div>

          <div class="form-group">
            <label for="accountType">Initial Account Type</label>
            <select
              id="accountType"
              name="accountType"
              [(ngModel)]="accountType"
              required
              #accountTypeInput="ngModel"
              [class.error]="accountTypeInput.invalid && accountTypeInput.touched"
            >
              <option value="">Select account type</option>
              <option value="Savings">Savings Account</option>
              <option value="Checking">Checking Account</option>
              <option value="Business">Business Account</option>
            </select>
            <div class="error-message" *ngIf="accountTypeInput.invalid && accountTypeInput.touched">
              Please select an account type
            </div>
          </div>

          <div class="error-message" *ngIf="signupError">
            {{ signupError }}
          </div>

          <div class="success-message" *ngIf="signupSuccess">
            {{ signupSuccess }}
          </div>

          <button 
            type="submit" 
            class="signup-btn"
            [disabled]="signupForm.invalid || isLoading || confirmPassword !== customerData.password"
          >
            <span *ngIf="!isLoading">Create Account</span>
            <span *ngIf="isLoading">Creating Account...</span>
          </button>
        </form>

        <div class="login-link">
          <p>Already have an account? <a (click)="goToLogin()">Sign In</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      font-family: Arial, sans-serif;
    }

    .signup-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      padding: 20px;
    }

    .signup-card {
      background: white;
      border-radius: 6px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
      overflow: hidden;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .logo-section {
      background: #1976d2;
      color: white;
      text-align: center;
      padding: 25px 20px;
    }

    .logo-section h1 {
      margin: 0 0 8px 0;
      font-size: 1.8rem;
      font-weight: 600;
      font-family: Arial, sans-serif;
    }

    .logo-section p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }

    .signup-form {
      padding: 30px;
    }

    .signup-form h2 {
      margin: 0 0 25px 0;
      color: #333;
      font-size: 1.4rem;
      text-align: center;
    }

    .form-row {
      display: flex;
      gap: 15px;
    }

    .form-row .form-group {
      flex: 1;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #555;
      font-weight: 500;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e1e1;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
      font-family: inherit;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-group input.error,
    .form-group textarea.error,
    .form-group select.error {
      border-color: #e74c3c;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 5px;
      text-align: left;
      padding: 8px;
      background-color: #fdf2f2;
      border: 1px solid #fecaca;
      border-radius: 4px;
    }

    .success-message {
      color: #27ae60;
      font-size: 0.9rem;
      margin-top: 5px;
      text-align: center;
      padding: 10px;
      background-color: #f0f9f4;
      border: 1px solid #bbf7d0;
      border-radius: 4px;
    }

    .signup-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.3s ease;
      margin-top: 10px;
    }

    .signup-btn:hover:not(:disabled) {
      opacity: 0.9;
    }

    .signup-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .login-link {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }

    .login-link p {
      margin: 0;
      color: #666;
    }

    .login-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
    }

    .login-link a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .signup-card {
        margin: 10px;
        max-height: calc(100vh - 20px);
      }
    }
  `]
})
export class SignupComponent {
  customerData: CustomerDTO = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    accountIds: []
  };
  
  confirmPassword: string = '';
  accountType: string = '';
  signupError: string = '';
  signupSuccess: string = '';
  isLoading: boolean = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.customerData.password !== this.confirmPassword) {
      this.signupError = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.signupError = '';
    this.signupSuccess = '';

    // First create the customer
    this.apiService.createCustomer(this.customerData).subscribe({
      next: (createdCustomer) => {
        console.log('Customer created successfully:', createdCustomer);
        console.log('Created customer ID:', createdCustomer.id);
        
        // Now create an account for the customer
        if (createdCustomer.id) {
          this.createInitialAccount(createdCustomer.id);
        } else {
          console.warn('Customer created but no ID returned, trying to find customer...');
          // Fallback - try to find the customer by email to get ID
          this.findCustomerAndCreateAccount();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Customer creation error:', error);
        
        if (error.status === 400) {
          this.signupError = 'Email or phone number already exists. Please use different credentials.';
        } else {
          this.signupError = error.error?.message || 'Failed to create account. Please try again.';
        }
      }
    });
  }

  private createInitialAccount(customerId: number): void {
    const accountData = {
      accountType: this.accountType,
      customerName: `${this.customerData.firstName} ${this.customerData.lastName}`,
      customerId: customerId,
      balance: 0,
      transactionIds: []
    };

    this.apiService.createAccount(customerId, accountData).subscribe({
      next: (account) => {
        this.isLoading = false;
        this.signupSuccess = 'Account created successfully! You can now log in.';
        console.log('Account created successfully:', account);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Account creation error:', error);
        this.signupError = 'Customer created but failed to create bank account. Please contact support.';
      }
    });
  }

  private findCustomerAndCreateAccount(): void {
    // Try to authenticate to get the customer ID
    this.apiService.authenticateCustomer(this.customerData.email, this.customerData.password).subscribe({
      next: (customer) => {
        if (customer.id) {
          this.createInitialAccount(customer.id);
        } else {
          this.handleAccountCreationFailure();
        }
      },
      error: () => {
        this.handleAccountCreationFailure();
      }
    });
  }

  private handleAccountCreationFailure(): void {
    this.isLoading = false;
    this.signupSuccess = 'Customer account created successfully! Please log in to create your bank account.';
    
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}