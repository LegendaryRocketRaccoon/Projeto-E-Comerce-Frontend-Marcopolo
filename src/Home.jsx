import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./services/api";
import { useStore } from "./store.jsx";
import { useAuthModal } from "./hooks/useAuthModal.js";
import AuthModal from "./components/AuthModal.jsx";
import "./styles/home.scss";
import "./styles/auth.scss";

import goldenBoots from "./assets/golden_boots.png";
import stadium     from "./assets/stadium.png";
import drawerIcon  from "./assets/drawer_icon.svg";
import profileIcon from "./assets/iconamoon_profile-light.svg";
import cartIcon    from "./assets/lineicons_cart-1.svg";
import searchIcon  from "./assets/icon.svg";

export default function Home() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  const { isLoggedIn, logout, authUser, setAuthUserFromGoogle } = useStore();
  const auth = useAuthModal();

  const [q, setQ]                   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef              = useRef(null);
  const navigate                    = useNavigate();

  const recentTags = [
    "Chuteira Adulto", "Chuteira Infantil", "Meião GMA",
    "Luva Goleiro", "Calça Térmica GMA", "Feminino", "Masculino",
  ];

  useEffect(() => {
    auth.handleGoogleCallback(setAuthUserFromGoogle);
    auth.handleResetCallback();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setItems(await api.getProducts()); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered  = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return qn ? items.filter((p) => p.title.toLowerCase().includes(qn)) : items;
  }, [items, q]);

  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setSearchOpen(true);
      }
      if (e.key === "Escape") { setSearchOpen(false); auth.closeAuth(); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [auth]);

  useEffect(() => {
    if (!searchOpen && !auth.authOpen) return;
    const handle = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;
      if (auth.authOpen) auth.closeAuth();
      if (searchOpen) setSearchOpen(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [searchOpen, auth]);

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

  return (
    <div className="home">

      {/* Toast de boas-vindas (Google) */}
      {auth.authSuccess && (
        <div className="cart__toast" style={{ zIndex: 9999 }}>{auth.authSuccess}</div>
      )}

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
      <section className="hero">
        <div className="hero__wrap">
          <div className="hero__brand">po</div>

          <div className="hero__copy">
            <h1 className="hero__title">GMA D'or <br />Chuteira Campo</h1>
            <p className="hero__desc">
              Poucos pares. Acabamento dourado exclusivo. Performance de elite.
              Uma chuteira feita para brilhar e marcar presença dentro e fora dos gramados.
            </p>
          </div>

          <button className="hero__cta" type="button"
            onClick={() => document.getElementById("novidades")?.scrollIntoView({ behavior: "smooth" })}>
            Ler mais
          </button>

          <div className="hero__media">
            <img src={goldenBoots} alt="GMA D'or Chuteira Campo" />
          </div>

          {/* Drawer — ícone de perfil fica verde quando logado */}
          <nav className="drawer" aria-label="Ações rápidas">
            <button className="drawer__btn" type="button" aria-label="Menu">
              <img src={drawerIcon} alt="" />
            </button>
            <button className="drawer__btn" type="button"
              aria-label={isLoggedIn ? `Sair (${authUser?.name ?? ""})` : "Entrar"}
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
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="benefits">
        <div className="benefits__row">
          <div className="benefits__item"><strong>FRETE GRÁTIS</strong> para compras acima de <strong>R$ 200!</strong></div>
          <div className="benefits__item"><strong>Envio rápido</strong> para todo o <strong>Brasil!</strong></div>
          <div className="benefits__item"><strong>20% OFF</strong> na sua primeira <strong>compra!</strong></div>
        </div>
      </section>

      {/* ===== NOVIDADES ===== */}
      <section className="newsHead" id="novidades">
        <h2 className="newsHead__title">Novidades</h2>
        <p className="newsHead__sub">Confira já!</p>
      </section>

      {/* ===== GRID ===== */}
      <section className="grid">
        {loading ? (
          <div className="grid__loading">Carregando produtos...</div>
        ) : (
          <div className="grid__rows">
            <div className="grid__row">
              {filtered.slice(0, 4).map((p) => (
                <Link key={p.id} to={`/produto/${p.id}`} className="card">
                  <img className="card__img" src={p.image} alt={p.title} loading="lazy" />
                  <div className="card__text">
                    <div className="card__nameWrap">
                      <div className="card__name">{p.title}</div>
                    </div>
                    <div className="card__price">R$ {p.price.toFixed(2)}</div>
                    <div className="card__icons">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`card__star ${i < Math.round(p.rating?.rate ?? 0) ? "isFilled" : ""}`}>★</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== BANNER ===== */}
      <section className="banner">
        <img src={stadium} alt="Torcida no estádio" />
      </section>

      <footer className="footerbar" />
    </div>
  );
}