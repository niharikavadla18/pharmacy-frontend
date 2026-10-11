import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "https://pharmacy-backend-1-wreu.onrender.com";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/user/login`, {
        email: email.trim(),
        password: password,
      });

      const data = response.data;

      // Read the role from the login response.
      const roleValue =
        data.role ??
        data.user?.role ??
        data.userRole ??
        data.user?.userRole ??
        "";

      const role = String(roleValue)
        .replace(/^ROLE_/i, "")
        .toUpperCase();

      // Stop if the backend did not return a role.
      if (role !== "ADMIN" && role !== "CUSTOMER") {
        console.error("Login response:", data);
        setMessage(
          "Login succeeded, but the user role was not returned correctly. Please check the backend login response."
        );
        return;
      }

      // Preserve the backend response and store the normalized role.
      const userData = {
        ...data,
        ...(data.user && typeof data.user === "object"
          ? data.user
          : {}),
        role: role,
      };

      // Keep the token if the backend returns it.
      const token = data.token ?? data.user?.token;

      if (token) {
        userData.token = token;
      }

      localStorage.setItem("user", JSON.stringify(userData));

      // Clear any old login information used by the application.
      window.dispatchEvent(new Event("storage"));

      if (role === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/customer-dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error);

      if (error.response?.status === 401) {
        setMessage("Invalid email or password.");
      } else if (error.response?.status === 403) {
        setMessage(
          "Access denied. Please check the backend login and security configuration."
        );
      } else {
        setMessage(
          error.response?.data?.message ||
            "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome Back</h1>
        <p>Login to your MediCare Pharmacy account</p>

        {message && (
          <div role="alert" className="login-message">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;