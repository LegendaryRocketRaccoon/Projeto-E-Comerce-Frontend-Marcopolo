import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useStore } from "../store.jsx";
import { useAuthModal } from "../hooks/useAuthModal.js";
import AuthModal from "../components/AuthModal.jsx";
import "../styles/product.scss";
import "../styles/auth.scss";

import drawerIcon  from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon    from "../assets/lineicons_cart-1.svg";
import searchIcon  from "../assets/icon.svg";

const ORIGINAL_MARKUP = 0.10;
const PIX_DISCOUNT    = 0.10;
const INSTALLMENTS    = 10;

function formatBRL(v) {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0); }
  catch { return `R$ ${(v ?? 0).toFixed(2)}`; }
}

export default function Product() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const { addToCart, isLoggedIn, logout, authUser } = useStore();
  const auth    = useAuthModal();

  const [p, setP]           = useState(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize]     = useState(null);

  const [q, setQ]                   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef              = useRef(null);

  const [reviews, setReviews]       = useState([]);
  const [myRating, setMyRating]     = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment]   = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg]   = useState("");
  const [reviewError, setReviewError] = useState("");

  const recentTags = [
    "Chuteira Adulto", "Chuteira Infantil", "Meião GMA",
    "Luva Goleiro", "Calça Térmica GMA", "Feminino", "Masculino",
  ];

  useEffect(() => {
    setLoading(true);
    api.getProduct(id)
      .then((data) => {
        setP(data);
        if (data?.sizes?.length) setSize(data.sizes[0]);
        else setSize(null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.getReviews(id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn || !authUser || reviews.length === 0) return;
    const mine = reviews.find((r) => r.user?._id?.toString() === authUser._id?.toString());
    if (mine) {
      setMyRating(mine.rating);
      setMyComment(mine.comment ?? "");
    }
  }, [reviews, isLoggedIn, authUser]);

  const basePrice     = useMemo(() => Number(p?.price ?? 0), [p]);
  const originalPrice = useMemo(() => basePrice * (1 + ORIGINAL_MARKUP), [basePrice]);
  const pixPrice      = useMemo(() => basePrice * (1 - PIX_DISCOUNT), [basePrice]);
  const installment   = useMemo(() => pixPrice / INSTALLMENTS, [pixPrice]);

  const ratingAvg   = useMemo(() => Math.min(5, Math.max(0, Number(p?.rating?.rate ?? 0))), [p]);
  const ratingCount = useMemo(() => Number(p?.rating?.count ?? 0), [p]);

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
    nav(`/catalog?q=${encodeURIComponent(query ?? "")}`);
    setSearchOpen(false);
  };

  const handleProfileClick = () => {
    if (isLoggedIn) logout();
    else auth.openAuth("login");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { auth.openAuth("login"); return; }
    if (myRating === 0) { setReviewError("Selecione uma nota de 1 a 5."); return; }
    setReviewLoading(true); setReviewError(""); setReviewMsg("");
    try {
      await api.submitReview(id, myRating, myComment);
      setReviewMsg("Avaliação salva com sucesso!");
      const [newReviews, newProduct] = await Promise.all([
        api.getReviews(id),
        api.getProduct(id),
      ]);
      setReviews(newReviews);
      setP(newProduct);
      setTimeout(() => setReviewMsg(""), 4000);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    setReviewLoading(true); setReviewError(""); setReviewMsg("");
    try {
      await api.deleteReview(id);
      setMyRating(0); setMyComment("");
      const [newReviews, newProduct] = await Promise.all([
        api.getReviews(id),
        api.getProduct(id),
      ]);
      setReviews(newReviews);
      setP(newProduct);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="product">Carregando...</div>;
  if (!p)      return <div className="product">Produto não encontrado.</div>;

  const sizes = p.sizes ?? [];
  const hasAlreadyReviewed = isLoggedIn && reviews.some(
    (r) => r.user?._id?.toString() === authUser?._id?.toString()
  );

  return (
    <div className="product">

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
      <section className="pHero">
        <div className="pHero__wrap">
          <div className="pHero__brand">****************</div>

          <h1 className="pTitle">{p.title}</h1>

          {/* Rating */}
          <div className="pRating">
            <div className="pRating__stars" aria-label={`Avaliação média ${ratingAvg.toFixed(1)} de 5`}>
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = ratingAvg >= i + 1;
                const half   = !filled && ratingAvg > i;
                return (
                  <span key={i} className={`pStar ${filled ? "isFilled" : ""} ${half ? "isHalf" : ""}`}>★</span>
                );
              })}
            </div>
            <div className="pRating__text">
              {ratingCount > 0 ? `${ratingCount} avaliação${ratingCount > 1 ? "ões" : ""}` : "Sem avaliações"}
            </div>
          </div>

          {/* Tamanhos — dinâmicos do MongoDB */}
          {sizes.length > 0 && (
            <div className="pSizes">
              <div className="pSizes__label">Tamanho:</div>
              <div className="pSizes__grid">
                {sizes.map((n) => (
                  <button key={n} type="button"
                    className={`pSize ${size === n ? "isActive" : ""}`}
                    onClick={() => setSize(n)}
                    aria-pressed={size === n}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preço */}
          <div className="pPrice">
            <div className="pPrice__from">
              <span className="pPrice__fromLabel">de</span>{" "}
              <span className="pPrice__fromValue">{formatBRL(originalPrice)}</span>{" "}
              <span className="pPrice__fromLabel">por apenas</span>
            </div>
            <div className="pPrice__pix">
              <span className="pPrice__pixRS">R$</span>
              <span className="pPrice__pixValue">{pixPrice.toFixed(2).replace(".", ",")}</span>
              <span className="pPrice__pixLabel">no</span>
              <span className="pPrice__pixMethod">PIX</span>
            </div>
            <div className="pPrice__inst">
              ou <strong>{INSTALLMENTS}x</strong> de <strong>{formatBRL(installment)}</strong> sem juros
            </div>

            <div className="pBuyRow">
              <button className="pBuy" type="button"
                onClick={() => { addToCart({ ...p, size }); nav("/cart"); }}>
                Comprar
              </button>
              <button className="pBuyCart" type="button"
                onClick={() => { addToCart({ ...p, size }); }}
                aria-label="Adicionar ao carrinho">
                <img src={cartIcon} alt="" />
              </button>
            </div>
          </div>

          <div className="pHero__media">
            <img src={p.image} alt={p.title} />
          </div>

          {/* Drawer */}
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

          <div className="pPromo">
            <span className="pPromo__strong">Registre-se</span> e ganhe{" "}
            <span className="pPromo__strong">10%</span> de desconto usando o cupom{" "}
            <span className="pPromo__strong">COMPRA1</span> na sua primeira compra feita pelo{" "}
            <span className="pPromo__strong">site</span>.
          </div>
        </div>
      </section>

      {/* ===== DESCRIÇÃO ===== */}
      <section className="pContent">
        <div className="pContent__inner">
          <div className="pDesc" id="descricao">
            <div className="pDesc__title">Descrição do Produto:</div>
            <div className="pDesc__text">{p.description}</div>
          </div>
        </div>
      </section>

      {/* ===== AVALIAÇÕES ===== */}
      <section className="pReviews">
        <div className="pReviews__inner">
          <div className="pReviews__title">Avaliações:</div>
          <div className="pReviews__sub">O que os clientes estão dizendo sobre o produto?</div>

          {/* ── Formulário de avaliação ── */}
          <div className="reviewForm">
            {!isLoggedIn ? (
              <div className="reviewForm__login">
                <span>Faça </span>
                <button type="button" className="reviewForm__loginLink"
                  onClick={() => auth.openAuth("login")}>login</button>
                <span> para avaliar este produto.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="reviewForm__form">
                <div className="reviewForm__stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button"
                      className={`reviewForm__star ${(hoverRating || myRating) >= n ? "isActive" : ""}`}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setMyRating(n)}
                      aria-label={`Nota ${n}`}>
                      ★
                    </button>
                  ))}
                  <span className="reviewForm__ratingLabel">
                    {hoverRating || myRating
                      ? ["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"][hoverRating || myRating]
                      : "Selecione uma nota"}
                  </span>
                </div>

                <div className="reviewForm__commentBox">
                  <textarea className="reviewForm__comment"
                    placeholder="Comentário (opcional)..."
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    rows={3} maxLength={500} />
                </div>

                {reviewError && <div className="authError" style={{ marginBottom: 8 }}>{reviewError}</div>}
                {reviewMsg   && <div className="reviewForm__success">{reviewMsg}</div>}

                <div className="reviewForm__actions">
                  <button type="submit" className="reviewForm__submit" disabled={reviewLoading}>
                    {reviewLoading ? "Salvando..." : hasAlreadyReviewed ? "Atualizar avaliação" : "Enviar avaliação"}
                  </button>
                  {hasAlreadyReviewed && (
                    <button type="button" className="reviewForm__delete" disabled={reviewLoading}
                      onClick={handleDeleteReview}>
                      Remover
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* ── Lista de avaliações ── */}
          {reviews.length === 0 ? (
            <div className="pReviews__empty">
              Ainda não há avaliações. Seja o primeiro a avaliar!
            </div>
          ) : (
            <div className="reviewList">
              {reviews.map((r) => (
                <div key={r._id} className="reviewItem">
                  <div className="reviewItem__header">
                    <span className="reviewItem__author">{r.user?.name ?? "Usuário"}</span>
                    <span className="reviewItem__stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`reviewItem__star ${i < r.rating ? "isFilled" : ""}`}>★</span>
                      ))}
                    </span>
                    <span className="reviewItem__date">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {r.comment && <div className="reviewItem__comment">{r.comment}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="footerbar" />
    </div>
  );
}