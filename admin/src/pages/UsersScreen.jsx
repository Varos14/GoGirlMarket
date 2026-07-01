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
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-800 flex items-center gap-3">
            <Users size={32} className="text-primary" />
            User Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage platform users, roles, and access.</p>
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
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                          {user.name.substring(0, 2)}
                        </div>
                        <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                        user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        user.role === 'vendor' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        {user.role === 'customer' && (
                          <button onClick={() => makeVendorHandler(user._id)} className="text-blue-500 hover:text-white hover:bg-blue-500 transition-all p-2 rounded-md border border-transparent hover:shadow-md" title="Promote to Vendor">
                            <Store size={16} />
                          </button>
                        )}
                        <button onClick={() => deleteHandler(user._id)} className="text-red-500 hover:text-white hover:bg-red-500 transition-all p-2 rounded-md border border-transparent hover:shadow-md" title="Delete User">
                          <UserX size={16} />
                        </button>
                      </div>
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
