import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { savePRRecord, getNextProposedSequence } from '../services/prService';
import { Save, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Helper for simple ID
const generateId = () => Math.random().toString(36).substr(2, 9);

interface AddPRProps {
    currentUser: UserRole;
    onSaveSuccess: () => void;
}

export const AddPR: React.FC<AddPRProps> = ({ currentUser, onSaveSuccess }) => {
    const currentYear = new Date().getFullYear();
    
    // UI State for PR Number construction
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [sequence, setSequence] = useState('');
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        requestedBy: currentUser,
        vendor: '',
        description: ''
    });

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    // Generate year options (Current - 1 to Current + 5)
    const yearOptions = Array.from({ length: 7 }, (_, i) => (currentYear - 1 + i).toString());

    // Sync current user if it changes from sidebar
    useEffect(() => {
        setFormData(prev => ({ ...prev, requestedBy: currentUser }));
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleAutoGenerate = async () => {
        setGenerating(true);
        try {
            const next = await getNextProposedSequence(selectedYear);
            setSequence(next);
            setError(null);
        } catch (e) {
            console.error(e);
            setError("Could not generate sequence. Check connection.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!sequence.trim()) {
            setError("PR Sequence number is required.");
            setLoading(false);
            return;
        }

        const fullPRNumber = `ADMIN/${selectedYear}/${sequence.trim()}`;

        try {
            await savePRRecord({
                id: generateId(),
                prNumber: fullPRNumber,
                date: formData.date,
                requestedBy: formData.requestedBy,
                vendor: formData.vendor.trim(),
                description: formData.description.trim(),
                timestamp: Date.now()
            });

            setSuccess(true);
            
            // Reset form (keep year)
            setSequence('');
            setFormData(prev => ({
                ...prev,
                date: new Date().toISOString().split('T')[0],
                vendor: '',
                description: ''
            }));
            
            // Clear success message after 2 seconds
            setTimeout(() => {
                setSuccess(false);
                onSaveSuccess(); // Navigate back or refresh
            }, 2000);

        } catch (err: any) {
            setError(err.message || "Failed to save record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">New Purchase Requisition</h2>
                        <p className="text-slate-500 text-sm mt-1">Select year and enter the sequence number.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2 rounded">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center gap-2 rounded">
                            <CheckCircle size={20} />
                            <span>Record saved successfully! Redirecting...</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* PR Number Construction */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                PR Number <span className="text-red-500">*</span>
                            </label>
                            
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all bg-white shadow-sm">
                                    <div className="bg-slate-100 px-3 py-3 text-slate-600 font-bold text-sm border-r border-slate-200 select-none tracking-wide">
                                        ADMIN /
                                    </div>
                                    <select 
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="bg-transparent px-2 py-3 text-black font-semibold outline-none cursor-pointer hover:bg-slate-50 transition-colors border-r border-slate-200"
                                    >
                                        {yearOptions.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <div className="bg-slate-100 px-3 py-3 text-slate-600 font-bold border-r border-slate-200 select-none">
                                        /
                                    </div>
                                    <input
                                        type="text"
                                        value={sequence}
                                        onChange={(e) => setSequence(e.target.value)}
                                        className="flex-1 px-4 py-3 outline-none text-black font-medium placeholder-slate-400 bg-white"
                                        placeholder="001"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAutoGenerate}
                                    disabled={generating}
                                    className="px-4 py-3 bg-white text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors h-full shadow-sm"
                                    title="Find next available number for this year"
                                >
                                    {generating ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 pl-1 mt-1">
                                Preview: <span className="font-mono font-medium text-indigo-500">ADMIN/{selectedYear}/{sequence || '...'}</span>
                            </p>
                        </div>

                        {/* Date Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-black bg-white"
                            />
                        </div>

                        {/* Requested By */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Requested By <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="requestedBy"
                                value={formData.requestedBy}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-black"
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        {/* Vendor */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Vendor Name
                            </label>
                            <input
                                type="text"
                                name="vendor"
                                value={formData.vendor}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-black bg-white"
                                placeholder="Company Name"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Description / Remarks
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-black bg-white"
                            placeholder="Brief description of the purchase..."
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            {loading ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};