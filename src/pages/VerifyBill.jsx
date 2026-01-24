import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const VerifyBill = () => {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/bills/${id}`)
      .then(res => { setBill(res.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  if (loading) return <div className="container">Loading Verification...</div>;
  if (!bill) return <div className="container error"><h1>❌ Invalid QR Code</h1><p>This bill is not recognized.</p></div>;

  const isCancelled = bill.status === 'CANCELLED';

  return (
    <div className="container verify-box" style={{borderTop: isCancelled ? '5px solid red' : '5px solid green'}}>
      
      <div className="verified-badge" style={{background: isCancelled ? '#ffebee' : '#e8f5e9', color: isCancelled ? '#c62828' : '#2e7d32'}}>
         {isCancelled ? '❌ BILL CANCELLED' : '✅ Verified Original'}
      </div>

      <h2 style={{color: '#a52a2a', marginTop:'15px'}}>Maruti Jewellers</h2>
      <p style={{color:'#666', marginBottom:'20px'}}>02, Ratnadeep CHS, Navghar Road, Bhayandar East</p>
      
      <div style={{textAlign:'left', background:'#f9f9f9', padding:'20px', borderRadius:'8px', border:'1px solid #eee'}}>
        
        <div style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #eee'}}>
            <strong>Invoice No:</strong> <span>{bill.invoiceNo}</span>
        </div>
        
        {/* DATE REMOVED COMPLETELY */}

        <div style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #eee'}}>
            <strong>Customer:</strong> <span>{bill.customer.name}</span>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #eee'}}>
            <strong>Status:</strong> 
            <span style={{fontWeight:'bold', color: isCancelled ? 'red' : 'green'}}>
                {isCancelled ? 'CANCELLED' : 'ACTIVE'}
            </span>
        </div>
        
        <div style={{marginTop:'20px', fontSize:'22px', color:'#333', textAlign:'center', background:'#e0e0e0', padding:'10px', borderRadius:'5px'}}>
          <strong>Total: Rs. {bill.grandTotal}</strong>
        </div>
      </div>
      
      <p style={{marginTop:'20px', fontSize:'12px', color:'#999'}}>
        Digital verification system powered by SecureBill.
      </p>
    </div>
  );
};

export default VerifyBill;