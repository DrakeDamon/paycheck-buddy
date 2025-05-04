import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import '../styles/Paychecks.css';

const Paychecks = () => {
  const { id } = useParams(); // time_period_id from URL if present
  const navigate = useNavigate();
  const { 
    paychecks, 
    timePeriods, 
    getPaychecksByTimePeriod,
    createPaycheck,
    deletePaycheck,
    loading, 
    error 
  } = useContext(DataContext);
  
  const [filteredPaychecks, setFilteredPaychecks] = useState([]);
  const [filterTimePeriod, setFilterTimePeriod] = useState('all'); // Filter state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    date_received: '',
    currency: 'USD'
  });
  const [formError, setFormError] = useState('');
  const [currentTimePeriod, setCurrentTimePeriod] = useState(null);
  
  // Function to get unique time period types for dropdown
  const getUniqueTimePeriodTypes = () => {
    const types = new Set();
    timePeriods.forEach(period => {
      if (period.type) {
        types.add(period.type);
      }
    });
    return Array.from(types);
  };
  
  // Get current time period if id is provided
  useEffect(() => {
    if (id && timePeriods.length > 0) {
      const period = timePeriods.find(p => p.id === parseInt(id));
      setCurrentTimePeriod(period || null);
    } else {
      setCurrentTimePeriod(null);
    }
  }, [id, timePeriods]);
  
  // Filter paychecks based on id or filterTimePeriod
  useEffect(() => {
    if (id) {
      const periodPaychecks = getPaychecksByTimePeriod(parseInt(id));
      setFilteredPaychecks(periodPaychecks);
    } else if (filterTimePeriod === 'all') {
      setFilteredPaychecks(paychecks);
    } else {
      const periodId = parseInt(filterTimePeriod);
      const filtered = getPaychecksByTimePeriod(periodId);
      setFilteredPaychecks(filtered);
    }
  }, [id, paychecks, filterTimePeriod, getPaychecksByTimePeriod]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.amount) {
      setFormError('Amount is required');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }
    
    try {
      const paycheckData = {
        ...formData,
        amount,
        time_period_id: id
      };
      
      await createPaycheck(parseInt(id), paycheckData);
      
      setFormData({
        amount: '',
        date_received: '',
        currency: 'USD'
      });
      setShowForm(false);
    } catch (err) {
      setFormError('Failed to create paycheck');
    }
  };
  
  const handleDelete = async (paycheckId) => {
    if (window.confirm('Are you sure you want to delete this paycheck?')) {
      try {
        const paycheck = paychecks.find(pc => pc.id === paycheckId);
        if (paycheck) {
          await deletePaycheck(paycheck.time_period_id, paycheckId);
        }
      } catch (err) {
        console.error('Error deleting paycheck:', err);
      }
    }
  };
  
  if (loading) {
    return <div className="loading">Loading paychecks...</div>;
  }
  
  return (
    <div className="paychecks-page">
      <header className="page-header">
        <div className="header-content">
          {id ? (
            <>
              <h1>Paychecks for: {currentTimePeriod?.type || 'Unknown Time Period'}</h1>
              <div className="header-actions">
                <Link to="/paychecks" className="secondary-button">
                  All Paychecks
                </Link>
              </div>
            </>
          ) : (
            <h1>All Paychecks</h1>
          )}
        </div>
        
        {id && (
          <button 
            className="add-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Paycheck'}
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
          
          <form onSubmit={handleSubmit} className="paycheck-form">
            <div className="form-grid">
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
                <label htmlFor="date_received">Date Received</label>
                <input
                  type="date"
                  id="date_received"
                  name="date_received"
                  value={formData.date_received}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
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
            
            <button type="submit" className="submit-button">
              Add Paycheck
            </button>
          </form>
        </div>
      )}
      
      {!id && timePeriods.length > 0 && (
        <div className="time-period-selector">
          <h2>Select a Time Period to Filter or Add Paychecks</h2>
          <div className="filter-and-add">
            <select
              id="timePeriodFilter"
              value={filterTimePeriod}
              onChange={(e) => setFilterTimePeriod(e.target.value)}
              className="select-dropdown"
            >
              <option value="all">All Paychecks</option>
              {timePeriods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.type}
                </option>
              ))}
            </select>
            <button
              className="add-paycheck-button"
              onClick={() => {
                if (filterTimePeriod !== 'all') {
                  navigate(`/time-periods/${filterTimePeriod}/paychecks`);
                } else {
                  alert('Please select a specific time period to add a paycheck.');
                }
              }}
            >
              Add Paycheck
            </button>
          </div>
        </div>
      )}
      
      {filteredPaychecks.length > 0 ? (
        <div className="paychecks-list">
          <table className="paychecks-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Date Received</th>
                <th>Currency</th>
                {!id && <th>Time Period</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaychecks.map(paycheck => {
                const timePeriod = timePeriods.find(period => period.id === paycheck.time_period_id);
                const timePeriodType = timePeriod ? timePeriod.type : 'Unknown';
                return (
                  <tr key={paycheck.id}>
                    <td className="amount">
                      {paycheck.currency} {paycheck.amount.toFixed(2)}
                    </td>
                    <td>
                      {paycheck.date_received 
                        ? new Date(paycheck.date_received).toLocaleDateString() 
                        : 'N/A'}
                    </td>
                    <td>{paycheck.currency}</td>
                    {!id && (
                      <td>
                        <Link to={`/time-periods/${paycheck.time_period_id}/paychecks`}>
                          {timePeriodType}
                        </Link>
                      </td>
                    )}
                    <td>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(paycheck.id)}
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
              <p>No paychecks found for this time period.</p>
              <button
                className="add-button"
                onClick={() => setShowForm(true)}
              >
                Add Paycheck
              </button>
            </>
          ) : (
            <p>No paychecks found. Select a time period to add paychecks.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Paychecks;