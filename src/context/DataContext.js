import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  
  const [timePeriods, setTimePeriods] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [paychecks, setPaychecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Use useCallback to prevent function recreation on every render
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || dataLoaded) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/user_data');
      const userData = response.data;
      
      setTimePeriods(userData.time_periods || []);
      setExpenses(userData.expenses || []);
      setPaychecks(userData.paychecks || []);
      setDataLoaded(true);
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to load user data');
      console.error('Error loading user data:', err);
    }
  }, [isAuthenticated, dataLoaded]);

  // Load all user data when authenticated
  useEffect(() => {
    if (isAuthenticated && !dataLoaded) {
      loadUserData();
    } else if (!isAuthenticated) {
      // Reset data when logged out
      setTimePeriods([]);
      setExpenses([]);
      setPaychecks([]);
      setDataLoaded(false);
    }
  }, [isAuthenticated, loadUserData, dataLoaded]);

  // Time Period CRUD operations
  const createTimePeriod = async (timePeriod) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/time_periods', timePeriod);
      const newTimePeriod = response.data;
      
      setTimePeriods([...timePeriods, newTimePeriod]);
      setLoading(false);
      
      return newTimePeriod;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to create time period');
      console.error('Error creating time period:', err);
      return null;
    }
  };

  const updateTimePeriod = async (id, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`/api/time_periods/${id}`, updates);
      const updatedTimePeriod = response.data;
      
      setTimePeriods(timePeriods.map(period => 
        period.id === id ? updatedTimePeriod : period
      ));
      
      setLoading(false);
      return updatedTimePeriod;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to update time period');
      console.error('Error updating time period:', err);
      return null;
    }
  };

  const deleteTimePeriod = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`/api/time_periods/${id}`);
      
      // Remove the time period from state
      setTimePeriods(timePeriods.filter(period => period.id !== id));
      
      // Also remove any expenses or paychecks associated with this time period
      setExpenses(expenses.filter(expense => expense.time_period_id !== id));
      setPaychecks(paychecks.filter(paycheck => paycheck.time_period_id !== id));
      
      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to delete time period');
      console.error('Error deleting time period:', err);
      return false;
    }
  };

  // Expense CRUD operations
  const createExpense = async (timePeriodId, expense) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`/api/time_periods/${timePeriodId}/expenses`, expense);
      const newExpense = response.data;
      
      setExpenses([...expenses, newExpense]);
      setLoading(false);
      
      return newExpense;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to create expense');
      console.error('Error creating expense:', err);
      return null;
    }
  };

  const updateExpense = async (timePeriodId, expenseId, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`/api/time_periods/${timePeriodId}/expenses/${expenseId}`, updates);
      const updatedExpense = response.data;
      
      setExpenses(expenses.map(expense => 
        expense.id === expenseId ? updatedExpense : expense
      ));
      
      setLoading(false);
      return updatedExpense;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to update expense');
      console.error('Error updating expense:', err);
      return null;
    }
  };

  const deleteExpense = async (timePeriodId, expenseId) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`/api/time_periods/${timePeriodId}/expenses/${expenseId}`);
      
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      setLoading(false);
      
      return true;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to delete expense');
      console.error('Error deleting expense:', err);
      return false;
    }
  };

  // Paycheck CRUD operations
  const createPaycheck = async (timePeriodId, paycheck) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`/api/time_periods/${timePeriodId}/paychecks`, paycheck);
      const newPaycheck = response.data;
      
      setPaychecks([...paychecks, newPaycheck]);
      setLoading(false);
      
      return newPaycheck;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to create paycheck');
      console.error('Error creating paycheck:', err);
      return null;
    }
  };

  const updatePaycheck = async (timePeriodId, paycheckId, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`/api/time_periods/${timePeriodId}/paychecks/${paycheckId}`, updates);
      const updatedPaycheck = response.data;
      
      setPaychecks(paychecks.map(paycheck => 
        paycheck.id === paycheckId ? updatedPaycheck : paycheck
      ));
      
      setLoading(false);
      return updatedPaycheck;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to update paycheck');
      console.error('Error updating paycheck:', err);
      return null;
    }
  };

  const deletePaycheck = async (timePeriodId, paycheckId) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`/api/time_periods/${timePeriodId}/paychecks/${paycheckId}`);
      
      setPaychecks(paychecks.filter(paycheck => paycheck.id !== paycheckId));
      setLoading(false);
      
      return true;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to delete paycheck');
      console.error('Error deleting paycheck:', err);
      return false;
    }
  };

  // Helper functions for filtered data
  const getExpensesByTimePeriod = useCallback((timePeriodId) => {
    return expenses.filter(expense => expense.time_period_id === timePeriodId);
  }, [expenses]);

  const getPaychecksByTimePeriod = useCallback((timePeriodId) => {
    return paychecks.filter(paycheck => paycheck.time_period_id === timePeriodId);
  }, [paychecks]);

  // Calculate balance for a time period
  const calculateTimePeriodBalance = useCallback((timePeriodId) => {
    const periodExpenses = getExpensesByTimePeriod(timePeriodId);
    const periodPaychecks = getPaychecksByTimePeriod(timePeriodId);
    
    const totalExpenses = periodExpenses.reduce((total, expense) => total + expense.amount, 0);
    const totalIncome = periodPaychecks.reduce((total, paycheck) => total + paycheck.amount, 0);
    
    return {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses
    };
  }, [getExpensesByTimePeriod, getPaychecksByTimePeriod]);

  // Value object to provide through context
  const value = {
    timePeriods,
    expenses,
    paychecks,
    loading,
    error,
    loadUserData,
    createTimePeriod,
    updateTimePeriod,
    deleteTimePeriod,
    createExpense,
    updateExpense,
    deleteExpense,
    createPaycheck,
    updatePaycheck,
    deletePaycheck,
    getExpensesByTimePeriod,
    getPaychecksByTimePeriod,
    calculateTimePeriodBalance
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};