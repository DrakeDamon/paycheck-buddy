import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import '../styles/Dashboard.css';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const { 
    timePeriods, 
    expenses, 
    paychecks, 
    loading, 
    error,
    calculateTimePeriodBalance,
    getExpensesByTimePeriod,
    getPaychecksByTimePeriod
  } = useContext(DataContext);
  
  const [summaryData, setSummaryData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState('all');
  
  // Calculate summary data when dependencies change
  useEffect(() => {
    if (timePeriods.length > 0 && !loading) {
      // Get summary data for each time period
      const summaries = timePeriods.map(period => {
        const { income, expenses, balance } = calculateTimePeriodBalance(period.id);
        return {
          id: period.id,
          name: period.name,
          type: period.type,
          income,
          expenses,
          balance,
          expenseCount: getExpensesByTimePeriod(period.id).length,
          paycheckCount: getPaychecksByTimePeriod(period.id).length
        };
      });
      
      setSummaryData(summaries);
    }
  }, [timePeriods, expenses, paychecks, loading, calculateTimePeriodBalance, getExpensesByTimePeriod, getPaychecksByTimePeriod]);

  // Generate expense categories data for pie chart
  useEffect(() => {
    if (expenses.length > 0) {
      // Group expenses by category
      const categories = {};
      expenses.forEach(expense => {
        const category = expense.category || 'Uncategorized';
        if (categories[category]) {
          categories[category] += expense.amount;
        } else {
          categories[category] = expense.amount;
        }
      });
      
      // Convert to array format for pie chart
      const categoryArray = Object.keys(categories).map(name => ({
        name,
        value: categories[name]
      }));
      
      // Sort by value (highest first)
      categoryArray.sort((a, b) => b.value - a.value);
      
      setCategoryData(categoryArray);
    }
  }, [expenses]);
  
  // Prepare chart data
  const chartData = {
    labels: summaryData
      ?.filter(item => chartTimeframe === 'all' || item.type === chartTimeframe)
      .slice(0, 6)
      .map(item => item.name) || [],
    datasets: [
      {
        label: 'Income',
        data: summaryData
          ?.filter(item => chartTimeframe === 'all' || item.type === chartTimeframe)
          .slice(0, 6)
          .map(item => item.income) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Expenses',
        data: summaryData
          ?.filter(item => chartTimeframe === 'all' || item.type === chartTimeframe)
          .slice(0, 6)
          .map(item => item.expenses) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      }
    ],
  };
  
  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time Period'
        }
      }
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Income vs. Expenses by Time Period'
      },
    },
  };

  // Prepare pie chart data
  const pieData = {
    labels: categoryData?.slice(0, 6).map(item => item.name) || [],
    datasets: [
      {
        data: categoryData?.slice(0, 6).map(item => item.value) || [],
        backgroundColor: [
          '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#ffc658', '#ff8042'
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Expense Breakdown by Category'
      },
    },
  };
  
  // Calculate overall summary
  const totalIncome = paychecks.reduce((sum, paycheck) => sum + paycheck.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const overallBalance = totalIncome - totalExpenses;
  
  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {currentUser?.username}</h1>
        <p>Here's an overview of your finances</p>
      </header>
      
      <div className="dashboard-summary">
        <div className="summary-card income">
          <h3>Total Income</h3>
          <p className="amount">${totalIncome.toFixed(2)}</p>
          <p className="details">Across {paychecks.length} paychecks</p>
        </div>
        
        <div className="summary-card expenses">
          <h3>Total Expenses</h3>
          <p className="amount">${totalExpenses.toFixed(2)}</p>
          <p className="details">Across {expenses.length} expenses</p>
        </div>
        
        <div className={`summary-card balance ${overallBalance >= 0 ? 'positive' : 'negative'}`}>
          <h3>Overall Balance</h3>
          <p className="amount">${overallBalance.toFixed(2)}</p>
          <p className="details">
            {overallBalance >= 0 
              ? 'You are within budget!' 
              : 'You are over budget!'}
          </p>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <div className="chart-container">
          <div className="chart-header">
            <h2>Income vs Expenses</h2>
            <div className="chart-filters">
              <button 
                onClick={() => setChartTimeframe('all')} 
                className={chartTimeframe === 'all' ? 'active' : ''}
              >
                All
              </button>
              <button 
                onClick={() => setChartTimeframe('monthly')} 
                className={chartTimeframe === 'monthly' ? 'active' : ''}
              >
                Monthly
              </button>
              <button 
                onClick={() => setChartTimeframe('bi-monthly')} 
                className={chartTimeframe === 'bi-monthly' ? 'active' : ''}
              >
                Bi-Monthly
              </button>
              <button 
                onClick={() => setChartTimeframe('yearly')} 
                className={chartTimeframe === 'yearly' ? 'active' : ''}
              >
                Yearly
              </button>
            </div>
          </div>
          {timePeriods.length > 0 ? (
            <div className="dashboard-chart">
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="no-data">
              <p>No time periods found. Start by adding a time period.</p>
              <Link to="/time-periods" className="action-button">
                Add Time Period
              </Link>
            </div>
          )}
        </div>
        
        <div className="category-chart">
          <h2>Expense Breakdown</h2>
          {categoryData && categoryData.length > 0 ? (
            <div className="pie-chart-container">
              <div className="pie-chart">
                <Pie data={pieData} options={pieOptions} />
              </div>
              <div className="top-categories">
                <h3>Top Categories</h3>
                <ul>
                  {categoryData.slice(0, 3).map((category, index) => (
                    <li key={index}>
                      <span className="category-name">{category.name}</span>
                      <span className="category-value">${category.value.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="no-data">
              <p>No expense data available.</p>
            </div>
          )}
        </div>
      </div>
      
      {summaryData && summaryData.length > 0 && (
        <div className="time-period-list">
          <h2>Your Time Periods</h2>
          <div className="time-period-cards">
            {summaryData.map(period => (
              <div key={period.id} className="time-period-card">
                <div className="card-header">
                  <h3>{period.name}</h3>
                  <span className="period-type">{period.type}</span>
                </div>
                <div className="card-body">
                  <div className="stat">
                    <span className="label">Income:</span>
                    <span className="value">${period.income.toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Expenses:</span>
                    <span className="value">${period.expenses.toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Balance:</span>
                    <span className={`value ${period.balance >= 0 ? 'positive' : 'negative'}`}>
                      ${period.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="card-footer">
                  <Link to={`/time-periods/${period.id}`}>
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      

    </div>
  );
};

export default Dashboard;