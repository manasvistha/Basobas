import LoginForm from "../_components/login_form";

export default function LoginPage() {
  return (
    <div className="auth-frame">
      <div className="auth-card">
        <aside className="auth-left">
          <div className="auth-left-img" />
          <div className="auth-left-overlay" />
          <div className="auth-left-content">
            <h1 className="auth-left-title">Welcome Back</h1>
            <p className="auth-left-text">
              Sign in to pick up where you left off — your saved rooms, messages, and
              listings are waiting for you.
            </p>
          </div>
          <span className="auth-brand-chip">presented by BasoBas</span>
        </aside>

        <LoginForm />
      </div>
    </div>
  );
}
