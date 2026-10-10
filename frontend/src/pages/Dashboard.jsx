import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [orders, setOrders] = useState([]);
  const [crops, setCrops] = useState([]);

  // Load farmer notifications
  const loadNotifications = async () => {
    if (!user || user.role !== "farmer") return;

    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  // Load orders
  const loadOrders = async () => {
    try {
      const response = await api.get("/orders");
      setOrders(response.data);
    } catch (error) {
      console.error("Orders error:", error);
    }
  };

  // Load crops
  const loadCrops = async () => {
    try {
      const response = await api.get("/crops");
      setCrops(response.data);
    } catch (error) {
      console.error("Crops error:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadOrders();
    loadCrops();

    // Check for new notifications every 5 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

 const farmerCrops = crops.filter((crop) => {
  if (!crop.farmerId || !user) return false;

  const cropFarmerId =
    typeof crop.farmerId === "object"
      ? crop.farmerId._id
      : crop.farmerId;

  const currentFarmerId =
    user._id || user.id;

  return String(cropFarmerId) === String(currentFarmerId);
});

  return (
    <div style={styles.page}>

      {/* ================= HEADER ================= */}
      <header style={styles.header}>

        <div>
          <div style={styles.logo}>
            🌾 AI AgriConnect
          </div>

          <div style={styles.welcome}>
            Welcome, {user?.name || "User"} 👋
          </div>
        </div>

        {/* NOTIFICATION BELL */}
        {user?.role === "farmer" && (
          <div style={styles.notificationWrapper}>

            <button
              style={styles.bellButton}
              onClick={() =>
                setShowNotifications(!showNotifications)
              }
            >
              🔔

              {unreadCount > 0 && (
                <span style={styles.badge}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION DROPDOWN */}
            {showNotifications && (
              <div style={styles.notificationBox}>

                <div style={styles.notificationHeader}>
                  <strong>Notifications</strong>

                  <button
                    style={styles.closeButton}
                    onClick={() =>
                      setShowNotifications(false)
                    }
                  >
                    ×
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div style={styles.noNotifications}>
                    <div style={{ fontSize: "35px" }}>
                      🔔
                    </div>

                    <p>No notifications yet</p>

                    <small>
                      New crop orders will appear here.
                    </small>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() =>
                          markAsRead(notification._id)
                        }
                        style={{
                          ...styles.notificationItem,
                          backgroundColor: notification.isRead
                            ? "#ffffff"
                            : "#ecfdf3",
                        }}
                      >

                        <div style={styles.notificationIcon}>
                          🌾
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={styles.notificationTitle}>
                            {notification.title}
                          </div>

                          <div style={styles.notificationMessage}>
                            {notification.message}
                          </div>

                          <div style={styles.notificationTime}>
                            {new Date(
                              notification.createdAt
                            ).toLocaleString()}
                          </div>
                        </div>

                        {!notification.isRead && (
                          <span style={styles.unreadDot}></span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </header>


      {/* ================= HERO ================= */}

      <section style={styles.hero}>

        <div style={styles.heroText}>

          <span style={styles.heroTag}>
            🌱 SMART AGRICULTURE PLATFORM
          </span>

          <h1 style={styles.heroTitle}>
            {user?.role === "farmer"
              ? "Grow More. Sell Better."
              : "Find Fresh Crops Directly From Farmers."}
          </h1>

          <p style={styles.heroDescription}>
            {user?.role === "farmer"
              ? "Manage your crops, receive buyer orders and grow your agricultural business."
              : "Connect directly with farmers and purchase fresh agricultural products."}
          </p>

          <div style={styles.heroButtons}>

            {user?.role === "farmer" ? (
              <>
                <Link
                  to="/add-crop"
                  style={styles.primaryButton}
                >
                  + Add Crop
                </Link>

                <Link
                  to="/orders"
                  style={styles.secondaryButton}
                >
                  View Orders
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/marketplace"
                  style={styles.primaryButton}
                >
                  Explore Marketplace
                </Link>

                <Link
                  to="/orders"
                  style={styles.secondaryButton}
                >
                  My Orders
                </Link>
              </>
            )}

          </div>

        </div>

        <div style={styles.heroArt}>
          🚜
          <div style={styles.sun}>☀️</div>
          <div style={styles.field}>🌾🌾🌾🌾🌾</div>
        </div>

      </section>


      {/* ================= STATS ================= */}

      <section style={styles.stats}>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🌾</div>
          <div>
            <div style={styles.statNumber}>
              {user?.role === "farmer"
                ? farmerCrops.length
                : "—"}
            </div>
            <div style={styles.statLabel}>
              My Crops
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📦</div>
          <div>
            <div style={styles.statNumber}>
              {orders.length}
            </div>
            <div style={styles.statLabel}>
              Orders
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statNumber}>
              ₹
            </div>
            <div style={styles.statLabel}>
              Payments
            </div>
          </div>
        </div>

        {user?.role === "farmer" && (
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🔔</div>

            <div>
              <div style={styles.statNumber}>
                {unreadCount}
              </div>

              <div style={styles.statLabel}>
                New Notifications
              </div>
            </div>
          </div>
        )}

      </section>


      {/* ================= FARMER NOTIFICATION SECTION ================= */}

      {user?.role === "farmer" && notifications.length > 0 && (

        <section style={styles.notificationSection}>

          <div style={styles.sectionTitleRow}>

            <div>
              <h2 style={styles.sectionTitle}>
                🔔 Recent Notifications
              </h2>

              <p style={styles.sectionSubtitle}>
                Stay updated with new buyer orders.
              </p>
            </div>

            <button
              style={styles.viewButton}
              onClick={() =>
                setShowNotifications(true)
              }
            >
              View All
            </button>

          </div>

          <div style={styles.notificationList}>

            {notifications.slice(0, 3).map((notification) => (

              <div
                key={notification._id}
                style={{
                  ...styles.dashboardNotification,
                  opacity: notification.isRead ? 0.7 : 1,
                }}
                onClick={() =>
                  markAsRead(notification._id)
                }
              >

                <div style={styles.bigNotificationIcon}>
                  🌾
                </div>

                <div style={{ flex: 1 }}>

                  <strong>
                    {notification.title}
                  </strong>

                  <p style={{ margin: "6px 0" }}>
                    {notification.message}
                  </p>

                  <small style={{ color: "#6b7280" }}>
                    {new Date(
                      notification.createdAt
                    ).toLocaleString()}
                  </small>

                </div>

                {!notification.isRead && (
                  <span style={styles.newLabel}>
                    NEW
                  </span>
                )}

              </div>

            ))}

          </div>

        </section>
      )}


      {/* ================= QUICK ACTIONS ================= */}

      <section style={styles.section}>

        <h2 style={styles.sectionTitle}>
          Quick Actions
        </h2>

        <p style={styles.sectionSubtitle}>
          Everything you need in one place.
        </p>

        <div style={styles.actionGrid}>

          {user?.role === "farmer" && (
            <>
              <Link
                to="/add-crop"
                style={styles.actionCard}
              >
                <div style={styles.actionIcon}>
                  🌱
                </div>

                <h3>Add Crop</h3>

                <p>
                  Add your fresh agricultural products.
                </p>
              </Link>

              <Link
                to="/orders"
                style={styles.actionCard}
              >
                <div style={styles.actionIcon}>
                  📦
                </div>

                <h3>Orders</h3>

                <p>
                  View orders received from buyers.
                </p>
              </Link>
            </>
          )}

          {user?.role === "buyer" && (
            <>
              <Link
                to="/marketplace"
                style={styles.actionCard}
              >
                <div style={styles.actionIcon}>
                  🛒
                </div>

                <h3>Marketplace</h3>

                <p>
                  Browse fresh crops from farmers.
                </p>
              </Link>

              <Link
                to="/orders"
                style={styles.actionCard}
              >
                <div style={styles.actionIcon}>
                  📦
                </div>

                <h3>My Orders</h3>

                <p>
                  Track your crop purchases.
                </p>
              </Link>
            </>
          )}

          <Link
            to="/payments"
            style={styles.actionCard}
          >
            <div style={styles.actionIcon}>
              💳
            </div>

            <h3>Payments</h3>

            <p>
              Check your payment information.
            </p>
          </Link>

          <Link
            to="/tracking"
            style={styles.actionCard}
          >
            <div style={styles.actionIcon}>
              🚚
            </div>

            <h3>Tracking</h3>

            <p>
              Track your agricultural orders.
            </p>
          </Link>

        </div>

      </section>


      {/* ================= FOOTER ================= */}

      <footer style={styles.footer}>
        <strong>🌾 AI AgriConnect</strong>
        <span>
          Connecting Farmers • Buyers • Fresh Agriculture
        </span>
      </footer>

    </div>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f5f8f3",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
    color: "#173b25",
  },

  header: {
    height: "78px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 6%",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  logo: {
    fontSize: "21px",
    fontWeight: "800",
    color: "#166534",
  },

  welcome: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "3px",
  },

  notificationWrapper: {
    position: "relative",
  },

  bellButton: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "1px solid #dbe5dc",
    background: "#f0fdf4",
    fontSize: "23px",
    cursor: "pointer",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: "-3px",
    right: "-3px",
    minWidth: "21px",
    height: "21px",
    padding: "0 5px",
    borderRadius: "20px",
    background: "#dc2626",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid white",
  },

  notificationBox: {
    position: "absolute",
    right: 0,
    top: "58px",
    width: "380px",
    maxWidth: "calc(100vw - 30px)",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow:
      "0 18px 50px rgba(0,0,0,0.15)",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },

  notificationHeader: {
    padding: "17px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "17px",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "24px",
    cursor: "pointer",
    color: "#6b7280",
  },

  noNotifications: {
    textAlign: "center",
    padding: "35px 20px",
    color: "#6b7280",
  },

  notificationItem: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    borderBottom: "1px solid #eef2ee",
    cursor: "pointer",
  },

  notificationIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },

  notificationTitle: {
    fontWeight: "800",
    color: "#166534",
    fontSize: "14px",
  },

  notificationMessage: {
    fontSize: "13px",
    color: "#374151",
    lineHeight: "1.5",
    marginTop: "4px",
  },

  notificationTime: {
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "7px",
  },

  unreadDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#16a34a",
    marginTop: "5px",
    flexShrink: 0,
  },

  hero: {
    margin: "28px 6%",
    padding: "45px",
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, #166534, #22c55e)",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
  },

  heroText: {
    maxWidth: "650px",
  },

  heroTag: {
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1px",
    opacity: 0.9,
  },

  heroTitle: {
    fontSize: "clamp(32px, 5vw, 58px)",
    lineHeight: "1.05",
    margin: "16px 0",
  },

  heroDescription: {
    fontSize: "17px",
    lineHeight: "1.7",
    opacity: 0.92,
    maxWidth: "600px",
  },

  heroButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "25px",
    flexWrap: "wrap",
  },

  primaryButton: {
    background: "#ffffff",
    color: "#166534",
    padding: "13px 22px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: "800",
  },

  secondaryButton: {
    background: "rgba(255,255,255,0.15)",
    color: "#ffffff",
    padding: "13px 22px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: "700",
    border: "1px solid rgba(255,255,255,0.4)",
  },

  heroArt: {
    fontSize: "110px",
    position: "relative",
    padding: "30px",
  },

  sun: {
    position: "absolute",
    fontSize: "45px",
    top: 0,
    right: 0,
  },

  field: {
    fontSize: "25px",
    position: "absolute",
    bottom: "5px",
    left: "25px",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(190px,1fr))",
    gap: "18px",
    margin: "0 6% 35px",
  },

  statCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "22px",
    display: "flex",
    gap: "15px",
    alignItems: "center",
    border: "1px solid #e5e7eb",
  },

  statIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },

  statNumber: {
    fontSize: "25px",
    fontWeight: "900",
    color: "#166534",
  },

  statLabel: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "2px",
  },

  notificationSection: {
    margin: "0 6% 35px",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "25px",
    border: "1px solid #e5e7eb",
  },

  sectionTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "18px",
  },

  sectionTitle: {
    fontSize: "25px",
    margin: 0,
    color: "#173b25",
  },

  sectionSubtitle: {
    color: "#6b7280",
    marginTop: "7px",
  },

  viewButton: {
    border: "none",
    background: "#166534",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "700",
  },

  notificationList: {
    display: "grid",
    gap: "12px",
  },

  dashboardNotification: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "17px",
    borderRadius: "14px",
    background: "#f8faf8",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
  },

  bigNotificationIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
  },

  newLabel: {
    background: "#dc2626",
    color: "#ffffff",
    padding: "5px 8px",
    borderRadius: "7px",
    fontSize: "10px",
    fontWeight: "900",
  },

  section: {
    margin: "0 6% 45px",
  },

  actionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginTop: "20px",
  },

  actionCard: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    textDecoration: "none",
    color: "#173b25",
    transition: "0.2s",
  },

  actionIcon: {
    fontSize: "35px",
    marginBottom: "12px",
  },

  footer: {
    padding: "28px 6%",
    background: "#173b25",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
  },
};