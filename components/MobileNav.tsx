import React from 'react';
import { LayoutDashboard, PlusCircle, Search, Menu } from 'lucide-react';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPage, onNavigate }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-50 shadow-lg pb-safe">
      <button 
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center p-2 rounded-lg ${currentPage === 'dashboard' ? 'text-indigo-600' : 'text-gray-500'}`}
      >
        <LayoutDashboard size={24} />
        <span className="text-xs mt-1">Dash</span>
      </button>
      <button 
        onClick={() => onNavigate('add')}
        className={`flex flex-col items-center p-2 rounded-lg ${currentPage === 'add' ? 'text-indigo-600' : 'text-gray-500'}`}
      >
        <PlusCircle size={24} />
        <span className="text-xs mt-1">Add</span>
      </button>
      <button 
        onClick={() => onNavigate('check')}
        className={`flex flex-col items-center p-2 rounded-lg ${currentPage === 'check' ? 'text-indigo-600' : 'text-gray-500'}`}
      >
        <Search size={24} />
        <span className="text-xs mt-1">Check</span>
      </button>
    </div>
  );
};