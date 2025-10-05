import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { TransactionService } from '../services/transaction.service';
import { ApiService } from '../services/api.service';
import { Customer, Account, Transaction } from '../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-content">
          <div class="welcome-section">
            <h1>Name :{{ currentUser?.firstName }} {{ currentUser?.lastName }}</h1>
            <p>Customer ID: {{ currentUser?.id }}</p>
          </div>
          <button class="logout-btn" (click)="logout()">
            Logout
          </button>
        </div>
      </header>

      <main class="dashboard-main">
        <!-- Account Information -->
        <div class="accounts-section" *ngIf="userAccounts.length > 0">
          <div class="accounts-header">
            <h2>Your Accounts</h2>
            <button class="create-account-btn-header" (click)="openCreateAccountModal()">
              + Create New Account
            </button>
          </div>
          <div class="account-card" *ngFor="let account of userAccounts; let i = index">
            <div class="account-header">
              <h3>{{ account.accountType }} Account</h3>
              <span class="account-number">Account: {{ account.accountNo || 'N/A' }}</span>
            </div>
            <div class="balance-section">
              <div class="balance-amount">
                Rs.\{{ account.balance?.toFixed(2) }}
              </div>
            </div>
            
            <div class="actions-section">
              <div class="action-buttons">
                <button class="action-btn deposit-btn" (click)="openDepositModal(account)">
                  Deposit
                </button>
                <button class="action-btn withdraw-btn" (click)="openWithdrawModal(account)">
                  Withdraw
                </button>
                <button class="action-btn history-btn" (click)="toggleTransactionHistory(account, i)">
                  {{ account.showHistory ? 'Hide History' : 'Show History' }}
                </button>
              </div>
            </div>

            <!-- Transaction History per Account -->
            <div class="account-transactions" *ngIf="account.showHistory">
              <div class="transactions-header">
                <h4>Recent Transactions</h4>
                <span class="transaction-count">{{ getAccountTransactions(account).length }} transactions</span>
              </div>
              
              <!-- Debug Information -->
              <div class="debug-info" style="background: #f0f0f0; padding: 10px; margin: 10px 0; font-size: 12px;">
                <p><strong>Debug Info:</strong></p>
                <p>Account Number: {{ account.accountNo }}</p>
                <p>Total Transactions in Array: {{ transactions.length }}</p>
                <p>Filtered Transactions: {{ getAccountTransactions(account).length }}</p>
                <p>Show History: {{ account.showHistory }}</p>
              </div>

              <div class="transaction-list" *ngIf="getAccountTransactions(account).length > 0; else noTransactions">
                <div class="transaction-item" *ngFor="let transaction of getAccountTransactions(account) | slice:0:5; let i = index">
                  <div class="transaction-info">
                    <span class="transaction-type">{{ transaction.transactionType }}</span>
                    <span class="transaction-date">{{ formatTransactionDate(transaction.transactionDate) }}</span>
                  </div>
                  <div class="transaction-amount" [class]="transaction.transactionType.toLowerCase()">
                    {{ transaction.transactionType === 'Deposit' ? '+' : '-' }}Rs.{{ transaction.amount.toFixed(2) }}
                  </div>
                </div>
                <button class="view-all-btn" *ngIf="getAccountTransactions(account).length > 5" 
                        (click)="viewAllTransactions(account)">
                  View All {{ getAccountTransactions(account).length }} Transactions
                </button>
              </div>
              <ng-template #noTransactions>
                <div class="no-transactions-account">
                  <p>No transactions found for this account.</p>
                  <div class="debug-info" style="background: #ffe0e0; padding: 10px; margin: 10px 0; font-size: 12px;">
                    <p><strong>No Transactions Debug:</strong></p>
                    <p>Account Number: {{ account.accountNo }}</p>
                    <p>All Transactions: {{ transactions | json }}</p>
                  </div>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <div class="no-accounts" *ngIf="userAccounts.length === 0">
          <div class="no-accounts-content">
            <h3>No Bank Accounts Found</h3>
            <p>You don't have any bank accounts yet. Create your first account to start banking!</p>
            <button class="create-account-btn" (click)="openCreateAccountModal()">
              Create New Account
            </button>
          </div>
        </div>

        <!-- CIBIL Score Section -->
        <div class="cibil-section" *ngIf="userAccounts.length > 0">
          <div class="cibil-card">
            <div class="cibil-header">
              <h3>Credit Score</h3>
              <p>Check your CIBIL score</p>
            </div>
            <div class="cibil-content">
              <div class="cibil-score-display" *ngIf="cibilScore !== null">
                <div class="score-circle" [class]="getScoreClass(cibilScore)">
                  <span class="score-number">{{ cibilScore }}</span>
                  <span class="score-label">CIBIL Score</span>
                </div>
                <div class="score-info">
                  <p class="score-range">{{ getScoreRange(cibilScore) }}</p>
                  <p class="score-description">{{ getScoreDescription(cibilScore) }}</p>
                </div>
              </div>
              <div class="cibil-actions">
                <button class="cibil-btn" (click)="checkCibilScore()" [disabled]="isCalculatingScore">
                  {{ isCalculatingScore ? 'Calculating...' : (cibilScore !== null ? 'Refresh Score' : 'Check CIBIL Score') }}
                </button>
              </div>
            </div>
          </div>
        </div>


      </main>

      <!-- Deposit Modal -->
      <div class="modal-overlay" *ngIf="showDepositModal" (click)="closeModals()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Make a Deposit</h3>
            <button class="close-btn" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body">
            <div class="account-info" *ngIf="selectedAccount">
              <p><strong>Account:</strong> {{ selectedAccount.accountType }}</p>
              <p><strong>Current Balance:</strong> \${{ selectedAccount.balance?.toFixed(2) }}</p>
            </div>
            <div class="form-group">
              <label for="depositAmount">Amount</label>
              <input
                type="number"
                id="depositAmount"
                [(ngModel)]="depositAmount"
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
              >
            </div>
            <div class="error-message" *ngIf="transactionError">
              {{ transactionError }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Cancel</button>
            <button 
              class="btn btn-primary" 
              (click)="deposit()" 
              [disabled]="!depositAmount || depositAmount <= 0 || isProcessing">
              {{ isProcessing ? 'Processing...' : 'Deposit $' + (depositAmount || 0) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Withdraw Modal -->
      <div class="modal-overlay" *ngIf="showWithdrawModal" (click)="closeModals()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Make a Withdrawal</h3>
            <button class="close-btn" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body">
            <div class="account-info" *ngIf="selectedAccount">
              <p><strong>Account:</strong> {{ selectedAccount.accountType }}</p>
              <p><strong>Available Balance:</strong> \${{ selectedAccount.balance?.toFixed(2) }}</p>
            </div>
            <div class="form-group">
              <label for="withdrawAmount">Amount</label>
              <input
                type="number"
                id="withdrawAmount"
                [(ngModel)]="withdrawAmount"
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
              >
            </div>
            <div class="error-message" *ngIf="transactionError">
              {{ transactionError }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Cancel</button>
            <button 
              class="btn btn-primary" 
              (click)="withdraw()" 
              [disabled]="!withdrawAmount || withdrawAmount <= 0 || withdrawAmount > (selectedAccount?.balance || 0) || isProcessing">
              {{ isProcessing ? 'Processing...' : 'Withdraw $' + (withdrawAmount || 0) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create Account Modal -->
      <div class="modal-overlay" *ngIf="showCreateAccountModal" (click)="closeModals()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create New Account</h3>
            <button class="close-btn" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body">
            <div class="customer-info" *ngIf="currentUser">
              <p><strong>Customer:</strong> {{ currentUser.firstName }} {{ currentUser.lastName }}</p>
              <p><strong>Customer ID:</strong> {{ currentUser.id }}</p>
            </div>
            <div class="form-group">
              <label for="accountType">Account Type</label>
              <select id="accountType" [(ngModel)]="newAccountType" class="form-select">
                <option value="">Select Account Type</option>
                <option value="SAVINGS">Savings Account</option>
                <option value="CHECKING">Checking Account</option>
                <option value="BUSINESS">Business Account</option>
              </select>
            </div>
            <div class="form-group">
              <label for="initialDeposit">Initial Deposit (Optional)</label>
              <input
                type="number"
                id="initialDeposit"
                [(ngModel)]="initialDeposit"
                min="0"
                step="0.01"
                placeholder="Enter initial amount (default: $0.00)"
              >
            </div>
            <div class="error-message" *ngIf="accountCreationError">
              {{ accountCreationError }}
            </div>
            <div class="success-message" *ngIf="accountCreationSuccess">
              {{ accountCreationSuccess }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Cancel</button>
            <button 
              class="btn btn-primary" 
              (click)="createAccount()" 
              [disabled]="!newAccountType || isCreatingAccount">
              {{ isCreatingAccount ? 'Creating...' : 'Create Account' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      font-family: Arial, sans-serif;
    }

    .dashboard-container {
      min-height: 100vh;
      background-color: #f8f9fa;
    }

    .dashboard-header {
      background: #1976d2;
      color: white;
      padding: 20px 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .welcome-section h1 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 600;
      font-family: Arial, sans-serif;
    }

    .welcome-section p {
      margin: 5px 0 0 0;
      opacity: 0.9;
      font-family: Arial, sans-serif;
    }

    .logout-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      font-family: Arial, sans-serif;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    .dashboard-main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px 20px;
    }

    .accounts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .accounts-section h2 {
      color: #1976d2;
      margin: 0;
      font-size: 1.4rem;
      font-family: Arial, sans-serif;
      font-weight: 600;
    }

    .create-account-btn-header {
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: Arial, sans-serif;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .create-account-btn-header:hover {
      background: #1565c0;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
    }

    .account-card {
      background: white;
      border-radius: 6px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
      transition: box-shadow 0.3s ease;
    }

    .account-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .account-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .account-header h3 {
      margin: 0;
      font-family: Arial, sans-serif;
      color: #333;
      font-size: 1.3rem;
    }

    .account-number {
      color: #666;
      font-size: 0.9rem;
      font-family: Arial, sans-serif;
    }

    .balance-section {
      text-align: center;
      margin: 20px 0;
    }

    .balance-amount {
      font-size: 2.2rem;
      font-weight: 600;
      color: #1976d2;
      margin: 10px 0;
      font-family: Arial, sans-serif;
    }

    .actions-section {
      margin-top: 25px;
    }

    .action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    .action-btn {
      flex: 1;
      max-width: 150px;
      padding: 12px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      font-family: Arial, sans-serif;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .deposit-btn {
      background: #1976d2;
      color: white;
    }

    .deposit-btn:hover {
      background: #1565c0;
      transform: translateY(-1px);
    }

    .withdraw-btn {
      background: #d32f2f;
      color: white;
    }

    .withdraw-btn:hover {
      background: #c62828;
      transform: translateY(-1px);
    }

    .history-btn {
      background: #757575;
      color: white;
    }

    .history-btn:hover {
      background: #616161;
      transform: translateY(-1px);
    }

    /* Account Transaction History Styles */
    .account-transactions {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
      border-radius: 0 0 6px 6px;
      margin: 20px -25px -25px -25px;
      padding: 20px 25px 25px 25px;
    }

    .transactions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .transactions-header h4 {
      margin: 0;
      color: #1976d2;
      font-size: 1.1rem;
      font-family: Arial, sans-serif;
      font-weight: 600;
    }

    .transaction-count {
      color: #666;
      font-size: 0.9rem;
      font-family: Arial, sans-serif;
    }

    .transaction-list {
      background: white;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .account-transactions .transaction-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      border-bottom: 1px solid #f0f0f0;
    }

    .account-transactions .transaction-item:last-child {
      border-bottom: none;
    }

    .view-all-btn {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      color: #1976d2;
      padding: 8px 15px;
      border-radius: 0 0 4px 4px;
      font-size: 0.9rem;
      font-family: Arial, sans-serif;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s ease;
    }

    .view-all-btn:hover {
      background: #e3f2fd;
      color: #1565c0;
    }

    .no-transactions-account {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 20px;
      text-align: center;
      color: #666;
      font-family: Arial, sans-serif;
    }

    .no-transactions-account p {
      margin: 0;
    }

    .transactions-card {
      background: white;
      border-radius: 6px;
      padding: 25px;
      margin-top: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }

    .transactions-card h2 {
      margin: 0 0 20px 0;
      color: #1976d2;
      font-size: 1.4rem;
      font-family: Arial, sans-serif;
      font-weight: 600;
    }

    .transaction-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid #eee;
    }

    .transaction-item:last-child {
      border-bottom: none;
    }

    .transaction-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .transaction-type {
      font-weight: 500;
      color: #333;
    }

    .transaction-date {
      color: #666;
      font-size: 0.9rem;
    }

    .transaction-account {
      color: #888;
      font-size: 0.8rem;
    }

    .transaction-amount {
      font-weight: bold;
      font-size: 1.1rem;
    }

    .transaction-amount.deposit {
      color: #27ae60;
    }

    .transaction-amount.withdrawal {
      color: #e74c3c;
    }

    .no-accounts, .no-transactions {
      text-align: center;
      padding: 40px 20px;
      color: #666;
      background: white;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .no-accounts-content h3 {
      color: #333;
      margin: 0 0 15px 0;
      font-size: 1.5rem;
    }

    .no-accounts-content p {
      margin: 0 0 25px 0;
      font-size: 1rem;
      line-height: 1.5;
    }

    .create-account-btn {
      background: #1976d2;
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      font-family: Arial, sans-serif;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .create-account-btn:hover {
      background: #1565c0;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
    }

    .create-account-btn:active {
      transform: translateY(0);
    }

    /* CIBIL Score Styles */
    .cibil-section {
      padding: 0 20px;
      margin-top: 30px;
    }

    .cibil-card {
      background: white;
      border-radius: 6px;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }

    .cibil-header h3 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 1.4rem;
      font-family: Arial, sans-serif;
      font-weight: 600;
    }

    .cibil-header p {
      margin: 0 0 20px 0;
      color: #666;
      font-family: Arial, sans-serif;
    }

    .cibil-score-display {
      display: flex;
      align-items: center;
      gap: 30px;
      margin-bottom: 25px;
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 6px solid;
      position: relative;
    }

    .score-circle.excellent {
      border-color: #4caf50;
      background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
    }

    .score-circle.good {
      border-color: #8bc34a;
      background: linear-gradient(135deg, #f1f8e9 0%, #f9fbe7 100%);
    }

    .score-circle.fair {
      border-color: #ff9800;
      background: linear-gradient(135deg, #fff3e0 0%, #ffecc0 100%);
    }

    .score-circle.poor {
      border-color: #f44336;
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
    }

    .score-circle.very-poor {
      border-color: #d32f2f;
      background: linear-gradient(135deg, #ffebee 0%, #ef9a9a 100%);
    }

    .score-number {
      font-size: 2rem;
      font-weight: bold;
      font-family: Arial, sans-serif;
      color: #333;
    }

    .score-label {
      font-size: 0.8rem;
      color: #666;
      font-family: Arial, sans-serif;
      margin-top: 4px;
    }

    .score-info {
      flex: 1;
    }

    .score-range {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #1976d2;
      font-family: Arial, sans-serif;
    }

    .score-description {
      margin: 0;
      color: #666;
      line-height: 1.4;
      font-family: Arial, sans-serif;
    }

    .cibil-actions {
      text-align: center;
    }

    .cibil-btn {
      background: #1976d2;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      font-family: Arial, sans-serif;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cibil-btn:hover:not(:disabled) {
      background: #1565c0;
      transform: translateY(-1px);
    }

    .cibil-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      padding: 20px;
    }

    .account-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .account-info p {
      margin: 5px 0;
      color: #555;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #333;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e8ed;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-select {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e8ed;
      border-radius: 8px;
      font-size: 1rem;
      background: white;
      cursor: pointer;
      transition: border-color 0.3s ease;
    }

    .form-select:focus {
      outline: none;
      border-color: #667eea;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.9rem;
      margin-top: 10px;
      padding: 10px;
      background: #fdf2f2;
      border-radius: 6px;
      border-left: 4px solid #e74c3c;
    }

    .success-message {
      color: #27ae60;
      font-size: 0.9rem;
      margin-top: 10px;
      padding: 10px;
      background: #f1f9f4;
      border-radius: 6px;
      border-left: 4px solid #27ae60;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5a6fd8;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-btn {
        max-width: none;
      }

      .transaction-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .modal-content {
        width: 95%;
        margin: 20px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: Customer | null = null;
  userAccounts: Account[] = [];
  transactions: Transaction[] = [];
  selectedAccount: Account | null = null;
  
  showDepositModal = false;
  showWithdrawModal = false;
  showCreateAccountModal = false;
  depositAmount: number = 0;
  withdrawAmount: number = 0;
  transactionError = '';
  isProcessing = false;

  // Account creation properties
  newAccountType = '';
  initialDeposit: number = 0;
  accountCreationError = '';
  accountCreationSuccess = '';
  isCreatingAccount = false;

  // CIBIL Score properties
  cibilScore: number | null = null;
  isCalculatingScore = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Subscribe to user accounts
    this.subscriptions.push(
      this.authService.userAccounts$.subscribe(accounts => {
        this.userAccounts = accounts.map(account => ({
          ...account,
          showHistory: account.showHistory || false
        }));
      })
    );

    // Load initial data
    this.currentUser = this.authService.getCurrentUser();
    this.userAccounts = this.authService.getUserAccounts().map(account => ({
      ...account,
      showHistory: account.showHistory || false
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openDepositModal(account: Account): void {
    this.selectedAccount = account;
    this.depositAmount = 0;
    this.transactionError = '';
    this.showDepositModal = true;
  }

  openWithdrawModal(account: Account): void {
    this.selectedAccount = account;
    this.withdrawAmount = 0;
    this.transactionError = '';
    this.showWithdrawModal = true;
  }

  closeModals(): void {
    this.showDepositModal = false;
    this.showWithdrawModal = false;
    this.showCreateAccountModal = false;
    this.selectedAccount = null;
    this.depositAmount = 0;
    this.withdrawAmount = 0;
    this.transactionError = '';
    this.newAccountType = '';
    this.initialDeposit = 0;
    this.accountCreationError = '';
    this.accountCreationSuccess = '';
  }

  openCreateAccountModal(): void {
    this.newAccountType = '';
    this.initialDeposit = 0;
    this.accountCreationError = '';
    this.accountCreationSuccess = '';
    this.showCreateAccountModal = true;
  }

  createAccount(): void {
    if (!this.newAccountType || !this.currentUser?.id) {
      this.accountCreationError = 'Please select an account type';
      return;
    }

    this.isCreatingAccount = true;
    this.accountCreationError = '';
    this.accountCreationSuccess = '';

    const accountData = {
      accountType: this.newAccountType,
      balance: this.initialDeposit || 0,
      accountHolderName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
      customerId: this.currentUser.id
    };

    this.apiService.createAccount(this.currentUser.id, accountData).subscribe({
      next: (newAccount) => {
        this.isCreatingAccount = false;
        this.accountCreationSuccess = `${this.newAccountType} account created successfully!`;
        console.log('Account created:', newAccount);
        
        // Refresh user accounts to show the new account
        this.authService.refreshUserAccounts();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          this.closeModals();
        }, 2000);
      },
      error: (error) => {
        this.isCreatingAccount = false;
        console.error('Account creation error:', error);
        this.accountCreationError = error.error?.message || 'Failed to create account. Please try again.';
      }
    });
  }

  deposit(): void {
    if (!this.selectedAccount || !this.depositAmount || this.depositAmount <= 0) {
      this.transactionError = 'Please enter a valid amount';
      return;
    }

    this.isProcessing = true;
    this.transactionError = '';

    // For demo purposes, we'll use account number 1 if accountNo is not available
    const accountNo = this.selectedAccount.accountNo || 1;

    this.transactionService.deposit(accountNo, this.depositAmount).subscribe({
      next: (updatedAccount) => {
        // Update the account balance in the local array
        const accountIndex = this.userAccounts.findIndex(acc => acc.accountNo === accountNo);
        if (accountIndex !== -1) {
          this.userAccounts[accountIndex].balance = updatedAccount.balance;
        }
        
        // Refresh user accounts from the service
        this.authService.refreshUserAccounts();
        
        this.isProcessing = false;
        this.closeModals();
        
        // Reload transaction history for this account
        if (this.selectedAccount) {
          this.loadTransactionHistory(this.selectedAccount);
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.transactionError = 'Deposit failed. Please try again.';
        console.error('Deposit error:', error);
      }
    });
  }

  withdraw(): void {
    if (!this.selectedAccount || !this.withdrawAmount || this.withdrawAmount <= 0) {
      this.transactionError = 'Please enter a valid amount';
      return;
    }

    if (this.withdrawAmount > this.selectedAccount.balance) {
      this.transactionError = 'Insufficient funds';
      return;
    }

    this.isProcessing = true;
    this.transactionError = '';

    // For demo purposes, we'll use account number 1 if accountNo is not available
    const accountNo = this.selectedAccount.accountNo || 1;

    this.transactionService.withdraw(accountNo, this.withdrawAmount).subscribe({
      next: (updatedAccount) => {
        // Update the account balance in the local array
        const accountIndex = this.userAccounts.findIndex(acc => acc.accountNo === accountNo);
        if (accountIndex !== -1) {
          this.userAccounts[accountIndex].balance = updatedAccount.balance;
        }
        
        // Refresh user accounts from the service
        this.authService.refreshUserAccounts();
        
        this.isProcessing = false;
        this.closeModals();
        
        // Reload transaction history for this account
        if (this.selectedAccount) {
          this.loadTransactionHistory(this.selectedAccount);
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.transactionError = 'Withdrawal failed. Please try again.';
        console.error('Withdrawal error:', error);
      }
    });
  }

  loadTransactionHistory(account: Account): void {
    const accountNo = account.accountNo || 1;
    
    this.transactionService.getAccountTransactions(accountNo).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.selectedAccount = account;
      },
      error: (error) => {
        console.error('Failed to load transaction history:', error);
        this.transactions = [];
      }
    });
  }

  // CIBIL Score Methods
  checkCibilScore(): void {
    if (!this.currentUser || this.userAccounts.length === 0) {
      return;
    }

    this.isCalculatingScore = true;
    
    // Simulate CIBIL score calculation with a delay
    setTimeout(() => {
      this.cibilScore = this.calculateCibilScore();
      this.isCalculatingScore = false;
    }, 2000);
  }

  private calculateCibilScore(): number {
    // CIBIL score calculation algorithm based on various factors
    let score = 300; // Base score

    if (!this.currentUser || this.userAccounts.length === 0) {
      return score;
    }

    // Factor 1: Account age (simulate with customer ID)
    const accountAge = this.currentUser.id || 1;
    score += Math.min(accountAge * 20, 150); // Max 150 points for account age

    // Factor 2: Total balance across all accounts
    const totalBalance = this.userAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    if (totalBalance > 10000) score += 100;
    else if (totalBalance > 5000) score += 75;
    else if (totalBalance > 1000) score += 50;
    else score += 25;

    // Factor 3: Number of accounts (diversity)
    const accountCount = this.userAccounts.length;
    score += Math.min(accountCount * 30, 90); // Max 90 points for multiple accounts

    // Factor 4: Transaction activity (simulate based on transaction count)
    const transactionActivity = this.transactions.length;
    score += Math.min(transactionActivity * 5, 50); // Max 50 points for activity

    // Factor 5: Random factor to simulate credit history, payment behavior, etc.
    const randomFactor = Math.floor(Math.random() * 100); // 0-99 random points
    score += randomFactor;

    // Ensure score is within CIBIL range (300-900)
    score = Math.min(Math.max(score, 300), 900);

    return score;
  }

  getScoreClass(score: number): string {
    if (score >= 750) return 'excellent';
    if (score >= 700) return 'good';
    if (score >= 650) return 'fair';
    if (score >= 600) return 'poor';
    return 'very-poor';
  }

  getScoreRange(score: number): string {
    if (score >= 750) return 'Excellent (750-900)';
    if (score >= 700) return 'Good (700-749)';
    if (score >= 650) return 'Fair (650-699)';
    if (score >= 600) return 'Poor (600-649)';
    return 'Very Poor (300-599)';
  }

  getScoreDescription(score: number): string {
    if (score >= 750) return 'Excellent credit score! You qualify for the best loan rates and terms.';
    if (score >= 700) return 'Good credit score. You can get loans at competitive rates.';
    if (score >= 650) return 'Fair credit score. You may get loans but at higher interest rates.';
    if (score >= 600) return 'Poor credit score. Limited loan options with high interest rates.';
    return 'Very poor credit score. Focus on improving your credit health.';
  }

  // New methods for enhanced account display
  toggleTransactionHistory(account: Account, index: number): void {
    console.log('Toggling transaction history for account:', account.accountNo, 'Current showHistory:', account.showHistory);
    
    // Toggle showHistory property
    account.showHistory = !account.showHistory;
    
    console.log('New showHistory state:', account.showHistory);
    
    // Load transaction history if showing
    if (account.showHistory) {
      console.log('Loading transactions for account:', account.accountNo);
      // Always add sample transactions first for immediate display
      this.addSampleTransactions(account, account.accountNo || 1);
      // Then try to load from API (will replace samples if successful)
      this.loadAccountTransactions(account);
    }
  }

  getAccountTransactions(account: Account): Transaction[] {
    console.log('=== getAccountTransactions called ===');
    console.log('Account:', account);
    console.log('Account Number:', account.accountNo);
    console.log('All transactions:', this.transactions);
    
    const accountTransactions = this.transactions.filter(transaction => {
      console.log('Comparing transaction accountNo:', transaction.accountNo, 'with account.accountNo:', account.accountNo);
      return transaction.accountNo === account.accountNo;
    });
    
    console.log('Filtered transactions for account', account.accountNo, ':', accountTransactions);
    console.log('Found', accountTransactions.length, 'transactions');
    
    return accountTransactions;
  }

  private loadAccountTransactions(account: Account): void {
    const accountNo = account.accountNo || 1;
    console.log('=== Loading Transactions from API ===');
    console.log('Account:', account);
    console.log('Account Number:', accountNo);
    console.log('API URL will be: http://localhost:8080/api/transactions/account/' + accountNo);
    
    this.transactionService.getAccountTransactions(accountNo).subscribe({
      next: (transactions) => {
        console.log('✅ API Response - Raw transactions:', transactions);
        console.log('✅ API Response type:', typeof transactions);
        console.log('✅ API Response is array:', Array.isArray(transactions));
        
        if (transactions && transactions.length > 0) {
          console.log('✅ First transaction:', transactions[0]);
          console.log('✅ First transaction accountNo:', transactions[0].accountNo);
          console.log('✅ First transaction type:', typeof transactions[0].accountNo);
        }
        
        // Remove existing transactions for this account and add new ones
        const beforeLength = this.transactions.length;
        this.transactions = this.transactions.filter(t => t.accountNo !== accountNo);
        this.transactions = [...this.transactions, ...transactions];
        
        console.log('✅ Transactions before:', beforeLength);
        console.log('✅ Transactions after:', this.transactions.length);
        console.log('✅ All transactions now:', this.transactions);
        
        // If no transactions from API, add sample ones for demo
        if (!transactions || transactions.length === 0) {
          console.log('⚠️ No transactions from API, adding sample transactions');
          this.addSampleTransactions(account, accountNo);
        }
      },
      error: (error) => {
        console.error('❌ API Error - Failed to load transaction history for account:', accountNo);
        console.error('❌ Error details:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        
        // For demo purposes, add some sample transactions if the API fails
        console.log('❌ API failed, adding sample transactions');
        this.addSampleTransactions(account, accountNo);
      }
    });
  }

  private addSampleTransactions(account: Account, accountNo: number): void {
    console.log('=== Adding Sample Transactions ===');
    console.log('Account:', account);
    console.log('Account Number:', accountNo);
    console.log('Account Balance:', account.balance);
    
    const sampleTransactions: Transaction[] = [
      {
        transactionType: 'Deposit',
        amount: 1000,
        transactionDate: new Date().toISOString(),
        accountNo: accountNo,
        balance: account.balance
      },
      {
        transactionType: 'Withdrawal',
        amount: 500,
        transactionDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        accountNo: accountNo,
        balance: account.balance + 500
      },
      {
        transactionType: 'Deposit',
        amount: 2000,
        transactionDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        accountNo: accountNo,
        balance: account.balance + 1500
      }
    ];
    
    console.log('Sample transactions created:', sampleTransactions);
    console.log('Transactions array before adding:', this.transactions);
    
    // Remove existing transactions for this account and add sample ones
    this.transactions = this.transactions.filter(t => t.accountNo !== accountNo);
    this.transactions = [...this.transactions, ...sampleTransactions];
    
    console.log('Transactions array after adding:', this.transactions);
    console.log('Added', sampleTransactions.length, 'sample transactions for account', accountNo);
  }

  formatTransactionDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  viewAllTransactions(account: Account): void {
    // For now, just load more transactions or show a modal
    // This could be extended to show a separate page or modal with all transactions
    this.loadAccountTransactions(account);
  }
}