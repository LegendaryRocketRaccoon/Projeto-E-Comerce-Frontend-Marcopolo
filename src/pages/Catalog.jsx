import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api.js";
import { useStore } from "../store.jsx";
import { useAuthModal } from "../hooks/useAuthModal.js";
import AuthModal from "../components/AuthModal.jsx";
import "../styles/catalog.scss";
import "../styles/auth.scss";

import drawerIcon  from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon    from "../assets/lineicons_cart-1.svg";
import searchIcon  from "../assets/icon.svg";
import vectorArrow from "../assets/Vector.svg";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const { isLoggedIn, logout, authUser } = useStore();
  const auth = useAuthModal();

  const [q, setQ]                   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef              = useRef(null);
  const navigate                    = useNavigate();
  const location                    = useLocation();

  const [filterOpen, setFilterOpen]     = useState(false);
  const [sortOpen, setSortOpen]         = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy]             = useState("Relevância");
  const filterRef                       = useRef(null);
  const sortRef                         = useRef(null);

  const recentTags = [
    "Chuteira Adulto", "Chuteira Infantil", "Meião GMA",
    "Luva Goleiro", "Calça Térmica GMA", "Feminino", "Masculino",
  ];

  useEffect(() => {
    setLoading(true);
    api.getProducts()
      .then(setProducts).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQ(params.get("q") ?? "");
  }, [location.search]);

  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false); setFilterOpen(false);
        setSortOpen(false); auth.closeAuth();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [auth]);

  useEffect(() => {
    if (!searchOpen && !filterOpen && !sortOpen && !auth.authOpen) return;
    const handle = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;
      if (searchOpen) setSearchOpen(false);
      if (auth.authOpen) auth.closeAuth();
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
      if (sortOpen   && sortRef.current   && !sortRef.current.contains(e.target))   setSortOpen(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [searchOpen, filterOpen, sortOpen, auth]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [searchOpen]);

  const goToCatalog = (query) => {
    navigate(`/catalog?q=${encodeURIComponent(query ?? "")}`);
    setSearchOpen(false);
  };

  const handleProfileClick = () => {
    if (isLoggedIn) logout();
    else auth.openAuth("login");
  };

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    let arr = activeCategory !== "Todos"
      ? products.filter((p) => p.category === activeCategory)
      : products;
    if (qn) arr = arr.filter((p) => p.title.toLowerCase().includes(qn));
    return arr;
  }, [products, q, activeCategory]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "Menor preço": arr.sort((a, b) => a.price - b.price); break;
      case "Maior preço": arr.sort((a, b) => b.price - a.price); break;
      case "A-Z": arr.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "Z-A": arr.sort((a, b) => b.title.localeCompare(a.title)); break;
    }
    return arr;
  }, [filtered, sortBy]);

  const firstRow  = sorted.slice(0, 4);
  const restRows  = useMemo(() => {
    const rest = sorted.slice(4), out = [];
    for (let i = 0; i < rest.length; i += 4) out.push(rest.slice(i, i + 4));
    return out;
  }, [sorted]);

  if (loading) return <div className="catalog__loading">Carregando catálogo...</div>;

  return (
    <div className="catalog">

      {/* ===== SEARCH HEADER ===== */}
      <div className={`searchHeader ${searchOpen ? "isOpen" : ""}`}>
        <div className="searchHeader__bar">
          <img src={searchIcon} alt="" className="searchHeader__icon" />
          <input ref={searchInputRef} className="searchHeader__input" type="text"
            placeholder="Buscar..." value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goToCatalog(q)}
            aria-label="Buscar produtos" />
        </div>
        <div className="searchHeader__section">
          <div className="searchHeader__title">Mais buscados</div>
        </div>
        <div className="searchHeader__tags">
          {recentTags.map((t) => (
            <button key={t} type="button" className="tag"
              onClick={() => { setQ(t); setTimeout(() => goToCatalog(t), 0); }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ===== AUTH MODAL ===== */}
      <AuthModal {...auth} />

      {/* ===== HERO ===== */}
      <section className="catalogHero">
        <div className="catalogHero__wrap">
          <div className="catalogHero__brand">po</div>

          <nav className="drawer" aria-label="Ações rápidas">
            <button className="drawer__btn" type="button" aria-label="Menu">
              <img src={drawerIcon} alt="" />
            </button>
            <button className="drawer__btn" type="button"
              aria-label={isLoggedIn ? "Sair" : "Entrar"}
              title={isLoggedIn ? `Clique para sair (${authUser?.name ?? authUser?.email ?? ""})` : "Entrar / Cadastrar"}
              onClick={handleProfileClick}>
              <img src={profileIcon} alt=""
                style={isLoggedIn ? { filter: "invert(35%) sepia(80%) saturate(400%) hue-rotate(100deg)" } : {}} />
            </button>
            <Link className="drawer__btn" to="/cart" aria-label="Carrinho">
              <img src={cartIcon} alt="" />
            </Link>
            <button className="drawer__btn" type="button" aria-label="Buscar"
              onClick={() => setSearchOpen((p) => !p)}>
              <img src={searchIcon} alt="" />
            </button>
          </nav>

          <div className="catalogHero__results">
            <div className="catalogHero__hint">Você buscou por "{q?.trim() ? q.trim() : "******"}"</div>
            <div className="catalogHero__count">{sorted.length} Resultados</div>
          </div>

          <div className="catalogControls">
            <div className="catalogControls__group" ref={filterRef}>
              <button type="button"
                className={`catalogControls__btn ${filterOpen ? "isOpen" : ""}`}
                onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); auth.closeAuth(); }}>
                <span>Filtrar por</span>
                <img src={vectorArrow} alt="" className={`catalogControls__arrow ${filterOpen ? "isOpen" : ""}`} />
              </button>
              {filterOpen && (
                <div className="catalogControls__menu">
                  {categories.map((c) => (
                    <button key={c} type="button"
                      className={`catalogControls__item ${activeCategory === c ? "isActive" : ""}`}
                      onClick={() => { setActiveCategory(c); setFilterOpen(false); }}>{c}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="catalogControls__group" ref={sortRef}>
              <button type="button"
                className={`catalogControls__btn ${sortOpen ? "isOpen" : ""}`}
                onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); auth.closeAuth(); }}>
                <span>Ordenar por</span>
                <img src={vectorArrow} alt="" className={`catalogControls__arrow ${sortOpen ? "isOpen" : ""}`} />
              </button>
              {sortOpen && (
                <div className="catalogControls__menu">
                  {["Relevância", "Menor preço", "Maior preço", "A-Z", "Z-A"].map((s) => (
                    <button key={s} type="button"
                      className={`catalogControls__item ${sortBy === s ? "isActive" : ""}`}
                      onClick={() => { setSortBy(s); setSortOpen(false); }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="catalogHero__row">
            {firstRow.map((p) => (
              <Link key={p.id} to={`/produto/${p.id}`} className="card">
                <img className="card__img" src={p.image} alt={p.title} loading="lazy" />
                <div className="card__text">
                  <div className="card__name">{p.title}</div>
                  <div className="card__price">R$ {p.price.toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="catalogBody">
        {restRows.map((row, idx) => (
          <div className="catalogBody__row" key={idx}>
            {row.map((p) => (
              <Link key={p.id} to={`/produto/${p.id}`} className="card">
                <img className="card__img" src={p.image} alt={p.title} loading="lazy" />
                <div className="card__text">
                  <div className="card__name">{p.title}</div>
                  <div className="card__price">R$ {p.price.toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </section>

      <footer className="footerbar" />
    </div>
  );
}