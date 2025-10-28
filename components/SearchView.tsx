import React, { useState, useMemo } from 'react';
import { Bill } from '../types';
import BillDetailView from './BillDetailView';
import { SearchIcon } from './Icons';
import BillSummaryModal from './BillSummaryModal';

interface SearchViewProps {
  bills: Bill[];
  onSaveBill: (bill: Partial<Bill>) => Promise<Bill>;
}

type ViewState = 
  | { type: 'SEARCH_LIST' }
  | { type: 'CUSTOMER_BILLS', customerName: string }
  | { type: 'BILL_DETAIL', billId: string };

const SearchView: React.FC<SearchViewProps> = ({ bills, onSaveBill }) => {
  const [viewState, setViewState] = useState<ViewState>({ type: 'SEARCH_LIST' });
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryBill, setSummaryBill] = useState<Bill | null>(null);


  // State for filtering and sorting
  const [sortOption, setSortOption] = useState('createdAt_desc');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const customerBills = useMemo(() => {
    const customerMap = new Map<string, Bill[]>();
    bills.forEach(bill => {
      const existing = customerMap.get(bill.customerName) || [];
      customerMap.set(bill.customerName, [...existing, bill]);
    });
    return customerMap;
  }, [bills]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) {
      return Array.from(customerBills.keys());
    }
    return Array.from(customerBills.keys()).filter(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, customerBills]);
  
  const processedBillsForCustomer = useMemo(() => {
    if (viewState.type !== 'CUSTOMER_BILLS') return [];

    let billsToProcess = [...(customerBills.get(viewState.customerName) || [])];

    // 1. Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      let start: Date | null = null;
      let end: Date | null = null;

      if (dateFilter === 'last_month') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        end = now;
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        start = new Date(customStartDate);
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day
      }

      if (start && end) {
        const startTime = start.getTime();
        const endTime = end.getTime();
        billsToProcess = billsToProcess.filter(b => {
          const billTime = b.createdAt.getTime();
          return billTime >= startTime && billTime <= endTime;
        });
      }
    }

    // 2. Sort
    return billsToProcess.sort((a, b) => {
      switch (sortOption) {
        case 'createdAt_asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'updatedAt_desc':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'createdAt_desc':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  }, [viewState, customerBills, dateFilter, customStartDate, customEndDate, sortOption]);


  const renderContent = () => {
    switch (viewState.type) {
      case 'SEARCH_LIST':
        return (
          <div className="space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map(name => (
                <div
                  key={name}
                  onClick={() => setViewState({ type: 'CUSTOMER_BILLS', customerName: name })}
                  className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl hover:ring-2 hover:ring-sky-500 transition cursor-pointer"
                >
                  <p className="font-semibold text-lg text-slate-800">{name}</p>
                  <p className="text-sm text-slate-500">{customerBills.get(name)?.length} bill(s)</p>
                </div>
              ))}
               {filteredCustomers.length === 0 && <p className="text-slate-500 col-span-full text-center py-8">No customers found.</p>}
            </div>
          </div>
        );

      case 'CUSTOMER_BILLS':
        return (
          <div>
            <button onClick={() => setViewState({ type: 'SEARCH_LIST' })} className="text-sky-600 hover:underline mb-4">&larr; Back to search</button>
            <h2 className="text-2xl font-bold mb-4">Bills for {viewState.customerName}</h2>

            <div className="bg-slate-50 p-4 rounded-lg mb-4 flex flex-wrap items-center gap-4 text-sm">
                <div>
                    <label htmlFor="sort" className="font-medium text-slate-600 mr-2">Sort by:</label>
                    <select id="sort" value={sortOption} onChange={e => setSortOption(e.target.value)} className="p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white">
                        <option value="createdAt_desc">Newest First</option>
                        <option value="createdAt_asc">Oldest First</option>
                        <option value="updatedAt_desc">Last Updated</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="dateFilter" className="font-medium text-slate-600 mr-2">Date:</label>
                    <select id="dateFilter" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white">
                        <option value="all">All Time</option>
                        <option value="last_month">Last Month</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
                {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2">
                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                        <span className="text-slate-500">to</span>
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                )}
            </div>

            <div className="space-y-4">
              {processedBillsForCustomer.map(bill => (
                <div
                  key={bill.id}
                  onClick={() => setSummaryBill(bill)}
                  className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl hover:ring-2 hover:ring-sky-500 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="font-semibold text-lg text-sky-700">{bill.billNumber}</p>
                          <p className="text-sm text-slate-500">{bill.products.length} product(s)</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                          <p>Created: {bill.createdAt.toLocaleDateString()}</p>
                          <p className="mt-1">Modified: {bill.updatedAt.toLocaleString()}</p>
                      </div>
                  </div>
                </div>
              ))}
              {processedBillsForCustomer.length === 0 && <p className="text-center text-slate-500 py-8">No bills match the current filters.</p>}
            </div>
          </div>
        );

      case 'BILL_DETAIL':
        const billToEdit = bills.find(b => b.id === viewState.billId);
        if (!billToEdit) {
            setViewState({ type: 'SEARCH_LIST' });
            return <p>Bill not found.</p>;
        }
        return (
          <BillDetailView
            bill={billToEdit}
            onSave={onSaveBill}
            onBack={() => setViewState({ type: 'CUSTOMER_BILLS', customerName: billToEdit.customerName })}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderContent()}
      {summaryBill && (
          <BillSummaryModal
              bill={summaryBill}
              onClose={() => setSummaryBill(null)}
              onEdit={() => {
                  setViewState({ type: 'BILL_DETAIL', billId: summaryBill.id });
                  setSummaryBill(null);
              }}
          />
      )}
    </div>
  );
};

export default SearchView;