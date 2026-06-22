import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../assets/unipulse-logo.png";
import { authApi } from "../../services/api";
import "./LoginPage.css";

function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(() => {
    const notice = sessionStorage.getItem("unipulse_login_notice");
    sessionStorage.removeItem("unipulse_login_notice");
    return notice || "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!credentials.email.trim() || !credentials.password) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await authApi.login({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      localStorage.setItem("unipulse_token", data.access_token);
      localStorage.setItem("unipulse_user", JSON.stringify(data.user));

      onLogin?.(data.user);
    } catch (loginError) {
      setError(loginError.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-panel" aria-label="UniPulse login">
        <div className="brand-lockup">
          <img src={logo} alt="UniPulse" className="brand-logo" />
          <p className="brand-kicker">Sentiment Intelligence</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <label className="field-group" htmlFor="email">
            <span>Email address</span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@unipulse.cm"
              value={credentials.email}
              onChange={handleChange}
            />
          </label>

          <label className="field-group" htmlFor="password">
            <span>Password</span>
            <div className="password-control">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                value={credentials.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="ghost-icon-button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </label>

          <div className="form-row">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="login-footer">Powered by UniPulse Analytics</p>
      </section>

      <section className="login-visual" aria-hidden="true">
        <div className="visual-shade" />
      </section>
    </main>
  );
}

export default LoginPage;
