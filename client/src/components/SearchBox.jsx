import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBox = () => {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    const term = keyword.trim();
    if (term.toLowerCase() === 'shoes' || term.toLowerCase() === 'shoe') {
      navigate('/shop?category=Shoes');
    } else if (term) {
      navigate(`/shop?keyword=${encodeURIComponent(term)}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <form onSubmit={submitHandler} className="relative hidden md:flex items-center mr-4">
      <input
        type="text"
        name="q"
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search products..."
        className="py-2 pl-4 pr-10 border border-gray-300 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48 lg:w-64 transition-all text-sm bg-gray-50"
      />
      <button type="submit" className="absolute right-3 text-gray-400 hover:text-primary transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
};

export default SearchBox;
