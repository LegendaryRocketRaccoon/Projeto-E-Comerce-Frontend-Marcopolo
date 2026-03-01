import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api.js";
import "../styles/catalog.scss";
import "../styles/auth.scss";

// Drawer icons
import drawerIcon from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon from "../assets/lineicons_cart-1.svg";
import searchIcon from "../assets/icon.svg";
import googleIcon from "../assets/icon_google.svg"; 


// flecha para filtros/orden
import vectorArrow from "../assets/Vector.svg";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== SEARCH HEADER STATE / REFS =====
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ AUTH modal (igual Home)
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // "login" | "register"
  const authRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ===== FILTER / SORT =====
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("Relevância");

  const filterRef = useRef(null);
  const sortRef = useRef(null);

  // recent tags
  const recentTags = [
    "Chuteira Adulto",
    "Chuteira Infantil",
    "Meião GMA",
    "Luva Goleiro",
    "Calça Térmica GMA",
    "Feminino",
    "Masculino",
  ];

  useEffect(() => {
    setLoading(true);
    api
      .getProducts()
      .then((data) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // precargar q desde query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get("q") ?? "";
    setQ(qParam);
  }, [location.search]);

  // atajo Ctrl/Cmd + K y Escape
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setAuthOpen(false);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setFilterOpen(false);
        setSortOpen(false);
        setAuthOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // click outside: search header, drawer, dropdowns, modal
  useEffect(() => {
    const handleClickOutside = (e) => {
      // si click dentro del header/drawer/modal, no cerrar
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;

      if (searchOpen) setSearchOpen(false);
      if (authOpen) setAuthOpen(false);

      // dropdowns
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
      if (sortOpen && sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };

    if (!searchOpen && !filterOpen && !sortOpen && !authOpen) return;

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [searchOpen, filterOpen, sortOpen, authOpen]);

  // enfocar input cuando se abre searchHeader
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
        if (searchInputRef.current.select) searchInputRef.current.select();
      }, 80);
    }
  }, [searchOpen]);

  // enfocar email cuando abre modal
  useEffect(() => {
    if (!authOpen) return;
    setTimeout(() => {
      const el = authRef.current?.querySelector("input");
      if (el) el.focus();
    }, 220);
  }, [authOpen, authTab]);

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
    setAuthOpen(false);
  };

  // navegar al catálogo con query param
  const goToCatalog = (query) => {
    const qParam = query ?? "";
    navigate(`/catalog?q=${encodeURIComponent(qParam)}`);
    setSearchOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") goToCatalog(q);
  };

  const handleTagClick = (tag) => {
    setQ(tag);
    setTimeout(() => goToCatalog(tag), 0);
  };

  // ✅ open auth modal
  const openAuth = (tab = "login") => {
    setAuthTab(tab);
    setAuthOpen(true);
    setSearchOpen(false);
    setFilterOpen(false);
    setSortOpen(false);
  };

  // placeholder submit
  const handleSubmitAuth = (e) => {
    e.preventDefault();

    // if (authTab === "register" && password !== confirmPassword) {
    //   // TODO mostrar toast/erro
    //   return;
    // }

    // if (authTab === "login") {
    //   // TODO Firebase signInWithEmailAndPassword(auth, email, password)
    // } else {
    //   // TODO Firebase createUserWithEmailAndPassword(auth, email, password)
    // }

    alert(authTab === "login" ? `Login: ${email}` : `Cadastrar: ${email}`);
  };

  // categorías a partir del dataset
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  // filtro + búsqueda (FRONT)
  const filtered = useMemo(() => {
    const qNorm = q.trim().toLowerCase();

    let arr = products;

    if (activeCategory !== "Todos") {
      arr = arr.filter((p) => (p.category ?? "") === activeCategory);
    }

    if (qNorm) {
      arr = arr.filter((p) => (p.title ?? "").toLowerCase().includes(qNorm));
    }

    return arr;
  }, [products, q, activeCategory]);

  // orden (FRONT)
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "Menor preço":
        arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "Maior preço":
        arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "A-Z":
        arr.sort((a, b) => String(a.title ?? "").localeCompare(String(b.title ?? "")));
        break;
      case "Z-A":
        arr.sort((a, b) => String(b.title ?? "").localeCompare(String(a.title ?? "")));
        break;
      default:
        break; // Relevância
    }
    return arr;
  }, [filtered, sortBy]);

  const firstRow = sorted.slice(0, 4);
  const rest = sorted.slice(4);

  const restRows = useMemo(() => {
    const out = [];
    for (let i = 0; i < rest.length; i += 4) out.push(rest.slice(i, i + 4));
    return out;
  }, [rest]);

  if (loading) {
    return <div className="catalog__loading">Carregando catálogo...</div>;
  }

  return (
    <div className="catalog">
      {/* ===== SEARCH HEADER ===== */}
      <div className={`searchHeader ${searchOpen ? "isOpen" : ""}`}>
        <div className="searchHeader__bar">
          <img src={searchIcon} alt="" className="searchHeader__icon" />
          <input
            ref={searchInputRef}
            className="searchHeader__input"
            type="text"
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Buscar productos"
          />
        </div>

        <div className="searchHeader__section">
          <div className="searchHeader__title">Mais buscados</div>
        </div>

        <div className="searchHeader__tags">
          {recentTags.map((t) => (
            <button key={t} type="button" className="tag" onClick={() => handleTagClick(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ AUTH MODAL (Figma) */}
      <div className={`authOverlay ${authOpen ? "isOpen" : ""}`} aria-hidden={!authOpen}>
        <div
          className={`authModal ${authOpen ? "isOpen" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Login / Cadastrar"
          ref={authRef}
        >
          <div className="authTabs">
            <button
              type="button"
              className={`authTab ${authTab === "login" ? "isActive" : ""}`}
              onClick={() => setAuthTab("login")}
            >
              Login
            </button>

            <button
              type="button"
              className={`authTab ${authTab === "register" ? "isActive" : ""}`}
              onClick={() => setAuthTab("register")}
            >
              Cadastrar
            </button>
          </div>

          <div className="authUnderlineWrap">
            <div className={`authUnderline ${authTab === "register" ? "isRegister" : "isLogin"}`} />
          </div>

          <form
            className={`authForm ${authTab === "register" ? "isRegister" : ""}`}
            onSubmit={handleSubmitAuth}
          >
            <div className="authForm__inner">
              <div className="authGroup">
                <div className="authLabel">E-mail</div>
                <div className="authInputBox">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digitar..."
                    aria-label="E-mail"
                  />
                </div>
              </div>

              <div className="authGroup">
                <div className="authLabel">Senha</div>
                <div className="authInputBox">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="**********"
                    aria-label="Senha"
                  />
                </div>
              </div>

              {authTab === "register" && (
                <div className="authGroup">
                  <div className="authLabel">Confirmar Senha</div>
                  <div className="authInputBox">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="**********"
                      aria-label="Confirmar Senha"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="authFooter">
              <button className="authSubmit" type="submit">
                {authTab === "login" ? "Entrar" : "Criar Conta"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== TOP (1080) ===== */}
      <section className="catalogHero">
        <div className="catalogHero__wrap">
          <div className="catalogHero__brand">po</div>

          {/* drawer */}
          <nav className="drawer" aria-label="Ações rápidas">
            <button className="drawer__btn" type="button" aria-label="Menu">
              <img src={drawerIcon} alt="" />
            </button>

            {/* ✅ PERFIL abre modal */}
            <button
              className="drawer__btn"
              type="button"
              aria-label="Perfil"
              onClick={() => openAuth("login")}
            >
              <img src={profileIcon} alt="" />
            </button>

            <Link className="drawer__btn" to="/cart" aria-label="Carrinho">
              <img src={cartIcon} alt="" />
            </Link>

            <button className="drawer__btn" type="button" aria-label="Buscar" onClick={toggleSearch}>
              <img src={searchIcon} alt="" />
            </button>
          </nav>

          <div className="catalogHero__results">
            <div className="catalogHero__hint">
              Você buscou por “{q?.trim() ? q.trim() : "******"}”
            </div>
            <div className="catalogHero__count">{sorted.length} Resultados</div>
          </div>

          <div className="catalogControls">
            <div className="catalogControls__group" ref={filterRef}>
              <button
                type="button"
                className={`catalogControls__btn ${filterOpen ? "isOpen" : ""}`}
                onClick={() => {
                  setFilterOpen((v) => !v);
                  setSortOpen(false);
                  setAuthOpen(false);
                }}
                aria-label="Filtrar por"
              >
                <span>Filtrar por</span>
                <img
                  src={vectorArrow}
                  alt=""
                  className={`catalogControls__arrow ${filterOpen ? "isOpen" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {filterOpen && (
                <div className="catalogControls__menu">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`catalogControls__item ${activeCategory === c ? "isActive" : ""}`}
                      onClick={() => {
                        setActiveCategory(c);
                        setFilterOpen(false);
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="catalogControls__group" ref={sortRef}>
              <button
                type="button"
                className={`catalogControls__btn ${sortOpen ? "isOpen" : ""}`}
                onClick={() => {
                  setSortOpen((v) => !v);
                  setFilterOpen(false);
                  setAuthOpen(false);
                }}
                aria-label="Ordenar por"
              >
                <span>Ordenar por</span>
                <img
                  src={vectorArrow}
                  alt=""
                  className={`catalogControls__arrow ${sortOpen ? "isOpen" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {sortOpen && (
                <div className="catalogControls__menu">
                  {["Relevância", "Menor preço", "Maior preço", "A-Z", "Z-A"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`catalogControls__item ${sortBy === s ? "isActive" : ""}`}
                      onClick={() => {
                        setSortBy(s);
                        setSortOpen(false);
                      }}
                    >
                      {s}
                    </button>
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