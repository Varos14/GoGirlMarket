import React from 'react';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  return (
    <nav className="flex justify-center mb-8">
      <ol className="flex items-center w-full max-w-3xl">
        <li className={`flex w-full items-center text-sm font-medium after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block ${step1 ? 'text-primary after:border-primary' : 'text-gray-400 after:border-gray-200'}`}>
          <div className="flex items-center">
            <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${step1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>1</span>
            Sign In
          </div>
        </li>
        <li className={`flex w-full items-center text-sm font-medium after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block ${step2 ? 'text-primary after:border-primary' : 'text-gray-400 after:border-gray-200'}`}>
          <div className="flex items-center ml-2">
            <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${step2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>2</span>
            Shipping
          </div>
        </li>
        <li className={`flex w-full items-center text-sm font-medium after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block ${step3 ? 'text-primary after:border-primary' : 'text-gray-400 after:border-gray-200'}`}>
          <div className="flex items-center ml-2">
            <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${step3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>3</span>
            Payment
          </div>
        </li>
        <li className={`flex items-center text-sm font-medium ${step4 ? 'text-primary' : 'text-gray-400'}`}>
          <div className="flex items-center ml-2 whitespace-nowrap">
            <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${step4 ? 'bg-primary text-white' : 'bg-gray-200'}`}>4</span>
            Place Order
          </div>
        </li>
      </ol>
    </nav>
  );
};

export default CheckoutSteps;
