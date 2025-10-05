import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginCredentials } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <h1>Bank</h1>
          
        </div>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <h2>Sign In to Your Account</h2>
          
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="credentials.email"
              required
              email
              #emailInput="ngModel"
              [class.error]="emailInput.invalid && emailInput.touched"
              placeholder="Enter your email"
            >
            <div class="error-message" *ngIf="emailInput.invalid && emailInput.touched">
              <span *ngIf="emailInput.errors?.['required']">Email is required</span>
              <span *ngIf="emailInput.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="credentials.password"
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

          <div class="error-message" *ngIf="loginError">
            {{ loginError }}
          </div>

          <button 
            type="submit" 
            class="login-btn"
            [disabled]="loginForm.invalid || isLoading"
          >
            <span *ngIf="!isLoading">Sign In</span>
            <span *ngIf="isLoading">Signing In...</span>
          </button>
        </form>

        <div class="signup-link">
          <p>Don't have an account? <a routerLink="/signup">Sign Up</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      font-family: Arial, sans-serif;
    }

    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      max-width: 420px;
      width: 100%;
      border: 1px solid #e0e0e0;
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
    }

    .logo-section p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }

    .login-form {
      padding: 35px 30px;
    }

    .login-form h2 {
      margin: 0 0 30px 0;
      color: #1976d2;
      font-size: 1.5rem;
      text-align: center;
      font-weight: 600;
    }

    .form-group {
      margin-bottom: 25px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
      font-size: 0.95rem;
    }

    .form-group input {
      width: 100%;
      padding: 12px 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
      box-sizing: border-box;
      background: #fff;
    }

    .form-group input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .form-group input.error {
      border-color: #d32f2f;
    }

    .error-message {
      color: #d32f2f;
      font-size: 0.85rem;
      margin-top: 8px;
      text-align: center;
      padding: 12px;
      background-color: #fef2f2;
      border: 1px solid #fed7d7;
      border-radius: 4px;
    }

    .login-btn {
      width: 100%;
      padding: 14px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .login-btn:hover:not(:disabled) {
      background: #1565c0;
      transform: translateY(-1px);
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .signup-link {
      text-align: center;
      margin: 25px 0 0 0;
      padding: 20px 0 0 0;
      border-top: 1px solid #e0e0e0;
    }

    .signup-link p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .signup-link a {
      color: #1976d2;
      text-decoration: none;
      font-weight: 600;
    }

    .signup-link a:hover {
      color: #1565c0;
      text-decoration: underline;
    }

    /* Responsive design */
    @media (max-width: 480px) {
      .login-container {
        padding: 15px;
      }
      
      .login-card {
        max-width: 100%;
      }
      
      .login-form {
        padding: 25px 20px;
      }
      
      .logo-section {
        padding: 20px 15px;
      }
    }
  `]
})
export class LoginComponent {
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };
  
  loginError: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.credentials.email && this.credentials.password) {
      this.isLoading = true;
      this.loginError = '';

      this.authService.login(this.credentials).subscribe({
        next: (user) => {
          this.isLoading = false;
          if (user) {
            console.log('Login successful, navigating to dashboard');
            this.router.navigate(['/dashboard']);
          } else {
            this.loginError = 'Invalid email or password. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);
          this.loginError = error.message || 'Login failed. Make sure your backend is running on port 8080 and you have a customer with matching credentials.';
        }
      });
    }
  }
}