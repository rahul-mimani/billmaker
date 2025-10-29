// src/storage/customerStorage.ts
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const FILE_NAME = 'customers.json';

export const initCustomerStorage = async () => {
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

export const getCustomers = async (): Promise<string[]> => {
  try {
    const result = await Filesystem.readFile({
      path: FILE_NAME,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    const dataStr = typeof result.data === 'string' ? result.data : await result.data.text();
    return JSON.parse(dataStr) as string[];
  } catch (error) {
    console.error('Error reading customers:', error);
    return [];
  }
};

export const saveCustomers = async (customers: string[]) => {
  const jsonData = JSON.stringify(customers, null, 2);
  await Filesystem.writeFile({
    path: FILE_NAME,
    data: jsonData,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
};

export const addCustomer = async (name?: string) => {
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  const customers = await getCustomers();
  // avoid duplicates (case-insensitive)
  const exists = customers.some(c => c.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    customers.push(trimmed);
    await saveCustomers(customers);
  }
};

export const clearCustomersFile = async () => {
  try {
    await Filesystem.deleteFile({ path: FILE_NAME, directory: Directory.Documents });
  } catch (e) {
    // ignore if doesn't exist
  }
};
