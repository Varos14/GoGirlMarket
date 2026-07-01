import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackagePlus, Upload, Image as ImageIcon, Trash2, Edit } from 'lucide-react';

const ProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [countInStock, setCountInStock] = useState('');
  
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProducts = async () => {
    try {
      const vendorInfoStr = localStorage.getItem('vendorInfo');
      if (!vendorInfoStr) throw new Error('Not logged in');
      const vendorInfo = JSON.parse(vendorInfoStr);
      
      const config = {
        headers: { Authorization: `Bearer ${vendorInfo.token}` },
      };

      const { data } = await axios.get(`/api/products?vendor=${vendorInfo._id}`, config);
      setProducts(data.products);
      setLoadingProducts(false);
    } catch (error) {
      console.error('Failed to fetch vendor products', error);
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
        const config = {
          headers: { Authorization: `Bearer ${vendorInfo.token}` },
        };
        await axios.delete(`/api/products/${id}`, config);
        fetchProducts(); // Refresh list
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${vendorInfo.token}`,
        },
      };

      const { data } = await axios.post('/api/upload', formData, config);
      setImageUrl(data.url);
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
      setError(error.response?.data?.message || 'Image upload failed');
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorInfo.token}`,
        },
      };

      const productData = {
        name,
        price: Number(price),
        description,
        category,
        brand,
        countInStock: Number(countInStock),
        images: [imageUrl],
      };

      await axios.post('/api/products', productData, config);
      
      setLoading(false);
      setSuccess('Product created successfully!');
      
      // Reset form
      setName('');
      setPrice('');
      setDescription('');
      setCategory('');
      setBrand('');
      setCountInStock('');
      setImageUrl('');
      setImageFile(null);
      
      // Refresh list
      fetchProducts();
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Col: Product List */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-heading font-bold text-textPrimary">Your Products</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loadingProducts ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="bg-primary/10 text-primary p-4 rounded-full mb-4">
                <PackagePlus size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Yet</h3>
              <p className="text-gray-500 max-w-sm">
                You haven't added any products to your store. Use the form to create your first listing and start selling!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stock</th>
                    <th className="py-4 px-6 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(product => (
                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <img src={product.images[0]} alt={product.name} className="h-12 w-12 object-cover rounded-xl shadow-sm border border-gray-100" />
                          <div>
                            <p className="font-bold text-gray-800 text-sm line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gray-400">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-gray-800">UGX {product.price.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.countInStock > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {product.countInStock > 0 ? `${product.countInStock} in stock` : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => deleteHandler(product._id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100" title="Delete Product">
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

      {/* Right Col: Add Form */}
      <div className="lg:w-[450px]">
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-8 sticky top-28">
          <h2 className="text-2xl font-heading font-extrabold mb-6 flex items-center gap-3 text-gray-800">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <PackagePlus size={20} />
            </div>
            Add Product
          </h2>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">{error}</div>}
          {success && <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">{success}</div>}

          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Product Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Silk Evening Dress"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Price (UGX)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Stock</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                  value={countInStock}
                  onChange={(e) => setCountInStock(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Brand</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Brand Name"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Category</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Fashion"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Description</label>
              <textarea
                required
                rows="3"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product description..."
              ></textarea>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Product Image</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors group cursor-pointer relative">
                {imageUrl ? (
                  <div className="relative w-full flex justify-center">
                    <img src={imageUrl} alt="Preview" className="h-32 w-32 object-cover rounded-xl shadow-sm border border-gray-200" />
                    <button type="button" onClick={(e) => { e.preventDefault(); setImageUrl(''); }} className="absolute -top-3 -right-3 sm:right-1/4 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors z-10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon size={20} className="text-gray-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">{uploading ? 'Uploading...' : 'Click to Upload Image'}</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={uploadFileHandler} accept="image/*" />
                  </>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors shadow-md mt-6"
              disabled={loading || uploading || !imageUrl}
            >
              {loading ? 'Publishing...' : 'Publish Product'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductsScreen;
