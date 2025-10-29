// src/storage/productStorage.ts
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const FILE_NAME = 'products.json';

/** Initialize products file */
export const initProductStorage = async () => {
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

/** Get all saved product names */
export const getProducts = async (): Promise<string[]> => {
  try {
    const result = await Filesystem.readFile({
      path: FILE_NAME,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    const dataStr =
      typeof result.data === 'string' ? result.data : await result.data.text();
    return JSON.parse(dataStr) as string[];
  } catch (error) {
    console.error('Error reading products:', error);
    return [];
  }
};

/** Save entire list */
export const saveProducts = async (products: string[]) => {
  const jsonData = JSON.stringify(products, null, 2);
  await Filesystem.writeFile({
    path: FILE_NAME,
    data: jsonData,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
};

/** Add a single new product (avoids duplicates) */
export const addProduct = async (name?: string) => {
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;

  const products = await getProducts();
  const exists = products.some(p => p.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    products.push(trimmed);
    await saveProducts(products);
  }
};

/** Optional: clear file manually */
export const clearProductsFile = async () => {
  try {
    await Filesystem.deleteFile({
      path: FILE_NAME,
      directory: Directory.Documents,
    });
  } catch (e) {
    // ignore if not exists
  }
};
