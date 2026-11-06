import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import "./style.css";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from "chart.js";
import "./style.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value || 0);

const initialAccounts = [
  { id: 1, name: "Cash", type: "Cash" },
  { id: 2, name: "Bank Account", type: "Bank" },
  { id: 3, name: "UPI", type: "Digital" }
];

const emptyForm = () => ({
  type: "expense",
  description: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  category: "Food",
  account: "Cash",
  recurring: false
});

export default function ExpenseDashboard() {
  const [transactions, setTransactions] = useState(() =>
    JSON.parse(localStorage.getItem("transactions") || "[]")
  );

  const [accounts, setAccounts] = useState(() =>
    JSON.parse(localStorage.getItem("accounts") || "null") ||
    initialAccounts
  );

  const [budget, setBudget] = useState(() =>
    Number(localStorage.getItem("budget") || 0)
  );

  const [dark, setDark] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  const [section, setSection] = useState("dashboard");
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [budgetInput, setBudgetInput] = useState(String(budget));

  // Save data in local storage
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("budget", String(budget));
    setBudgetInput(String(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem("darkMode", String(dark));
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  // Calculate income, expenses and balance
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expense;

  const savingRate =
    income > 0 ? Math.max(0, (balance / income) * 100) : 0;

  const remaining = budget - expense;

  const progress =
    budget > 0 ? Math.min(100, (expense / budget) * 100) : 0;

  // Search and filter transactions
  const filtered = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.description.toLowerCase().includes(search.toLowerCase()) &&
            (typeFilter === "all" || t.type === typeFilter) &&
            (categoryFilter === "all" || t.category === categoryFilter)
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, search, typeFilter, categoryFilter]
  );

  const categories = [...new Set(transactions.map((t) => t.category))];

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Category-wise expense calculation
  const categoryTotals = {};

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals[t.category] =
        (categoryTotals[t.category] || 0) + Number(t.amount);
    });

  // Monthly income and expense calculation
  const monthly = {};

  transactions.forEach((t) => {
    const key = t.date.slice(0, 7);

    monthly[key] ||= { income: 0, expense: 0 };

    monthly[key][t.type] += Number(t.amount);
  });

  const months = Object.keys(monthly).sort();

  // Open add transaction form
  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setModal(true);
  }

  // Open edit transaction form
  function openEdit(t) {
    setEditingId(t.id);
    setForm({ ...t, amount: String(t.amount) });
    setModal(true);
  }

  // Save transaction
  function saveTransaction(e) {
    e.preventDefault();

    const item = {
      ...form,
      id: editingId ?? Date.now(),
      amount: Number(form.amount),
      recurring: Boolean(form.recurring)
    };

    if (!item.description.trim() || item.amount <= 0) return;

    setTransactions((old) =>
      editingId
        ? old.map((t) => (t.id === editingId ? item : t))
        : [...old, item]
    );

    setModal(false);
  }

  // Delete transaction
  function deleteTransaction(id) {
    if (window.confirm("Delete this transaction?")) {
      setTransactions((old) => old.filter((t) => t.id !== id));
    }
  }

  // Add account
  function addAccount() {
    const name = window.prompt("Enter account name:");

    if (!name?.trim()) return;

    const type = window.prompt("Enter account type:", "Bank") || "Other";

    setAccounts((old) => [
      ...old,
      {
        id: Date.now(),
        name: name.trim(),
        type: type.trim()
      }
    ]);
  }

  // Export transactions as CSV
  function exportCSV() {
    if (!transactions.length) {
      alert("No transactions to export.");
      return;
    }

    const rows = [
      [
        "Date",
        "Description",
        "Category",
        "Account",
        "Type",
        "Amount",
        "Recurring"
      ],
      ...transactions.map((t) => [
        t.date,
        t.description,
        t.category,
        t.account,
        t.type,
        t.amount,
        t.recurring ? "Yes" : "No"
      ])
    ];

    const csv = rows
      .map((row) =>
        row
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = "expense-transactions.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  // Reset application data
  function resetData() {
    if (
      confirm(
        "This will delete all transactions, accounts and budget. Continue?"
      )
    ) {
      setTransactions([]);
      setAccounts(initialAccounts);
      setBudget(0);
    }
  }

  const titles = {
    dashboard: "Dashboard",
    transactions: "Transactions",
    budget: "Budget",
    accounts: "Accounts",
    reports: "Reports"
  };

  const nav = [
    ["dashboard", "📊 Dashboard"],
    ["transactions", "💳 Transactions"],
    ["budget", "🎯 Budget"],
    ["accounts", "🏦 Accounts"],
    ["reports", "📈 Reports"]
  ];

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">₹</div>

          <div>
            <h2>
              Expense<span>Track</span>
            </h2>
            <small>Finance Manager</small>
          </div>
        </div>

        <nav>
          {nav.map(([key, label]) => (
            <button
              key={key}
              className={`nav-item ${
                section === key ? "active" : ""
              }`}
              onClick={() => setSection(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button onClick={() => setDark((v) => !v)}>
            {dark ? "☀️" : "🌙"} Toggle Theme
          </button>

          <button onClick={exportCSV}>📥 Export CSV</button>

          <button onClick={resetData}>⚠ Reset Data</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main">
        <header className="header">
          <div>
            <h1>{titles[section]}</h1>
            <p>Manage your finances smartly and efficiently.</p>
          </div>

          <button className="add-btn" onClick={openAdd}>
            + Add Transaction
          </button>
        </header>

        {/* Dashboard */}
        {section === "dashboard" && (
          <>
            <div className="summary-grid">
              <Summary
                title="Total Income"
                value={money(income)}
                icon="💰"
                kind="income"
              />

              <Summary
                title="Total Expenses"
                value={money(expense)}
                icon="💸"
                kind="expense"
              />

              <Summary
                title="Balance"
                value={money(balance)}
                icon="💳"
                kind="balance"
              />

              <Summary
                title="Savings Rate"
                value={`${savingRate.toFixed(1)}%`}
                icon="🎯"
                kind="saving"
              />
            </div>

            <div className="dashboard-grid">
              <div className="panel chart-panel">
                <div className="panel-header">
                  <div>
                    <h3>Expense by Category</h3>
                    <p>Where your money goes</p>
                  </div>
                </div>

                <div className="chart-container">
                  {Object.keys(categoryTotals).length ? (
                    <Doughnut
                      data={{
                        labels: Object.keys(categoryTotals),
                        datasets: [
                          {
                            data: Object.values(categoryTotals)
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: "bottom" }
                        }
                      }}
                    />
                  ) : (
                    <Empty>No expense data yet.</Empty>
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Budget Overview</h3>
                    <p>Monthly spending</p>
                  </div>
                </div>

                <BudgetProgress
                  budget={budget}
                  expense={expense}
                  remaining={remaining}
                  progress={progress}
                />

                <button
                  className="secondary-btn"
                  onClick={() => setSection("budget")}
                >
                  Manage Budget
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Recent Transactions</h3>
                  <p>Your latest financial activities</p>
                </div>

                <button
                  className="text-btn"
                  onClick={() => setSection("transactions")}
                >
                  View All
                </button>
              </div>

              {recent.length ? (
                recent.map((t) => (
                  <TransactionRow key={t.id} item={t} />
                ))
              ) : (
                <Empty>No transactions yet.</Empty>
              )}
            </div>
          </>
        )}

        {/* Transactions */}
        {section === "transactions" && (
          <div className="panel">
            <div className="filter-bar">
              <input
                placeholder="🔍 Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>

                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Account</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length ? (
                    filtered.map((t) => (
                      <tr key={t.id}>
                        <td>{t.date}</td>

                        <td>
                          <strong>{t.description}</strong>
                          {t.recurring && <small> 🔁 Recurring</small>}
                        </td>

                        <td>
                          <span className="category-tag">
                            {t.category}
                          </span>
                        </td>

                        <td>{t.account}</td>
                        <td>{t.type}</td>

                        <td
                          className={
                            t.type === "income"
                              ? "income-text"
                              : "expense-text"
                          }
                        >
                          {t.type === "income" ? "+" : "-"}
                          {money(t.amount)}
                        </td>

                        <td>
                          <button
                            className="action-btn"
                            onClick={() => openEdit(t)}
                          >
                            ✏️
                          </button>

                          <button
                            className="action-btn"
                            onClick={() => deleteTransaction(t.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <Empty>No transactions found.</Empty>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Budget */}
        {section === "budget" && (
          <div className="budget-layout">
            <div className="panel">
              <h3>Monthly Budget</h3>
              <p>Set your spending limit for the month.</p>

              <div className="form-group">
                <label>Budget Amount</label>

                <input
                  type="number"
                  min="0"
                  value={budgetInput}
                  placeholder="Enter budget"
                  onChange={(e) => setBudgetInput(e.target.value)}
                />
              </div>

              <button
                className="add-btn"
                onClick={() => {
                  const n = Number(budgetInput);

                  if (n < 0) {
                    return alert("Budget cannot be negative.");
                  }

                  setBudget(n);
                  alert("Budget saved successfully.");
                }}
              >
                Save Budget
              </button>
            </div>

            <div className="panel">
              <h3>Budget Status</h3>

              <div className="big-number">{money(budget)}</div>

              <BudgetProgress
                budget={budget}
                expense={expense}
                remaining={remaining}
                progress={progress}
              />
            </div>
          </div>
        )}

        {/* Accounts */}
        {section === "accounts" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Accounts</h3>
                <p>Track money across multiple accounts.</p>
              </div>

              <button className="add-btn" onClick={addAccount}>
                + Add Account
              </button>
            </div>

            <div className="accounts-grid">
              {accounts.map((a) => {
                const total = transactions
                  .filter((t) => t.account === a.name)
                  .reduce(
                    (s, t) =>
                      s +
                      (t.type === "income" ? 1 : -1) *
                        Number(t.amount),
                    0
                  );

                return (
                  <div className="account-card" key={a.id}>
                    <h4>{a.name}</h4>
                    <p>{a.type}</p>
                    <div className="account-balance">
                      {money(total)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reports */}
        {section === "reports" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Financial Reports</h3>
                <p>Analyze your financial activity.</p>
              </div>
            </div>

            <div className="chart-container large-chart">
              {months.length ? (
                <Bar
                  data={{
                    labels: months,
                    datasets: [
                      {
                        label: "Income",
                        data: months.map((m) => monthly[m].income)
                      },
                      {
                        label: "Expenses",
                        data: months.map((m) => monthly[m].expense)
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" }
                    }
                  }}
                />
              ) : (
                <Empty>No report data yet.</Empty>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Transaction Modal */}
      {modal && (
        <div
          className="modal show"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setModal(false);
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {editingId ? "Edit Transaction" : "Add Transaction"}
              </h2>

              <button
                className="close-btn"
                onClick={() => setModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveTransaction}>
              <div className="form-group">
                <label>Transaction Type</label>

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>

                <input
                  required
                  value={form.description}
                  placeholder="e.g. Grocery shopping"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value
                    })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Date</label>

                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>

                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {[
                      "Food",
                      "Transport",
                      "Shopping",
                      "Bills",
                      "Entertainment",
                      "Health",
                      "Education",
                      "Salary",
                      "Freelance",
                      "Investment",
                      "Other"
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Account</label>

                  <select
                    value={form.account}
                    onChange={(e) =>
                      setForm({ ...form, account: e.target.value })
                    }
                  >
                    {accounts.map((a) => (
                      <option key={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recurring: e.target.checked
                    })
                  }
                />

                <label>Recurring transaction</label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="add-btn">
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="developer-tag">
        Designed and Developed by <strong>Harshal Balla</strong>
      </div>
    </div>
  );
}

// Summary card component
function Summary({ title, value, icon, kind }) {
  return (
    <div className={`summary-card ${kind}`}>
      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>

      <div className="card-icon">{icon}</div>
    </div>
  );
}

// Empty message component
function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

// Transaction row component
function TransactionRow({ item: t }) {
  return (
    <div className="transaction-row">
      <div>
        <strong>{t.description}</strong>
        <small>
          {t.date} • {t.category}
        </small>
      </div>

      <strong
        className={
          t.type === "income" ? "income-text" : "expense-text"
        }
      >
        {t.type === "income" ? "+" : "-"}
        {money(t.amount)}
      </strong>
    </div>
  );
}

// Budget progress component
function BudgetProgress({
  budget,
  expense,
  remaining,
  progress
}) {
  return (
    <div className="budget-box">
      <div className="budget-top">
        <span>Monthly Budget</span>
        <strong>{money(budget)}</strong>
      </div>

      <div className="progress">
        <div style={{ width: `${progress}%` }} />
      </div>

      <div className="budget-info">
        <span>Spent: {money(expense)}</span>
        <span>Remaining: {money(remaining)}</span>
      </div>
    </div>
  );
} 