export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'platos' | 'bebidas' | 'postres';
  image: string;
  available: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Screen = 'home' | 'menu' | 'checkout' | 'payment' | 'success';
