import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem('@GoMarketplace:products');

      if (response) {
        setProducts([...JSON.parse(response)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const findItemInCart = products.find(item => item.id === product.id);

      if (findItemInCart) {
        const newProducts = products.map(item => {
          if (item.id === product.id) {
            return {
              ...item,
              quantity: item.quantity + 1,
            };
          }
          return item;
        });
        setProducts(newProducts);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const incrementProduct = products.map(item => {
        if (item.id === id) {
          return { ...item, quantity: item.quantity + 1 };
        }

        return item;
      });

      setProducts(incrementProduct);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(incrementProduct),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const decrementProduct = products.map(item => {
        if (item.id === id) {
          return { ...item, quantity: item.quantity - 1 };
        }

        return item;
      });

      const filterProducts = decrementProduct.filter(
        item => !(item.quantity < 1),
      );

      setProducts(filterProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(filterProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
