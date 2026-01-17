// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateBill from './pages/CreateBill';
import VerifyBill from './pages/VerifyBill';
import './App.css'; // Import the CSS

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('admin_token');
  return isAuth ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/verify/:id" element={<VerifyBill />} />
        <Route path="/" element={<Login />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        
        <Route path="/create" element={
          <ProtectedRoute><CreateBill /></ProtectedRoute>
        } />
        
        <Route path="/edit/:invoiceNo" element={
          <ProtectedRoute><CreateBill isEditMode={true} /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;