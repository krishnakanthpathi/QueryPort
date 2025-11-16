import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="text-white text-lg font-bold">TalentLayer</div>
      <ul className="flex space-x-4">
        <li><a className="text-white hover:text-gray-400" href="/login">Login</a></li>
        <li><a className="text-white hover:text-gray-400" href="/signup">Signup</a></li>
        <li><a className="text-white hover:text-gray-400" href="/portfolio1">Portfolio 1</a></li>
        <li><a className="text-white hover:text-gray-400" href="/portfolio2">Portfolio 2</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
