import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './pages/Dashboard';
import { AddPR } from './pages/AddPR';
import { CheckAvailability } from './pages/CheckAvailability';
import { UserRole } from './types';
import { seedDataIfEmpty } from './services/prService';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<UserRole>(UserRole.USER_1);

  useEffect(() => {
    // Initialize dummy data if this is the first run
    seedDataIfEmpty();
  }, []);

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'add':
        return <AddPR currentUser={currentUser} onSaveSuccess={() => setCurrentPage('dashboard')} />;
      case 'check':
        return <CheckAvailability />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar for Desktop */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <header className="bg-white shadow-sm sticky top-0 z-20 px-6 py-4 flex justify-between items-center md:hidden">
          <h1 className="font-bold text-indigo-600 text-lg">PR Tracker</h1>
           <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
             {currentUser}
           </div>
        </header>

        <main className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
};

export default App;