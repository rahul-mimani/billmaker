import React from 'react';
import { Bill, Product } from '../types';
import { PrintIcon } from './Icons';
import { generateBillsPDF } from "../utils/generateBillsPDF";

interface PrintPreviewProps {
    bills: Bill[];
    onBack: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ bills, onBack }) => {
    
    const calculateTotal = (products: Product[] | undefined) => {
        if (!products) return 0;
        return products.reduce((acc, product) => {
            const quantity = parseFloat(product.quantity) || 0;
            const price = parseFloat(product.price) || 0;
            return acc + (quantity * price);
        }, 0);
    };

    const handlePrintAll = async () => {
        console.log("bills are here" + bills);
        await generateBillsPDF(bills);
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 no-print">
                 <button onClick={onBack} className="text-sky-600 hover:underline">&larr; Back to selection</button>
                 <button
                    onClick={handlePrintAll}
                    className="flex items-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-700 transition"
                >
                    <PrintIcon />
                    Print All ({bills.length})
                </button>
            </div>
            
            <div className="space-y-8">
            {bills.map((bill: { products: any[]; id: any; customerName: any; billNumber: any; createdAt: { toLocaleDateString: () => any; }; }) => {
                const grandTotal = calculateTotal(bill.products);
                return (
                    <div key={bill.id} className="printable-bill bg-white p-8 border rounded-lg shadow-lg mx-auto">
                        <div className="border-b pb-4 mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Bill / Invoice</h2>
                            <p className="text-slate-500">Thank you for your business!</p>
                        </div>
                        <div className="flex justify-between mb-6">
                            <div>
                                <p className="font-semibold text-slate-600">Bill To:</p>
                                <p className="text-lg font-medium text-slate-800">{bill.customerName}</p>
                            </div>
                            <div className="text-right">
                                <p><strong>Bill No:</strong> {bill.billNumber}</p>
                                <p><strong>Date:</strong> {bill.createdAt.toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border p-2 text-left font-semibold text-slate-600">Product</th>
                                    <th className="border p-2 text-right font-semibold text-slate-600">Qty</th>
                                    <th className="border p-2 text-right font-semibold text-slate-600">Rate</th>
                                    <th className="border p-2 text-right font-semibold text-slate-600">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bill.products.map(p => {
                                    const quantity = parseFloat(p.quantity) || 0;
                                    const price = parseFloat(p.price) || 0;
                                    const total = quantity * price;
                                    return (
                                        <tr key={p.id}>
                                            <td className="border p-2">{p.name}</td>
                                            <td className="border p-2 text-right">{`${p.quantity} ${p.prefix}`}</td>
                                            <td className="border p-2 text-right">₹{price.toFixed(2)}</td>
                                            <td className="border p-2 text-right">₹{total.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="text-right text-lg font-bold mt-6">
                            <span className="text-slate-700">Grand Total: </span>
                            <span className="text-sky-600">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                );
            })}
            </div>
        </div>
    );
};

export default PrintPreview;