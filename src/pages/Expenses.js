import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import '../styles/Expenses.css';

const Expenses = () => {
  const { id } = useParams(); // time_period_id from URL if present
  const navigate = useNavigate();
  const { 
    expenses, 
    timePeriods, 
    getExpensesByTimePeriod,
    createExpense,
    deleteExpense,
    loading, 
    error 
  } = useContext(DataContext);
  
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    category: '',
    is_recurring: false,
    recurrence_interval: '',
    currency: 'USD'
  });
  const [formError, setFormError] = useState('');
  const [currentTimePeriod, setCurrentTimePeriod] = useState(null);
  
  // Get current time period if id is provided
  useEffect(() => {
    if (id && timePeriods.length > 0) {
      const period = timePeriods.find(p => p.id === parseInt(id));
      setCurrentTimePeriod(period || null);
    } else {
      setCurrentTimePeriod(null);
    }
  }, [id, timePeriods]);
  
  // Filter expenses by time period if id is provided
  useEffect(() => {
    if (id) {
      // Specific time period's expenses
      const periodExpenses = getExpensesByTimePeriod(parseInt(id));
      setFilteredExpenses(periodExpenses);
    } else {
      // All expenses
      setFilteredExpenses(expenses);
    }
  }, [id, expenses, getExpensesByTimePeriod]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validate form
    if (!formData.description.trim() || !formData.amount) {
      setFormError('Description and amount are required');
      return;
    }
    
    // Validate amount is a number
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }
    
    try {
      // Create the expense object
      const expenseData = {
        ...formData,
        amount,
        is_recurring: formData.is_recurring || false,
        time_period_id: id // Use the time period ID from URL params
      };
      
      await createExpense(parseInt(id), expenseData);
      
      // Reset form and hide it
      setFormData({
        description: '',
        amount: '',
        due_date: '',
        category: '',
        is_recurring: false,
        recurrence_interval: '',
        currency: 'USD'
      });
      setShowForm(false);
    } catch (err) {
      setFormError('Failed to create expense');
    }
  };
  
  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        // Find the time period ID for this expense
        const expense = expenses.find(exp => exp.id === expenseId);
        if (expense) {
          await deleteExpense(expense.time_period_id, expenseId);
        }
      } catch (err) {
        console.error('Error deleting expense:', err);
      }
    }
  };
  
  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }
  
  return (
    <div className="expenses-page">
      <header className="page-header">
        <div className="header-content">
          {id ? (
            <>
              <h1>Expenses for: {currentTimePeriod?.name || 'Unknown Time Period'}</h1>
              <div className="header-actions">
                <Link to="/time-periods" className="secondary-button">
                  Back to Time Periods
                </Link>
                <Link to="/expenses" className="secondary-button">
                  All Expenses
                </Link>
              </div>
            </>
          ) : (
            <h1>All Expenses</h1>
          )}
        </div>
        
        {id && (
          <button 
            className="add-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        )}
      </header>
      
      {error && <div className="error-message">{error}</div>}
      
      {id && !currentTimePeriod && (
        <div className="error-message">Time period not found. <Link to="/time-periods">Return to Time Periods</Link></div>
      )}
      
      {id && showForm && (
        <div className="form-container">
          {formError && <div className="form-error">{formError}</div>}
          
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Rent, Groceries, etc."
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">Amount ($)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="due_date">Due Date</label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Select category</option>
                  <option value="Housing">Housing</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Food">Food</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Personal">Personal</option>
                  <option value="Debt">Debt</option>
                  <option value="Savings">Savings</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleInputChange}
                  />
                  Recurring Expense
                </label>
              </div>
              
              {formData.is_recurring && (
                <div className="form-group">
                  <label htmlFor="recurrence_interval">Recurrence</label>
                  <select
                    id="recurrence_interval"
                    name="recurrence_interval"
                    value={formData.recurrence_interval}
                    onChange={handleInputChange}
                  >
                    <option value="">Select interval</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="submit-button">
              Create Expense
            </button>
          </form>
        </div>
      )}
      
      {!id && timePeriods.length > 0 && (
        <div className="time-period-selector">
          <h2>Select a Time Period to Add Expenses</h2>
          <div className="time-period-cards">
            {timePeriods.map(period => (
              <div key={period.id} className="time-period-select-card">
                <h3>{period.name}</h3>
                <span className="period-type">{period.type}</span>
                <Link to={`/time-periods/${period.id}/expenses`} className="select-button">
                  View & Add Expenses
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {filteredExpenses.length > 0 ? (
        <div className="expenses-list">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Category</th>
                <th>Recurring</th>
                {!id && <th>Time Period</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => {
                // Find time period name
                const timePeriod = timePeriods.find(period => period.id === expense.time_period_id);
                const timePeriodName = timePeriod ? timePeriod.name : 'Unknown';
                
                return (
                  <tr key={expense.id}>
                    <td>{expense.description}</td>
                    <td className="amount">
                      {expense.currency} {expense.amount.toFixed(2)}
                    </td>
                    <td>
                      {expense.due_date 
                        ? new Date(expense.due_date).toLocaleDateString() 
                        : 'N/A'}
                    </td>
                    <td>{expense.category || 'Uncategorized'}</td>
                    <td>
                      {expense.is_recurring 
                        ? `Yes (${expense.recurrence_interval || 'not specified'})` 
                        : 'No'}
                    </td>
                    {!id && (
                      <td>
                        <Link to={`/time-periods/${expense.time_period_id}/expenses`}>
                          {timePeriodName}
                        </Link>
                      </td>
                    )}
                    <td>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(expense.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">
          {id ? (
            <>
              <p>No expenses found for this time period.</p>
              <button
                className="add-button"
                onClick={() => setShowForm(true)}
              >
                Add Expense
              </button>
            </>
          ) : (
            <p>No expenses found. Select a time period to add expenses.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Expenses;