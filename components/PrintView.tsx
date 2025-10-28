import React, { useState, useMemo } from 'react';
import { Bill } from '../types';
import { SearchIcon, PrintIcon } from './Icons';
import PrintPreview from './PrintPreview';

interface PrintViewProps {
  bills: Bill[];
}

const PrintView: React.FC<PrintViewProps> = ({ bills }) => {
  const [billsToPreview, setBillsToPreview] = useState<Bill[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());

  const handleToggleSelection = (billId: string) => {
    setSelectedBillIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(billId)) {
        newSet.delete(billId);
      } else {
        newSet.add(billId);
      }
      return newSet;
    });
  };

  const handlePrintSelected = () => {
    const selected = bills
      .filter(bill => selectedBillIds.has(bill.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Ensure consistent order
    if (selected.length > 0) {
      setBillsToPreview(selected);
    }
  };

  const groupedBills = useMemo(() => {
    let filteredBills = [...bills];

    if (searchTerm.trim()) {
      filteredBills = filteredBills.filter(b => b.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    filteredBills.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const groups: { [key: string]: Bill[] } = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    };

    filteredBills.forEach(bill => {
      let groupName: string;
      if (isSameDay(bill.createdAt, today)) {
        groupName = 'Today';
      } else if (isSameDay(bill.createdAt, yesterday)) {
        groupName = 'Yesterday';
      } else {
        groupName = bill.createdAt.toLocaleDateString(undefined, {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      }

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(bill);
    });

    return groups;
  }, [bills, searchTerm]);

  const orderedGroupKeys = useMemo(() => {
      const groupOrder = ['Today', 'Yesterday'];
      const dateKeys = Object.keys(groupedBills)
        .filter(key => !groupOrder.includes(key))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      return [
        ...groupOrder.filter(key => groupedBills[key]),
        ...dateKeys
      ];
  }, [groupedBills]);


  if (billsToPreview) {
    return <PrintPreview bills={billsToPreview} onBack={() => setBillsToPreview(null)} />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Select Bills to Print</h2>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-10 pr-4 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition bg-white"
          />
        </div>

        <div className="space-y-6 pt-4">
            {orderedGroupKeys.length > 0 ? (
                orderedGroupKeys.map(groupName => (
                  <div key={groupName}>
                    <h3 className="text-lg font-semibold text-slate-600 mb-3 pb-2 border-b">{groupName}</h3>
                    <div className="space-y-3">
                      {groupedBills[groupName].map(bill => {
                        const isSelected = selectedBillIds.has(bill.id);
                        return (
                        <div
                          key={bill.id}
                          onClick={() => handleToggleSelection(bill.id)}
                          className={`bg-white p-4 rounded-lg shadow-md transition cursor-pointer flex items-center gap-4 ${isSelected ? 'ring-2 ring-sky-500' : 'hover:shadow-xl'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelection(bill.id)}
                            className="h-5 w-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <div className="flex-grow flex justify-between items-start">
                              <div>
                                  <p className="font-semibold text-lg text-sky-700">{bill.billNumber}</p>
                                  <p className="font-medium text-slate-800">{bill.customerName}</p>
                                  <p className="text-sm text-slate-500">{bill.products.length} product(s)</p>
                              </div>
                              <div className="text-right text-xs text-slate-500">
                                  <p>Created: {bill.createdAt.toLocaleDateString()}</p>
                              </div>
                          </div>
                        </div>
                      )})
                      }
                    </div>
                  </div>
                ))
            ) : (
                <p className="text-center text-slate-500 py-8">No bills found.</p>
            )}
        </div>
      </div>
      
      {selectedBillIds.size > 0 && (
        <div className="fixed bottom-6 right-6 no-print">
            <button
                onClick={handlePrintSelected}
                className="flex items-center gap-3 bg-sky-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-sky-700 transition-transform transform hover:scale-105"
            >
                <PrintIcon />
                Print Selected ({selectedBillIds.size})
            </button>
        </div>
      )}
    </div>
  );
};

export default PrintView;