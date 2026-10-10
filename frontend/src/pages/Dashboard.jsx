import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalCrops: 0,
    totalOrders: 0,
    newOrders: 0,
    totalSales: 0,
  });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isFarmer = user?.role === "farmer";

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setError("");

    try {
      if (isFarmer) {
        const [statsResponse, notificationsResponse] = await Promise.all([
          api.get("/orders/dashboard/stats"),
          api.get("/orders/notifications"),
        ]);

        setStats(statsResponse.data);
        setNotifications(notificationsResponse.data);
      } else {
        const [cropsResponse, ordersResponse] = await Promise.all([
          api.get("/crops"),
          api.get("/orders"),
        ]);

        setStats({
          totalCrops: cropsResponse.data.length,
          totalOrders: ordersResponse.data.length,
          newOrders: 0,
          totalSales: 0,
        });
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err.response?.data?.message ||
          "Could not load dashboard information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user, isFarmer]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!isFarmer || !user) return;

    const interval = setInterval(loadDashboard, 15000);

    return () => clearInterval(interval);
  }, [isFarmer, user, loadDashboard]);

  if (!user) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-panel">
          <h2>Please log in to view your dashboard.</h2>
          <Link className="btn" to="/login">
            Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-panel">
        <div className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">AI AgriConnect Marketplace</p>
            <h1>Welcome, {user.name || "User"}!</h1>
            <p>
              {isFarmer
                ? "Manage your crops, orders, and sales."
                : "Discover fresh crops and track your orders."}
            </p>
          </div>

          <span className="role-badge">
            {isFarmer ? "🌾 Farmer" : "🛒 Buyer"}
          </span>
        </div>

        {error && (
          <div className="dashboard-error">
            <p>{error}</p>
            <button className="btn" onClick={loadDashboard}>
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <p className="dashboard-loading">Loading your dashboard...</p>
        ) : (
          <>
            <div className="dashboard-stats">
              <article className="stat-card">
                <span className="stat-icon">🌱</span>
                <p>{isFarmer ? "My Listed Crops" : "Available Crops"}</p>
                <h2>{stats.totalCrops}</h2>
                <Link to={isFarmer ? "/add-crop" : "/marketplace"}>
                  {isFarmer ? "Manage crops →" : "Explore crops →"}
                </Link>
              </article>

              <article className="stat-card">
                <span className="stat-icon">📦</span>
                <p>{isFarmer ? "Total Orders Received" : "My Orders"}</p>
                <h2>{stats.totalOrders}</h2>
                <Link to="/orders">View orders →</Link>
              </article>

              {isFarmer && (
                <>
                  <article className="stat-card">
                    <span className="stat-icon">🔔</span>
                    <p>New Orders</p>
                    <h2>{stats.newOrders}</h2>
                    <Link to="/orders">Respond to orders →</Link>
                  </article>

                  <article className="stat-card">
                    <span className="stat-icon">💰</span>
                    <p>Successful Payment Sales</p>
                    <h2>
                      ₹
                      {Number(stats.totalSales || 0).toLocaleString("en-IN")}
                    </h2>
                    <span className="stat-note">
                      Excludes rejected orders
                    </span>
                  </article>
                </>
              )}
            </div>

            <div className="dashboard-actions">
              {isFarmer && (
                <Link className="btn" to="/add-crop">
                  + Add New Crop
                </Link>
              )}

              <Link className="btn" to="/marketplace">
                Browse Marketplace
              </Link>

              <Link className="btn secondary" to="/orders">
                Manage My Orders
              </Link>
            </div>

            {isFarmer && (
              <section className="notifications-panel">
                <div className="section-heading">
                  <div>
                    <h2>🔔 Recent Order Notifications</h2>
                    <p>See which buyers have ordered your crops.</p>
                  </div>

                  <button
                    className="refresh-button"
                    onClick={loadDashboard}
                  >
                    Refresh
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <span>📭</span>
                    <h3>No orders yet</h3>
                    <p>
                      When a buyer orders one of your crops, the notification
                      will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="notification-list">
                    {notifications.map((notification) => (
                      <article
                        className="notification-item"
                        key={notification.id}
                      >
                        <div className="notification-icon">🛒</div>

                        <div className="notification-content">
                          <h3>{notification.message}</h3>
                          <p>
                            Quantity: {notification.quantity}{" "}
                            {notification.unit}
                          </p>
                          <p>
                            Order value: ₹
                            {Number(
                              notification.totalAmount || 0
                            ).toLocaleString("en-IN")}
                          </p>
                          <span className="notification-date">
                            {new Date(
                              notification.createdAt
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <span className="order-status">
                          {notification.status}
                        </span>
                      </article>
                    ))}
                  </div>
                )}

                <Link className="orders-link" to="/orders">
                  View all orders →
                </Link>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}