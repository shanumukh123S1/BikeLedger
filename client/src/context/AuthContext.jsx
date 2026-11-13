
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify existing login session
  useEffect(() => {
    const verifySession = async () => {
      const token = sessionStorage.getItem("bikeledger_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setStaff(response.data.staff);
      } catch (error) {
        sessionStorage.removeItem("bikeledger_token");
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // Login function
  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password
    });

    sessionStorage.setItem(
      "bikeledger_token",
      response.data.token
    );

    setStaff(response.data.staff);

    return response.data;
  };

  // Logout function
  const logout = () => {
    sessionStorage.removeItem("bikeledger_token");
    setStaff(null);
  };

  return (
    <AuthContext.Provider
      value={{
        staff,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(staff)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
