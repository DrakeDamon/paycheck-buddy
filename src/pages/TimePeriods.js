import React, { useState, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import '../styles/TimePeriods.css';

const TimePeriods = () => {
  const { 
    timePeriods, 
    loading, 
    error,
    calculateTimePeriodBalance,
    getExpensesByTimePeriod,
    getPaychecksByTimePeriod
  } = useContext(DataContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortColumn, setSortColumn] = useState('type');
  const [sortDirection, setSortDirection] = useState('asc');

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
    // Safely handle potential undefined values
    const periodType = period.type || '';
    const searchMatch = period.type ? period.type.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const typeMatch = filterType === 'all' || periodType === filterType;
    return searchMatch && typeMatch;
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
      // Safely handle potential undefined values
      aValue = (a[sortColumn] || '').toString().toLowerCase();
      bValue = (b[sortColumn] || '').toString().toLowerCase();
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
        <Link to="/time-periods/new" className="add-button">
          Create New Time Period
        </Link>
      </header>

      {error && <div className="error-message">{error}</div>}

      {timePeriods.length > 0 ? (
        <div className="time-periods-table">
          <div className="filter-controls">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by type"
            />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="monthly">Monthly</option>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <table>
            <thead>
              <tr>
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
                  <td>
                    <Link to={`/time-periods/${period.id}`} className="period-type-link">
                      {period.type}
                    </Link>
                  </td>
                  <td>${period.balance.income.toFixed(2)}</td>
                  <td>${period.balance.expenses.toFixed(2)}</td>
                  <td className={period.balance.balance >= 0 ? 'positive' : 'negative'}>
                    ${period.balance.balance.toFixed(2)}
                  </td>
                  <td>{period.paycheckCount}</td>
                  <td>{period.expenseCount}</td>
                  <td className="actions">
                    <Link to={`/time-periods/${period.id}`} className="action-button view" title="View Time Period">
                      View
                    </Link>
                    <Link to={`/time-periods/${period.id}/paychecks`} className="action-button paycheck" title="Manage Paychecks">
                      P
                    </Link>
                    <Link to={`/time-periods/${period.id}/expenses`} className="action-button expense" title="Manage Expenses">
                      E
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">
          <p>No time periods found. Create your first time period to get started!</p>
          <Link to="/time-periods/new" className="add-button">
            Create Time Period
          </Link>
        </div>
      )}

      <div className="info-box">
        <h3>How PaycheckBuddy Works</h3>
        <p>
          First, select a time period that matches your financial cycle (bi-weekly, monthly, yearly).
          Then add your paychecks and expenses to that time period to see if your income covers your expenses.
        </p>
      </div>
    </div>
  );
};

export default TimePeriods;