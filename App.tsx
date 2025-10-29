import React, { useState, useCallback, useEffect } from 'react';
import { Bill } from './types';
import CreateBillView from './components/CreateBillView';
import SearchView from './components/SearchView';
import PrintView from './components/PrintView';
import { PlusCircleIcon, SearchIcon, PrintIcon } from './components/Icons';
import Toast from './components/Toast';
import { initStorage, getBills, addBill, updateBill } from './storage/storage';
import { initCustomerStorage } from './storage/customerStorage';
import { initProductStorage } from './storage/productStorage';

type Tab = 'create' | 'search' | 'print';

export const useBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getBills(); 
      setBills(data);
    };
    load();
  }, []);

  const handleAdd = async (bill: Bill) => {
    await addBill(bill);
    const updated = await getBills();
    setBills(updated);
  };

  const handleUpdate = async (bill: Bill) => {
    await updateBill(bill);
    const updated = await getBills();
    setBills(updated);
  };

  return { bills, handleAdd, handleUpdate };
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const { bills, handleAdd, handleUpdate } = useBills();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [billCounter, setBillCounter] = useState<number>(0);

  useEffect(() => {
    const initAll = async () => {
      await initStorage();          // Bill storage
      await initCustomerStorage();  // Customer names
      await initProductStorage();   // Product names
    };
    initAll();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveBill = useCallback(
    (billToSave: Partial<Bill>) => {
      return new Promise<Bill>(async (resolve, reject) => {
        try {
          if (!billToSave.customerName || !billToSave.products) {
            showToast("Customer name and products are required.", "error");
            return reject(new Error("Invalid bill data: missing customer name or products."));
          }

          if (billToSave.id) {
            // Update existing bill
            const updatedBill: Bill = { ...billToSave, updatedAt: new Date() } as Bill;
            await handleUpdate(updatedBill);
            showToast("Changes updated");
            resolve(updatedBill);
          } else {
            // Create new bill
            const nextBillNum = billCounter + 1;
            const formattedBillNumber = `BILL-${String(nextBillNum).padStart(4, "0")}`;

            const newBill: Bill = {
              ...billToSave,
              id: Date.now().toString(),
              billNumber: formattedBillNumber,
              customerName: billToSave.customerName!,
              products: billToSave.products!,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await handleAdd(newBill);
            setBillCounter(nextBillNum);
            showToast("Bill saved");
            resolve(newBill);
          }
        } catch (err) {
          showToast("Error saving bill", "error");
          reject(err);
        }
      });
    },
    [billCounter]
  );


  return (
    <div className="min-h-screen font-sans">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 pt-2">
          <h1 className="text-2xl font-bold text-sky-600 py-4">Bill Manager</h1>
          <div className="flex border-b">
            <TabButton
              label="Create"
              icon={<PlusCircleIcon />}
              isActive={activeTab === 'create'}
              onClick={() => setActiveTab('create')}
            />
            <TabButton
              label="Search"
              icon={<SearchIcon />}
              isActive={activeTab === 'search'}
              onClick={() => setActiveTab('search')}
            />
            <TabButton
              label="Print"
              icon={<PrintIcon />}
              isActive={activeTab === 'print'}
              onClick={() => setActiveTab('print')}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {activeTab === 'create' && <CreateBillView onSaveBill={handleSaveBill} />}
        {activeTab === 'search' && <SearchView bills={bills} onSaveBill={handleSaveBill} />}
        {activeTab === 'print' && <PrintView bills={bills} />}
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
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none ${isActive
        ? 'border-b-2 border-sky-500 text-sky-600'
        : 'border-b-2 border-transparent text-slate-500 hover:text-sky-600'
      }`}
  >
    {icon}
    {label}
  </button>
);

export default App;