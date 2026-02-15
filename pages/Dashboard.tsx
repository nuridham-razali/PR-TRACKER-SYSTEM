import React, { useState, useEffect } from 'react';
import { PRRecord, UserRole } from '../types';
import { getPRRecords, deletePRRecord, updatePRRecord } from '../services/prService';
import { Search, Download, Trash2, Filter, Loader2, Edit2, X, Save } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [records, setRecords] = useState<PRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('');

  // Edit State
  const [editingRecord, setEditingRecord] = useState<PRRecord | null>(null);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    // Simple validation
    if(!editingRecord.prNumber || !editingRecord.date || !editingRecord.requestedBy) {
        alert("Please fill in all required fields");
        return;
    }

    setLoading(true);
    try {
        await updatePRRecord(editingRecord);
        setEditingRecord(null);
        await loadData();
    } catch (err: any) {
        alert(err.message || "Failed to update record");
        setLoading(false);
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
    <div className="space-y-6 relative">
      
      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center shrink-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Edit2 size={20} className="text-indigo-200"/>
                        Edit Record
                    </h3>
                    <button 
                        onClick={() => setEditingRecord(null)} 
                        className="text-indigo-200 hover:text-white transition-colors bg-indigo-700/50 hover:bg-indigo-700 p-1.5 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto">
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">PR Number</label>
                        <input 
                            type="text" 
                            value={editingRecord.prNumber}
                            onChange={(e) => setEditingRecord({...editingRecord, prNumber: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-black font-medium"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Date</label>
                            <input 
                                type="date" 
                                value={editingRecord.date}
                                onChange={(e) => setEditingRecord({...editingRecord, date: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Requested By</label>
                            <select 
                                value={editingRecord.requestedBy}
                                onChange={(e) => setEditingRecord({...editingRecord, requestedBy: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-black bg-white"
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                         </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Vendor</label>
                        <input 
                            type="text" 
                            value={editingRecord.vendor}
                            onChange={(e) => setEditingRecord({...editingRecord, vendor: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Description</label>
                        <textarea 
                            rows={3}
                            value={editingRecord.description}
                            onChange={(e) => setEditingRecord({...editingRecord, description: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-black resize-none"
                        />
                     </div>

                     <div className="pt-2 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setEditingRecord(null)}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                     </div>
                </form>
            </div>
        </div>
      )}

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
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
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
                        <div className="flex items-center justify-center gap-2">
                            <button 
                                onClick={() => setEditingRecord(record)}
                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all p-2 rounded-full"
                                title="Edit Record"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDelete(record.id)}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all p-2 rounded-full"
                                title="Delete Record"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
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
