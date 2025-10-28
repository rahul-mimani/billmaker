import React, { useState, useCallback } from 'react';
import { Bill, Product } from '../types';
import { PlusIcon, TrashIcon, EyeIcon } from './Icons';
import BillSummaryModal from './BillSummaryModal';

interface CreateBillViewProps {
  onSaveBill: (bill: Partial<Bill>) => Promise<Bill>;
}

const CreateBillView: React.FC<CreateBillViewProps> = ({ onSaveBill }) => {
  const [currentBill, setCurrentBill] = useState<Partial<Bill> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const startNewBill = () => {
    setCurrentBill({ customerName: '', products: [] });
    setIsCreating(true);
  };
  
  const validateBill = (bill: Partial<Bill> | null): boolean => {
      if (!bill || !bill.customerName?.trim()) return false;
      if (!bill.products || bill.products.length === 0) return false;
      return bill.products.every(p => 
          p.name.trim() && 
          parseFloat(p.quantity) > 0 &&
          !isNaN(parseFloat(p.price)) &&
          parseFloat(p.price) >= 0
      );
  }

  const handleSave = useCallback(async () => {
    if (currentBill && validateBill(currentBill)) {
      setIsSaving(true);
      try {
        const savedBill = await onSaveBill(currentBill);
        // Reset form for next entry after successful save
        startNewBill();
      } catch (error) {
        console.error("Failed to save bill:", error);
      } finally {
        setIsSaving(false);
      }
    }
  }, [onSaveBill, currentBill]);

  const updateCustomerName = (name: string) => {
    setCurrentBill(prev => prev ? { ...prev, customerName: name } : null);
  };
  
  const updateProduct = (index: number, field: keyof Product, value: string) => {
      setCurrentBill(prev => {
          if (!prev || !prev.products) return prev;
          const newProducts = [...prev.products];
          if (field === 'quantity' || field === 'price') {
              if (/^\d*\.?\d*$/.test(value)) {
                 newProducts[index] = { ...newProducts[index], [field]: value };
              }
          } else {
             newProducts[index] = { ...newProducts[index], [field]: value };
          }
          return { ...prev, products: newProducts };
      });
  };

  const addProduct = () => {
    setCurrentBill(prev => {
      if (!prev) return prev;
      const newProduct: Product = { id: Date.now().toString(), name: '', prefix: 'Box', quantity: '1', price: '0' };
      return { ...prev, products: [...(prev.products || []), newProduct] };
    });
  };

  const removeProduct = (index: number) => {
    setCurrentBill(prev => {
      if (!prev || !prev.products) return prev;
      return { ...prev, products: prev.products.filter((_, i) => i !== index) };
    });
  };

  if (!isCreating) {
    return (
      <div className="flex items-center justify-center h-96">
        <button
          onClick={startNewBill}
          className="bg-sky-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105 flex items-center gap-2"
        >
          <PlusIcon />
          Create New Bill
        </button>
      </div>
    );
  }
  
  const isSaveDisabled = !validateBill(currentBill) || isSaving;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-700">New Bill</h2>
      </div>

      <div>
        <label htmlFor="customerName" className="block text-sm font-medium text-slate-600 mb-1">
          Customer Name
        </label>
        <input
          type="text"
          id="customerName"
          value={currentBill?.customerName || ''}
          onChange={(e) => updateCustomerName(e.target.value)}
          placeholder="Enter customer's name"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition bg-white text-slate-900"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">Products</h3>
        {currentBill?.products?.map((product, index) => (
          <div key={product.id} className="p-4 bg-slate-50 rounded-md border relative space-y-3">
             <div className="absolute top-2 right-2">
                <button
                    onClick={() => removeProduct(index)}
                    className="text-slate-400 hover:text-red-500 transition"
                    aria-label="Remove Product"
                >
                    <TrashIcon />
                </button>
            </div>
            <div>
                <label htmlFor={`name-${product.id}`} className="block text-sm font-medium text-slate-600 mb-1">Product Name</label>
                <input
                    id={`name-${product.id}`}
                    type="text"
                    value={product.name}
                    onChange={(e) => updateProduct(index, 'name', e.target.value)}
                    placeholder="Product Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition bg-white text-slate-900"
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`quantity-${product.id}`} className="block text-sm font-medium text-slate-600 mb-1">Quantity</label>
                    <input
                        id={`quantity-${product.id}`}
                        type="text"
                        inputMode="decimal"
                        value={product.quantity}
                        onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition bg-white text-slate-900"
                    />
                </div>
                <div>
                    <label htmlFor={`prefix-${product.id}`} className="block text-sm font-medium text-slate-600 mb-1">Unit</label>
                    <select
                        id={`prefix-${product.id}`}
                        value={product.prefix}
                        onChange={(e) => updateProduct(index, 'prefix', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition bg-white text-slate-900"
                    >
                        <option>Box</option>
                        <option>Pieces</option>
                    </select>
                </div>
             </div>
             <div>
                 <label htmlFor={`price-${product.id}`} className="block text-sm font-medium text-slate-600 mb-1">Price</label>
                 <div className="relative">
                    <input
                        id={`price-${product.id}`}
                        type="text"
                        inputMode="decimal"
                        value={product.price}
                        onChange={(e) => updateProduct(index, 'price', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition bg-white text-slate-900 text-right"
                    />
                     <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                        INR
                    </span>
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t">
        <button
          onClick={addProduct}
          className="flex items-center gap-2 bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-md hover:bg-slate-300 transition"
        >
          <PlusIcon />
          Add Product
        </button>
        <div className="flex gap-4">
            <button
              onClick={() => setShowSummary(true)}
              disabled={!validateBill(currentBill)}
              className="flex items-center gap-2 bg-white text-sky-600 border border-sky-500 font-semibold py-2 px-4 rounded-md hover:bg-sky-50 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed"
            >
              <EyeIcon />
              View Summary
            </button>
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-sky-600 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Bill'}
            </button>
        </div>
      </div>
      
      {showSummary && currentBill && (
          <BillSummaryModal bill={currentBill as Bill} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
};

export default CreateBillView;