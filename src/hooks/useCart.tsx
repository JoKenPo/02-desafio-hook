import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart'); //Buscar dados do localStorage
    console.log('storagedCart: ', storagedCart);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      await api('/stock/' + productId)
        .then(async response => {
          const stock = response.data as Stock;

          const cartHasProduct = cart.filter(product => product.id === productId)
          if (cartHasProduct.length > 0) {
            if (cartHasProduct[0].amount === stock.amount) {
              return toast.error('Quantidade solicitada fora de estoque');
            }
            updateProductAmount({ productId, amount: 1 })
          } else {
            await api('/products/' + productId)
              .then(async response => {
                setCart([
                  ...cart,
                  {
                    ...response.data as Product,
                    amount: 1
                  }
                ])
              })
          }
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
          console.log('cart: ', cart);
        })
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
