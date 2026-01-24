import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generatePDF } from '../utils/pdfGenerator';
import { API_URL } from '../config';
import { numToWords } from '../utils/numToWords'; // Import this to fix words

const Dashboard = () => {
  const navigate = useNavigate();
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [searchedBill, setSearchedBill] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  // Fetch History on Load
  useEffect(() => {
    axios.get(`${API_URL}/api/bills/history`)
      .then(res => setHistory(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/');
  };

  // Search Bill
  const handleSearch = async () => {
    if(!invoiceSearch) return;
    try {
      setError('');
      setSearchedBill(null);
      const res = await axios.get(`${API_URL}/api/bills/search/${invoiceSearch}`);
      if (res.data) {
        setSearchedBill(res.data);
      } else {
        setError('No Bill Found.');
      }
    } catch (err) { setError('Error searching.'); }
  };

  // Cancel Bill
  const handleCancel = async () => {
    if(!searchedBill) return;
    if(!window.confirm(`Are you sure you want to CANCEL Invoice #${searchedBill.invoiceNo}? This cannot be undone.`)) return;

    try {
      const res = await axios.put(`${API_URL}/api/bills/cancel/${searchedBill.invoiceNo}`);
      alert("Bill Cancelled Successfully.");
      setSearchedBill(res.data); 
      // Refresh History
      const hist = await axios.get(`${API_URL}/api/bills/history`);
      setHistory(hist.data);
    } catch (err) { alert("Error cancelling bill."); }
  };

  // --- THE CONSISTENCY FIX ---
  // We recalculate the math here so it matches the "Create Bill" logic perfectly.
  const handleDownload = () => {
    if(!searchedBill) return;

    // 1. Get the Raw Amount from Items (This is the Taxable Value)
    // Note: We use 'item.amount' because that's what you typed in the box.
    const taxable = searchedBill.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 2. Calculate GST on top (Exclusive)
    const cgst = taxable * 0.015;
    const sgst = taxable * 0.015;
    const total = Math.round(taxable + cgst + sgst);

    // 3. Create a "Corrected" Bill Object for the PDF
    const billForPDF = {
      ...searchedBill, // Keep name, date, invoiceNo, etc.
      taxableValue: taxable.toFixed(2),
      cgstAmount: cgst.toFixed(2),
      sgstAmount: sgst.toFixed(2),
      grandTotal: total,
      amountInWords: total ? `${numToWords(total)} Rupees Only` : ''
    };

    generatePDF(billForPDF);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div style={{marginBottom: '20px'}}>
        <button className="btn-primary" onClick={() => navigate('/create')}>
          + Create New Bill
        </button>
      </div>

      {/* SEARCH SECTION */}
      <div className="form-section">
        <h3>Search / Manage Bill</h3>
        <div className="row">
          <input 
            className="col"
            placeholder="Enter Invoice No (e.g. 252601)" 
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
          />
          <button className="col" style={{flex:0}} onClick={handleSearch}>Search</button>
        </div>
        {error && <p style={{color:'red', textAlign:'center'}}>{error}</p>}

        {/* SEARCH RESULT CARD */}
        {searchedBill && (
          <div style={{background:'#f9f9f9', padding:'15px', borderRadius:'8px', marginTop:'10px', border:'1px solid #ddd'}}>
            <p><strong>Invoice:</strong> {searchedBill.invoiceNo}</p>
            <p><strong>Customer:</strong> {searchedBill.customer.name}</p>
            <p><strong>Amount:</strong> Rs. {searchedBill.grandTotal}</p>
            <p><strong>Status:</strong> <span className={searchedBill.status === 'CANCELLED' ? 'status-cancelled' : 'status-active'}>{searchedBill.status}</span></p>
            
            <div className="row" style={{marginTop:'10px'}}>
               {/* Use the new handleDownload function */}
               <button className="col btn-secondary" onClick={handleDownload}>Download PDF</button>
               
               {searchedBill.status !== 'CANCELLED' && (
                 <button className="col btn-danger" onClick={handleCancel}>Cancel Bill</button>
               )}
            </div>
          </div>
        )}
      </div>

      {/* HISTORY SECTION */}
      <div className="form-section">
        <h3>Recent History (Last 10)</h3>
        {history.map(bill => (
          <div key={bill._id} className="history-item">
            <div>
              <strong>#{bill.invoiceNo}</strong> - {bill.customer.name}
            </div>
            <div style={{textAlign:'right'}}>
              <div>Rs. {bill.grandTotal}</div>
              <small className={bill.status === 'CANCELLED' ? 'status-cancelled' : 'status-active'}>
                {bill.status}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;