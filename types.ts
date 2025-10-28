
export interface Product {
  id: string;
  prefix: 'Box' | 'Pieces';
  quantity: string; // Stored as string for input control, converted to number for saving
  name: string;
  price: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  products: Product[];
  createdAt: Date;
  updatedAt: Date;
}