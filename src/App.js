import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Layout
import Layout from './components/Layout';

// Auth Pages
import Login from './Auth/Login';
import Register from './Auth/Register';

// Main Pages
import Dashboard from './pages/Dashboard';
import TimePeriods from './pages/TimePeriods';
// import TimePeriodDetail from './pages/TimePeriods/TimePeriodDetail';
// import Expenses from './pages/Expenses/Expenses';
// import Paychecks from './pages/Paychecks/Paychecks';

// Protected Route component implemented inline
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Since Layout component is not available yet, just render the Outlet directly
  return <Layout />;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected App Routes */}
            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="time-periods" element={<TimePeriods />} />
              {/* <Route path="time-periods/:id" element={<TimePeriodDetail />} /> */}
              {/* <Route path="time-periods/:id/expenses" element={<Expenses />} /> */}
              {/* <Route path="time-periods/:id/paychecks" element={<Paychecks />} /> */}
              {/* <Route path="expenses" element={<Expenses />} /> */}
              {/* <Route path="paychecks" element={<Paychecks />} /> */}
            </Route>
            
            {/* Redirect any unknown routes to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;