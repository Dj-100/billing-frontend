// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // NOTE: Replace http://localhost:5000 with your RENDER URL later
      const res = await axios.post(`${API_URL}/api/auth/login`, { password });
      
      if (res.data.success) {
        localStorage.setItem('admin_token', 'secure-token-123'); 
        navigate('/dashboard');
      }
    } catch (err) {
      setError("Incorrect Password. Access Denied.");
    }
  };

  return (
    <div className="container" style={{maxWidth: '400px', marginTop: '100px', textAlign: 'center'}}>
      <h1 style={{color: '#a52a2a'}}>Maruti Jewellers</h1>
      <h3>Admin Access</h3>
      <div style={{marginTop: '20px'}}>
        <input 
          type="password" 
          placeholder="Enter Admin Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn-primary" onClick={handleLogin}>Login Securely</button>
      </div>
    </div>
  );
};

export default Login;