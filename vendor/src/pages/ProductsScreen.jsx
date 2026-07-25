import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackagePlus, Upload, Image as ImageIcon, Trash2, Edit, Star, FileSpreadsheet, TrendingUp, Zap, X } from 'lucide-react';

const ProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [vendorWallet, setVendorWallet] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [flashSalePrice, setFlashSalePrice] = useState('');
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

  const [csvFile, setCsvFile] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCountInStock, setEditCountInStock] = useState('');
  
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editUploading, setEditUploading] = useState(false);
  
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

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
      
      // Fetch vendor profile to get wallet data
      const profileRes = await axios.get('/api/auth/profile', config);
      if (profileRes.data.wallet) {
        setVendorWallet(profileRes.data.wallet);
      }
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

  const sponsorHandler = async (id) => {
    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = {
        headers: { Authorization: `Bearer ${vendorInfo.token}` },
      };
      await axios.put(`/api/products/${id}/sponsor`, {}, config);
      fetchProducts(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle sponsorship');
    }
  };

  const buyCreditsHandler = async () => {
    if (window.confirm('Buy 50 Boost Credits for 10,000 UGX? This will be deducted from your Available Balance.')) {
      try {
        const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
        const config = {
          headers: { Authorization: `Bearer ${vendorInfo.token}` },
        };
        const { data } = await axios.post('/api/users/buy-credits', {}, config);
        alert(data.message);
        setVendorWallet(data.wallet);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to purchase credits');
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

  const uploadCsvHandler = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    
    setUploadingCsv(true);
    setCsvError('');
    setCsvSuccess('');

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${vendorInfo.token}`,
        },
      };

      await axios.post('/api/products/bulk', formData, config);
      setUploadingCsv(false);
      setCsvSuccess('Products imported successfully!');
      setCsvFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-upload');
      if (fileInput) fileInput.value = '';
      fetchProducts();
    } catch (error) {
      console.error(error);
      setUploadingCsv(false);
      setCsvError(error.response?.data?.message || 'CSV upload failed');
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
        flashSalePrice: flashSalePrice ? Number(flashSalePrice) : undefined,
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
      setFlashSalePrice('');
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

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setEditName(product.name || '');
    setEditPrice(product.price || '');
    setEditDescription(product.description || '');
    setEditCategory(product.category || '');
    setEditBrand(product.brand || '');
    setEditCountInStock(product.countInStock || '');
    setEditImageUrl(product.images && product.images.length > 0 ? product.images[0] : '');
    setEditImageFile(null);
    setEditError('');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    setEditImageUrl('');
    setEditImageFile(null);
  };

  const editUploadFileHandler = async (e) => {
    const file = e.target.files[0];
    setEditImageFile(file);
    const formData = new FormData();
    formData.append('image', file);
    setEditUploading(true);
    setEditError('');

    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${vendorInfo.token}`,
        },
      };

      const { data } = await axios.post('/api/upload', formData, config);
      setEditImageUrl(data.url);
      setEditUploading(false);
    } catch (error) {
      console.error(error);
      setEditUploading(false);
      setEditError(error.response?.data?.message || 'Image upload failed');
    }
  };

  const editSubmitHandler = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProduct) return;
    setEditLoading(true);
    setEditError('');

    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorInfo.token}`,
        },
      };

      const productData = {
        name: editName,
        price: Number(editPrice),
        description: editDescription,
        category: editCategory,
        brand: editBrand,
        countInStock: Number(editCountInStock),
        images: editImageUrl ? [editImageUrl] : [],
      };

      await axios.put(`/api/products/${selectedProduct._id}`, productData, config);

      setEditLoading(false);
      closeEditModal();
      fetchProducts();
    } catch (error) {
      setEditLoading(false);
      setEditError(
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
        
        {/* Boost Credits Banner */}
        <div className="vendor-card p-6 mb-8 bg-gradient-to-br from-surface to-background border-borderLight flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Zap size={24} className="fill-amber-500" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-primary">Sponsored Ad Promotion Boosts</h3>
              <p className="text-xs text-textMuted mt-0.5">
                Boost Credits Available: <span className="font-bold text-primary text-sm">{vendorWallet?.boostCredits || 0} Credits</span>
              </p>
            </div>
          </div>
          <button 
            onClick={buyCreditsHandler}
            className="btn-primary py-2.5 px-5 text-xs font-bold shadow-xs shrink-0"
          >
            Buy 50 Boost Credits (UGX 10,000)
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-heading font-bold text-textPrimary">Your Products</h1>
          
          <form onSubmit={uploadCsvHandler} className="flex items-center gap-3">
            <div className="relative">
              <input 
                type="file" 
                id="csv-upload"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button 
                type="button"
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors shadow-sm text-sm"
              >
                <FileSpreadsheet size={16} className="text-green-600" />
                {csvFile ? csvFile.name : 'Choose CSV'}
              </button>
            </div>
            <button 
              type="submit"
              disabled={!csvFile || uploadingCsv}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-sm text-sm disabled:opacity-50"
            >
              {uploadingCsv ? 'Importing...' : 'Import CSV'}
            </button>
          </form>
        </div>
        <div className="mb-4">
          <a 
            href="data:text/csv;charset=utf-8,Name,Price,Stock,Description,Category,Brand%0AExample Product,50000,10,A great product,Fashion,Generic" 
            download="products_template.csv"
            className="text-xs text-primary hover:underline font-semibold"
          >
            Download CSV Template
          </a>
        </div>

        {csvError && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">{csvError}</div>}
        {csvSuccess && <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">{csvSuccess}</div>}
      </div>

      {/* Product List Table / Grid */}
      <div className="vendor-card p-6">
        <div className="flex justify-between items-center mb-6 border-b border-borderLight pb-4">
          <h2 className="text-lg font-heading font-bold text-primary">Your Catalog</h2>
          <span className="text-xs text-textMuted">Showing {products.length} products</span>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <span className="text-4xl">🛍️</span>
            <p className="text-xs font-semibold text-textMuted">No products found in your store catalog yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-borderLight text-textMuted uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Sponsored Ad</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img src={prod.images?.[0]} alt={prod.name} className="w-10 h-10 rounded-xl object-cover border border-borderLight" />
                      <div>
                        <p className="font-bold text-primary text-xs">{prod.name}</p>
                        <p className="text-[10px] text-textMuted">{prod.brand || 'Boutique'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-textMuted">
                      <span className="pill-badge">{prod.category}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">
                      UGX {prod.price?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {prod.countInStock > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200">
                          In Stock ({prod.countInStock})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => sponsorHandler(prod._id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                          prod.isSponsored 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-xs' 
                            : 'bg-cream text-textMuted hover:text-accent border border-borderLight'
                        }`}
                      >
                        <Zap size={12} className={prod.isSponsored ? 'fill-amber-500 text-amber-500' : ''} />
                        {prod.isSponsored ? 'Sponsored Ad (Active)' : 'Boost Product'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 text-textMuted hover:text-accent rounded-lg hover:bg-cream transition-colors"
                        title="Edit Product"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => deleteProductHandler(prod._id)}
                        className="p-1.5 text-textMuted hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right Col: Add Form */}
      <div className="w-full lg:w-[420px] shrink-0">
        <div className="vendor-card p-6 sm:p-8 sticky top-24">
          <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-2 text-primary">
            <PackagePlus size={20} className="text-accent" />
            Add New Product
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Regular Price (UGX)</label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-medium text-gray-800 placeholder-gray-400"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-accent font-bold mb-1.5">Flash Sale Price</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-xs font-bold text-accent placeholder-rose-300"
                  value={flashSalePrice || ''}
                  onChange={(e) => setFlashSalePrice(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Stock</label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-medium text-gray-800 placeholder-gray-400"
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

      {/* Full Product Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Edit size={20} className="text-primary" />
                Edit Product
              </h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {editError && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">{editError}</div>}
              
              <form id="editProductForm" onSubmit={editSubmitHandler} className="space-y-5">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Product Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Price (UGX)</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Stock</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                      value={editCountInStock}
                      onChange={(e) => setEditCountInStock(e.target.value)}
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
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Category</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Description</label>
                  <textarea
                    required
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800 placeholder-gray-400 resize-none"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Product Image</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors group cursor-pointer relative">
                    {editImageUrl ? (
                      <div className="relative w-full flex justify-center">
                        <img src={editImageUrl} alt="Preview" className="h-32 w-32 object-cover rounded-xl shadow-sm border border-gray-200" />
                        <button type="button" onClick={(e) => { e.preventDefault(); setEditImageUrl(''); }} className="absolute -top-3 -right-3 sm:right-1/3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors z-10">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <ImageIcon size={20} className="text-gray-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-600">{editUploading ? 'Uploading...' : 'Click to Upload Image'}</span>
                        <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={editUploadFileHandler} accept="image/*" />
                      </>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="flex gap-3 p-6 bg-gray-50/50 border-t border-gray-100">
              <button onClick={closeEditModal} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button 
                type="submit"
                form="editProductForm"
                disabled={editUploading || editLoading}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsScreen;
