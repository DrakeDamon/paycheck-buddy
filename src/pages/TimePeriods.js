import React, { useState, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import '../styles/TimePeriods.css';

const TimePeriods = () => {
  const { 
    timePeriods, 
    loading, 
    error, 
    createTimePeriod, 
    deleteTimePeriod,
    calculateTimePeriodBalance,
    getExpensesByTimePeriod,
    getPaychecksByTimePeriod
  } = useContext(DataContext);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'monthly' });
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    try {
      await createTimePeriod(formData);
      setFormData({ name: '', type: 'monthly' });
      setShowForm(false);
    } catch (err) {
      setFormError('Failed to create time period');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this time period? This will also delete all associated expenses and paychecks.')) {
      await deleteTimePeriod(id);
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const timePeriodData = useMemo(() => {
    return timePeriods.map(period => {
      const balance = calculateTimePeriodBalance(period.id);
      const expenseCount = getExpensesByTimePeriod(period.id).length;
      const paycheckCount = getPaychecksByTimePeriod(period.id).length;
      return { ...period, balance, expenseCount, paycheckCount };
    });
  }, [timePeriods, calculateTimePeriodBalance, getExpensesByTimePeriod, getPaychecksByTimePeriod]);

  const filteredData = timePeriodData.filter(period => {
    const nameMatch = period.name.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === 'all' || period.type === filterType;
    return nameMatch && typeMatch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue, bValue;
    if (sortColumn === 'income') {
      aValue = a.balance.income;
      bValue = b.balance.income;
    } else if (sortColumn === 'expenses') {
      aValue = a.balance.expenses;
      bValue = b.balance.expenses;
    } else if (sortColumn === 'balance') {
      aValue = a.balance.balance;
      bValue = b.balance.balance;
    } else if (sortColumn === 'paychecks') {
      aValue = a.paycheckCount;
      bValue = b.paycheckCount;
    } else if (sortColumn === 'expensesCount') {
      aValue = a.expenseCount;
      bValue = b.expenseCount;
    } else {
      aValue = a[sortColumn].toLowerCase();
      bValue = b[sortColumn].toLowerCase();
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return <div className="loading">Loading time periods...</div>;
  }

  return (
    <div className="time-periods-page">
      <header className="page-header">
        <h1>Time Periods</h1>
        <button className="add-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Time Period'}
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-container">
          {formError && <div className="form-error">{formError}</div>}
          <form onSubmit={handleSubmit} className="time-period-form">
            <div className="form-group">
              <label htmlFor="name">Time Period Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., January 2025"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="type">Time Period Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="bi-monthly">Bi-Monthly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <button type="submit" className="submit-button">Create Time Period</button>
          </form>
        </div>
      )}

      {timePeriods.length > 0 ? (
        <div className="time-periods-table">
          <div className="filter-controls">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name"
            />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="monthly">Monthly</option>
              <option value="bi-monthly">Bi-Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  Name {sortColumn === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('type')}>
                  Type {sortColumn === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('income')}>
                  Income {sortColumn === 'income' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('expenses')}>
                  Expenses {sortColumn === 'expenses' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('balance')}>
                  Balance {sortColumn === 'balance' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('paychecks')}>
                  Paychecks {sortColumn === 'paychecks' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('expensesCount')}>
                  Expenses {sortColumn === 'expensesCount' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(period => (
                <tr key={period.id}>
                  <td>{period.name}</td>
                  <td>{period.type}</td>
                  <td>${period.balance.income.toFixed(2)}</td>
                  <td>${period.balance.expenses.toFixed(2)}</td>
                  <td className={period.balance.balance >= 0 ? 'positive' : 'negative'}>
                    ${period.balance.balance.toFixed(2)}
                  </td>
                  <td>{period.paycheckCount}</td>
                  <td>{period.expenseCount}</td>
                  <td className="actions">
                    <Link to={`/time-periods/${period.id}/paychecks`} className="action-button paycheck">P</Link>
                    <Link to={`/time-periods/${period.id}/expenses`} className="action-button expense">E</Link>
                    <button className="action-button delete" onClick={() => handleDelete(period.id)}>D</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">
          <p>No time periods found. Create your first time period to get started!</p>
          <button className="add-button" onClick={() => setShowForm(true)}>
            Create Time Period
          </button>
        </div>
      )}

      <div className="info-box">
        <h3>How PaycheckBuddy Works</h3>
        <p>
          First, create time periods that match your financial cycles (bi-monthly, monthly, yearly). Time periods should match your income cycle. Name them according to when you receive paychecks.
          Then add your paychecks and expenses to each time period to see if your income covers your expenses.
        </p>
      </div>
    </div>
  );
};

export default TimePeriods;