import React, { useState, useEffect } from 'react';
import { Store, Trash2 } from 'lucide-react';
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-gray-800 flex items-center gap-3">
            <Store size={32} className="text-primary" />
            Vendor Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review and manage store owners selling on GoGirl Market.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-100 border-collapse">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Store / Vendor</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 font-medium">No active vendors found.</td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-md flex items-center justify-center">
                            <Store size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{vendor.storeName || 'Unnamed Store'}</p>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{vendor.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{vendor.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{new Date(vendor.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button onClick={() => revokeVendorHandler(vendor._id)} className="text-red-500 hover:text-white hover:bg-red-500 transition-all p-2 rounded-md border border-transparent hover:shadow-md" title="Revoke Vendor Status">
                          <Trash2 size={16} />
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
