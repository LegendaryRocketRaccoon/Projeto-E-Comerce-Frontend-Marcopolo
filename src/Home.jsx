import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./services/api";
import { useStore } from "./store.jsx";
import "./styles/home.scss";
import "./styles/auth.scss";

import goldenBoots from "./assets/golden_boots.png";
import stadium from "./assets/stadium.png";

import drawerIcon   from "./assets/drawer_icon.svg";
import profileIcon  from "./assets/iconamoon_profile-light.svg";
import cartIcon     from "./assets/lineicons_cart-1.svg";
import searchIcon   from "./assets/icon.svg";
import googleIcon   from "./assets/icon_google.svg";


export default function Home() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  const { login, register, setAuthUserFromGoogle, isLoggedIn, authUser, logout } = useStore();

  const [q, setQ]                   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef              = useRef(null);
  const navigate                    = useNavigate();

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab]   = useState("login");
  const [authView, setAuthView] = useState("login");
  const authRef = useRef(null);

  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotEmail, setForgotEmail]     = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]     = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const recentTags = [
    "Chuteira Adulto", "Chuteira Infantil", "Meião GMA",
    "Luva Goleiro", "Calça Térmica GMA", "Feminino", "Masculino",
  ];

  useEffect(() => {
    try {
      const user = api.handleGoogleCallback();
      if (user) {
        setAuthUserFromGoogle(user);
        setAuthSuccess(`Bem-vindo, ${user.name}!`);
        setTimeout(() => setAuthSuccess(""), 4000);
      }
    } catch (err) {
      setAuthError(err.message);
      setAuthOpen(true);
      setAuthView("login");
    }
  }, []);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rt     = params.get("reset_token");
    const re     = params.get("email");
    if (rt && re) {
      sessionStorage.setItem("resetToken", rt);
      sessionStorage.setItem("resetEmail", re);
      window.history.replaceState({}, "", "/");
      openAuth("login");
      setAuthView("reset");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const prods = await api.getProducts();
        setItems(prods);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered  = useMemo(() => {
    const qNorm = q.trim().toLowerCase();
    if (!qNorm) return items;
    return items.filter((p) => (p.title ?? "").toLowerCase().includes(qNorm));
  }, [items, q]);

  const gridItems = filtered.slice(0, 8);

  const goToNews = () =>
    document.getElementById("novidades")?.scrollIntoView({ behavior: "smooth" });

  const toggleSearch = () => setSearchOpen((prev) => !prev);

  const goToCatalog = (query) => {
    navigate(`/catalog?q=${encodeURIComponent(query ?? "")}`);
    setSearchOpen(false);
  };

  const handleTagClick = (tag) => { setQ(tag); setTimeout(() => goToCatalog(tag), 0); };

  const resetAuthForm = () => {
    setName(""); setEmail(""); setPassword("");
    setConfirmPassword(""); setForgotEmail("");
    setAuthError(""); setAuthSuccess("");
  };

  const openAuth = (tab = "login") => {
    resetAuthForm();
    setAuthTab(tab);
    setAuthView(tab);
    setAuthOpen(true);
    setSearchOpen(false);
  };

  const closeAuth = () => {
    setAuthOpen(false);
    setTimeout(resetAuthForm, 300);
  };

  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setSearchOpen(true);
      }
      if (e.key === "Escape") { setSearchOpen(false); closeAuth(); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  useEffect(() => {
    if (!searchOpen && !authOpen) return;
    const handle = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;
      if (authOpen) closeAuth();
      if (searchOpen) setSearchOpen(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [searchOpen, authOpen]);

  useEffect(() => {
    if (!authOpen) return;
    setTimeout(() => { authRef.current?.querySelector("input")?.focus(); }, 220);
  }, [authOpen, authView]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => { searchInputRef.current.focus(); }, 80);
    }
  }, [searchOpen]);


  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setAuthError(""); setAuthLoading(true);
    try {
      await login(email, password);
      closeAuth();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (password !== confirmPassword) {
      setAuthError("As senhas não coincidem.");
      return;
    }
    setAuthLoading(true);
    try {
      await register(name || email.split("@")[0], email, password);
      closeAuth();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitForgot = async (e) => {
    e.preventDefault();
    setAuthError(""); setAuthLoading(true);
    try {
      await api.forgotPassword(forgotEmail);
      setAuthView("forgot_sent");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitReset = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (password !== confirmPassword) {
      setAuthError("As senhas não coincidem.");
      return;
    }
    setAuthLoading(true);
    try {
      const rt = sessionStorage.getItem("resetToken");
      const re = sessionStorage.getItem("resetEmail");
      await api.resetPassword(rt, re, password);
      sessionStorage.removeItem("resetToken");
      sessionStorage.removeItem("resetEmail");
      setAuthView("reset_done");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    api.loginWithGoogle();
  };


  const renderModalContent = () => {
    if (authView === "forgot_sent") {
      return (
        <div className="authForm">
          <div className="authForm__inner" style={{ height: "auto", padding: "32px 10px 10px" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 40 }}>📧</div>
              <div className="authLabel" style={{ fontSize: 14, lineHeight: 1.5 }}>
                Enviamos as instruções para<br />
                <strong>{forgotEmail}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#818181", lineHeight: 1.5 }}>
                Verifique sua caixa de entrada e spam.<br />
                O link expira em 1 hora.
              </div>
            </div>
          </div>
          <div className="authFooter">
            <button className="authSubmit" type="button" onClick={() => { setAuthView("login"); resetAuthForm(); }}>
              Voltar ao login
            </button>
          </div>
        </div>
      );
    }

    if (authView === "reset_done") {
      return (
        <div className="authForm">
          <div className="authForm__inner" style={{ height: "auto", padding: "32px 10px 10px" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 40 }}>✅</div>
              <div className="authLabel" style={{ fontSize: 14 }}>
                Senha redefinida com sucesso!
              </div>
            </div>
          </div>
          <div className="authFooter">
            <button className="authSubmit" type="button" onClick={() => { setAuthView("login"); resetAuthForm(); }}>
              Entrar
            </button>
          </div>
        </div>
      );
    }

    if (authView === "reset") {
      return (
        <form className="authForm" onSubmit={handleSubmitReset}>
          <div className="authForm__inner" style={{ height: "auto", padding: "20px 10px 10px", gap: 0 }}>
            <div style={{ fontSize: 13, color: "#818181", marginBottom: 16, textAlign: "center" }}>
              Digite sua nova senha
            </div>
            <div className="authGroup">
              <div className="authLabel">Nova senha</div>
              <div className="authInputBox">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="**********" autoComplete="new-password" required />
              </div>
            </div>
            <div className="authGroup" style={{ marginTop: 10 }}>
              <div className="authLabel">Confirmar nova senha</div>
              <div className="authInputBox">
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="**********" autoComplete="new-password" required />
              </div>
            </div>
            {authError && <div className="authError">{authError}</div>}
          </div>
          <div className="authFooter">
            <button className="authSubmit" type="submit" disabled={authLoading}>
              {authLoading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </div>
        </form>
      );
    }

    if (authView === "forgot") {
      return (
        <form className="authForm" onSubmit={handleSubmitForgot}>
          <div className="authForm__inner" style={{ height: "auto", padding: "20px 10px 10px", gap: 0 }}>
            <div style={{ fontSize: 13, color: "#818181", marginBottom: 16, textAlign: "center" }}>
              Informe seu e-mail para receber o link de redefinição
            </div>
            <div className="authGroup">
              <div className="authLabel">E-mail</div>
              <div className="authInputBox">
                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Digitar..." required />
              </div>
            </div>
            {authError && <div className="authError">{authError}</div>}
          </div>
          <div className="authFooter">
            <button className="authSubmit" type="submit" disabled={authLoading}>
              {authLoading ? "Enviando..." : "Enviar link"}
            </button>
            <button type="button" className="authForgot"
              style={{ marginTop: -10 }}
              onClick={() => { setAuthView("login"); setAuthError(""); }}>
              Voltar ao login
            </button>
          </div>
        </form>
      );
    }

    const isRegister = authView === "register";

    return (
      <form
        className={`authForm ${isRegister ? "isRegister" : ""}`}
        onSubmit={isRegister ? handleSubmitRegister : handleSubmitLogin}
      >
        <div className="authForm__inner">

          {isRegister && (
            <div className="authGroup">
              <div className="authLabel">Nome</div>
              <div className="authInputBox">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome" autoComplete="name" />
              </div>
            </div>
          )}

          <div className="authGroup">
            <div className="authLabel">E-mail</div>
            <div className="authInputBox">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Digitar..." required aria-label="E-mail" />
            </div>
          </div>

          <div className="authGroup">
            <div className="authLabel">Senha</div>
            <div className="authInputBox">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="**********" required aria-label="Senha" />
            </div>
          </div>

          {!isRegister && (
            <div className="authForgotWrap">
              <button type="button" className="authForgot"
                onClick={() => { setAuthView("forgot"); setAuthError(""); setForgotEmail(email); }}>
                Esqueci minha senha.
              </button>
            </div>
          )}

          {isRegister && (
            <div className="authGroup">
              <div className="authLabel">Confirmar Senha</div>
              <div className="authInputBox">
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="**********" required aria-label="Confirmar Senha" />
              </div>
            </div>
          )}

          {authError && <div className="authError">{authError}</div>}
        </div>

        <div className={`authFooter ${isRegister ? "isRegister" : "isLogin"}`}>
          <button type="button" className="authGoogleBtn" onClick={handleGoogleLogin}>
            <img className="authGoogleBtn__icon" src={googleIcon} alt="" />
            <span>{isRegister ? "Cadastrar com Google" : "Entrar com Google"}</span>
          </button>

          <button className="authSubmit" type="submit" disabled={authLoading}>
            {authLoading
              ? (isRegister ? "Criando conta..." : "Entrando...")
              : (isRegister ? "Criar Conta" : "Entrar")}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="home">

      {/* Toast de sucesso global (boas-vindas Google) */}
      {authSuccess && (
        <div className="cart__toast" style={{ zIndex: 9999 }}>{authSuccess}</div>
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
            <button key={t} type="button" className="tag" onClick={() => handleTagClick(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* ===== AUTH MODAL ===== */}
      <div className={`authOverlay ${authOpen ? "isOpen" : ""}`} aria-hidden={!authOpen}>
        <div className={`authModal ${authOpen ? "isOpen" : ""}`}
          role="dialog" aria-modal="true" ref={authRef}>

          {/* Tabs — ocultas nas telas de forgot/reset */}
          {(authView === "login" || authView === "register") && (
            <>
              <div className="authTabs">
                <button type="button"
                  className={`authTab ${authTab === "login" ? "isActive" : ""}`}
                  onClick={() => { setAuthTab("login"); setAuthView("login"); setAuthError(""); }}>
                  Login
                </button>
                <button type="button"
                  className={`authTab ${authTab === "register" ? "isActive" : ""}`}
                  onClick={() => { setAuthTab("register"); setAuthView("register"); setAuthError(""); }}>
                  Cadastrar
                </button>
              </div>
              <div className="authUnderlineWrap">
                <div className={`authUnderline ${authTab === "register" ? "isRegister" : "isLogin"}`} />
              </div>
            </>
          )}

          {/* Título para telas sem tabs */}
          {(authView === "forgot" || authView === "forgot_sent" || authView === "reset" || authView === "reset_done") && (
            <div className="authTabs" style={{ justifyContent: "center", gap: 0 }}>
              <span className="authTab isActive" style={{ cursor: "default", paddingBottom: 18 }}>
                {authView === "forgot" || authView === "forgot_sent" ? "Redefinir senha" : "Nova senha"}
              </span>
            </div>
          )}

          {renderModalContent()}
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero__wrap">
          <div className="hero__brand">po</div>

          <div className="hero__copy">
            <h1 className="hero__title">
              GMA D'or <br />
              Chuteira Campo
            </h1>
            <p className="hero__desc">
              Poucos pares. Acabamento dourado exclusivo. Performance de elite. Uma
              chuteira feita para brilhar e marcar presença dentro e fora dos gramados.
            </p>
          </div>

          <button className="hero__cta" type="button" onClick={goToNews}>
            Ler mais
          </button>

          <div className="hero__media">
            <img src={goldenBoots} alt="GMA D'or Chuteira Campo" />
          </div>

          <nav className="drawer" aria-label="Ações rápidas">
            <button className="drawer__btn" type="button" aria-label="Menu">
              <img src={drawerIcon} alt="" />
            </button>

            <button className="drawer__btn" type="button" aria-label="Perfil"
              onClick={() => isLoggedIn ? logout() : openAuth("login")}>
              <img src={profileIcon} alt=""
                style={isLoggedIn ? { filter: "invert(30%) sepia(100%) saturate(500%) hue-rotate(90deg)" } : {}} />
            </button>

            <Link className="drawer__btn" to="/cart" aria-label="Carrinho">
              <img src={cartIcon} alt="" />
            </Link>

            <button className="drawer__btn" type="button" aria-label="Buscar" onClick={toggleSearch}>
              <img src={searchIcon} alt="" />
            </button>
          </nav>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="benefits">
        <div className="benefits__row">
          <div className="benefits__item">
            <strong>FRETE GRÁTIS</strong> para compras acima de <strong>R$ 200!</strong>
          </div>
          <div className="benefits__item">
            <strong>Envio rápido</strong> para todo o <strong>Brasil!</strong>
          </div>
          <div className="benefits__item">
            <strong>20% OFF</strong> na sua primeira <strong>compra!</strong>
          </div>
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
              {gridItems.slice(0, 4).map((p) => (
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