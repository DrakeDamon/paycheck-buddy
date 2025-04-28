import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import '../styles/Expenses.css';

const Expenses = () => {
  const { id } = useParams();
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
  const [filterTimePeriod, setFilterTimePeriod] = useState('all'); // New filter state
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
  
  // Filter expenses based on id or filterTimePeriod
  useEffect(() => {
    if (id) {
      const periodExpenses = getExpensesByTimePeriod(parseInt(id));
      setFilteredExpenses(periodExpenses);
    } else if (filterTimePeriod === 'all') {
      setFilteredExpenses(expenses);
    } else {
      const periodId = parseInt(filterTimePeriod);
      const filtered = getExpensesByTimePeriod(periodId);
      setFilteredExpenses(filtered);
    }
  }, [id, expenses, filterTimePeriod, getExpensesByTimePeriod]);
  
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
    
    if (!formData.description.trim() || !formData.amount) {
      setFormError('Description and amount are required');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }
    
    try {
      const expenseData = {
        ...formData,
        amount,
        is_recurring: formData.is_recurring || false,
        time_period_id: id
      };
      
      await createExpense(parseInt(id), expenseData);
      
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
        <h1>All Expenses</h1>
      </header>

      {!id && timePeriods.length > 0 && (
        <div className="time-period-selector">
          <h2>Select a Time Period to Filter or Add Expenses</h2>
          <div className="filter-and-add">
            <select
              id="timePeriodFilter"
              value={filterTimePeriod}
              onChange={(e) => setFilterTimePeriod(e.target.value)}
            >
              <option value="all">All Expenses</option>
              {timePeriods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
            <button
              className="add-expense-button"
              onClick={() => {
                if (filterTimePeriod !== 'all') {
                  navigate(`/time-periods/${filterTimePeriod}/expenses`);
                } else {
                  alert('Please select a specific time period to add expenses.');
                }
              }}
            >
              Add Expense
            </button>
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
                <th>Time Period</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  <td>{expense.description}</td>
                  <td>{expense.currency} {expense.amount.toFixed(2)}</td>
                  <td>{expense.due_date}</td>
                  <td>{expense.category}</td>
                  <td>{expense.is_recurring ? `Yes (${expense.recurrence_interval})` : 'No'}</td>
                  <td>{timePeriods.find(p => p.id === expense.time_period_id)?.name}</td>
                  <td><button className="delete-button">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">No expenses found.</div>
      )}

      <footer>© 2025 PaycheckBuddy. All rights reserved</footer>
    </div>
  );
};

export default Expenses;