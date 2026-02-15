import { PRRecord } from '../types';

// REPLACED: Default to LocalStorage for the demo to ensure it works immediately on GitHub Pages.
// To use Google Sheets, replace the URL below with your deployed Web App URL and set forceApi = true.
const API_URL = 'https://script.google.com/macros/s/AKfycbzaQdneTddZnX5VqIOFeinvs3aMHdP-aV48Th3iffDKmY7DQgUu-SFdpHugdFPd2wM6/exec'; 

// Change this to true ONLY after you have pasted your valid Google Script URL above.
const forceApi = false; 

const STORAGE_KEY = 'pr_tracker_data';
const USE_API = forceApi && API_URL.includes('script.google.com');

// --- Local Storage Helpers ---
const getLocalRecords = (): PRRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading from storage", error);
    return [];
  }
};

const saveLocalRecord = (record: PRRecord) => {
  const currentRecords = getLocalRecords();
  const updatedRecords = [record, ...currentRecords];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
};

const deleteLocalRecord = (id: string) => {
  const currentRecords = getLocalRecords();
  const updatedRecords = currentRecords.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
};

// --- Service Methods ---

export const getPRRecords = async (): Promise<PRRecord[]> => {
  if (!USE_API) {
    // Simulate network delay for better UX feel
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalRecords();
  }

  try {
    const response = await fetch(`${API_URL}?action=GET_ALL`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching from Google Sheets", error);
    // Fallback to local if API fails
    return getLocalRecords();
  }
};

export const savePRRecord = async (record: PRRecord): Promise<void> => {
  // 1. Get current records to check for duplicates (Source of Truth)
  const currentRecords = await getPRRecords();
  
  const isDuplicate = currentRecords.some(
    (r) => r.prNumber.toLowerCase() === record.prNumber.toLowerCase()
  );

  if (isDuplicate) {
    throw new Error(`PR Number "${record.prNumber}" already exists.`);
  }

  // 2. Save
  if (!USE_API) {
    saveLocalRecord(record);
    return;
  }

  try {
    // using text/plain content type to avoid CORS preflight issues with Google Apps Script
    const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'ADD', record }),
    });
    
    if (!response.ok) {
        throw new Error("Failed to save to Google Sheets");
    }
  } catch (e) {
      console.error("API Save failed, falling back to local", e);
      saveLocalRecord(record);
  }
};

export const deletePRRecord = async (id: string): Promise<void> => {
  if (!USE_API) {
    deleteLocalRecord(id);
    return;
  }

  try {
    const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', id }),
    });
    
    if (!response.ok) {
        throw new Error("Failed to delete from Google Sheets");
    }
  } catch (e) {
      console.error("API Delete failed, falling back to local", e);
      deleteLocalRecord(id);
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

export const getNextProposedPRNumber = async (): Promise<string> => {
   const year = new Date().getFullYear().toString();
   const seq = await getNextProposedSequence(year);
   return `ADMIN/${year}/${seq}`;
};

export const seedDataIfEmpty = () => {
    // Always check local storage for seed, even if using API, to have something in fallback
    if (!localStorage.getItem(STORAGE_KEY)) {
        const currentYear = new Date().getFullYear();
        const seed: PRRecord[] = [
            {
            id: '1',
            prNumber: `ADMIN/${currentYear}/001`,
            date: `${currentYear}-10-25`,
            requestedBy: 'Idham', // Matching UserRole enum value
            vendor: 'Office Depot',
            description: 'Office supplies for Q4',
            timestamp: Date.now() - 10000000
            },
            {
            id: '2',
            prNumber: `ADMIN/${currentYear}/002`,
            date: `${currentYear}-10-26`,
            requestedBy: 'Halim', // Matching UserRole enum value
            vendor: 'Tech Solutions Inc',
            description: 'New monitor for design team',
            timestamp: Date.now() - 5000000
            }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    }
};
