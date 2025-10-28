
import React, { useState, useCallback } from 'react';
import { Bill } from './types';
import CreateBillView from './components/CreateBillView';
import SearchView from './components/SearchView';
import { PlusCircleIcon, SearchIcon } from './components/Icons';
import Toast from './components/Toast';

type Tab = 'create' | 'search';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [bills, setBills] = useState<Bill[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [billCounter, setBillCounter] = useState<number>(0);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveBill = useCallback((billToSave: Partial<Bill>) => {
    return new Promise<Bill>((resolve, reject) => {
      setTimeout(() => { // Simulate network latency
        if (!billToSave.customerName || !billToSave.products) {
          const err = new Error("Invalid bill data: missing customer name or products.");
          showToast("Customer name and products are required.", 'error');
          return reject(err);
        }

        if (billToSave.id) {
          // Update existing bill
          let updatedBill: Bill | null = null;
          setBills(prevBills => prevBills.map(b => {
            if (b.id === billToSave.id) {
              updatedBill = { ...b, ...billToSave, updatedAt: new Date() } as Bill;
              return updatedBill;
            }
            return b;
          }));
          
          if (updatedBill) {
            showToast('Changes updated');
            resolve(updatedBill);
          } else {
            reject(new Error("Bill to update not found."));
          }
        } else {
          // Create new bill
          const nextBillNum = billCounter + 1;
          const formattedBillNumber = `BILL-${String(nextBillNum).padStart(4, '0')}`;
          
          const newBill: Bill = {
            ...billToSave,
            id: Date.now().toString(),
            billNumber: formattedBillNumber,
            customerName: billToSave.customerName,
            products: billToSave.products,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setBills(prevBills => [...prevBills, newBill]);
          setBillCounter(nextBillNum);
          showToast('Bill saved');
          resolve(newBill);
        }
      }, 500);
    });
  }, [billCounter]);

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-sky-600 py-4">Bill Manager</h1>
          <div className="flex border-b">
            <TabButton
              label="Create Bill"
              icon={<PlusCircleIcon />}
              isActive={activeTab === 'create'}
              onClick={() => setActiveTab('create')}
            />
            <TabButton
              label="Search Bills"
              icon={<SearchIcon />}
              isActive={activeTab === 'search'}
              onClick={() => setActiveTab('search')}
            />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        {activeTab === 'create' && <CreateBillView onSaveBill={handleSaveBill} />}
        {activeTab === 'search' && <SearchView bills={bills} onSaveBill={handleSaveBill} />}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
};

interface TabButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none ${
      isActive
        ? 'border-b-2 border-sky-500 text-sky-600'
        : 'border-b-2 border-transparent text-slate-500 hover:text-sky-600'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;