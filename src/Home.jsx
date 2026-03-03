import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./services/api";
import { useStore } from "./store.jsx";
import { useAuthModal } from "./hooks/useAuthModal.js";
import AuthModal from "./components/AuthModal.jsx";
import "./styles/home.scss";
import "./styles/auth.scss";
import "./styles/profile.scss";
import "./styles/logo.scss";

import goldenBoots from "./assets/golden_boots.png";
import stadium     from "./assets/stadium.png";
import drawerIcon  from "./assets/drawer_icon.svg";
import profileIcon from "./assets/iconamoon_profile-light.svg";
import cartIcon    from "./assets/lineicons_cart-1.svg";
import searchIcon  from "./assets/icon.svg";
import logo        from "./assets/logo.svg";
import check       from "./assets/check.svg";
import truck       from "./assets/truck.svg";
import box         from "./assets/box.svg";

export default function Home() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  const { isLoggedIn, logout, authUser, setAuthUserFromGoogle } = useStore();
  const auth = useAuthModal();

  const [q, setQ]                   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef              = useRef(null);
  const navigate                    = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileView, setProfileView] = useState("profile");
  const [ordersTab, setOrdersTab]     = useState("confirmed");

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email:    authUser?.email ?? "",
    phone:    "",
    cep:      "",
  });

  useEffect(() => {
    setProfileForm((prev) => ({ ...prev, email: authUser?.email ?? "" }));
  }, [authUser]);

  const openOrders = (tab) => { setOrdersTab(tab); setProfileView("orders"); };
  const closeProfileAll = () => { setProfileOpen(false); setProfileView("profile"); };

  const ordersByTab = {
    confirmed: [
      { id: "S1-29384756", title: "Chuteira Campo",    size: "41", qty: 1, img: "" },
      { id: "S1-11839201", title: "Meião GMA",         size: "U",  qty: 2, img: "" },
    ],
    preparing: [
      { id: "S1-77441122", title: "Luva Goleiro",      size: "M",  qty: 1, img: "" },
    ],
    shipping: [
      { id: "S1-99001122", title: "Calça Térmica GMA", size: "G",  qty: 1, img: "" },
    ],
  };

  const ordersTitle =
    ordersTab === "confirmed" ? "Pedidos Confirmados"
    : ordersTab === "preparing" ? "Pedidos Preparando"
    : "Pedidos A caminho";

  const ordersSub =
    ordersTab === "confirmed" ? "Confira seus pedidos já confirmados pela S1!"
    : ordersTab === "preparing" ? "Estamos preparando seus pedidos."
    : "Seus pedidos já estão a caminho!";

  const userName = authUser?.name || authUser?.email?.split("@")?.[0] || "";

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

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return qn ? items.filter((p) => p.title.toLowerCase().includes(qn)) : items;
  }, [items, q]);

  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false); auth.closeAuth(); setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [auth]);

  useEffect(() => {
    if (!searchOpen && !auth.authOpen && !profileOpen) return;
    const handle = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer"))       return;
      if (e.target.closest(".authModal"))    return;
      if (e.target.closest(".profileModal")) return;
      if (auth.authOpen) auth.closeAuth();
      if (searchOpen)    setSearchOpen(false);
      if (profileOpen)   setProfileOpen(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [searchOpen, auth, profileOpen]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [searchOpen]);

  const goToCatalog = (query) => {
    navigate(`/catalog?q=${encodeURIComponent(query ?? "")}`);
    setSearchOpen(false);
  };

  const handleProfileClick = () => {
    if (isLoggedIn) setProfileOpen(true);
    else auth.openAuth("login");
  };

  const handleDrawerMenuClick = () => setProfileOpen(true);

  const handleSaveProfile = () => closeProfileAll();

  const handleLogoutFromProfile = async () => {
    closeProfileAll();
    await logout();
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
          <input
            ref={searchInputRef}
            className="searchHeader__input"
            type="text"
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goToCatalog(q)}
            aria-label="Buscar produtos"
          />
        </div>
        <div className="searchHeader__section">
          <div className="searchHeader__title">Mais buscados</div>
        </div>
        <div className="searchHeader__tags">
          {recentTags.map((t) => (
            <button key={t} type="button" className="tag"
              onClick={() => { setQ(t); setTimeout(() => goToCatalog(t), 0); }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ===== AUTH MODAL ===== */}
      <AuthModal {...auth} />

      {/* ===== PROFILE MODAL ===== */}
      <div className={`profileOverlay ${profileOpen ? "isOpen" : ""}`} onClick={closeProfileAll}>
        <div
          className={`profileModal ${profileOpen ? "isOpen" : ""}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="profileCard">
            <div className="profileCard__pad">

              {/* ── VIEW: PROFILE ── */}
              {profileView === "profile" && (
                <div className="profileGrid">

                  {/* LEFT */}
                  <div className="profileLeft">
                    <div className="profileHello">
                      <div className="profileHello__text">
                        Olá, {userName || "[Nome do Usuário]"}.
                      </div>
                    </div>

                    <div className="profileFields">
                      <div className="profileField">
                        <input className="profileField__input"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                          placeholder="Nome Completo: Ex. Goku Super Saiyajin 2"
                          aria-label="Nome completo" />
                      </div>
                      <div className="profileField">
                        <input className="profileField__input"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="E-mail: gokusupersaiyajin2@gmail.com"
                          aria-label="E-mail" />
                      </div>
                      <div className="profileField">
                        <input className="profileField__input"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="Número: Ex.(**) ****-****"
                          aria-label="Número" />
                      </div>
                      <div className="profileField">
                        <input className="profileField__input"
                          value={profileForm.cep}
                          onChange={(e) => setProfileForm((p) => ({ ...p, cep: e.target.value }))}
                          placeholder="Cep: Ex. *****-***"
                          aria-label="CEP" />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="profileRight">
                    <div className="profileRight__titleWrap">
                      <div className="profileRight__title">Minhas Compras</div>
                    </div>
                    <div className="profileRight__body">
                      <div className="profileIconsRow">
                        <button type="button" className="iconBox iconBox--confirmed iconBoxBtn"
                          onClick={() => openOrders("confirmed")}>
                          <img className="iconImg iconImg--confirmed" src={check} alt="Confirmado" />
                        </button>
                        <button type="button" className="iconBox iconBox--preparing iconBoxBtn"
                          onClick={() => openOrders("preparing")}>
                          <img className="iconImg iconImg--preparing" src={box} alt="Preparando" />
                        </button>
                        <button type="button" className="iconBox iconBox--shipping iconBoxBtn"
                          onClick={() => openOrders("shipping")}>
                          <img className="iconImg iconImg--shipping" src={truck} alt="A caminho" />
                        </button>
                      </div>
                      <div className="profileLabelsRow">
                        <div className="profileLabel">Confirmado</div>
                        <div className="profileLabel">Preparando</div>
                        <div className="profileLabel">A caminho</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ── VIEW: ORDERS ── */}
              {profileView === "orders" && (
                <div className="ordersView">
                  <div className="ordersHead">
                    <div className="ordersHead__title">{ordersTitle}</div>
                    <div className="ordersHead__sub">{ordersSub}</div>
                  </div>
                  <div className="ordersList">
                    {ordersByTab[ordersTab].map((o) => (
                      <div key={o.id} className="orderItem">
                        <div className="orderItem__left">
                          <img className="orderItem__img"
                            src={o.img || "https://placehold.co/87x87"} alt="" />
                          <div className="orderItem__mid">
                            <div className="orderItem__name">{o.title}</div>
                            <div className="orderItem__meta">
                              <div className="orderItem__metaText">Tam {o.size}</div>
                              <div className="orderItem__metaText">Qnt. {o.qty}</div>
                            </div>
                          </div>
                          <div className="orderItem__codeWrap">
                            <div className="orderItem__code">Código do Pedido: #{o.id}</div>
                          </div>
                        </div>
                        <div className="orderItem__right">
                          <div className="orderRightIcon">
                            <div className="orderRightIcon__a" />
                            <div className="orderRightIcon__b" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* FOOTER BUTTONS */}
            <div className="profileActions">
              {profileView === "profile" ? (
                <>
                  {isLoggedIn ? (
                    <>
                      {/* Logado: Sair + Salvar */}
                      <button type="button" className="profileBtn profileBtn--ghost"
                        onClick={handleLogoutFromProfile}>
                        Sair
                      </button>
                      <button type="button" className="profileBtn profileBtn--solid"
                        onClick={handleSaveProfile}>
                        Salvar
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Não logado: Cancelar + Entrar */}
                      <button type="button" className="profileBtn profileBtn--ghost"
                        onClick={closeProfileAll}>
                        Cancelar
                      </button>
                      <button type="button" className="profileBtn profileBtn--solid"
                        onClick={() => { closeProfileAll(); auth.openAuth("login"); }}>
                        Entrar
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button type="button" className="profileBtn profileBtn--solid profileBtn--ok"
                  onClick={() => setProfileView("profile")}>
                  Ok
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero__wrap">

          <img src={logo} alt="Logo" className="logo" />

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

          <nav className="drawer" aria-label="Ações rápidas">
            {/* 3 linhas → abre modal de perfil */}
            <button className="drawer__btn" type="button" aria-label="Menu"
              onClick={handleDrawerMenuClick}>
              <img src={drawerIcon} alt="" />
            </button>

            {/* Ícone de pessoa → verde se logado, abre perfil ou login */}
            <button
              className="drawer__btn"
              type="button"
              aria-label={isLoggedIn ? `Perfil (${authUser?.name ?? ""})` : "Entrar"}
              title={isLoggedIn
                ? `Ver perfil (${authUser?.name ?? authUser?.email ?? ""})`
                : "Entrar / Cadastrar"}
              onClick={handleProfileClick}
            >
              <img src={profileIcon} alt=""
                style={isLoggedIn
                  ? { filter: "invert(35%) sepia(80%) saturate(400%) hue-rotate(100deg)" }
                  : {}} />
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
                        <span key={i}
                          className={`card__star ${i < Math.round(p.rating?.rate ?? 0) ? "isFilled" : ""}`}>
                          ★
                        </span>
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