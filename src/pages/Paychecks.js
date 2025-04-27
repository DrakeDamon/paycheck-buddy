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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    date_received: '',
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
  
  // Filter paychecks by time period if id is provided
  useEffect(() => {
    if (id) {
      // Specific time period's paychecks
      const periodPaychecks = getPaychecksByTimePeriod(parseInt(id));
      setFilteredPaychecks(periodPaychecks);
    } else {
      // All paychecks
      setFilteredPaychecks(paychecks);
    }
  }, [id, paychecks, getPaychecksByTimePeriod]);
  
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
    
    // Validate form
    if (!formData.amount) {
      setFormError('Amount is required');
      return;
    }
    
    // Validate amount is a number
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }
    
    try {
      // Create the paycheck object
      const paycheckData = {
        ...formData,
        amount,
        time_period_id: id // Use the time period ID from URL params
      };
      
      await createPaycheck(parseInt(id), paycheckData);
      
      // Reset form and hide it
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
        // Find the time period ID for this paycheck
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
              <h1>Paychecks for: {currentTimePeriod?.name || 'Unknown Time Period'}</h1>
              <div className="header-actions">
                <Link to="/time-periods" className="secondary-button">
                  Back to Time Periods
                </Link>
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
          <h2>Select a Time Period to Add Paychecks</h2>
          <div className="time-period-cards">
            {timePeriods.map(period => (
              <div key={period.id} className="time-period-select-card">
                <h3>{period.name}</h3>
                <span className="period-type">{period.type}</span>
                <Link to={`/time-periods/${period.id}/paychecks`} className="select-button">
                  View & Add Paychecks
                </Link>
              </div>
            ))}
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
                // Find time period name
                const timePeriod = timePeriods.find(period => period.id === paycheck.time_period_id);
                const timePeriodName = timePeriod ? timePeriod.name : 'Unknown';
                
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
                          {timePeriodName}
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