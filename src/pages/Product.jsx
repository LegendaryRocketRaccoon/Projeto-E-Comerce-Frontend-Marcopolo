import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useStore } from "../store.jsx";
import "../styles/product.scss";
import "../styles/auth.scss";


// Drawer icons (mismos assets que usas en Home)
import drawerIcon from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon from "../assets/lineicons_cart-1.svg";
import searchIcon from "../assets/icon.svg";
import googleIcon from "../assets/icon_google.svg"; 


const SIZES = [34, 35, 36, 37, 38, 39, 40, 41, 42, 43];
const ORIGINAL_MARKUP = 0.10; // “de R$ …”
const PIX_DISCOUNT = 0.10; // “no PIX”
const INSTALLMENTS = 10;

function formatBRL(v) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v ?? 0);
  } catch {
    return `R$ ${(v ?? 0).toFixed(2)}`;
  }
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function Product() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart } = useStore();

  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);

  const [size, setSize] = useState(40);

  // ===== SEARCH HEADER STATE / REFS =====
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  // ✅ AUTH (igual Home)
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // "login" | "register"
  const authRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // tags recientes (mismo set que en Home)
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
      .getProduct(id)
      .then((data) => setP(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const ratingAvg = useMemo(() => {
    const r = Number(p?.rating?.rate ?? 0);
    return clamp(r, 0, 5);
  }, [p]);

  const ratingCount = useMemo(() => {
    return Number(p?.rating?.count ?? 0);
  }, [p]);

  const basePrice = useMemo(() => Number(p?.price ?? 0), [p]);

  // Precio “de …”
  const originalPrice = useMemo(() => {
    return basePrice * (1 + ORIGINAL_MARKUP);
  }, [basePrice]);

  // Precio PIX
  const pixPrice = useMemo(() => {
    return basePrice * (1 - PIX_DISCOUNT);
  }, [basePrice]);

  // Cuotas 10x
  const installment = useMemo(() => {
    return pixPrice / INSTALLMENTS;
  }, [pixPrice]);

  // ===== SHORTCUTS =====
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setAuthOpen(false);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setAuthOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // cerrar al clickar fuera (pero no dentro del header, drawer o modal)
  useEffect(() => {
    if (!searchOpen && !authOpen) return;

    const handleClickOutside = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;

      if (authOpen) setAuthOpen(false);
      if (searchOpen) setSearchOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [searchOpen, authOpen]);

  // enfocar input cuando se abre el header
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

  const goToCatalog = (query) => {
    const qParam = query ?? "";
    nav(`/catalog?q=${encodeURIComponent(qParam)}`);
    setSearchOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") goToCatalog(q);
  };

  const handleTagClick = (tag) => {
    setQ(tag);
    setTimeout(() => goToCatalog(tag), 0);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setAuthOpen(false);
  };

  // ✅ open auth modal from drawer
  const openAuth = (tab = "login") => {
    setAuthTab(tab);
    setAuthOpen(true);
    setSearchOpen(false);
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

  if (loading) return <div className="product">Carregando...</div>;
  if (!p) return <div className="product">Produto não encontrado.</div>;

  return (
    <div className="product">
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
          {/* tabs */}
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

          {/* underline gradient */}
          <div className="authUnderlineWrap">
            <div className={`authUnderline ${authTab === "register" ? "isRegister" : "isLogin"}`} />
          </div>

          {/* form */}
          <form
            className={`authForm ${authTab === "register" ? "isRegister" : ""}`}
            onSubmit={handleSubmitAuth}
          >
            <div className="authForm__inner">
              {/* Email */}
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

              {/* Senha */}
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

              {/* Confirmar Senha */}
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

      {/* ===== HERO 1920x1080 ===== */}
      <section className="pHero">
        <div className="pHero__wrap">
          <div className="pHero__brand">****************</div>

          <h1 className="pTitle">{p.title}</h1>

          <div className="pRating">
            <div className="pRating__stars" aria-label={`Avaliação média ${ratingAvg.toFixed(1)} de 5`}>
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = ratingAvg >= i + 1;
                const half = !filled && ratingAvg > i && ratingAvg < i + 1;
                return (
                  <span key={i} className={`pStar ${filled ? "isFilled" : ""} ${half ? "isHalf" : ""}`}>
                    ★
                  </span>
                );
              })}
            </div>

            <div className="pRating__text">
              {ratingCount > 0 ? `${ratingCount} avaliações` : "Sem avaliações"}
            </div>
          </div>

          <div className="pSizes">
            <div className="pSizes__label">Tamanho:</div>

            <div className="pSizes__grid">
              {SIZES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pSize ${size === n ? "isActive" : ""}`}
                  onClick={() => setSize(n)}
                  aria-pressed={size === n}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="pPrice">
            <div className="pPrice__from">
              <span className="pPrice__fromLabel">de</span>{" "}
              <span className="pPrice__fromValue">{formatBRL(originalPrice)}</span>{" "}
              <span className="pPrice__fromLabel">por apenas</span>
            </div>

            <div className="pPrice__pix" aria-label={`Preço no PIX ${formatBRL(pixPrice)}`}>
              <span className="pPrice__pixRS">R$</span>
              <span className="pPrice__pixValue">{pixPrice.toFixed(2).replace(".", ",")}</span>
              <span className="pPrice__pixLabel">no</span>
              <span className="pPrice__pixMethod">PIX</span>
            </div>

            <div className="pPrice__inst">
              ou <strong>{INSTALLMENTS}x</strong> de <strong>{formatBRL(installment)}</strong> sem juros
            </div>

            <div className="pBuyRow">
              <button
                className="pBuy"
                type="button"
                onClick={() => {
                  addToCart({ ...p, size });
                  nav("/cart");
                }}
              >
                Comprar
              </button>

              <button
                className="pBuyCart"
                type="button"
                onClick={() => {
                  addToCart({ ...p, size });
                  alert("Produto adicionado ao carrinho!");
                }}
                aria-label="Adicionar ao carrinho"
              >
                <img src={cartIcon} alt="" />
              </button>
            </div>
          </div>

          <div className="pHero__media">
            <img src={p.image} alt={p.title} />
          </div>

          {/* drawer vertical */}
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

            <button className="drawer__btn" type="button" aria-label="Buscar" onClick={openSearch}>
              <img src={searchIcon} alt="" />
            </button>
          </nav>

          <div className="pPromo">
            <span className="pPromo__strong">Registre-se</span> e ganhe{" "}
            <span className="pPromo__strong">10%</span> de desconto usando o cupom{" "}
            <span className="pPromo__strong">COMPRA1</span> na sua primeira compra feita pelo{" "}
            <span className="pPromo__strong">site</span>.
          </div>
        </div>
      </section>

      <section className="pContent">
        <div className="pContent__inner">
          <div className="pDesc" id="descricao">
            <div className="pDesc__title">Descrição do Produto:</div>
            <div className="pDesc__text">{p.description}</div>
          </div>
        </div>
      </section>

      <section className="pReviews">
        <div className="pReviews__inner">
          <div className="pReviews__title">Avaliações:</div>
          <div className="pReviews__sub">O que os clientes estão dizendo sobre o produto?</div>

          <div className="pReviews__empty">
            {ratingCount > 0
              ? "Em breve vamos listar as avaliações aqui."
              : "Ainda não há avaliações. Seja o primeiro a avaliar!"}
          </div>
        </div>
      </section>

      <footer className="footerbar" />
    </div>
  );
}