import React, { useState, useEffect } from 'react';
import { UserX, Shield, Store, Users } from 'lucide-react';
import axios from 'axios';

const UsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) throw new Error('Not logged in');
      const userInfo = JSON.parse(userInfoStr);
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const { data } = await axios.get('/api/users', config);
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) throw new Error('Not logged in');
        const userInfo = JSON.parse(userInfoStr);
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        await axios.delete(`/api/users/${id}`, config);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const makeVendorHandler = async (id) => {
    if (window.confirm('Promote this user to Vendor?')) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) throw new Error('Not logged in');
        const userInfo = JSON.parse(userInfoStr);
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        await axios.put(`/api/users/${id}/role`, { role: 'vendor' }, config);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to update role');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary flex items-center gap-2">
            <Users size={28} className="text-accent" />
            User Account Management
          </h1>
          <p className="text-xs text-textMuted mt-1">Manage customer, seller, and administrator accounts across GoGirl Market.</p>
        </div>
        <span className="pill-badge bg-softRose text-accent text-xs font-bold w-max">
          {users.length} Total Registered Accounts
        </span>
      </div>

      {/* Users Table */}
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
                  <th className="py-3 px-4">User Account</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Account Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-cream text-primary font-bold flex items-center justify-center text-xs border border-borderLight uppercase">
                          {user.name.substring(0, 2)}
                        </div>
                        <p className="font-bold text-primary text-xs">{user.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-textMuted">
                      {user.email}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        user.role === 'vendor' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-textMuted">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 text-right space-x-1">
                      {user.role === 'customer' && (
                        <button 
                          onClick={() => makeVendorHandler(user._id)} 
                          className="btn-secondary py-1 px-2.5 text-[10px] font-semibold"
                          title="Promote to Vendor"
                        >
                          Make Vendor
                        </button>
                      )}
                      <button 
                        onClick={() => deleteHandler(user._id)} 
                        className="p-1.5 text-textMuted hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete User Account"
                      >
                        <UserX size={15} />
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
  );
};

export default UsersScreen;
