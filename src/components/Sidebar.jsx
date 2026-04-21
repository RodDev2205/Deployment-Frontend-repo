import React from 'react';
import { LogOut } from 'lucide-react';
import logo from '../assets/logo3.png'; // Optional: if you want to use an image logo instead of text

const Sidebar = ({
  logoTitle = "AppTitle",
  logoHighlight = "",
  navItems = [],
  activeItem,
  setActiveItem,
  onLogout,
}) => {
  // define which items should be preceded by a divider line
  const dividerNames = [
    'Menu',
    'Reports'
  ];

  return (
    <div className="w-64 bg-white text-gray-800 flex flex-col shadow-lg h-screen">

      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-center">
        <img 
          src={logo} 
          alt="App Logo" 
          className="h-16 object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeItem === item.name;
          const Icon = item.icon;
          const needsDivider = dividerNames.includes(item.name);

          return (
            <React.Fragment key={item.name}>
              {needsDivider && <hr className="my-2 border-gray-300" />}
              <div
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
                  ${isActive ? "bg-green-100 font-semibold text-green-700 shadow-inner" : "hover:bg-green-50"}
                `}
                onClick={() => setActiveItem(item.name, item.path)}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </div>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <div
          className="flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 
          hover:bg-red-100 hover:text-red-700"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;
