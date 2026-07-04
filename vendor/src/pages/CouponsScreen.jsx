import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Tag, Trash2, PlusCircle, AlertCircle, Pencil, BarChart3, X, Search, ChevronDown } from 'lucide-react';

// ─── Searchable Multi-Select Product Picker ──────────────────────────────
const ProductPicker = ({ vendorProducts, selectedProducts, setSelectedProducts }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = vendorProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedProducts.includes(p._id)
  );

  const addProduct = (product) => {
    setSelectedProducts([...selectedProducts, product._id]);
    setSearch('');
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(id => id !== productId));
  };

  const getProductName = (id) => {
    const p = vendorProducts.find(p => p._id === id);
    return p ? p.name : id;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">
        Apply to Products <span className="text-gray-400 normal-case">(optional — empty = all products)</span>
      </label>

      {/* Selected chips */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedProducts.map(id => (
            <span key={id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
              {getProductName(id).length > 25 ? getProductName(id).substring(0, 25) + '…' : getProductName(id)}
              <button type="button" onClick={() => removeProduct(id)} className="hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div
        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl flex items-center gap-2 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <Search size={14} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search products to add..."
          className="bg-transparent outline-none text-sm flex-grow"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        <ChevronDown size={14} className="text-gray-400" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No products found</div>
          ) : (
            filtered.map(product => (
              <button
                type="button"
                key={product._id}
                onClick={() => addProduct(product)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm transition-colors flex justify-between items-center"
              >
                <span className="truncate">{product.name}</span>
                <span className="text-xs text-gray-400 ml-2 shrink-0">UGX {product.price?.toLocaleString()}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Edit Modal ──────────────────────────────────────────────────────────
const EditModal = ({ coupon, vendorProducts, onClose, onSave }) => {
  const [discountType, setDiscountType] = useState(coupon.discountType);
  const [discountValue, setDiscountValue] = useState(coupon.discountValue);
  const [expiryDate, setExpiryDate] = useState(coupon.expiryDate?.split('T')[0] || '');
  const [usageLimit, setUsageLimit] = useState(coupon.usageLimit || 1);
  const [minOrderAmount, setMinOrderAmount] = useState(coupon.minOrderAmount || '');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(coupon.maxDiscountAmount || '');
  const [selectedProducts, setSelectedProducts] = useState(
    (coupon.applicableProducts || []).map(p => typeof p === 'object' ? p._id : p)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = { headers: { Authorization: `Bearer ${vendorInfo.token}` } };

      const { data } = await axios.put(`/api/coupons/${coupon._id}`, {
        discountType,
        discountValue: Number(discountValue),
        expiryDate,
        usageLimit: Number(usageLimit),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: Number(maxDiscountAmount) || 0,
        applicableProducts: selectedProducts
      }, config);

      onSave(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-heading font-extrabold text-gray-800">Edit Promo Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}

          {/* Code (Read-Only) */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Code <span className="text-gray-400 normal-case">(immutable)</span></label>
            <input
              type="text"
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 uppercase cursor-not-allowed"
              value={coupon.code}
            />
          </div>

          {/* Discount Type */}
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

          {/* Discount Value */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Discount Value</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </div>

          {/* Per-User Limit */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Per-User Limit</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
          </div>

          {/* Min Order Amount */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Min. Order Amount (UGX) <span className="text-gray-400 normal-case">(optional)</span></label>
            <input
              type="number"
              min="0"
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="e.g. 50000"
            />
          </div>

          {/* Max Discount (only for percentage) */}
          {discountType === 'percentage' && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Max Discount (UGX) <span className="text-gray-400 normal-case">(optional cap)</span></label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="e.g. 15000"
              />
            </div>
          )}

          {/* Expiry Date */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Expiry Date</label>
            <input
              type="date"
              required
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          {/* Product Picker */}
          <ProductPicker
            vendorProducts={vendorProducts}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
          />

          {/* Save / Cancel */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Analytics Detail Modal ──────────────────────────────────────────────
const AnalyticsModal = ({ coupon, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
        const config = { headers: { Authorization: `Bearer ${vendorInfo.token}` } };
        const { data } = await axios.get(`/api/coupons/${coupon._id}/analytics`, config);
        setAnalytics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [coupon._id]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-heading font-extrabold text-gray-800">Coupon Analytics</h2>
            <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded tracking-wide text-sm">{coupon.code}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : analytics ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-blue-700">{analytics.totalTimesUsed}</p>
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mt-1">Total Uses</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-green-700">
                    {analytics.totalDiscountGiven?.toLocaleString()}
                  </p>
                  <p className="text-xs font-bold text-green-500 uppercase tracking-wider mt-1">UGX Given</p>
                </div>
              </div>

              {/* Orders Table */}
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">Orders Using This Code</h3>
              {analytics.orders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No orders have used this code yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Order</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Customer</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase text-right">Discount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analytics.orders.map((order, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-xs text-gray-600">
                            #{order.orderId.toString().slice(-6)}
                          </td>
                          <td className="py-3 px-4 text-gray-700 font-medium">{order.customerName}</td>
                          <td className="py-3 px-4 text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">
                            UGX {order.discountAmount?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-red-500 text-center py-8">Failed to load analytics.</p>
          )}
        </div>
      </div>
    </div>
  );
};


// ─── Main CouponsScreen ──────────────────────────────────────────────────
const CouponsScreen = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorProducts, setVendorProducts] = useState([]);
  
  // Create form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState(1);
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  // Modal state
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [analyticsCoupon, setAnalyticsCoupon] = useState(null);

  const getConfig = () => {
    const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
    return { headers: { Authorization: `Bearer ${vendorInfo.token}` } };
  };

  const fetchCoupons = async () => {
    try {
      const { data } = await axios.get('/api/coupons/vendor', getConfig());
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = { headers: { Authorization: `Bearer ${vendorInfo.token}` } };
      const { data } = await axios.get(`/api/products?vendor=${vendorInfo._id}&pageSize=999`, config);
      setVendorProducts(data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const createHandler = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.post('/api/coupons', {
        code,
        discountType,
        discountValue: Number(discountValue),
        expiryDate,
        usageLimit: Number(usageLimit) || 1,
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: Number(maxDiscountAmount) || 0,
        applicableProducts: selectedProducts
      }, getConfig());
      
      setSuccess('Coupon created successfully!');
      setCode('');
      setDiscountValue('');
      setExpiryDate('');
      setUsageLimit(1);
      setMinOrderAmount('');
      setMaxDiscountAmount('');
      setSelectedProducts([]);
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
        await axios.delete(`/api/coupons/${id}`, getConfig());
        fetchCoupons();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  const toggleHandler = async (id) => {
    try {
      await axios.put(`/api/coupons/${id}/toggle`, {}, getConfig());
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle coupon');
    }
  };

  const handleEditSave = (updatedCoupon) => {
    setCoupons(prev => prev.map(c => c._id === updatedCoupon._id ? updatedCoupon : c));
    setEditingCoupon(null);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ─── Coupon List ─── */}
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
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase text-center">Uses</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase text-right">Given (UGX)</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                      <th className="py-4 px-6 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.map((coupon) => {
                      const isExpired = new Date(coupon.expiryDate) < new Date();
                      return (
                        <tr
                          key={coupon._id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setAnalyticsCoupon(coupon)}
                        >
                          <td className="py-4 px-6">
                            <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded tracking-wide">
                              {coupon.code}
                            </span>
                            {coupon.applicableProducts && coupon.applicableProducts.length > 0 && (
                              <span className="block text-[10px] text-gray-400 mt-1">
                                {coupon.applicableProducts.length} product(s)
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm font-semibold text-gray-700">
                            <div>
                              {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `UGX ${coupon.discountValue?.toLocaleString()} OFF`}
                            </div>
                            {coupon.minOrderAmount > 0 && (
                              <span className="text-[10px] text-gray-400 block">min UGX {coupon.minOrderAmount?.toLocaleString()}</span>
                            )}
                            {coupon.discountType === 'percentage' && coupon.maxDiscountAmount > 0 && (
                              <span className="text-[10px] text-gray-400 block">cap UGX {coupon.maxDiscountAmount?.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {new Date(coupon.expiryDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-sm text-center font-bold text-gray-700">
                            {coupon.totalTimesUsed || 0}
                            <span className="text-[10px] text-gray-400 block">
                              limit: {coupon.usageLimit || 1}/user
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-right font-semibold text-gray-600">
                            {(coupon.totalDiscountGiven || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-center" onClick={e => e.stopPropagation()}>
                            {isExpired ? (
                              <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">Expired</span>
                            ) : (
                              <button
                                onClick={() => toggleHandler(coupon._id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  coupon.isActive ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                                title={coupon.isActive ? 'Click to deactivate' : 'Click to activate'}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                    coupon.isActive ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setAnalyticsCoupon(coupon)}
                                className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="View Analytics"
                              >
                                <BarChart3 size={16} />
                              </button>
                              <button
                                onClick={() => setEditingCoupon(coupon)}
                                className="text-gray-400 hover:text-primary p-2 rounded-lg hover:bg-primary/10 transition-colors"
                                title="Edit Coupon"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => deleteHandler(coupon._id)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete Coupon"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* ─── Create Form ─── */}
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
              {/* Code */}
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
              
              {/* Discount Type */}
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
              
              {/* Discount Value */}
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

              {/* Per-User Limit */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Per-User Limit</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="e.g. 1"
                />
                <p className="text-[10px] text-gray-400 mt-1">How many times each customer can use this code</p>
              </div>

              {/* Min Order Amount */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Min. Order Amount (UGX) <span className="text-gray-400 normal-case">(optional)</span></label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="e.g. 50000"
                />
              </div>

              {/* Max Discount (only for percentage) */}
              {discountType === 'percentage' && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Max Discount (UGX) <span className="text-gray-400 normal-case">(optional cap)</span></label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="e.g. 15000"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Maximum discount in UGX regardless of order size</p>
                </div>
              )}
              
              {/* Expiry Date */}
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

              {/* Product Picker */}
              <ProductPicker
                vendorProducts={vendorProducts}
                selectedProducts={selectedProducts}
                setSelectedProducts={setSelectedProducts}
              />
              
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

      {/* ─── Modals ─── */}
      {editingCoupon && (
        <EditModal
          coupon={editingCoupon}
          vendorProducts={vendorProducts}
          onClose={() => setEditingCoupon(null)}
          onSave={handleEditSave}
        />
      )}

      {analyticsCoupon && (
        <AnalyticsModal
          coupon={analyticsCoupon}
          onClose={() => setAnalyticsCoupon(null)}
        />
      )}
    </>
  );
};

export default CouponsScreen;
