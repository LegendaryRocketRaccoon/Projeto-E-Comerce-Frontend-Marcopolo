import googleIcon from "../assets/icon_google.svg";

export default function AuthModal({
  authOpen, authTab, authView, authRef,
  name, setName,
  email, setEmail,
  password, setPassword,
  confirmPassword, setConfirmPassword,
  forgotEmail, setForgotEmail,
  authLoading, authError,
  setAuthTab, setAuthView, setAuthError, closeAuth,
  handleSubmitLogin, handleSubmitRegister,
  handleSubmitForgot, handleSubmitReset,
  handleGoogleLogin,
}) {

  if (authView === "forgot_sent") {
    return (
      <ModalShell authOpen={authOpen} authRef={authRef} title="Redefinir senha">
        <div className="authForm">
          <div className="authForm__inner" style={{ height: "auto", padding: "32px 10px 10px" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 40 }}>📧</div>
              <div className="authLabel" style={{ fontSize: 14, lineHeight: 1.5 }}>
                Enviamos as instruções para<br /><strong>{forgotEmail}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#818181", lineHeight: 1.5 }}>
                Verifique sua caixa de entrada e spam.<br />O link expira em 1 hora.
              </div>
            </div>
          </div>
          <div className="authFooter">
            <button className="authSubmit" type="button"
              onClick={() => { setAuthView("login"); }}>
              Voltar ao login
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  if (authView === "reset_done") {
    return (
      <ModalShell authOpen={authOpen} authRef={authRef} title="Nova senha">
        <div className="authForm">
          <div className="authForm__inner" style={{ height: "auto", padding: "32px 10px 10px" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 40 }}>✅</div>
              <div className="authLabel" style={{ fontSize: 14 }}>Senha redefinida com sucesso!</div>
            </div>
          </div>
          <div className="authFooter">
            <button className="authSubmit" type="button"
              onClick={() => { setAuthView("login"); }}>
              Entrar
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  if (authView === "reset") {
    return (
      <ModalShell authOpen={authOpen} authRef={authRef} title="Nova senha">
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
      </ModalShell>
    );
  }

  if (authView === "forgot") {
    return (
      <ModalShell authOpen={authOpen} authRef={authRef} title="Redefinir senha">
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
            <button type="button" className="authForgot" style={{ marginTop: -10 }}
              onClick={() => { setAuthView("login"); setAuthError(""); }}>
              Voltar ao login
            </button>
          </div>
        </form>
      </ModalShell>
    );
  }

  const isRegister = authView === "register";

  return (
    <div className={`authOverlay ${authOpen ? "isOpen" : ""}`} aria-hidden={!authOpen}>
      <div className={`authModal ${authOpen ? "isOpen" : ""}`}
        role="dialog" aria-modal="true" ref={authRef}>

        {/* Tabs (Figma) */}
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
          <div className={`authUnderline ${isRegister ? "isRegister" : "isLogin"}`} />
        </div>

        <form className={`authForm ${isRegister ? "isRegister" : ""}`}
          onSubmit={isRegister ? handleSubmitRegister : handleSubmitLogin}>
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
                  <input type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
      </div>
    </div>
  );
}

function ModalShell({ authOpen, authRef, title, children }) {
  return (
    <div className={`authOverlay ${authOpen ? "isOpen" : ""}`}>
      <div className={`authModal ${authOpen ? "isOpen" : ""}`}
        role="dialog" aria-modal="true" ref={authRef}>
        <div className="authTabs" style={{ justifyContent: "center", gap: 0 }}>
          <span className="authTab isActive" style={{ cursor: "default", paddingBottom: 18 }}>
            {title}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}