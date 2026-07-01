import React from 'react';
import { useParams, Link } from 'react-router-dom';

const InfoPageScreen = ({ title, content }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link to="/" className="text-gray-500 hover:text-primary mb-8 inline-block font-semibold transition-colors">
        &larr; Back to Home
      </Link>
      
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-textPrimary mb-8">{title}</h1>
        <div className="prose prose-lg text-gray-700 max-w-none space-y-6">
          {content}
        </div>
      </div>
    </div>
  );
};

export default InfoPageScreen;
