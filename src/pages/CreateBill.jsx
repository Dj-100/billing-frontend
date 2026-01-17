import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generatePDF } from '../utils/pdfGenerator';
import { numToWords } from '../utils/numToWords';
import { API_URL } from '../config';

const CreateBill = () => {
  const navigate = useNavigate();
  
  const [bill, setBill] = useState({
    customer: { name: '', phone: '', address: '', gstin: '' },
    invoiceDate: new Date().toISOString().split('T')[0],
    orderDate: '',
    // Added 'purity' to initial state
    items: [{ particulars: '', purity: '', grossWeight: '', netWeight: '', rate: '', amount: '' }],
    grandTotal: 0,
    amountInWords: '',
    paymentMode: ''
  });

  // Math Logic
  useEffect(() => {
    const total = bill.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    if (bill.grandTotal !== total) {
      setBill(prev => ({
        ...prev,
        grandTotal: total,
        amountInWords: total ? `${numToWords(total)} Rupees Only` : ''
      }));
    }
  }, [bill.items]);

  const handleItem = (index, e) => {
    const newItems = [...bill.items];
    newItems[index][e.target.name] = e.target.value;
    setBill({...bill, items: newItems});
  };

  const addItem = () => setBill({...bill, items: [...bill.items, { particulars: '', purity: '', grossWeight: '', netWeight: '', rate: '', amount: '' }]});
  const handleCustomer = (e) => setBill({...bill, customer: {...bill.customer, [e.target.name]: e.target.value}});

  const saveBill = async () => {
    if(!bill.paymentMode) return alert("Please enter Payment Details");
    try {
      const res = await axios.post(`${API_URL}/api/bills/create`, bill);
      await generatePDF(res.data);
      alert("Bill Saved!");
      navigate('/dashboard');
    } catch (err) { alert("Error saving bill"); }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>New Tax Invoice</h1>
        <button onClick={() => navigate('/dashboard')}>Back</button>
      </div>

      <div className="form-section">
        <h3>Customer Details</h3>
        <div className="row">
           <div className="col"><label>Invoice Date</label><input type="date" value={bill.invoiceDate} onChange={e => setBill({...bill, invoiceDate: e.target.value})} /></div>
           <div className="col"><label>Order Date</label><input type="date" value={bill.orderDate} onChange={e => setBill({...bill, orderDate: e.target.value})} /></div>
        </div>
        <input name="name" placeholder="Customer Name" value={bill.customer.name} onChange={handleCustomer} />
        <div className="row">
          <input className="col" name="phone" placeholder="Phone" value={bill.customer.phone} onChange={handleCustomer} />
          <input className="col" name="address" placeholder="City" value={bill.customer.address} onChange={handleCustomer} />
        </div>
        <input name="gstin" placeholder="GSTIN (Optional)" value={bill.customer.gstin} onChange={handleCustomer} />
      </div>

      <div className="form-section">
        <h3>Items</h3>
        {bill.items.map((item, index) => (
          <div key={index} className="item-row">
            <span style={{fontWeight:'bold', width:'20px'}}>{index+1}</span>
            <input className="item-input-large" name="particulars" placeholder="Item Name" value={item.particulars} onChange={(e)=>handleItem(index,e)} />
            
            {/* PURITY INPUT ADDED HERE */}
            <input className="item-input-small" name="purity" placeholder="Purity" value={item.purity} onChange={(e)=>handleItem(index,e)} />
            
            <input className="item-input-small" name="grossWeight" placeholder="Gr.Wt" type="number" value={item.grossWeight} onChange={(e)=>handleItem(index,e)} />
            <input className="item-input-small" name="netWeight" placeholder="Nt.Wt" type="number" value={item.netWeight} onChange={(e)=>handleItem(index,e)} />
            <input className="item-input-small" name="rate" placeholder="Rate" type="number" value={item.rate} onChange={(e)=>handleItem(index,e)} />
            <input className="item-input-small" name="amount" placeholder="Amt" type="number" value={item.amount} onChange={(e) => handleItem(index, e)} style={{fontWeight: 'bold', border: '1px solid black'}} />
          </div>
        ))}
        <button className="btn-add" onClick={addItem}>+ Add Item</button>
      </div>

      <div className="form-section">
        <h3>Payment</h3>
        <input placeholder="e.g. Cash / UPI" value={bill.paymentMode} onChange={(e) => setBill({...bill, paymentMode: e.target.value})} />
        <div style={{marginTop:'15px', fontWeight:'bold', fontSize:'20px'}}>Grand Total: Rs. {bill.grandTotal}</div>
      </div>

      <button className="btn-primary" onClick={saveBill}>Generate Bill</button>
    </div>
  );
};

export default CreateBill;