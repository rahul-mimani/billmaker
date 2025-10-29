import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Bill } from '../types';
import { addCustomer } from './customerStorage';
import { addProduct } from './productStorage';

const FILE_NAME = 'bills.json';

/** 🧱 Initialize bills file if it doesn't exist */
export const initStorage = async () => {
  try {
    await Filesystem.readFile({
      path: FILE_NAME,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
  } catch {
    await Filesystem.writeFile({
      path: FILE_NAME,
      data: '[]',
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
  }
};

/** 📖 Read all bills */
export const getBills = async (): Promise<Bill[]> => {
  try {
    const result = await Filesystem.readFile({
      path: FILE_NAME,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    const dataStr =
      typeof result.data === 'string'
        ? result.data
        : await result.data.text();

    const bills = JSON.parse(dataStr);

    // 🔄 Convert string dates back to Date objects
    return bills.map((b: any) => ({
      ...b,
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading bills:', error);
    return [];
  }
};


/** 💾 Save all bills */
export const saveBills = async (bills: Bill[]) => {
  const jsonData = JSON.stringify(bills, null, 2);
  await Filesystem.writeFile({
    path: FILE_NAME,
    data: jsonData,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
};

/** ➕ Add a new bill */
export const addBill = async (newBill: Bill): Promise<void> => {
  const bills = await getBills();
  bills.push(newBill);
  await saveBills(bills);
  await addCustomer(newBill.customerName);
  for (const product of newBill.products) {
    await addProduct(product.name);
  }
};

/** ✏️ Update a bill by ID */
export const updateBill = async (updatedBill: Bill): Promise<any> => {
  const bills = await getBills();
  const index = bills.findIndex(b => b.id === updatedBill.id);
  if (index !== -1) {
    bills[index] = updatedBill;
    await saveBills(bills);
    await addCustomer(updatedBill.customerName);
    for (const product of updatedBill.products) {
      await addProduct(product.name);
    }
  } else {
    console.warn('Bill not found for update:', updatedBill.id);
  }
};

/** 🗑️ Delete a bill by ID (optional helper) */
export const deleteBill = async (billId: string): Promise<void> => {
  const bills = await getBills();
  const filtered = bills.filter(b => b.id !== billId);
  await saveBills(filtered);
};
