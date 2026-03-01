import {
  createContext, useCallback, useContext,
  useEffect, useMemo, useReducer, useState,
} from "react";
import { api } from "./services/api.js";

const StoreContext = createContext(null);
const CART_KEY = "fakestore_cart_v1";

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) ?? []; }
  catch { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
}
function normSize(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" || s === "null" ? null : s;
}

const initialState = { cart: loadCart() };

function reducer(state, action) {
  switch (action.type) {
    case "SET_CART": return { ...state, cart: action.payload };

    case "ADD": {
      const { size } = action.payload;
      const s = normSize(size);
      const found = state.cart.find((x) => x.id === action.payload.id && normSize(x.size) === s);
      const cart = found
        ? state.cart.map((x) =>
            x.id === action.payload.id && normSize(x.size) === s
              ? { ...x, qty: (x.qty ?? 0) + 1 } : x)
        : [...state.cart, { ...action.payload, qty: 1, size: s }];
      return { ...state, cart };
    }

    case "REMOVE": {
      const { id, size } = action.payload;
      return { ...state, cart: state.cart.filter(
        (x) => !(x.id === id && normSize(x.size) === normSize(size))) };
    }

    case "QTY": {
      const { id, size, qty } = action.payload;
      return { ...state, cart: state.cart.map((x) =>
        x.id === id && normSize(x.size) === normSize(size)
          ? { ...x, qty: Math.max(1, qty) } : x) };
    }

    case "SIZE": {
      const { id, fromSize, toSize } = action.payload;
      const from = normSize(fromSize), to = normSize(toSize);
      if (from === to) return state;
      const idx = state.cart.findIndex((x) => x.id === id && normSize(x.size) === from);
      if (idx < 0) return state;
      const cur = state.cart[idx];
      const mergeIdx = state.cart.findIndex((x, i) => i !== idx && x.id === id && normSize(x.size) === to);
      if (mergeIdx >= 0) {
        const next = [...state.cart];
        next[mergeIdx] = { ...next[mergeIdx], qty: (next[mergeIdx].qty ?? 0) + (cur.qty ?? 0), size: to };
        next.splice(idx, 1);
        return { ...state, cart: next };
      }
      const next = [...state.cart];
      next[idx] = { ...cur, size: to };
      return { ...state, cart: next };
    }

    case "CLEAR": return { ...state, cart: [] };
    default:      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch]   = useReducer(reducer, initialState);
  const [authUser, setAuthUser] = useState(() => api.getAuthUser());
  const isLoggedIn = Boolean(authUser);

  useEffect(() => { saveCart(state.cart); }, [state.cart]);

  useEffect(() => {
    if (!isLoggedIn) return;
    api.getCart()
      .then((items) => { if (items.length > 0) dispatch({ type: "SET_CART", payload: items }); })
      .catch(() => {});
  }, [isLoggedIn]);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setAuthUser(data.user);
    const serverCart = await api.getCart().catch(() => []);
    if (serverCart.length > 0) dispatch({ type: "SET_CART", payload: serverCart });
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.register(name, email, password);
    setAuthUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setAuthUser(null);
    dispatch({ type: "CLEAR" });
  }, []);

  const setAuthUserFromGoogle = useCallback((user) => {
    setAuthUser(user);
    api.getCart()
      .then((items) => { if (items.length > 0) dispatch({ type: "SET_CART", payload: items }); })
      .catch(() => {});
  }, []);

  const addToCart = useCallback((p) => {
    const size = normSize(p.size);
    dispatch({ type: "ADD", payload: {
      id: p.id ?? p._id, _id: p._id ?? p.id,
      title: p.title, price: p.price,
      image: p.image ?? p.imageUrl,
      sizes: p.sizes ?? [], size,
    }});
    if (isLoggedIn) api.addToCart(p.id ?? p._id, 1, size).catch(console.error);
  }, [isLoggedIn]);

  const removeFromCart = useCallback((id, size) => {
    const s = normSize(size);
    dispatch({ type: "REMOVE", payload: { id, size: s } });
    if (isLoggedIn) api.removeFromCart(id, s).catch(console.error);
  }, [isLoggedIn]);

  const setQty = useCallback((id, size, qty) => {
    const s = normSize(size);
    const q = Math.max(1, Number(qty) || 1);
    dispatch({ type: "QTY", payload: { id, size: s, qty: q } });
    if (isLoggedIn) api.updateCartItem(id, q, s).catch(console.error);
  }, [isLoggedIn]);

  const setSize = useCallback((id, fromSize, toSize) => {
    const from = normSize(fromSize), to = normSize(toSize);
    if (from === to) return;
    const item = state.cart.find((x) => x.id === id && normSize(x.size) === from);
    dispatch({ type: "SIZE", payload: { id, fromSize: from, toSize: to } });
    if (isLoggedIn && item) {
      api.removeFromCart(id, from)
        .then(() => api.addToCart(id, item.qty ?? 1, to))
        .catch(console.error);
    }
  }, [isLoggedIn, state.cart]);

  const clearCart = useCallback(async () => {
    dispatch({ type: "CLEAR" });
    if (isLoggedIn) await api.clearCart().catch(console.error);
  }, [isLoggedIn]);

  const cartCount = state.cart.reduce((acc, x) => acc + (x.qty ?? 0), 0);
  const cartTotal = state.cart.reduce((acc, x) => acc + (x.price ?? 0) * (x.qty ?? 0), 0);

  const value = useMemo(() => ({
    state, authUser, isLoggedIn,
    login, register, logout, setAuthUserFromGoogle,
    addToCart, removeFromCart, setQty, setSize, clearCart,
    cartCount, cartTotal,
  }), [state, authUser, isLoggedIn,
      login, register, logout, setAuthUserFromGoogle,
      addToCart, removeFromCart, setQty, setSize, clearCart,
      cartCount, cartTotal]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}