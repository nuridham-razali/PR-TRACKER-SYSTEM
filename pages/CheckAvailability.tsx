import React, { useState } from 'react';
import { checkPRAvailability } from '../services/prService';
import { PRRecord } from '../types';
import { Search, CheckCircle, XCircle, Calendar, User, ShoppingBag, Loader2 } from 'lucide-react';

export const CheckAvailability: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ checked: boolean; available: boolean; record?: PRRecord }>({
    checked: false,
    available: false,
  });

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
        const { available, record } = await checkPRAvailability(query);
        setResult({ checked: true, available, record });
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    
    // 1. Handle "YYYY-MM-DD" (exact date, no time) -> keep as is, just reformat to DD-MM-YYYY
    // We use a strict regex to ensure we don't accidentally match ISO strings here
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-');
        return `${d}-${m}-${y}`;
    }

    // 2. Handle ISO strings (e.g., 2026-02-14T16:00:00.000Z)
    // Convert to Local Time using Date object
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        }
    } catch (e) {
        // ignore error
    }

    // 3. Fallback
    return dateStr;
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">PR Availability Checker</h2>
        <p className="text-slate-500 mt-2">Instantly verify if a PR number has already been used.</p>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 flex items-center p-2 mb-8">
        <input 
          type="text"
          value={query}
          onChange={(e) => {
             setQuery(e.target.value);
             setResult({ checked: false, available: false }); // Reset on type
          }}
          placeholder="Enter PR Number (e.g. ADMIN/2026/055)"
          className="flex-1 px-6 py-4 text-lg outline-none text-black bg-transparent placeholder-slate-400"
        />
        <button 
          onClick={handleCheck}
          disabled={!query.trim() || loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Check'}
        </button>
      </div>

      {result.checked && (
        <div className={`transform transition-all duration-500 ease-out ${result.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-2xl p-8 shadow-sm`}>
          <div className="flex flex-col items-center text-center">
            {result.available ? (
              <>
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <CheckCircle size={48} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">PR Number is Available</h3>
                <p className="text-green-700">You can use <span className="font-mono font-bold bg-green-200 px-2 py-0.5 rounded text-green-900">{query}</span> for your new request.</p>
              </>
            ) : (
              <>
                <div className="bg-red-100 p-4 rounded-full mb-4">
                  <XCircle size={48} className="text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-red-800 mb-2">Already Used</h3>
                <p className="text-red-700 mb-6">This PR number is already recorded in the system.</p>
                
                {result.record && (
                  <div className="w-full bg-white rounded-xl p-6 border border-red-100 shadow-sm text-left">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-slate-500 flex items-center gap-1"><User size={14} /> Requested By</span>
                        <p className="font-semibold text-slate-800">{result.record.requestedBy}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 flex items-center gap-1"><Calendar size={14} /> Date Used</span>
                        <p className="font-semibold text-slate-800">{formatDate(result.record.date)}</p>
                      </div>
                      <div className="col-span-2 space-y-1 pt-2 border-t border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1"><ShoppingBag size={14} /> Vendor</span>
                        <p className="font-semibold text-slate-800">{result.record.vendor}</p>
                      </div>
                      <div className="col-span-2 pt-1">
                         <span className="text-slate-400 text-xs italic">{result.record.description}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
