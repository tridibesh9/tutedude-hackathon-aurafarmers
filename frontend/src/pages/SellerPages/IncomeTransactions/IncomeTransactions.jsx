import React, { useState, useEffect } from "react";
import "./IncomeTransactions.css";
import Header from "../../../components/Header/Header";

const IncomeTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    pendingPayments: 0,
    completedTransactions: 0,
  });

  useEffect(() => {
    // Dummy data for demonstration
    const dummyTransactions = [
      {
        id: 1,
        orderId: "ORD001",
        customerName: "John Doe",
        amount: 500,
        date: "2025-07-27",
        status: "Completed",
        paymentMethod: "UPI",
        type: "Order Payment",
      },
      // Add more dummy transactions as needed
    ];

    const dummySummary = {
      totalIncome: 25000,
      pendingPayments: 1500,
      completedTransactions: 45,
    };

    setTransactions(dummyTransactions);
    setSummary(dummySummary);
  }, []);

  return (
    <div className="page-container">
      <Header title="Income and Transactions" subtitle="" showSearch />
      <div className="income-transactions">
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Income</h3>
            <p className="amount">₹{summary.totalIncome}</p>
          </div>
          <div className="summary-card">
            <h3>Pending Payments</h3>
            <p className="amount">₹{summary.pendingPayments}</p>
          </div>
          <div className="summary-card">
            <h3>Completed Transactions</h3>
            <p className="amount">{summary.completedTransactions}</p>
          </div>
        </div>

        <div className="transactions-section">
          <h3>Recent Transactions</h3>
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-header">
                  <div className="transaction-info">
                    <h4>{transaction.type}</h4>
                    <p>Order: {transaction.orderId}</p>
                  </div>
                  <div className="transaction-amount">
                    <span className="amount">₹{transaction.amount}</span>
                    <span
                      className={`status ${transaction.status.toLowerCase()}`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>

                <div className="transaction-details">
                  <div className="detail">
                    <label>Customer</label>
                    <span>{transaction.customerName}</span>
                  </div>
                  <div className="detail">
                    <label>Date</label>
                    <span>{transaction.date}</span>
                  </div>
                  <div className="detail">
                    <label>Payment Method</label>
                    <span>{transaction.paymentMethod}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeTransactions;
