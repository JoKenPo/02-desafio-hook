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
  addProduct: (productId: number) => void;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart'); //Buscar dados do localStorage
    //console.log('storagedCart: ', storagedCart);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      await api(`stock/${productId}`)
        .then(async response => {
          const stock = response.data as Stock;
          if (!stock) throw new Error()
          let newCart = cart;

          const cartHasProduct = cart.filter(product => product.id === productId)
          if (cartHasProduct.length > 0) {
            if (cartHasProduct[0].amount + 1 > stock.amount) {
              toast.error('Quantidade solicitada fora de estoque');
              return
            }
            updateProductAmount({ productId, amount: cartHasProduct[0].amount + 1 })
          } else {
            await api('/products/' + productId)
              .then(response => {
                newCart = ([
                  ...cart,
                  {
                    ...response.data as Product,
                    amount: 1
                  }
                ])
              })
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          }
        })
    } catch (error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      let newCart = cart;
      const cartHasProduct = cart.find(product => product.id === productId)
      if (!cartHasProduct) throw Error()

      newCart = (cart.filter(product => product.id !== productId));

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return
      await api(`stock/${productId}`)
        .then(async response => {
          const stock = response.data as Stock;
          if (!stock) throw new Error()
          if (amount > stock.amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
          }
          let newCart = cart;

          const cartHasProduct = cart.find(product => product.id === productId)
          if (cartHasProduct) {
            newCart = (cart.map(product => {
              if (product.id === productId) product.amount = amount
              return product
            }))
          } else {
            await api('/products/' + productId)
              .then(async response => {
                newCart.push(
                  {
                    ...response.data as Product,
                    amount
                  })
              })
          }
          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          // console.log('cart: ', cart);
        })
    } catch (error) {
      toast.error('Erro na alteração de quantidade do produto');
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
