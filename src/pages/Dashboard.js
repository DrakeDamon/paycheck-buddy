import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import '../styles/Dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

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
  
  const [summaryData, setSummaryData] = useState([]);
  const [chartTimeframe, setChartTimeframe] = useState('all');
  
  //Recalculate financial summaries whenever any of the data it depends on changes.  
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

  // Prepare chart data 
  const getChartData = () => {
    // Filter data once based on timeframe
    const filteredData = summaryData
      .filter(item => chartTimeframe === 'all' || item.type === chartTimeframe)
      .slice(0, 6);
    
    return {
      labels: filteredData.map(item => item.name),
      datasets: [
        {
          label: 'Income',
          data: filteredData.map(item => item.income),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: 'Expenses',
          data: filteredData.map(item => item.expenses),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        }
      ],
    };
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
      

      
      <div className="dashboard-chart-container">
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
              <Bar data={getChartData()} options={chartOptions} />
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
      </div>
      
      {summaryData.length > 0 && (
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