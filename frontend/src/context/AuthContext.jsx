import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const AuthContext = createContext(null);

const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem("user");

    if (!savedUser || savedUser === "undefined") {
      return null;
    }

    return JSON.parse(savedUser);
  } catch (error) {
    console.error("Failed to load saved user:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("agc_token");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getSavedUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = (userData, token) => {
    if (!token || !userData) {
      throw new Error("User information or authentication token is missing.");
    }

    // Use one consistent token key throughout the application.
    localStorage.setItem("token", token);
    localStorage.removeItem("agc_token");

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("agc_token");
    setUser(null);
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;