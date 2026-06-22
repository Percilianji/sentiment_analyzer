import { useEffect, useState } from "react";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import LoginPage from "./pages/Login/LoginPage";

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

  useEffect(() => {
    window.addEventListener("unipulse:session-expired", handleLogout);

    return () => {
      window.removeEventListener("unipulse:session-expired", handleLogout);
    };
  }, []);

  if (user) {
    return <DashboardPage user={user} onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={setUser} />;
}

export default App;
