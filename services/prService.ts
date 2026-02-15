import { PRRecord } from '../types';

// =============================================================================================
// CONFIGURATION
// =============================================================================================

// 🔴 PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL INSIDE THE QUOTES BELOW 🔴
const GOOGLE_SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbzgt7rFw97ar8r_m7BICuD7iNWR7kPxxC6NO2mJ_3-K8Y0ge2e7JLJVldvdc7jno8bO/exec'; 

// =============================================================================================

const STORAGE_KEY_DATA = 'pr_tracker_data';

// --- Helpers ---
const getScriptUrl = (): string => {
  if (GOOGLE_SCRIPT_URL) return GOOGLE_SCRIPT_URL;
  return localStorage.getItem('GOOGLE_SCRIPT_URL') || '';
};

const shouldUseApi = () => {
  const url = getScriptUrl();
  return !!url && url.startsWith('http');
};

// --- Local Storage Helpers ---
const getLocalRecords = (): PRRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DATA);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading from storage", error);
    return [];
  }
};

const saveLocalRecord = (record: PRRecord) => {
  const currentRecords = getLocalRecords();
  const updatedRecords = [record, ...currentRecords];
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updatedRecords));
};

const updateLocalRecord = (record: PRRecord) => {
  const currentRecords = getLocalRecords();
  const index = currentRecords.findIndex(r => r.id === record.id);
  if (index !== -1) {
    currentRecords[index] = record;
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(currentRecords));
  }
};

const deleteLocalRecord = (id: string) => {
  const currentRecords = getLocalRecords();
  const updatedRecords = currentRecords.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updatedRecords));
};

// --- Service Methods ---

export const getPRRecords = async (): Promise<PRRecord[]> => {
  if (!shouldUseApi()) {
    // Simulate network delay for better UX feel
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalRecords();
  }

  try {
    const url = getScriptUrl();
    const response = await fetch(`${url}?action=GET_ALL`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching from Google Sheets", error);
    // Fallback to local if API fails, but warn
    alert("Could not fetch from Google Sheets. Showing local data instead. Check your Internet or API URL.");
    return getLocalRecords();
  }
};

export const savePRRecord = async (record: PRRecord): Promise<void> => {
  // 1. Get current records to check for duplicates
  const currentRecords = await getPRRecords();
  
  const isDuplicate = currentRecords.some(
    (r) => r.prNumber.toLowerCase() === record.prNumber.toLowerCase()
  );

  if (isDuplicate) {
    throw new Error(`PR Number "${record.prNumber}" already exists.`);
  }

  // 2. Save
  if (!shouldUseApi()) {
    saveLocalRecord(record);
    return;
  }

  try {
    // using text/plain content type to avoid CORS preflight issues with Google Apps Script
    const url = getScriptUrl();
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'ADD', record }),
    });
    
    const result = await response.json();
    
    if (!response.ok || (result && result.status === 'error')) {
        throw new Error(result.message || "Failed to save to Google Sheets");
    }
  } catch (e) {
      console.error("API Save failed", e);
      throw new Error("Failed to save to Google Sheet. Check your URL configuration or Internet connection.");
  }
};

export const updatePRRecord = async (record: PRRecord): Promise<void> => {
  // 1. Check for duplicate PR Number (if changed)
  const currentRecords = await getPRRecords();
  const duplicate = currentRecords.find(r => 
    r.prNumber.toLowerCase() === record.prNumber.toLowerCase() && 
    r.id !== record.id
  );
  
  if (duplicate) {
     throw new Error(`PR Number "${record.prNumber}" is already used by another record.`);
  }

  // 2. Update
  if (!shouldUseApi()) {
    updateLocalRecord(record);
    return;
  }

  try {
    const url = getScriptUrl();
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'UPDATE', record }),
    });
    
    const result = await response.json();
    
    if (!response.ok || (result && result.status === 'error')) {
        throw new Error(result.message || "Failed to update Google Sheets");
    }
  } catch (e) {
      console.error("API Update failed", e);
      throw new Error("Failed to update remote record. Check connection.");
  }
};

export const deletePRRecord = async (id: string): Promise<void> => {
  if (!shouldUseApi()) {
    deleteLocalRecord(id);
    return;
  }

  try {
    const url = getScriptUrl();
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', id }),
    });
    
    if (!response.ok) {
        throw new Error("Failed to delete from Google Sheets");
    }
  } catch (e) {
      console.error("API Delete failed", e);
      // Fallback for better UX? Or throw?
      // For now, let's delete locally too so it doesn't reappear instantly
      deleteLocalRecord(id); 
      throw new Error("Could not delete from Sheet (Network Error). Removed locally only.");
  }
};

export const checkPRAvailability = async (prNumber: string): Promise<{ available: boolean; record?: PRRecord }> => {
  const records = await getPRRecords();
  const found = records.find((r) => r.prNumber.toLowerCase() === prNumber.trim().toLowerCase());
  
  if (found) {
    return { available: false, record: found };
  }
  return { available: true };
};

export const getNextProposedSequence = async (year: string): Promise<string> => {
  const records = await getPRRecords();
  const prefix = `ADMIN/${year}/`;
  
  const relevantRecords = records.filter(r => r.prNumber && r.prNumber.toUpperCase().startsWith(prefix));
  
  if (relevantRecords.length === 0) return "001";
  
  let maxSeq = 0;
  relevantRecords.forEach(r => {
    // Handle potential format variations gracefully
    const parts = r.prNumber.split('/');
    if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        const val = parseInt(lastPart, 10);
        if (!isNaN(val) && val > maxSeq) {
          maxSeq = val;
        }
    }
  });
  
  const nextVal = maxSeq + 1;
  return nextVal.toString().padStart(3, '0');
};

export const seedDataIfEmpty = () => {
    // Only seed if local storage is empty AND we aren't using API
    if (!localStorage.getItem(STORAGE_KEY_DATA) && !shouldUseApi()) {
        const currentYear = new Date().getFullYear();
        const seed: PRRecord[] = [
            {
            id: '1',
            prNumber: `ADMIN/${currentYear}/001`,
            date: `${currentYear}-10-25`,
            requestedBy: 'Idham', 
            vendor: 'Office Depot',
            description: 'Office supplies for Q4',
            timestamp: Date.now() - 10000000
            }
        ];
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(seed));
    }
};
