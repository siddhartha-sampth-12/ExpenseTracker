
import React, { useState } from "react";
import "./Auth.css";

export default function Login({
  onLogin,
  initialPage = "login",
  onPageChange
}) {
  const [page, setPage] = useState(initialPage);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function changePage(nextPage) {
    setPage(nextPage);
    setError("");
    onPageChange?.(nextPage);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const users = JSON.parse(
      localStorage.getItem("expenseUsers") || "[]"
    );

    if (page === "signup") {
      if (password.length < 6) {
        setError("Password must contain at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (users.some(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      )) {
        setError("This email is already registered.");
        return;
      }

      const newUser = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
      };

      users.push(newUser);

      localStorage.setItem("expenseUsers", JSON.stringify(users));
      onLogin(newUser);
      return;
    }

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );

    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    onLogin(user);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-logo">₹</div>

        <h1>
          {page === "login" ? "Welcome Back!" : "Create Account"}
        </h1>

        <p>
          {page === "login"
            ? "Login to your ExpenseTrack account"
            : "Start managing your finances today"}
        </p>

        <form onSubmit={handleSubmit}>

          {page === "signup" && (
            <>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={page === "signup" ? 6 : undefined}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {page === "signup" && (
            <>
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </>
          )}

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <button type="submit" className="auth-button">
            {page === "login" ? "Login" : "Create Account"}
          </button>

        </form>

        <div className="auth-switch">
          {page === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() =>
              changePage(page === "login" ? "signup" : "login")
            }
          >
            {page === "login" ? "Sign Up" : "Login"}
          </button>
        </div>

        <div className="auth-footer">
          © 2026 ExpenseTrack | Finance Manager
        </div>

      </div>
    </div>
  );
}
