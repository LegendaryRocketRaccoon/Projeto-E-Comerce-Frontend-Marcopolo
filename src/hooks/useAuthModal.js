import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";
import { useStore } from "../store.jsx";

export function useAuthModal() {
  const { login, register, isLoggedIn, logout } = useStore();

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab,  setAuthTab]  = useState("login");
  const [authView, setAuthView] = useState("login");

  const authRef = useRef(null);

  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotEmail,     setForgotEmail]     = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError,   setAuthError]   = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const resetForm = useCallback(() => {
    setName(""); setEmail(""); setPassword("");
    setConfirmPassword(""); setForgotEmail("");
    setAuthError(""); setAuthSuccess("");
    setAuthLoading(false);
  }, []);

  const openAuth = useCallback((tab = "login") => {
    resetForm();
    setAuthTab(tab);
    setAuthView(tab);
    setAuthOpen(true);
  }, [resetForm]);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    setTimeout(resetForm, 300);
  }, [resetForm]);

  useEffect(() => {
    if (!authOpen) return;
    const t = setTimeout(() => {
      authRef.current?.querySelector("input")?.focus();
    }, 220);
    return () => clearTimeout(t);
  }, [authOpen, authView]);

  const handleGoogleCallback = useCallback((onSuccess) => {
    try {
      const user = api.handleGoogleCallback();
      if (user) {
        onSuccess?.(user);
        setAuthSuccess(`Bem-vindo, ${user.name}!`);
        setTimeout(() => setAuthSuccess(""), 4000);
      }
    } catch (err) {
      setAuthError(err.message);
      openAuth("login");
    }
  }, [openAuth]);

  const handleResetCallback = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const rt = params.get("reset_token");
    const re = params.get("email");
    if (rt && re) {
      sessionStorage.setItem("resetToken", rt);
      sessionStorage.setItem("resetEmail", re);
      window.history.replaceState({}, "", window.location.pathname);
      openAuth("login");
      setAuthView("reset");
    }
  }, [openAuth]);

  const handleSubmitLogin = useCallback(async (e) => {
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
  }, [login, email, password, closeAuth]);

  const handleSubmitRegister = useCallback(async (e) => {
    e.preventDefault();
    setAuthError("");
    if (password !== confirmPassword) { setAuthError("As senhas não coincidem."); return; }
    setAuthLoading(true);
    try {
      await register(name || email.split("@")[0], email, password);
      closeAuth();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }, [register, name, email, password, confirmPassword, closeAuth]);

  const handleSubmitForgot = useCallback(async (e) => {
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
  }, [forgotEmail]);

  const handleSubmitReset = useCallback(async (e) => {
    e.preventDefault();
    setAuthError("");
    if (password !== confirmPassword) { setAuthError("As senhas não coincidem."); return; }
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
  }, [password, confirmPassword]);

  const handleGoogleLogin = useCallback(() => {
    api.loginWithGoogle();
  }, []);

  return {
    authOpen, authTab, authView, authRef,
    name, setName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    forgotEmail, setForgotEmail,
    authLoading, authError, authSuccess,
    openAuth, closeAuth,
    setAuthTab, setAuthView, setAuthError,
    handleSubmitLogin, handleSubmitRegister,
    handleSubmitForgot, handleSubmitReset,
    handleGoogleLogin,
    handleGoogleCallback, handleResetCallback,
  };
}