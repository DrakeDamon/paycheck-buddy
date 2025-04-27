import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import '../styles/Paychecks.css';

const Paychecks = () => {
  const { id } = useParams(); // time_period_id from URL if present
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
  
  // Find time period name if id is provided
  const getTimePeriodName = () => {
    if (id) {
      const timePeriod = timePeriods.find(period => period.id === parseInt(id));
      return timePeriod ? timePeriod.name : 'Unknown Time Period';
    }
    return 'All Time Periods';
  };
  
  if (loading) {
    return <div className="loading">Loading paychecks...</div>;
  }
  
  return (
    <div className="paychecks-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Paychecks: {getTimePeriodName()}</h1>
          {id && (
            <Link to="/paychecks" className="view-all-link">
              View All Paychecks
            </Link>
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
                    {!id && <td>{timePeriodName}</td>}
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
          <p>No paychecks found. {id && 'Add your first paycheck for this time period!'}</p>
          {id && (
            <button
              className="add-button"
              onClick={() => setShowForm(true)}
            >
              Add Paycheck
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Paychecks;