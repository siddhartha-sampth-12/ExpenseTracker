import React, { useState } from "react";

import Login from "./components/login";
import ExpenseDashboard from "./ExpenseDashboard";

export default function App() {

  // Check whether a user is already logged in
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("expenseUser") || "null"
      );
    } catch {
      return null;
    }
  });

  // Handle successful login or registration
  function handleLogin(userData) {
    localStorage.setItem(
      "expenseUser",
      JSON.stringify(userData)
    );

    setUser(userData);
  }

  // Handle logout
  function handleLogout() {
    localStorage.removeItem("expenseUser");
    setUser(null);
  }

  // Show Login / Registration page
  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        initialPage="login"
      />
    );
  }

  // Show Expense Dashboard
  return (
    <div className="authenticated-app">

      {/* User Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "15px",
          padding: "12px 25px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb"
        }}
      >
        <span
          style={{
            fontWeight: "600",
            color: "#334155"
          }}
        >
          Welcome, {user.name || user.email}!
        </span>

        <button
          onClick={handleLogout}
          style={{
            background: "#ef4444",
            color: "#ffffff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Logout
        </button>
      </header>

      {/* Main Expense Dashboard */}
      <ExpenseDashboard />

    </div>
  );
}