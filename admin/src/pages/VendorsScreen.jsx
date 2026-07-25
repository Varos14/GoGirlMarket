import React, { useState, useEffect } from 'react';
import { Store, Trash2, BadgeCheck, Percent, Ban, CheckCircle } from 'lucide-react';
import axios from 'axios';

const VendorsScreen = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) throw new Error('Not logged in');
      const userInfo = JSON.parse(userInfoStr);
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const { data } = await axios.get('/api/users', config);
      const onlyVendors = data.filter(user => user.role === 'vendor');
      setVendors(onlyVendors);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch vendors', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const revokeVendorHandler = async (id) => {
    if (window.confirm('Revoke vendor privileges for this user? They will become a regular customer.')) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) throw new Error('Not logged in');
        const userInfo = JSON.parse(userInfoStr);
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        await axios.put(`/api/users/${id}/role`, { role: 'customer' }, config);
        fetchVendors();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to update role');
      }
    }
  };

  const toggleVerifiedHandler = async (id, currentStatus) => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) throw new Error('Not logged in');
      const userInfo = JSON.parse(userInfoStr);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`/api/users/${id}/role`, { isVerified: !currentStatus }, config);
      fetchVendors();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update verification');
    }
  };

  const toggleSuspendHandler = async (id, currentStatus) => {
    const action = currentStatus ? 'reinstate' : 'suspend';
    if (window.confirm(`Are you sure you want to ${action} this vendor?`)) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        const userInfo = JSON.parse(userInfoStr);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`/api/users/${id}/suspend`, {}, config);
        fetchVendors();
      } catch (error) {
        alert(error.response?.data?.message || `Failed to ${action} vendor`);
      }
    }
  };

  const toggleApproveHandler = async (id, currentStatus) => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      const userInfo = JSON.parse(userInfoStr);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`/api/users/${id}/approve`, {}, config);
      fetchVendors();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve vendor');
    }
  };

  const updateCommissionHandler = async (id, rate) => {
    const newRate = prompt('Enter new commission rate (0-100):', rate !== undefined ? rate : 7);
    if (newRate !== null) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) throw new Error('Not logged in');
        const userInfo = JSON.parse(userInfoStr);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`/api/users/${id}/role`, { commissionRate: Number(newRate) }, config);
        fetchVendors();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to update commission');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary flex items-center gap-2">
            <Store size={28} className="text-accent" />
            Vendor Management
          </h1>
          <p className="text-xs text-textMuted mt-1">Review store verifications, commission rates, and seller platform access.</p>
        </div>
        <span className="pill-badge bg-softRose text-accent text-xs font-bold w-max">
          {vendors.length} Registered Stores
        </span>
      </div>

      {/* Vendors Table */}
      <div className="admin-card p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-borderLight text-textMuted uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Store / Vendor</th>
                  <th className="py-3 px-4">Contact Email</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Verification & Fee</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-textMuted font-medium">No registered vendors found.</td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-cream/40 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-cream text-primary font-bold flex items-center justify-center text-xs border border-borderLight uppercase">
                            {vendor.storeName ? vendor.storeName.substring(0, 2) : vendor.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-primary text-xs flex items-center gap-1">
                              {vendor.storeName || vendor.name}
                              {vendor.isVerified && <BadgeCheck size={14} className="text-emerald-500" />}
                            </p>
                            <p className="text-[10px] text-textMuted">Owner: {vendor.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-textMuted">
                        {vendor.email}
                      </td>
                      <td className="py-4 px-4 text-textMuted">
                        {new Date(vendor.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-2">
                          {vendor.isVerified ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200">
                              Verified Store
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200">
                              Unverified
                            </span>
                          )}

                          {vendor.isApproved ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200">
                              Pending Approval
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-textMuted">
                          Commission: <span className="font-bold text-primary">{vendor.commissionRate !== undefined ? vendor.commissionRate : 7}%</span>
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right space-x-1.5">
                        <button 
                          onClick={() => toggleVerifiedHandler(vendor._id, vendor.isVerified)}
                          className="btn-secondary py-1 px-2.5 text-[10px]"
                          title="Toggle Verification"
                        >
                          {vendor.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                        <button 
                          onClick={() => toggleApproveHandler(vendor._id, vendor.isApproved)}
                          className="btn-primary py-1 px-2.5 text-[10px]"
                        >
                          {vendor.isApproved ? 'Unapprove' : 'Approve'}
                        </button>
                        <button 
                          onClick={() => updateCommissionHandler(vendor._id, vendor.commissionRate)}
                          className="p-1.5 text-textMuted hover:text-accent rounded-lg hover:bg-cream transition-colors"
                          title="Set Commission"
                        >
                          <Percent size={15} />
                        </button>
                        <button 
                          onClick={() => revokeVendorHandler(vendor._id)}
                          className="p-1.5 text-textMuted hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Revoke Role"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorsScreen;
