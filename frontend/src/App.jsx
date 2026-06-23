import { useEffect, useState } from "react";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import LoginPage from "./pages/Login/LoginPage";
import SetupPasswordPage from "./pages/Login/SetupPasswordPage";

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("unipulse_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("unipulse_token");
    localStorage.removeItem("unipulse_user");
    setUser(null);
  };
  const handleUserChange = (updatedUser) => {
    localStorage.setItem("unipulse_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  useEffect(() => {
    window.addEventListener("unipulse:session-expired", handleLogout);

    return () => {
      window.removeEventListener("unipulse:session-expired", handleLogout);
    };
  }, []);

  if (user) {
    return <DashboardPage user={user} onLogout={handleLogout} onUserChange={handleUserChange} />;
  }

  if (window.location.pathname === "/setup-password") {
    return (
      <SetupPasswordPage
        onComplete={() => {
          window.history.replaceState({}, "", "/");
          sessionStorage.setItem("unipulse_login_notice", "Password set. Please sign in.");
          window.location.reload();
        }}
      />
    );
  }

  return <LoginPage onLogin={setUser} />;
}

export default App;
