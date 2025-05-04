// src/components/TimePeriodManagement.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import '../styles/TimePeriodManagement.css';

const TimePeriodManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    timePeriods, 
    expenses,
    paychecks,
    loading, 
    error, 
    createTimePeriod,
    getExpensesByTimePeriod,
    getPaychecksByTimePeriod,
    createExpense,
    updateExpense,
    deleteExpense,
    createPaycheck,
    updatePaycheck,
    deletePaycheck,
    calculateTimePeriodBalance
  } = useContext(DataContext);
  
  // States for time period
  const [timePeriodData, setTimePeriodData] = useState({ type: '' });
  const [timePeriodError, setTimePeriodError] = useState('');
  const [isCreatingTimePeriod, setIsCreatingTimePeriod] = useState(!id);
  
  // States for expenses
  const [expenseList, setExpenseList] = useState([]);
  const [expenseData, setExpenseData] = useState({
    description: '',
    amount: '',
    due_date: '',
    category: '',
    is_recurring: false,
    recurrence_interval: '',
    currency: 'USD'
  });
  const [expenseError, setExpenseError] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  
  // States for paychecks
  const [paycheckList, setPaycheckList] = useState([]);
  const [paycheckData, setPaycheckData] = useState({
    amount: '',
    date_received: '',
    currency: 'USD'
  });
  const [paycheckError, setPaycheckError] = useState('');
  const [editingPaycheckId, setEditingPaycheckId] = useState(null);
  const [showPaycheckForm, setShowPaycheckForm] = useState(false);

  // Financial summary
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('details');

  // Load time period data if ID is provided
  useEffect(() => {
    if (id) {
      const timePeriod = timePeriods.find(period => period.id === parseInt(id));
      console.log("Found time period:", timePeriod); // Debug logging
      
      if (timePeriod) {
        // Ensure we're working with a string type
        setTimePeriodData({
          type: typeof timePeriod.type === 'object' 
            ? JSON.stringify(timePeriod.type) 
            : String(timePeriod.type || '')
        });
        setIsCreatingTimePeriod(false);
        
        // Load expenses and paychecks for this time period
        const periodExpenses = getExpensesByTimePeriod(parseInt(id));
        const periodPaychecks = getPaychecksByTimePeriod(parseInt(id));
        
        setExpenseList(periodExpenses);
        setPaycheckList(periodPaychecks);
        
        // Calculate financial summary
        const financialSummary = calculateTimePeriodBalance(parseInt(id));
        setSummary({
          totalIncome: financialSummary.income,
          totalExpenses: financialSummary.expenses,
          balance: financialSummary.balance
        });
      } else {
        navigate('/time-periods');
      }
    }
  }, [id, timePeriods, expenses, paychecks, getExpensesByTimePeriod, getPaychecksByTimePeriod, calculateTimePeriodBalance, navigate]);
  
  // Handle time period form input changes
  const handleTimePeriodInputChange = (e) => {
    const { name, value } = e.target;
    setTimePeriodData({ ...timePeriodData, [name]: value });
  };
  
  // Handle expense form input changes
  const handleExpenseInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExpenseData({
      ...expenseData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle paycheck form input changes
  const handlePaycheckInputChange = (e) => {
    const { name, value } = e.target;
    setPaycheckData({
      ...paycheckData,
      [name]: value
    });
  };
  
  // Submit time period data - only for creation, not for updates
  const handleTimePeriodSubmit = async (e) => {
    e.preventDefault();
    setTimePeriodError('');
    
    if (!timePeriodData.type.trim()) {
      setTimePeriodError('Time period type is required');
      return;
    }
    
    // Optional: Add validation for minimum length, allowed characters, etc.
    if (timePeriodData.type.length < 3) {
      setTimePeriodError('Time period type must be at least 3 characters');
      return;
    }
    
    try {
      console.log("Submitting time period:", timePeriodData); // Debug logging
      const newTimePeriod = await createTimePeriod(timePeriodData);
      console.log("Server response:", newTimePeriod); // Debug logging
      
      if (newTimePeriod && newTimePeriod.id) {
        navigate(`/time-periods/${newTimePeriod.id}`);
      } else {
        setTimePeriodError('Failed to create time period');
      }
    } catch (err) {
      console.error("Error creating time period:", err);
      setTimePeriodError('Error creating time period: ' + (err.response?.data?.error || err.message || 'Unknown error'));
    }
  };
  
  // Submit expense data
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setExpenseError('');
    
    if (!expenseData.description.trim() || !expenseData.amount) {
      setExpenseError('Description and amount are required');
      return;
    }
    
    const amount = parseFloat(expenseData.amount);
    if (isNaN(amount) || amount <= 0) {
      setExpenseError('Amount must be a positive number');
      return;
    }
    
    try {
      const expensePayload = {
        ...expenseData,
        amount,
        is_recurring: expenseData.is_recurring || false
      };
      
      if (editingExpenseId) {
        await updateExpense(parseInt(id), editingExpenseId, expensePayload);
        // Update the expense in the local list
        setExpenseList(prevList => 
          prevList.map(expense => 
            expense.id === editingExpenseId ? { ...expense, ...expensePayload } : expense
          )
        );
      } else {
        const newExpense = await createExpense(parseInt(id), expensePayload);
        setExpenseList(prevList => [...prevList, newExpense]);
      }
      
      // Reset form
      setExpenseData({
        description: '',
        amount: '',
        due_date: '',
        category: '',
        is_recurring: false,
        recurrence_interval: '',
        currency: 'USD'
      });
      setEditingExpenseId(null);
      setShowExpenseForm(false);
      
      // Recalculate summary
      const updatedSummary = calculateTimePeriodBalance(parseInt(id));
      setSummary({
        totalIncome: updatedSummary.income,
        totalExpenses: updatedSummary.expenses,
        balance: updatedSummary.balance
      });
    } catch (err) {
      console.error('Error handling expense submission:', err);
      setExpenseError(editingExpenseId ? 'Failed to update expense' : 'Failed to create expense');
    }
  };
  
  // Submit paycheck data
  const handlePaycheckSubmit = async (e) => {
    e.preventDefault();
    setPaycheckError('');
    
    if (!paycheckData.amount) {
      setPaycheckError('Amount is required');
      return;
    }
    
    const amount = parseFloat(paycheckData.amount);
    if (isNaN(amount) || amount <= 0) {
      setPaycheckError('Amount must be a positive number');
      return;
    }
    
    try {
      const paycheckPayload = {
        ...paycheckData,
        amount
      };
      
      if (editingPaycheckId) {
        await updatePaycheck(parseInt(id), editingPaycheckId, paycheckPayload);
        // Update the paycheck in the local list
        setPaycheckList(prevList => 
          prevList.map(paycheck => 
            paycheck.id === editingPaycheckId ? { ...paycheck, ...paycheckPayload } : paycheck
          )
        );
      } else {
        const newPaycheck = await createPaycheck(parseInt(id), paycheckPayload);
        setPaycheckList(prevList => [...prevList, newPaycheck]);
      }
      
      // Reset form
      setPaycheckData({
        amount: '',
        date_received: '',
        currency: 'USD'
      });
      setEditingPaycheckId(null);
      setShowPaycheckForm(false);
      
      // Recalculate summary
      const updatedSummary = calculateTimePeriodBalance(parseInt(id));
      setSummary({
        totalIncome: updatedSummary.income,
        totalExpenses: updatedSummary.expenses,
        balance: updatedSummary.balance
      });
    } catch (err) {
      console.error('Error handling paycheck submission:', err);
      setPaycheckError(editingPaycheckId ? 'Failed to update paycheck' : 'Failed to create paycheck');
    }
  };
  
  // Edit expense
  const handleEditExpense = (expense) => {
    // Format date for input
    let formattedDate = '';
    if (expense.due_date) {
      const date = new Date(expense.due_date);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0];
      }
    }
    
    setExpenseData({
      description: expense.description,
      amount: expense.amount.toString(),
      due_date: formattedDate,
      category: expense.category || '',
      is_recurring: expense.is_recurring || false,
      recurrence_interval: expense.recurrence_interval || '',
      currency: expense.currency || 'USD'
    });
    
    setEditingExpenseId(expense.id);
    setShowExpenseForm(true);
    setActiveTab('expenses');
  };
  
  // Edit paycheck
  const handleEditPaycheck = (paycheck) => {
    // Format date for input
    let formattedDate = '';
    if (paycheck.date_received) {
      const date = new Date(paycheck.date_received);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0];
      }
    }
    
    setPaycheckData({
      amount: paycheck.amount.toString(),
      date_received: formattedDate,
      currency: paycheck.currency || 'USD'
    });
    
    setEditingPaycheckId(paycheck.id);
    setShowPaycheckForm(true);
    setActiveTab('paychecks');
  };
  
  // Delete expense
  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(parseInt(id), expenseId);
        
        // Update local list
        setExpenseList(prevList => 
          prevList.filter(expense => expense.id !== expenseId)
        );
        
        // Recalculate summary
        const updatedSummary = calculateTimePeriodBalance(parseInt(id));
        setSummary({
          totalIncome: updatedSummary.income,
          totalExpenses: updatedSummary.expenses,
          balance: updatedSummary.balance
        });
      } catch (err) {
        console.error('Error deleting expense:', err);
      }
    }
  };

  // Delete paycheck
  const handleDeletePaycheck = async (paycheckId) => {
    if (window.confirm('Are you sure you want to delete this paycheck?')) {
      try {
        await deletePaycheck(parseInt(id), paycheckId);
        
        // Update local list
        setPaycheckList(prevList => 
          prevList.filter(paycheck => paycheck.id !== paycheckId)
        );
        
        // Recalculate summary
        const updatedSummary = calculateTimePeriodBalance(parseInt(id));
        setSummary({
          totalIncome: updatedSummary.income,
          totalExpenses: updatedSummary.expenses,
          balance: updatedSummary.balance
        });
      } catch (err) {
        console.error('Error deleting paycheck:', err);
      }
    }
  };

  // Cancel forms
  const cancelExpenseForm = () => {
    setExpenseData({
      description: '',
      amount: '',
      due_date: '',
      category: '',
      is_recurring: false,
      recurrence_interval: '',
      currency: 'USD'
    });
    setEditingExpenseId(null);
    setShowExpenseForm(false);
  };

  const cancelPaycheckForm = () => {
    setPaycheckData({
      amount: '',
      date_received: '',
      currency: 'USD'
    });
    setEditingPaycheckId(null);
    setShowPaycheckForm(false);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

const getUniqueTimePeriodTypes = () => {
    const types = new Set();
    timePeriods.forEach(period => {
      if (period.type) {
        types.add(period.type);
      }
    });
    return Array.from(types);
  };

  return (
    <div className="time-period-management">
      <header className="page-header">
        <h1>
          {isCreatingTimePeriod 
            ? 'Create New Time Period' 
            : `Time Period: ${typeof timePeriodData.type === 'object' 
                ? JSON.stringify(timePeriodData.type) 
                : String(timePeriodData.type || '')}`
          }
        </h1>     
        <Link to="/time-periods" className="back-button">
          Back to All Time Periods
        </Link>
      </header>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Financial Summary Card - Only show if not creating a new time period */}
      {!isCreatingTimePeriod && (
        <div className="financial-summary-card">
          <div className="summary-item">
            <h3>Total Income</h3>
            <p className="amount">${summary.totalIncome.toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h3>Total Expenses</h3>
            <p className="amount">${summary.totalExpenses.toFixed(2)}</p>
          </div>
          <div className={`summary-item ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
            <h3>Balance</h3>
            <p className="amount">${summary.balance.toFixed(2)}</p>
          </div>
        </div>
      )}
      
      {/* Tab Navigation - Only show if not creating a new time period */}
      {!isCreatingTimePeriod && (
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Time Period Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            Expenses ({expenseList.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'paychecks' ? 'active' : ''}`}
            onClick={() => setActiveTab('paychecks')}
          >
            Paychecks ({paycheckList.length})
          </button>
        </div>
      )}
      
      {/* Time Period Form (Only enable editing for new time periods) */}
      {(isCreatingTimePeriod || activeTab === 'details') && (
        <div className="section">
          <h2>Time Period Details</h2>
          
          {timePeriodError && <div className="form-error">{timePeriodError}</div>}
          
          {isCreatingTimePeriod ? (
            <form onSubmit={handleTimePeriodSubmit} className="form time-period-form">
              <div className="form-group">
                <label htmlFor="type">Time Period Type</label>
                <select
                  id="type"
                  name="type"
                  value={timePeriodData.type}
                  onChange={handleTimePeriodInputChange}
                  className="select-dropdown"
                >
                  <option value="">Select a type</option>
                  {getUniqueTimePeriodTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div className="form-info">
                <p>Enter a time period type for your budget. Time periods are shared resources
                that organize your expenses and paychecks based on your financial cycles.</p>
                <p><strong>Common options:</strong> monthly, bi-weekly, yearly</p>
              </div>
              
              <button type="submit" className="submit-button">
                Create Time Period
              </button>
            </form>
          ) : (
            /* View-only display for existing time period */
            <div className="time-period-details">
              <div className="detail-item">
                <span className="label">Type:</span>
                <span className="value">
                  {typeof timePeriodData.type === 'object' 
                    ? JSON.stringify(timePeriodData.type) 
                    : timePeriodData.type}
                </span>
              </div>
              <div className="note">
                <p>Note: Time periods are shared resources and cannot be edited or deleted.</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Expenses Tab */}
      {!isCreatingTimePeriod && activeTab === 'expenses' && (
        <div className="section">
          <div className="section-header">
            <h2>Expenses</h2>
            {!showExpenseForm && (
              <button 
                className="add-button"
                onClick={() => setShowExpenseForm(true)}
              >
                Add Expense
              </button>
            )}
          </div>
          
          {/* Expense Form */}
          {showExpenseForm && (
            <div className="form-container">
              {expenseError && <div className="form-error">{expenseError}</div>}
              
              <form onSubmit={handleExpenseSubmit} className="form expense-form">
                <div className="form-header">
                  <h3>{editingExpenseId ? 'Edit Expense' : 'Add New Expense'}</h3>
                  {editingExpenseId && (
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={cancelExpenseForm}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={expenseData.description}
                      onChange={handleExpenseInputChange}
                      placeholder="e.g., Rent, Groceries"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="amount">Amount ($)</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={expenseData.amount}
                      onChange={handleExpenseInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="due_date">Due Date</label>
                    <input
                      type="date"
                      id="due_date"
                      name="due_date"
                      value={expenseData.due_date}
                      onChange={handleExpenseInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={expenseData.category}
                      onChange={handleExpenseInputChange}
                      className="select-dropdown"
                    >
                      <option value="">Select a category</option>
                      <option value="Housing">Housing</option>
                      <option value="Food">Food</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Debt">Debt</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Personal">Personal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="currency">Currency</label>
                    <select
                      id="currency"
                      name="currency"
                      value={expenseData.currency}
                      onChange={handleExpenseInputChange}
                      className="select-dropdown"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="is_recurring"
                        checked={expenseData.is_recurring}
                        onChange={handleExpenseInputChange}
                      />
                      Recurring Expense
                    </label>
                    
                    {expenseData.is_recurring && (
                      <select
                        name="recurrence_interval"
                        value={expenseData.recurrence_interval}
                        onChange={handleExpenseInputChange}
                        className="select-dropdown"
                      >
                        <option value="">Select interval</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    )}
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    {editingExpenseId ? 'Update Expense' : 'Add Expense'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={cancelExpenseForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Expenses List */}
          {expenseList.length > 0 ? (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Category</th>
                    <th>Recurring</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseList.map(expense => (
                    <tr key={expense.id}>
                      <td>{expense.description}</td>
                      <td>{expense.currency} {expense.amount.toFixed(2)}</td>
                      <td>
                        {expense.due_date 
                          ? new Date(expense.due_date).toLocaleDateString() 
                          : 'N/A'}
                      </td>
                      <td>{expense.category || 'Uncategorized'}</td>
                      <td>
                        {expense.is_recurring 
                          ? `Yes (${expense.recurrence_interval || 'Not specified'})` 
                          : 'No'}
                      </td>
                      <td className="actions">
                        <button 
                          className="edit-button"
                          onClick={() => handleEditExpense(expense)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No expenses found for this time period.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Paychecks Tab */}
      {!isCreatingTimePeriod && activeTab === 'paychecks' && (
        <div className="section">
          <div className="section-header">
            <h2>Paychecks</h2>
            {!showPaycheckForm && (
              <button 
                className="add-button"
                onClick={() => setShowPaycheckForm(true)}
              >
                Add Paycheck
              </button>
            )}
          </div>
          
          {/* Paycheck Form */}
          {showPaycheckForm && (
            <div className="form-container">
              {paycheckError && <div className="form-error">{paycheckError}</div>}
              
              <form onSubmit={handlePaycheckSubmit} className="form paycheck-form">
                <div className="form-header">
                  <h3>{editingPaycheckId ? 'Edit Paycheck' : 'Add New Paycheck'}</h3>
                  {editingPaycheckId && (
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={cancelPaycheckForm}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="amount">Amount ($)</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={paycheckData.amount}
                      onChange={handlePaycheckInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="date_received">Date Received</label>
                    <input
                      type="date"
                      id="date_received"
                      name="date_received"
                      value={paycheckData.date_received}
                      onChange={handlePaycheckInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="paycheck_currency">Currency</label>
                    <select
                      id="paycheck_currency"
                      name="currency"
                      value={paycheckData.currency}
                      onChange={handlePaycheckInputChange}
                      className="select-dropdown"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    {editingPaycheckId ? 'Update Paycheck' : 'Add Paycheck'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={cancelPaycheckForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Paychecks List */}
          {paycheckList.length > 0 ? (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Date Received</th>
                    <th>Currency</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paycheckList.map(paycheck => (
                    <tr key={paycheck.id}>
                      <td className="amount">{paycheck.currency} {paycheck.amount.toFixed(2)}</td>
                      <td>
                        {paycheck.date_received 
                          ? new Date(paycheck.date_received).toLocaleDateString() 
                          : 'N/A'}
                      </td>
                      <td>{paycheck.currency}</td>
                      <td className="actions">
                        <button 
                          className="edit-button"
                          onClick={() => handleEditPaycheck(paycheck)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeletePaycheck(paycheck.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No paychecks found for this time period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimePeriodManagement;