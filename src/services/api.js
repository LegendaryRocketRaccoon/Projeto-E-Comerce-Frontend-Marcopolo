const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";


const token = {
  getAccess:  () => localStorage.getItem("accessToken"),
  getRefresh: () => localStorage.getItem("refreshToken"),
  setAccess:  (t) => localStorage.setItem("accessToken", t),
  setRefresh: (t) => localStorage.setItem("refreshToken", t),
  clearAll:   () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authUser");
  },
};


let _refreshing = null;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const makeHeaders = (extra = {}) => {
    const h = { "Content-Type": "application/json", ...extra };
    const at = token.getAccess();
    if (at) h["Authorization"] = `Bearer ${at}`;
    return h;
  };

  let res = await fetch(url, { ...options, headers: makeHeaders(options.headers) });

  if (res.status === 401) {
    const rt = token.getRefresh();
    if (rt) {
      if (!_refreshing) {
        _refreshing = fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        })
          .then(async (r) => {
            if (!r.ok) throw new Error("refresh_failed");
            const data = await r.json();
            token.setAccess(data.accessToken);
            token.setRefresh(data.refreshToken);
            return data.accessToken;
          })
          .catch(() => { token.clearAll(); return null; })
          .finally(() => { _refreshing = null; });
      }

      const newAt = await _refreshing;
      if (newAt) {
        res = await fetch(url, {
          ...options,
          headers: makeHeaders({ ...options.headers, Authorization: `Bearer ${newAt}` }),
        });
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}


function normalizeProduct(p) {
  if (!p) return null;

  const categoryObj  = p.category ?? null;
  const categoryName =
    typeof categoryObj === "object" && categoryObj !== null
      ? (categoryObj.name ?? "")
      : (categoryObj ?? "");

  return {
    id:          p._id?.toString() ?? p.id,
    _id:         p._id?.toString() ?? p.id,
    title:       p.title        ?? "",
    price:       p.price        ?? 0,
    description: p.description  ?? "",
    image:       p.imageUrl     ?? p.image ?? "",
    imageUrl:    p.imageUrl     ?? p.image ?? "",
    sizes:       p.sizes        ?? [],
    category:    categoryName,
    categoryObj: categoryObj,
    rating: {
      rate:  p.rating?.avg   ?? 0,
      count: p.rating?.total ?? 0,
      avg:   p.rating?.avg   ?? 0,
      total: p.rating?.total ?? 0,
      sum:   p.rating?.sum   ?? 0,
    },
  };
}

function normalizeCartItem(item) {
  if (!item) return null;
  const product = item.product ? normalizeProduct(item.product) : null;
  return {
    productId: item.productId,
    quantity:  item.quantity ?? 1,
    size:      item.size ?? null,
    product,
    id:    item.productId,
    qty:   item.quantity ?? 1,
    title: product?.title ?? "",
    price: product?.price ?? 0,
    image: product?.image ?? "",
    sizes: product?.sizes ?? [],
  };
}


export const api = {

  getProducts: async ({ search, sort, limit } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort)   params.set("sort", sort);
    if (limit)  params.set("limit", String(limit));
    const qs = params.toString();
    const data = await request(`/products${qs ? `?${qs}` : ""}`);
    return Array.isArray(data) ? data.map(normalizeProduct) : [];
  },

  getProduct: async (id) => {
    const data = await request(`/products/${id}`);
    return normalizeProduct(data);
  },

  getCategories: async () => {
    const data = await request("/products/categories");
    return Array.isArray(data) ? data : [];
  },

  getByCategory: async (categoryId, { sort, limit } = {}) => {
    const params = new URLSearchParams();
    if (sort)  params.set("sort", sort);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    const data = await request(`/products/category/${categoryId}${qs ? `?${qs}` : ""}`);
    return Array.isArray(data) ? data.map(normalizeProduct) : [];
  },

  login: async (email, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    token.setAccess(data.accessToken);
    token.setRefresh(data.refreshToken);
    localStorage.setItem("authUser", JSON.stringify(data.user));
    return data;
  },

  register: async (name, email, password) => {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    token.setAccess(data.accessToken);
    token.setRefresh(data.refreshToken);
    localStorage.setItem("authUser", JSON.stringify(data.user));
    return data;
  },

  logout: async () => {
    const rt = token.getRefresh();
    try {
      if (rt) await request("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: rt }),
      });
    } finally {
      token.clearAll();
    }
  },

  getAuthUser: () => {
    try { return JSON.parse(localStorage.getItem("authUser")) ?? null; }
    catch { return null; }
  },

  isLoggedIn: () => Boolean(token.getAccess()),


  loginWithGoogle: () => {
    window.location.href = `${BASE_URL}/auth/google`;
  },


  handleGoogleCallback: () => {
    const params = new URLSearchParams(window.location.search);

    const accessToken  = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const userName     = params.get("userName");
    const userEmail    = params.get("userEmail");
    const userId       = params.get("userId");
    const authError    = params.get("auth_error");

    if (accessToken || authError) {
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }

    if (authError) {
      const messages = {
        google_cancelled:     "Login com Google cancelado.",
        google_token:         "Erro ao autenticar com Google. Tente novamente.",
        google_invalid_token: "Token do Google inválido.",
        google_server:        "Erro interno ao autenticar com Google.",
      };
      throw new Error(messages[authError] ?? "Erro no login com Google.");
    }

    if (!accessToken) return null;

    token.setAccess(accessToken);
    token.setRefresh(refreshToken);

    const user = { _id: userId, name: userName, email: userEmail };
    localStorage.setItem("authUser", JSON.stringify(user));

    return user;
  },


  forgotPassword: async (email) => {
    const data = await request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return data;
  },

  /**
   * Confirma o reset com o token recebido por e-mail.
   * @param {string} token
   * @param {string} email
   * @param {string} newPassword
   */
  resetPassword: async (resetToken, email, newPassword) => {
    const data = await request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: resetToken, email, newPassword }),
    });
    return data;
  },

  getCart: async () => {
    const data = await request("/cart");
    return Array.isArray(data) ? data.map(normalizeCartItem) : [];
  },

  addToCart: async (productId, quantity = 1, size = null) => {
    const body = { productId, quantity };
    if (size !== null && size !== undefined) body.size = String(size);
    return request("/cart", { method: "POST", body: JSON.stringify(body) });
  },

  updateCartItem: async (productId, quantity, size = null) => {
    const qs = size != null ? `?size=${encodeURIComponent(size)}` : "";
    return request(`/cart/${productId}${qs}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  },

  removeFromCart: async (productId, size = null) => {
    const qs = size != null ? `?size=${encodeURIComponent(size)}` : "";
    await request(`/cart/${productId}${qs}`, { method: "DELETE" });
  },

  clearCart: async () => { await request("/cart", { method: "DELETE" }); },

  getReviews: async (productId) => {
    const data = await request(`/reviews/${productId}`);
    return Array.isArray(data) ? data : [];
  },

  submitReview: async (productId, rating, comment = "") => {
    return request(`/reviews/${productId}`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    });
  },

  deleteReview: async (productId) => {
    await request(`/reviews/${productId}`, { method: "DELETE" });
  },
};