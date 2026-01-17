// client/src/pages/VerifyBill.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const VerifyBill = () => {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with RENDER URL in production
    axios.get(`${API_URL}/api/bills/${id}`)
      .then(res => { setBill(res.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  if (loading) return <div className="container">Loading Verification...</div>;
  if (!bill) return <div className="container error"><h1>❌ Invalid Bill</h1><p>This QR Code is not recognized in our database.</p></div>;

  return (
    <div className="container verify-box">
      <div className="verified-badge">✅ Verified Original</div>
      <h2 style={{color: '#a52a2a'}}>Maruti Jewellers</h2>
      <p style={{color:'#666', marginBottom:'20px'}}>02, Ratnadeep CHS, Navghar Road, Bhayandar East</p>
      
      <div style={{textAlign:'left', background:'#f9f9f9', padding:'20px', borderRadius:'8px', border:'1px solid #eee'}}>
        <p style={{padding:'5px 0'}}><strong>Invoice No:</strong> {bill.invoiceNo}</p>
        <p style={{padding:'5px 0'}}><strong>Date:</strong> {new Date(bill.date).toLocaleDateString()}</p>
        <p style={{padding:'5px 0'}}><strong>Customer:</strong> {bill.customer.name}</p>
        <p style={{padding:'5px 0', fontSize:'18px'}}><strong>Total Amount:</strong> Rs. {bill.grandTotal}</p>
      </div>
      
      <p style={{marginTop:'20px', fontSize:'12px', color:'#999'}}>
        Digital verification system powered by SecureBill.
      </p>
    </div>
  );
};

export default VerifyBill;