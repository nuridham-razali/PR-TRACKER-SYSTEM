import React from 'react';
import { LayoutDashboard, PlusCircle, Search } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: UserRole;
  onUserChange: (user: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, currentUser, onUserChange }) => {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add', label: 'Add New PR', icon: PlusCircle },
    { id: 'check', label: 'Check Availability', icon: Search },
  ];

  return (
    <div className="w-64 bg-white text-black flex flex-col h-screen fixed left-0 top-0 shadow-lg z-10 hidden md:flex border-r border-slate-200">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-600">ADMIN PR</h1>
        <p className="text-xs text-slate-500 mt-1">PR Tracker Management System</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-black'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="mb-2 text-xs uppercase text-slate-500 font-semibold tracking-wider">
          Current User
        </div>
        <select
          value={currentUser}
          onChange={(e) => onUserChange(e.target.value as UserRole)}
          className="w-full bg-white border border-slate-300 text-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        >
          {Object.values(UserRole).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};