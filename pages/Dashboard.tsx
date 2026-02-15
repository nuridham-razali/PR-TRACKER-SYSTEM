import React, { useState, useEffect } from 'react';
import { PRRecord, UserRole } from '../types';
import { getPRRecords, deletePRRecord } from '../services/prService';
import { Search, Download, Trash2, Filter, Loader2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [records, setRecords] = useState<PRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPRRecords();
      // Sort by newest first
      data.sort((a, b) => b.timestamp - a.timestamp);
      setRecords(data);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record? This cannot be undone.')) {
      setLoading(true);
      await deletePRRecord(id);
      await loadData();
    }
  };

  const handleExport = () => {
    const headers = ['PR Number', 'Date', 'Requested By', 'Vendor', 'Description'];
    const csvContent = [
      headers.join(','),
      ...records.map(r => 
        [r.prNumber, r.date, r.requestedBy, `"${r.vendor}"`, `"${r.description}"`].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pr_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Filter Logic
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      (record.prNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = userFilter === 'All' || record.requestedBy === userFilter;
    const matchesMonth = monthFilter === '' || record.date.startsWith(monthFilter);

    return matchesSearch && matchesUser && matchesMonth;
  });

  // Stats Logic
  const userCounts = records.reduce((acc, r) => {
    const user = r.requestedBy as string;
    acc[user] = (acc[user] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topUser = Object.keys(userCounts).sort((a, b) => userCounts[b] - userCounts[a])[0] || 'N/A';

  return (
    <div className="space-y-6">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500">Total PRs Used</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {loading ? '-' : records.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500">Top Requester</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {loading ? '-' : topUser}
          </p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search PR #, Vendor..."
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full md:w-64 bg-white text-black"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex gap-2">
                <select 
                    className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                >
                    <option value="All">All Users</option>
                    {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>

                <input 
                    type="month"
                    className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                />
            </div>
        </div>

        <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
        >
            <Download size={16} />
            Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                <th className="p-4">PR Number</th>
                <th className="p-4">Date</th>
                <th className="p-4">Requester</th>
                <th className="p-4">Vendor</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin text-indigo-500" />
                        <span>Loading records from Google Sheets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{record.prNumber}</td>
                    <td className="p-4 text-slate-600 text-sm">{record.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${record.requestedBy === UserRole.USER_1 ? 'bg-blue-100 text-blue-800' : 
                          record.requestedBy === UserRole.USER_2 ? 'bg-purple-100 text-purple-800' : 
                          'bg-orange-100 text-orange-800'}`}>
                        {record.requestedBy}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 text-sm">{record.vendor}</td>
                    <td className="p-4 text-slate-500 text-sm max-w-xs truncate" title={record.description}>
                      {record.description}
                    </td>
                    <td className="p-4 text-center">
                        <button 
                            onClick={() => handleDelete(record.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            title="Delete Record"
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};