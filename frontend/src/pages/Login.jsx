import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [f, setF] = useState({
    role: "farmer",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const nav = useNavigate();

  const handleChange = (e) => {
    setF((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        role: f.role,
        email: f.email.trim().toLowerCase(),
        password: f.password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("The backend returned an invalid login response.");
      }

      // Save the user and JWT token.
      login(user, token);

      // Open the dashboard.
      nav("/dashboard", { replace: true });
    } catch (err) {
      console.error(
        "Login error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <form className="form" onSubmit={handleSubmit}>
        <h1>
          {f.role === "farmer" ? "👨‍🌾 Farmer" : "🛒 Buyer"} Login
        </h1>

        {error && (
          <div
            role="alert"
            style={{
              padding: "12px",
              marginBottom: "16px",
              borderRadius: "8px",
              background: "#fff1f0",
              color: "#a12622",
            }}
          >
            {error}
          </div>
        )}

        <label htmlFor="role">Login as</label>
        <select
          id="role"
          name="role"
          value={f.role}
          onChange={handleChange}
        >
          <option value="farmer">Farmer</option>
          <option value="buyer">Buyer</option>
        </select>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="Enter your email"
          value={f.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          placeholder="Enter your password"
          value={f.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}