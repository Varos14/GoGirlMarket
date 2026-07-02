import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductDetails, createProductReview, productReviewCreateReset } from '../store/productSlice';
import { addToCart } from '../store/cartSlice';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';

const ProductDetailsScreen = () => {
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const productList = useSelector((state) => state.products);
  const { loading, error, productDetails: product, reviewLoading, reviewError, reviewSuccess } = productList;

  const auth = useSelector((state) => state.auth);
  const { userInfo } = auth;

  useEffect(() => {
    if (reviewSuccess) {
      alert('Review Submitted successfully');
      setRating(0);
      setComment('');
      dispatch(productReviewCreateReset());
    }
    dispatch(fetchProductDetails(id));
  }, [dispatch, id, reviewSuccess]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(createProductReview({
      productId: id,
      review: { rating, comment },
    }));
  };

  const addToCartHandler = () => {
    dispatch(addToCart({
      product: product._id,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      price: product.price,
      countInStock: product.countInStock,
      vendor: typeof product.vendor === 'object' ? product.vendor._id : product.vendor,
      qty: Number(qty)
    }));
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/shop" className="text-gray-500 hover:text-primary mb-6 inline-block font-semibold transition-colors">
        &larr; Back to Shop
      </Link>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : !product ? null : (
        <div className="flex flex-col md:flex-row gap-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          {/* Product Image Viewer */}
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div className="h-[500px] bg-surface rounded-xl overflow-hidden relative group">
               <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4">
               {product.images.map((img, index) => (
                 <div key={index} className="h-28 w-28 bg-surface rounded-lg cursor-pointer transition-all hover:shadow-md border border-gray-200 overflow-hidden">
                   <img src={img} alt="" className="w-full h-full object-cover" />
                 </div>
               ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2 flex flex-col justify-between">
            <div>
              <span className="text-sm text-primary font-bold tracking-widest uppercase mb-2 block">{product.category}</span>
              <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-textPrimary mb-4">{product.name}</h1>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                {product.description}
              </p>
              
              <div className="flex items-center gap-6 mb-8">
                <span className="text-4xl font-bold text-primary">UGX {product.price.toLocaleString()}</span>
                {product.countInStock > 0 ? (
                  <span className="text-sm bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold uppercase tracking-wider">In Stock</span>
                ) : (
                  <span className="text-sm bg-red-100 text-red-800 px-4 py-2 rounded-full font-bold uppercase tracking-wider">Out Of Stock</span>
                )}
              </div>

              <div className="border-t border-b border-gray-100 py-6 mb-8 space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-gray-700">Sold By:</span>
                  <Link to={`/store/${product.vendor?.storeSlug || product.vendor?._id}`} className="text-secondary font-bold hover:underline cursor-pointer flex items-center gap-1.5">
                    {product.vendor?.storeName || product.vendor?.name || 'Vendor'}
                    {product.vendor?.isVerified && <BadgeCheck size={16} className="text-blue-500" title="Verified Vendor" />}
                  </Link>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-gray-700">Brand:</span>
                  <span>{product.brand}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-gray-700">Rating:</span>
                  <span className="text-highlight font-bold flex items-center gap-2">
                    ★ {product.rating} <span className="text-gray-500 font-normal text-base">({product.numReviews} reviews)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {product.countInStock > 0 && (
              <div className="flex gap-4">
                <select 
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="border-2 border-gray-200 p-4 rounded-xl bg-gray-50 font-bold text-xl w-28 outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer text-center"
                >
                  {[...Array(product.countInStock).keys()].map((x) => (
                    <option key={x + 1} value={x + 1}>{x + 1}</option>
                  ))}
                </select>
                <button 
                  onClick={addToCartHandler}
                  className="flex-grow btn-primary text-xl shadow-lg hover:shadow-xl py-4 rounded-xl flex justify-center items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVIEWS SECTION */}
      {!loading && !error && product && (
        <div className="mt-16 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-3xl font-heading font-bold mb-8 text-textPrimary">Reviews</h2>
          
          {product.reviews.length === 0 && (
            <div className="bg-surface p-6 rounded-xl text-gray-500 text-center mb-8">
              No reviews yet. Be the first to review this product!
            </div>
          )}

          <div className="space-y-6 mb-12">
            {product.reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="font-bold text-lg">{review.name}</div>
                  <div className="text-highlight">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">{review.createdAt.substring(0, 10)}</p>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface p-8 rounded-xl">
            <h2 className="text-2xl font-heading font-bold mb-6">Write a Customer Review</h2>
            {reviewError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
                {reviewError}
              </div>
            )}
            
            {userInfo ? (
              <form onSubmit={submitHandler} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full md:w-1/3 border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Comment</label>
                  <textarea
                    rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  ></textarea>
                </div>
                
                <button
                  disabled={reviewLoading}
                  type="submit"
                  className="btn-primary py-3 px-8 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition-all font-bold"
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="text-gray-600">
                Please <Link to="/login" className="text-secondary font-bold hover:underline">sign in</Link> to write a review.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetailsScreen;
