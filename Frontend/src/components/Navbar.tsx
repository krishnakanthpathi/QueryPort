import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="mt-6 mx-auto bg-white/8 text-white backdrop-blur-sm shadow-md rounded-full w-full max-w-md sm:max-w-xl md:max-w-2xl fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ">
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3 cursor-pointer">
            <img src="" alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-semibold text-white">Talent Layer</span>
          </div>
          <button className="bg-grey-500 hover:bg-white hover:text-black text-white font-medium px-5 py-2 rounded-lg transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
