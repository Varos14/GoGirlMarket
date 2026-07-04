import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Trash2, PlusCircle, AlertCircle } from 'lucide-react';

const CouponsScreen = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCoupons = async () => {
    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = { headers: { Authorization: `Bearer ${vendorInfo.token}` } };
      const { data } = await axios.get('/api/coupons/vendor', config);
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const createHandler = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    
    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = { headers: { Authorization: `Bearer ${vendorInfo.token}` } };
      
      await axios.post('/api/coupons', {
        code,
        discountType,
        discountValue: Number(discountValue),
        expiryDate
      }, config);
      
      setSuccess('Coupon created successfully!');
      setCode('');
      setDiscountValue('');
      setExpiryDate('');
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
        const config = { headers: { Authorization: `Bearer ${vendorInfo.token}` } };
        
        await axios.delete(`/api/coupons/${id}`, config);
        fetchCoupons();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* List */}
      <div className="flex-1">
        <h1 className="text-3xl font-heading font-bold text-gray-800 mb-6">Promo Codes</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="bg-primary/10 text-primary p-4 rounded-full mb-4">
                <Tag size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Promo Codes Yet</h3>
              <p className="text-gray-500 max-w-sm">
                Create promotional codes to offer discounts to your customers and boost sales!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Code</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Discount</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Expiry</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="py-4 px-6 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded tracking-wide">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-gray-700">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `UGX ${coupon.discountValue} OFF`}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(coupon.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        {new Date(coupon.expiryDate) < new Date() ? (
                          <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">Expired</span>
                        ) : coupon.isActive ? (
                          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                        ) : (
                          <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Inactive</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => deleteHandler(coupon._id)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Form */}
      <div className="lg:w-[400px]">
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-8 sticky top-28">
          <h2 className="text-xl font-heading font-extrabold mb-6 flex items-center gap-3 text-gray-800">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <PlusCircle size={20} />
            </div>
            Create Promo Code
          </h2>
          
          {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
          {success && <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">{success}</div>}
          
          <form onSubmit={createHandler} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Code</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Discount Type</label>
              <select
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (UGX)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Discount Value</label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? "e.g. 20" : "e.g. 10000"}
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Expiry Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors shadow-md mt-6 disabled:opacity-70"
            >
              {creating ? 'Creating...' : 'Create Promo Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CouponsScreen;
