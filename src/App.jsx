import { Routes, Route } from "react-router-dom";
import Home from "./Home.jsx";
import Product from "./pages/Product.jsx";
import Cart from "./pages/Cart.jsx";
import Catalog from "./pages/Catalog.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/produto/:id" element={<Product />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/cart" element={<Cart />} />
    </Routes>
  );
}