import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../assets/unipulse-logo.png";
import { authApi } from "../../services/api";
import "./LoginPage.css";

function SetupPasswordPage({ onComplete }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token || !email) {
      setError("This password setup link is incomplete.");
      return;
    }

    if (passwords.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (passwords.password !== passwords.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.setupPassword({
        email,
        token,
        password: passwords.password,
      });
      setMessage("Password set successfully. You can sign in now.");
      setTimeout(() => {
        onComplete?.();
      }, 1200);
    } catch (setupError) {
      setError(setupError.message || "Could not set password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-panel" aria-label="Set password">
        <div className="brand-lockup">
          <img src={logo} alt="UniPulse" className="brand-logo" />
          <p className="brand-kicker">Account Setup</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="form-success" role="status">
              {message}
            </p>
          )}

          <label className="field-group" htmlFor="setup-email">
            <span>Email address</span>
            <input id="setup-email" type="email" value={email} disabled />
          </label>

          <label className="field-group" htmlFor="setup-password">
            <span>Password</span>
            <div className="password-control">
              <input
                id="setup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create password"
                value={passwords.password}
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

          <label className="field-group" htmlFor="confirm-password">
            <span>Confirm password</span>
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm password"
              value={passwords.confirmPassword}
              onChange={handleChange}
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Set password"}
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

export default SetupPasswordPage;
