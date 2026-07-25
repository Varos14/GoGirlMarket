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

  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <Link to="/shop" className="text-xs font-semibold text-textMuted hover:text-accent flex items-center gap-1.5 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Shop
      </Link>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <span>{error}</span>
        </div>
      ) : !product ? null : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-surface p-6 sm:p-10 rounded-3xl border border-borderLight shadow-xs">
          {/* Product Image Viewer Gallery */}
          <div className="space-y-4">
            <div className="h-[420px] sm:h-[480px] bg-background rounded-2xl overflow-hidden border border-borderLight relative group">
              <img 
                src={product.images && product.images.length > 0 ? product.images[selectedImage] || product.images[0] : 'https://via.placeholder.com/800x800'} 
                alt={product.name} 
                className="w-full h-full object-cover transition-all duration-300" 
              />
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {product.images.map((img, index) => (
                  <button 
                    key={index} 
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 w-20 flex-shrink-0 rounded-xl bg-background border-2 overflow-hidden transition-all ${
                      selectedImage === index ? 'border-accent shadow-xs scale-95' : 'border-borderLight opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Selection */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="pill-badge bg-cream text-primary text-[11px] uppercase tracking-wider">{product.category}</span>
                {product.countInStock > 0 ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">In Stock</span>
                ) : (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">Out of Stock</span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary">{product.name}</h1>
              
              <div className="flex items-center gap-3 pt-1">
                <span className="text-2xl font-bold text-primary">UGX {product.price.toLocaleString()}</span>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <span>★ {product.rating}</span>
                  <span className="text-textMuted font-normal">({product.numReviews} reviews)</span>
                </div>
              </div>

              <p className="text-textMuted text-sm leading-relaxed border-t border-borderLight pt-4">
                {product.description}
              </p>

              {/* Vendor & Brand Info */}
              <div className="bg-background p-4 rounded-2xl border border-borderLight space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-textMuted">Seller:</span>
                  <Link to={`/store/${product.vendor?.storeSlug || product.vendor?._id}`} className="font-bold text-primary hover:text-accent flex items-center gap-1">
                    {product.vendor?.storeName || product.vendor?.name || 'GoGirl Boutique'}
                    {product.vendor?.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
                  </Link>
                </div>
                {product.brand && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-textMuted">Brand:</span>
                    <span className="font-semibold text-primary">{product.brand}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions & Quantity Selector */}
            {product.countInStock > 0 && (
              <div className="space-y-4 pt-4 border-t border-borderLight">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-textMuted">Quantity:</span>
                  <div className="flex items-center bg-background rounded-full border border-borderLight p-1">
                    <button 
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-8 h-8 rounded-full bg-surface text-primary font-bold text-sm flex items-center justify-center hover:bg-cream transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 font-bold text-sm text-primary">{qty}</span>
                    <button 
                      onClick={() => setQty(Math.min(product.countInStock, qty + 1))}
                      className="w-8 h-8 rounded-full bg-surface text-primary font-bold text-sm flex items-center justify-center hover:bg-cream transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button 
                  onClick={addToCartHandler}
                  className="w-full btn-primary py-4 text-sm flex justify-center items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart • UGX {(product.price * qty).toLocaleString()}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      {!loading && !error && product && (
        <div className="bg-surface p-6 sm:p-10 rounded-3xl border border-borderLight shadow-xs space-y-8">
          <h2 className="text-2xl font-heading font-bold text-primary">Customer Reviews</h2>
          
          {product.reviews.length === 0 ? (
            <div className="bg-background p-6 rounded-2xl text-textMuted text-xs text-center border border-borderLight">
              No reviews yet. Be the first to share your thoughts on this item!
            </div>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review._id} className="bg-background p-5 rounded-2xl border border-borderLight space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-primary">{review.name}</span>
                      {review.isVerifiedBuyer && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200">
                          ✓ Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-amber-400 text-xs font-bold">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted">{review.createdAt.substring(0, 10)}</p>
                  <p className="text-xs text-textPrimary leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Submit Review */}
          <div className="bg-background p-6 rounded-2xl border border-borderLight space-y-4">
            <h3 className="text-base font-heading font-bold text-primary">Write a Review</h3>
            {reviewError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">
                {reviewError}
              </div>
            )}
            
            {userInfo ? (
              <form onSubmit={submitHandler} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full sm:w-auto bg-surface border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
                    required
                  >
                    <option value="">Select rating...</option>
                    <option value="5">5 ★★★★★ Excellent</option>
                    <option value="4">4 ★★★★☆ Very Good</option>
                    <option value="3">3 ★★★☆☆ Good</option>
                    <option value="2">2 ★★☆☆☆ Fair</option>
                    <option value="1">1 ★☆☆☆☆ Poor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Comment</label>
                  <textarea
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-surface border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
                    placeholder="Share details about fit, quality, or style..."
                    required
                  ></textarea>
                </div>
                
                <button
                  disabled={reviewLoading}
                  type="submit"
                  className="btn-primary py-2.5 px-6 text-xs shadow-xs"
                >
                  {reviewLoading ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            ) : (
              <p className="text-xs text-textMuted">
                Please <Link to="/login" className="text-accent font-bold hover:underline">sign in</Link> to post a customer review.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsScreen;
