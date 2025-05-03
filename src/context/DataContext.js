// src/context/DataContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
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
  
  // Filter states
  const [filterTimePeriodType, setFilterTimePeriodType] = useState('All');
  const [filterTimePeriod, setFilterTimePeriod] = useState(null);

  // Load ALL user data in a single call
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || dataLoaded) return;

    try {
      setLoading(true);
      setError(null);

      // Single API call to get all data
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

  useEffect(() => {
    if (isAuthenticated && !dataLoaded) {
      loadUserData();
    } else if (!isAuthenticated) {
      // Reset state when logged out
      setTimePeriods([]);
      setExpenses([]);
      setPaychecks([]);
      setDataLoaded(false);
    }
  }, [isAuthenticated, loadUserData, dataLoaded]);

  // Time Period operations - USERS CAN ONLY CREATE, NOT EDIT OR DELETE
  const createTimePeriod = async (timePeriod) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/time_periods', timePeriod);
      const newTimePeriod = response.data;

      // Update local state
      setTimePeriods(prevTimePeriods => [...prevTimePeriods, newTimePeriod]);
      
      setLoading(false);
      return newTimePeriod;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to create time period');
      console.error('Error creating time period:', err);
      return null;
    }
  };

  // Expense CRUD operations
  const createExpense = async (timePeriodId, expense) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`/api/time_periods/${timePeriodId}/expenses`, expense);
      const newExpense = response.data;

      // Update local state
      setExpenses(prevExpenses => [...prevExpenses, newExpense]);
      
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

      // Update local state
      setExpenses(prevExpenses => 
        prevExpenses.map(expense => expense.id === expenseId ? updatedExpense : expense)
      );

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

      // Update local state
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseId));
      
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

      // Update local state
      setPaychecks(prevPaychecks => [...prevPaychecks, newPaycheck]);
      
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

      // Update local state
      setPaychecks(prevPaychecks => 
        prevPaychecks.map(paycheck => paycheck.id === paycheckId ? updatedPaycheck : paycheck)
      );

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

      // Update local state
      setPaychecks(prevPaychecks => prevPaychecks.filter(paycheck => paycheck.id !== paycheckId));
      
      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to delete paycheck');
      console.error('Error deleting paycheck:', err);
      return false;
    }
  };

  // Helper functions
  const getExpensesByTimePeriod = useCallback((timePeriodId) => {
    return expenses.filter(expense => expense.time_period_id === timePeriodId);
  }, [expenses]);

  const getPaychecksByTimePeriod = useCallback((timePeriodId) => {
    return paychecks.filter(paycheck => paycheck.time_period_id === timePeriodId);
  }, [paychecks]);

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

  // Filtered data using useMemo
  const filteredExpenses = useMemo(() => {
    if (filterTimePeriod !== null) {
      return expenses.filter(expense => expense.time_period_id === filterTimePeriod);
    } else if (filterTimePeriodType !== 'All') {
      const periodsOfType = timePeriods.filter(period => period.type === filterTimePeriodType.toLowerCase());
      const periodIds = periodsOfType.map(period => period.id);
      return expenses.filter(expense => periodIds.includes(expense.time_period_id));
    } else {
      return expenses;
    }
  }, [expenses, timePeriods, filterTimePeriodType, filterTimePeriod]);

  const filteredPaychecks = useMemo(() => {
    if (filterTimePeriod !== null) {
      return paychecks.filter(paycheck => paycheck.time_period_id === filterTimePeriod);
    } else if (filterTimePeriodType !== 'All') {
      const periodsOfType = timePeriods.filter(period => period.type === filterTimePeriodType.toLowerCase());
      const periodIds = periodsOfType.map(period => period.id);
      return paychecks.filter(paycheck => periodIds.includes(paycheck.time_period_id));
    } else {
      return paychecks;
    }
  }, [paychecks, timePeriods, filterTimePeriodType, filterTimePeriod]);

  // Reset filters
  const resetFilters = () => {
    setFilterTimePeriodType('All');
    setFilterTimePeriod(null);
  };

  // Context value
  const value = {
    timePeriods,
    expenses,
    paychecks,
    loading,
    error,
    loadUserData,
    createTimePeriod,
    // Removed updateTimePeriod and deleteTimePeriod as per the requirements
    createExpense,
    updateExpense,
    deleteExpense,
    createPaycheck,
    updatePaycheck,
    deletePaycheck,
    getExpensesByTimePeriod,
    getPaychecksByTimePeriod,
    calculateTimePeriodBalance,
    filterTimePeriodType,
    setFilterTimePeriodType,
    filterTimePeriod,
    setFilterTimePeriod,
    filteredExpenses,
    filteredPaychecks,
    resetFilters
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};