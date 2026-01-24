import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generatePDF } from '../utils/pdfGenerator';
import { numToWords } from '../utils/numToWords';
import { API_URL } from '../config';

const CreateBill = () => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  
  const [bill, setBill] = useState({
    customer: { name: '', phone: '', address: '', gstin: '' },
    invoiceDate: new Date().toISOString().split('T')[0],
    orderDate: '',
    items: [{ particulars: '', purity: '', grossWeight: '', netWeight: '', rate: '', amount: '' }],
    taxableValue: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    grandTotal: 0,
    amountInWords: '',
    paymentMode: ''
  });

  // --- MATH LOGIC: The "Frontend Truth" ---
  // We trust this logic, not the backend's logic.
  useEffect(() => {
    // 1. Sum of items = Taxable Value
    const taxable = bill.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    // 2. Add GST on TOP (Exclusive)
    const cgst = taxable * 0.015;
    const sgst = taxable * 0.015;

    // 3. Grand Total
    const total = Math.round(taxable + cgst + sgst);

    if (bill.grandTotal !== total || bill.taxableValue !== taxable) {
      setBill(prev => ({
        ...prev,
        taxableValue: taxable.toFixed(2),
        cgstAmount: cgst.toFixed(2),
        sgstAmount: sgst.toFixed(2),
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

  const formatDecimals = (index, field) => {
    const newItems = [...bill.items];
    const val = parseFloat(newItems[index][field]);
    if (!isNaN(val)) {
      newItems[index][field] = val.toFixed(3);
      setBill({...bill, items: newItems});
    }
  };

  const addItem = () => setBill({...bill, items: [...bill.items, { particulars: '', purity: '', grossWeight: '', netWeight: '', rate: '', amount: '' }]});
  const handleCustomer = (e) => setBill({...bill, customer: {...bill.customer, [e.target.name]: e.target.value}});

  const handleSave = async () => {
    if(!bill.paymentMode) return alert("Please enter Payment Details");
    try {
      // 1. Save to DB (Backend might calculate wrong, but we ignore it)
      const res = await axios.post(`${API_URL}/api/bills/create`, bill);
      
      // 2. FORCE PDF TO USE FRONTEND MATH
      // We mix the DB ID (res.data._id) with Frontend Amounts (bill state)
      const billForPDF = {
        ...bill, 
        _id: res.data._id,
        invoiceNo: res.data.invoiceNo,
        status: 'ACTIVE' // Default for new bills
      };

      await generatePDF(billForPDF);
      
      alert("Bill Saved Successfully!");
      navigate('/dashboard');
    } catch (err) { alert("Error saving bill"); }
  };

  // Preview Modal
  const PreviewModal = () => (
    <div style={{
      position:'fixed', top:0, left:0, width:'100%', height:'100%', 
      background:'rgba(0,0,0,0.85)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000
    }}>
      <div style={{
        background:'white', width:'95%', maxWidth:'800px', height:'90vh', overflowY:'auto', 
        padding:'20px', borderRadius:'5px', fontFamily:'Times New Roman', color:'black'
      }}>
        <div style={{textAlign:'center', borderBottom:'2px solid black', paddingBottom:'10px', marginBottom:'10px'}}>
           <h4 style={{margin:0, textDecoration:'underline'}}>SUBJECT TO THANE JURISDICTION</h4>
           <h1 style={{margin:'5px 0', fontSize:'32px', color:'#d32f2f'}}>MARUTI JEWELLERS</h1>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', border:'1px solid black', padding:'10px', fontSize:'14px'}}>
           <div style={{width:'50%'}}>
              <strong>Customer:</strong> {bill.customer.name}<br/>
              <strong>Phone:</strong> {bill.customer.phone}<br/>
              <strong>Address:</strong> {bill.customer.address}
           </div>
           <div style={{width:'50%', textAlign:'right'}}>
              <strong>Date:</strong> {bill.invoiceDate}<br/>
              <strong>Payment:</strong> {bill.paymentMode}
           </div>
        </div>

        <table style={{width:'100%', borderCollapse:'collapse', marginTop:'15px', fontSize:'13px'}}>
          <thead>
            <tr style={{background:'#eee', borderBottom:'2px solid black'}}>
              <th style={{padding:'5px', textAlign:'left'}}>Item</th>
              <th style={{padding:'5px'}}>Gr.Wt</th>
              <th style={{padding:'5px'}}>Nt.Wt</th>
              <th style={{padding:'5px'}}>Rate</th>
              <th style={{padding:'5px', textAlign:'right'}}>Amount (Taxable)</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, i) => (
              <tr key={i} style={{borderBottom:'1px solid #ccc'}}>
                <td style={{padding:'5px'}}>{item.particulars}</td>
                <td style={{padding:'5px', textAlign:'center'}}>{item.grossWeight}</td>
                <td style={{padding:'5px', textAlign:'center'}}>{item.netWeight}</td>
                <td style={{padding:'5px', textAlign:'center'}}>{item.rate}</td>
                <td style={{padding:'5px', textAlign:'right', fontWeight:'bold'}}>{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{display:'flex', justifyContent:'flex-end', marginTop:'15px'}}>
          <div style={{width:'250px', textAlign:'right', fontSize:'14px'}}>
             <div style={{display:'flex', justifyContent:'space-between'}}><span>Taxable Value:</span> <span>{bill.taxableValue}</span></div>
             <div style={{display:'flex', justifyContent:'space-between'}}><span>CGST (1.5%):</span> <span>{bill.cgstAmount}</span></div>
             <div style={{display:'flex', justifyContent:'space-between'}}><span>SGST (1.5%):</span> <span>{bill.sgstAmount}</span></div>
             <div style={{display:'flex', justifyContent:'space-between', fontSize:'18px', fontWeight:'bold', borderTop:'2px solid black', marginTop:'5px', paddingTop:'5px'}}>
               <span>Grand Total:</span> <span>Rs. {bill.grandTotal}</span>
             </div>
          </div>
        </div>

        <div style={{marginTop:'30px', display:'flex', gap:'20px', justifyContent:'center'}}>
           <button style={{padding:'10px 30px', background:'#666', color:'white', border:'none', cursor:'pointer'}} onClick={() => setShowPreview(false)}>← Edit</button>
           <button style={{padding:'10px 30px', background:'#28a745', color:'white', border:'none', cursor:'pointer', fontWeight:'bold'}} onClick={handleSave}>Confirm & Print ✅</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      {showPreview && <PreviewModal />}
      <div className="header"><h1>New Tax Invoice</h1><button onClick={() => navigate('/dashboard')}>Back</button></div>
      <div className="form-section">
        <h3>Customer Details</h3>
        <div className="row">
           <div className="col"><label>Invoice Date</label><input type="date" value={bill.invoiceDate} onChange={e => setBill({...bill, invoiceDate: e.target.value})} /></div>
           <div className="col"><label>Order Date</label><input type="date" value={bill.orderDate} onChange={e => setBill({...bill, orderDate: e.target.value})} /></div>
        </div>
        <input name="name" placeholder="Customer Name" value={bill.customer.name} onChange={handleCustomer} />
        <div className="row">
          <input className="col" name="phone" placeholder="Phone" value={bill.customer.phone} onChange={handleCustomer} />
          <input className="col" name="address" placeholder="City / Address" value={bill.customer.address} onChange={handleCustomer} />
        </div>
        <input name="gstin" placeholder="GSTIN (Optional)" value={bill.customer.gstin} onChange={handleCustomer} />
      </div>
      <div className="form-section">
        <h3>Items</h3>
        {bill.items.map((item, index) => (
          <div key={index} className="item-row">
            <span style={{fontWeight:'bold', width:'20px'}}>{index+1}</span>
            <input className="item-input-large" name="particulars" placeholder="Item Name" value={item.particulars} onChange={(e)=>handleItem(index,e)} />
            <input className="item-input-small" name="purity" placeholder="Purity" value={item.purity} onChange={(e)=>handleItem(index,e)} />
            <input className="item-input-small" name="grossWeight" placeholder="Gr.Wt" type="number" step="0.001" value={item.grossWeight} onChange={(e)=>handleItem(index,e)} onBlur={() => formatDecimals(index, 'grossWeight')} />
            <input className="item-input-small" name="netWeight" placeholder="Nt.Wt" type="number" step="0.001" value={item.netWeight} onChange={(e)=>handleItem(index,e)} onBlur={() => formatDecimals(index, 'netWeight')} />
            <input className="item-input-small" name="rate" placeholder="Rate" type="number" value={item.rate} onChange={(e)=>handleItem(index,e)} />
            <input className="item-input-small" name="amount" placeholder="Amt" type="number" value={item.amount} onChange={(e) => handleItem(index, e)} style={{fontWeight: 'bold', border: '1px solid black'}} />
          </div>
        ))}
        <button className="btn-add" onClick={addItem}>+ Add Item</button>
      </div>
      <div className="form-section">
        <h3>Payment & Totals</h3>
        <input placeholder="Payment Mode (e.g. Cash / UPI)" value={bill.paymentMode} onChange={(e) => setBill({...bill, paymentMode: e.target.value})} />
        <div style={{textAlign:'right', fontSize:'18px', fontWeight:'bold', marginTop:'10px'}}>Grand Total: Rs. {bill.grandTotal}</div>
      </div>
      <button className="btn-primary" onClick={() => setShowPreview(true)}>Preview Bill</button>
    </div>
  );
};
export default CreateBill;