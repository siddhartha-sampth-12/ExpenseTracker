
import React, { useState } from "react";
import "./Auth.css";

export default function Register({ onLogin, onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    const users = JSON.parse(
      localStorage.getItem("expenseUsers") || "[]"
    );

    if (
      users.some(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      )
    ) {
      setError("Email is already registered!");
      return;
    }

    const user = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    };

    users.push(user);

    localStorage.setItem("expenseUsers", JSON.stringify(users));
    localStorage.setItem("expenseUser", JSON.stringify(user));

    onLogin(user);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">₹</div>

        <h1>Create Account</h1>
        <p>Start managing your finances today</p>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button">
            Create Account
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?
          <button type="button" onClick={onBack}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
