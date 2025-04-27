import React, { useState, useContext } from 'react';
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
    calculateTimePeriodBalance
  } = useContext(DataContext);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'monthly'
  });
  const [formError, setFormError] = useState('');
  
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
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    
    try {
      await createTimePeriod(formData);
      // Reset form and hide it
      setFormData({
        name: '',
        type: 'monthly'
      });
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
  
  if (loading) {
    return <div className="loading">Loading time periods...</div>;
  }
  
  return (
    <div className="time-periods-page">
      <header className="page-header">
        <h1>Time Periods</h1>
        <button 
          className="add-button"
          onClick={() => setShowForm(!showForm)}
        >
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
            
            <button type="submit" className="submit-button">
              Create Time Period
            </button>
          </form>
        </div>
      )}
      
      {timePeriods.length > 0 ? (
        <div className="time-periods-grid">
          {timePeriods.map(period => {
            const balance = calculateTimePeriodBalance(period.id);
            return (
              <div key={period.id} className="time-period-card">
                <div className="card-header">
                  <h2>{period.name}</h2>
                  <span className="period-type">{period.type}</span>
                </div>
                
                <div className="card-body">
                  <div className="balance-info">
                    <div className="balance-item">
                      <span className="label">Income:</span>
                      <span className="value">${balance.income.toFixed(2)}</span>
                    </div>
                    <div className="balance-item">
                      <span className="label">Expenses:</span>
                      <span className="value">${balance.expenses.toFixed(2)}</span>
                    </div>
                    <div className="balance-item">
                      <span className="label">Balance:</span>
                      <span className={`value ${balance.balance >= 0 ? 'positive' : 'negative'}`}>
                        ${balance.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <Link to={`/time-periods/${period.id}`} className="view-button">
                    View Details
                  </Link>
                  <Link to={`/time-periods/${period.id}/expenses`} className="expenses-button">
                    Expenses
                  </Link>
                  <Link to={`/time-periods/${period.id}/paychecks`} className="paychecks-button">
                    Paychecks
                  </Link>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(period.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-data">
          <p>No time periods found. Create your first time period to get started!</p>
          <button
            className="add-button"
            onClick={() => setShowForm(true)}
          >
            Create Time Period
          </button>
        </div>
      )}
    </div>
  );
};

export default TimePeriods;