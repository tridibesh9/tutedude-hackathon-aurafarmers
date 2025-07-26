import React, { useState } from 'react';
import { CreditCard, TrendingUp, Calendar, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import './DigitalKhata.css';

// The main component for the Digital Ledger feature
const DigitalKhata = ({ userRole }) => {
  // State to manage the currently active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Static data for demonstration purposes
  const creditLimit = 5000;
  const availableCredit = 2500;
  const usedCredit = creditLimit - availableCredit;
  const currentBalance = -1200; // Negative means the user owes money
  const creditScore = 750; // Out of 900

  const transactions = [
    {
      id: '1',
      type: 'debit',
      amount: 195,
      description: 'Bought onions, tomatoes',
      date: '12 Jan 2025',
      supplier: 'Gupta Traders',
    },
    {
      id: '2',
      type: 'credit',
      amount: 500,
      description: 'Payment made',
      date: '10 Jan 2025',
    },
    {
      id: '3',
      type: 'debit',
      amount: 380,
      description: 'Bought spices',
      date: '08 Jan 2025',
      supplier: 'Sharma Wholesale',
    },
  ];

  // Helper function to render a single transaction item
  const renderTransaction = (transaction) => (
    <div key={transaction.id} className="card transaction-item">
      <div className="transaction-content">
        <div className={`transaction-icon-container ${transaction.type}`}>
          {transaction.type === 'credit' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
        </div>
        <div className="transaction-details">
          <div className="font-semibold">{transaction.description}</div>
          {transaction.supplier && (
            <div className="text-sm text-muted">{transaction.supplier}</div>
          )}
          <div className="text-sm text-light">{transaction.date}</div>
        </div>
        <div className={`transaction-amount ${transaction.type}`}>
          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
        </div>
      </div>
    </div>
  );

  // Helper function to render a single benefit item
  const renderBenefit = (text) => (
      <div className="benefit-item">
          <div className="benefit-icon-container">
              <span className="benefit-tick">✓</span>
          </div>
          <span className="text-sm">{text}</span>
      </div>
  );

  return (
    <div className="container">
      {/* Header Section */}
      <header className="header">
        <h1>Digital Ledger</h1>
        <p>Your financial companion</p>

        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-row">
            <div>
              <div className="balance-label">Current Balance</div>
              <div className={`balance-amount ${currentBalance < 0 ? 'due' : 'paid'}`}>
                ₹{Math.abs(currentBalance)}
                {currentBalance < 0 && <span className="due-label">(Due)</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="balance-label">Credit Score</div>
              <div className="credit-score">{creditScore}/900</div>
            </div>
          </div>
          
          {/* Credit Progress Bar */}
          <div className="credit-bar-container">
            <div className="credit-bar-info">
              <span>Partner Credit</span>
              <span>₹{availableCredit}/₹{creditLimit}</span>
            </div>
            <div className="credit-bar-background">
              <div 
                className="credit-bar-progress"
                style={{ width: `${(availableCredit / creditLimit) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="tabs-container">
        <div className="tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'transactions', label: 'Transactions' },
            { id: 'credit', label: 'Credit' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content Area based on Active Tab */}
      <main className="content">
        {activeTab === 'overview' && (
          <div className="content-section">
            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-button add-money">
                <Plus size={20} />
                <span>Add Money</span>
              </button>
              <button className="action-button use-bnpl">
                <CreditCard size={20} />
                <span>Use BNPL</span>
              </button>
            </div>

            {/* Weekly Summary */}
            <div className="card">
              <h3 className="card-title">This week's summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-amount spent">₹1,275</div>
                  <div className="summary-label">Spent</div>
                </div>
                <div className="summary-item">
                  <div className="summary-amount deposited">₹800</div>
                  <div className="summary-label">Deposited</div>
                </div>
              </div>
            </div>

            {/* Payment Reminders */}
            <div className="reminder-card">
              <div className="reminder-content">
                <div className="reminder-icon-container">
                  <Calendar className="icon" size={16} />
                </div>
                <div>
                  <div className="font-semibold">Payment Reminder</div>
                  <div className="text-sm text-muted">₹195 due to Gupta Traders</div>
                </div>
                <button className="pay-now-button">Pay Now</button>
              </div>
            </div>

            {/* Credit Health */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Credit Health</h3>
                <TrendingUp className="text-green" size={20} />
              </div>
              <div className="credit-health-details">
                <div className="detail-row">
                  <span>On-time payments</span>
                  <span className="text-green font-semibold">92%</span>
                </div>
                <div className="detail-row">
                  <span>Credit utilization</span>
                  <span className="text-orange font-semibold">50%</span>
                </div>
                <div className="detail-row">
                  <span>Account age</span>
                  <span className="text-blue font-semibold">8 months</span>
                </div> 
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="content-section">
            {transactions.map(renderTransaction)}
          </div>
        )}

        {activeTab === 'credit' && (
          <div className="content-section">
            {/* Credit Limit Card */}
            <div className="credit-limit-card">
              <div className="card-header">
                <div>
                  <div className="credit-limit-label">Partner Credit Limit</div>
                  <div className="credit-limit-amount">₹{creditLimit}</div>
                </div>
                <CreditCard size={32} className="icon" />
              </div>
              <div className="credit-limit-details">
                <div className="detail-row">
                  <span>Available</span>
                  <span>₹{availableCredit}</span>
                </div>
                <div className="detail-row">
                  <span>Used</span>
                  <span>₹{usedCredit}</span>
                </div>
              </div>
            </div>

            {/* BNPL Benefits */}
            <div className="card">
              <h3 className="card-title">BNPL Benefits</h3>
              <div className="benefits-list">
                {renderBenefit("0% interest purchases")}
                {renderBenefit("15-day flexible payment")}
                {renderBenefit("Improve credit score")}
              </div>
            </div>

            {/* Increase Limit */}
            <div className="increase-limit-card">
              <div className="increase-limit-content">
                <div>
                  <div className="font-semibold">Increase credit limit</div>
                  <div className="text-sm text-muted">Get up to ₹10,000</div>
                </div>
                <button className="apply-button">Apply</button>
              </div>
            </div>

            {/* Payment Schedule */}
            <div className="card">
              <h3 className="card-title">Upcoming payments</h3>
              <div className="payment-schedule-list">
                <div className="upcoming-payment-item">
                  <div>
                    <div className="font-medium">15 Jan 2025</div>
                    <div className="text-sm text-muted">Gupta Traders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red">₹195</div>
                    <div className="text-xs text-light">2 days left</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default DigitalKhata;