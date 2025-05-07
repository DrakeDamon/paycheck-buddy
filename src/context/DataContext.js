// src/context/DataContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  // Core state
  const [timePeriods, setTimePeriods] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [paychecks, setPaychecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Filter states
  const [filterTimePeriodType, setFilterTimePeriodType] = useState('All');
  const [filterTimePeriod, setFilterTimePeriod] = useState(null);

  // Generic API request handler to reduce repetition
  const apiRequest = useCallback(async (method, endpoint, data = null) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (method === 'get') {
        response = await axios.get(endpoint);
      } else if (method === 'post') {
        response = await axios.post(endpoint, data);
      } else if (method === 'put') {
        response = await axios.put(endpoint, data);
      } else if (method === 'delete') {
        response = await axios.delete(endpoint);
      }
      
      setLoading(false);
      return response?.data;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || `API request failed: ${method} ${endpoint}`);
      console.error(`Error in API request ${method} ${endpoint}:`, err);
      return null;
    }
  }, []);

  // Load ALL user data in a single call
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || dataLoaded) return;

    const userData = await apiRequest('get', '/api/user_data');
    
    if (userData) {
      setTimePeriods(userData.time_periods || []);
      setExpenses(userData.expenses || []);
      setPaychecks(userData.paychecks || []);
      setDataLoaded(true);
    }
  }, [isAuthenticated, dataLoaded, apiRequest]);

  // Effect to load data on authentication change
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
    const newTimePeriod = await apiRequest('post', '/api/time_periods', timePeriod);
    
    if (newTimePeriod) {
      setTimePeriods(prev => [...prev, newTimePeriod]);
    }
    
    return newTimePeriod;
  };

  // Expense CRUD operations
  const createExpense = async (timePeriodId, expense) => {
    const newExpense = await apiRequest('post', `/api/time_periods/${timePeriodId}/expenses`, expense);
    
    if (newExpense) {
      setExpenses(prev => [...prev, newExpense]);
    }
    
    return newExpense;
  };

  const updateExpense = async (timePeriodId, expenseId, updates) => {
    const updatedExpense = await apiRequest('put', `/api/time_periods/${timePeriodId}/expenses/${expenseId}`, updates);
    
    if (updatedExpense) {
      setExpenses(prev => prev.map(expense => 
        expense.id === expenseId ? updatedExpense : expense
      ));
    }
    
    return updatedExpense;
  };

  const deleteExpense = async (timePeriodId, expenseId) => {
    const success = await apiRequest('delete', `/api/time_periods/${timePeriodId}/expenses/${expenseId}`);
    
    if (success !== null) {
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      return true;
    }
    
    return false;
  };

  // Paycheck CRUD operations
  const createPaycheck = async (timePeriodId, paycheck) => {
    const newPaycheck = await apiRequest('post', `/api/time_periods/${timePeriodId}/paychecks`, paycheck);
    
    if (newPaycheck) {
      setPaychecks(prev => [...prev, newPaycheck]);
    }
    
    return newPaycheck;
  };

  const updatePaycheck = async (timePeriodId, paycheckId, updates) => {
    const updatedPaycheck = await apiRequest('put', `/api/time_periods/${timePeriodId}/paychecks/${paycheckId}`, updates);
    
    if (updatedPaycheck) {
      setPaychecks(prev => prev.map(paycheck => 
        paycheck.id === paycheckId ? updatedPaycheck : paycheck
      ));
    }
    
    return updatedPaycheck;
  };

  const deletePaycheck = async (timePeriodId, paycheckId) => {
    const success = await apiRequest('delete', `/api/time_periods/${timePeriodId}/paychecks/${paycheckId}`);
    
    if (success !== null) {
      setPaychecks(prev => prev.filter(paycheck => paycheck.id !== paycheckId));
      return true;
    }
    
    return false;
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

  // Generic filter function to avoid duplication
  const filterByTimePeriod = useCallback((items) => {
    if (filterTimePeriod !== null) {
      return items.filter(item => item.time_period_id === filterTimePeriod);
    } else if (filterTimePeriodType !== 'All') {
      const periodsOfType = timePeriods.filter(period => 
        period.type === filterTimePeriodType.toLowerCase()
      );
      const periodIds = periodsOfType.map(period => period.id);
      return items.filter(item => periodIds.includes(item.time_period_id));
    }
    return items;
  }, [filterTimePeriod, filterTimePeriodType, timePeriods]);

  // Filtered data using shared filter logic
  const filteredExpenses = useMemo(() => filterByTimePeriod(expenses), 
    [expenses, filterByTimePeriod]);

  const filteredPaychecks = useMemo(() => filterByTimePeriod(paychecks), 
    [paychecks, filterByTimePeriod]);

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