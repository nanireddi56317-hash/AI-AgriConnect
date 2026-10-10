import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Marketplace() {
  const [crops, setCrops] = useState([]);
  const [q, setQ] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    api
      .get("/crops")
      .then((response) => setCrops(response.data))
      .catch((error) => {
        console.error("Failed to load crops:", error);
      });
  }, []);

  const buy = async (crop) => {
    if (!user) {
      alert("Please login as a buyer.");
      return;
    }

    if (user.role !== "buyer") {
      alert("Please login as a buyer to purchase crops.");
      return;
    }

    const qty = Number(
      prompt(`Enter quantity in ${crop.unit}:`, "1")
    );

    if (!Number.isFinite(qty) || qty <= 0) {
      alert("Please enter a valid quantity greater than zero.");
      return;
    }

    if (qty > crop.quantity) {
      alert(`Only ${crop.quantity} ${crop.unit} are available.`);
      return;
    }

    const loc = prompt("Enter delivery location:", "Hyderabad");

    if (!loc || !loc.trim()) {
      alert("Delivery location is required.");
      return;
    }

    try {
      // Step 1: Create the order.
      const response = await api.post("/orders", {
        cropId: crop._id,
        quantity: qty,
        deliveryLocation: loc.trim(),
      });

      // IMPORTANT: The backend returns { message, order }.
      const order = response.data.order;

      if (!order || !order._id) {
        console.error("Unexpected order response:", response.data);
        alert(
          "The server did not return the order ID. Please check your backend."
        );
        return;
      }

      // Step 2: Update the demo payment status using the correct order ID.
      await api.post(`/orders/${order._id}/payment`, {
        success: true,
      });

      alert(
        `Order ${order.orderId} placed successfully!\nDemo payment successful.`
      );

      // Step 3: Refresh the marketplace.
      window.location.reload();
    } catch (error) {
      console.error("Purchase failed:", error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Order failed. Please try again."
      );
    }
  };

  const filteredCrops = crops.filter((crop) =>
    (crop.cropName || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <main>
      <div className="marketHead">
        <h1>🌾 Marketplace</h1>

        <input
          type="text"
          placeholder="Search crops..."
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
      </div>

      <div className="grid">
        {filteredCrops.map((crop) => (
          <article className="crop" key={crop._id}>
            <div className="cropImg">🌱</div>

            <h2>{crop.cropName}</h2>

            <p>
              {crop.description ||
                "Fresh agricultural produce directly from the farmer."}
            </p>

            <b>
              ₹{crop.pricePerUnit}/{crop.unit}
            </b>

            <p>
              Available: {crop.quantity} {crop.unit}
            </p>

            <p>
              📍 {crop.location || "Telangana"} · 👨‍🌾{" "}
              {crop.farmerId?.name || "Farmer"}
            </p>

            <button
              className="btn"
              onClick={() => buy(crop)}
              disabled={crop.availabilityStatus === "Unavailable"}
            >
              {crop.availabilityStatus === "Unavailable"
                ? "Unavailable"
                : "Buy Now"}
            </button>
          </article>
        ))}
      </div>

      {filteredCrops.length === 0 && (
        <p>

          No crops found. Try another search or add crops through a farmer
          account.
        </p>
      )}
    </main>
  );
}