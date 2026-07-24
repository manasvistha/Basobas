import RegisterForm from "../_components/signup_form";

export default function RegisterPage() {
  return (
    <div className="auth-frame">
      <div className="auth-card">
        <aside className="auth-left">
          <div className="auth-left-img" />
          <div className="auth-left-overlay" />
          <div className="auth-left-content">
            <h1 className="auth-left-title">Let&apos;s Get Started</h1>
            <p className="auth-left-text">
              Create your free BasoBas account to list properties, save favourites, and
              connect with verified renters and roommates.
            </p>
          </div>
          <span className="auth-brand-chip">presented by BasoBas</span>
        </aside>

        <RegisterForm />
      </div>
    </div>
  );
}
