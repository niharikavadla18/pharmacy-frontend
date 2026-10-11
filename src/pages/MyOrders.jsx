import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// Change the pharmacy name here
const PHARMACY_NAME = "MediCare Pharmacy";

const STEPS = ["PLACED", "ACCEPTED", "SHIPPED", "DELIVERED"];

const STATUS_COLORS = {
    PLACED: ["#eef2f6", "#475467"],
    ACCEPTED: ["#e0f2f1", "#0b6e4f"],
    SHIPPED: ["#e8eefc", "#2c4fb3"],
    DELIVERED: ["#e3f6ec", "#157f4b"]
};

function MyOrders() {

    const [orders, setOrders] = useState([]);
    const [orderItems, setOrderItems] = useState({});
    const [problem, setProblem] = useState("");

    // remember medicines and orders already loaded
    const medicineCache = useRef({});
    const itemsLoaded = useRef(new Set());

    useEffect(() => {

        getOrders();

        // Refresh orders every 5 seconds
        const interval = setInterval(() => {
            getOrders();
        }, 5000);

        // Refresh when customer comes back to this tab
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                getOrders();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        // Refresh instantly when admin changes an order in another tab
        let channel;
        try {
            channel = new BroadcastChannel("pharmacy-orders");
            channel.onmessage = () => getOrders();
        } catch (e) {
            console.log(e);
        }

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
            if (channel) channel.close();
        };

    }, []);

    const getMedicine = async (medicineId, headers) => {

        if (medicineCache.current[medicineId]) {
            return medicineCache.current[medicineId];
        }

        try {

            const response = await axios.get(
                "https://pharmacy-backend-1-wreu.onrender.com/medicine/all",
                { headers }
            );

            medicineCache.current[medicineId] = response.data;
            return response.data;

        } catch (error) {

            console.log("Medicine details error:", error);
            return null;
        }
    };

    const getOrders = async () => {

        try {

            const user = JSON.parse(sessionStorage.getItem("user"));

            if (!user || !user.token) {
                setProblem("session");
                return;
            }

            const headers = { Authorization: `Bearer ${user.token}` };

            const response = await axios.get(
                "https://pharmacy-backend-1-wreu.onrender.com/medicine/all",
                { headers }
            );

            const ordersData = [...response.data].sort((a, b) => b.id - a.id);

            setOrders(ordersData);
            setProblem("");

            // load products only for orders not loaded yet
            for (const order of ordersData) {

                if (itemsLoaded.current.has(order.id)) {
                    continue;
                }

                try {

                    const itemResponse = await axios.get(
                        "https://pharmacy-backend-1-wreu.onrender.com/medicine/all",
                        { headers }
                    );

                    const itemsWithMedicine = await Promise.all(
                        itemResponse.data.map(async (item) => ({
                            ...item,
                            medicine: await getMedicine(item.medicineId, headers)
                        }))
                    );

                    itemsLoaded.current.add(order.id);

                    setOrderItems((previous) => ({
                        ...previous,
                        [order.id]: itemsWithMedicine
                    }));

                } catch (error) {

                    console.log("Order items error:", error);
                }
            }

        } catch (error) {

            console.log(error);

            if (error.response &&
                (error.response.status === 401 || error.response.status === 403)) {
                setProblem("session");
            } else {
                setProblem("network");
            }
        }
    };

    return (

        <div style={{
            minHeight: "85vh",
            backgroundColor: "#f6f8f9",
            padding: "30px 20px"
        }}>

            {/* Header */}

            <div style={{ textAlign: "center", marginBottom: "28px" }}>

                <div style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                    color: "#555"
                }}>
                    💊 {PHARMACY_NAME}
                </div>

                <h1 style={{
                    color: "#0b6e4f",
                    margin: "6px 0 4px"
                }}>
                    My Orders
                </h1>

                <Link
                    to="/customer-dashboard"
                    style={{
                        color: "#0b6e4f",
                        fontSize: "14px",
                        textDecoration: "none",
                        fontWeight: "bold"
                    }}
                >
                    ← Continue shopping
                </Link>

            </div>

            {problem === "session" && (
                <p style={{
                    maxWidth: "700px",
                    margin: "0 auto 15px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#fdecea",
                    color: "#b42318",
                    fontSize: "14px"
                }}>
                    Your login is not valid in this tab. Please login again.
                </p>
            )}

            {problem === "network" && (
                <p style={{
                    maxWidth: "700px",
                    margin: "0 auto 15px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#fff4e5",
                    color: "#8a5300",
                    fontSize: "13px"
                }}>
                    Connection problem. Showing your last loaded orders and trying again...
                </p>
            )}

            {orders.length === 0 ? (

                <p style={{ textAlign: "center", color: "#666" }}>
                    {problem ? "" : "No orders found."}
                </p>

            ) : (

                orders.map((order) => {

                    const items = orderItems[order.id];
                    const status = (order.status || "PLACED").toUpperCase();
                    const current = STEPS.indexOf(status);
                    const colors = STATUS_COLORS[status] || STATUS_COLORS.PLACED;

                    return (

                        <div
                            key={order.id}
                            style={{
                                backgroundColor: "white",
                                borderRadius: "14px",
                                margin: "20px auto",
                                maxWidth: "700px",
                                border: "1px solid #e2e8ec",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                                overflow: "hidden"
                            }}
                        >

                            {/* Order top bar */}

                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "10px",
                                padding: "16px 22px",
                                borderBottom: "1px solid #eef1f3",
                                backgroundColor: "#fbfcfc"
                            }}>

                                <h3 style={{ margin: 0, color: "#333" }}>
                                    Order #{order.id}
                                </h3>

                                <span style={{
                                    backgroundColor: colors[0],
                                    color: colors[1],
                                    padding: "5px 14px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}>
                                    {status}
                                </span>

                            </div>

                            <div style={{ padding: "18px 22px" }}>

                                {/* Progress */}

                                <div style={{
                                    display: "flex",
                                    gap: "6px",
                                    flexWrap: "wrap",
                                    fontSize: "12px",
                                    marginBottom: "20px"
                                }}>
                                    {STEPS.map((step, index) => (
                                        <span
                                            key={step}
                                            style={{
                                                padding: "4px 10px",
                                                borderRadius: "999px",
                                                backgroundColor: index <= current ? "#e0f2f1" : "#f2f4f6",
                                                color: index <= current ? "#0b6e4f" : "#98a2b3",
                                                fontWeight: index === current ? "bold" : "normal"
                                            }}
                                        >
                                            {index < current ? "✓ " : ""}{step}
                                        </span>
                                    ))}
                                </div>

                                <h4 style={{
                                    color: "#333",
                                    margin: "0 0 12px"
                                }}>
                                    Products in this order
                                </h4>

                                {!items ? (

                                    <p style={{ color: "#777", fontSize: "14px" }}>
                                        Loading product details...
                                    </p>

                                ) : (

                                    items.map((item) => {

                                        const medicine = item.medicine;

                                        const name = medicine
                                            ? medicine.name
                                            : `Medicine #${item.medicineId}`;

                                        const packSize = medicine
                                            ? (medicine.packageSize || medicine.packSize)
                                            : null;

                                        return (

                                            <div
                                                key={item.id}
                                                style={{
                                                    display: "flex",
                                                    gap: "14px",
                                                    border: "1px solid #e8ecef",
                                                    borderRadius: "10px",
                                                    padding: "14px",
                                                    marginBottom: "12px",
                                                    backgroundColor: "#fafbfb"
                                                }}
                                            >

                                                {/* Letter badge instead of image */}

                                                <div style={{
                                                    width: "44px",
                                                    height: "44px",
                                                    minWidth: "44px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "#e0f2f1",
                                                    color: "#0b6e4f",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: "bold",
                                                    fontSize: "18px"
                                                }}>
                                                    {name.charAt(0).toUpperCase()}
                                                </div>

                                                <div style={{ flex: 1 }}>

                                                    <div style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        gap: "10px",
                                                        flexWrap: "wrap"
                                                    }}>

                                                        <strong style={{
                                                            fontSize: "16px",
                                                            color: "#222"
                                                        }}>
                                                            {name}
                                                        </strong>

                                                        <strong style={{ color: "#0b6e4f" }}>
                                                            ₹{Number(item.price) * Number(item.quantity)}
                                                        </strong>

                                                    </div>

                                                    {medicine && medicine.category && (
                                                        <span style={{
                                                            display: "inline-block",
                                                            marginTop: "6px",
                                                            backgroundColor: "#eef2f6",
                                                            color: "#475467",
                                                            padding: "2px 9px",
                                                            borderRadius: "999px",
                                                            fontSize: "12px"
                                                        }}>
                                                            {medicine.category}
                                                        </span>
                                                    )}

                                                    {medicine && medicine.description && (
                                                        <p style={{
                                                            margin: "8px 0 0",
                                                            color: "#555",
                                                            fontSize: "14px",
                                                            lineHeight: "1.45"
                                                        }}>
                                                            <strong>About:</strong> {medicine.description}
                                                        </p>
                                                    )}

                                                    {!medicine && (
                                                        <p style={{
                                                            margin: "8px 0 0",
                                                            color: "#888",
                                                            fontSize: "13px"
                                                        }}>
                                                            Product details are not available right now.
                                                        </p>
                                                    )}

                                                    <div style={{
                                                        marginTop: "8px",
                                                        fontSize: "13px",
                                                        color: "#666",
                                                        display: "flex",
                                                        gap: "16px",
                                                        flexWrap: "wrap"
                                                    }}>

                                                        {packSize && (
                                                            <span>Pack: {packSize}</span>
                                                        )}

                                                        {medicine && medicine.expiryDate && (
                                                            <span>Expiry: {medicine.expiryDate}</span>
                                                        )}

                                                        <span>
                                                            Qty {item.quantity} × ₹{item.price}
                                                        </span>

                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    })
                                )}

                                {/* Order total */}

                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginTop: "16px",
                                    paddingTop: "14px",
                                    borderTop: "1px dashed #d9dfe3",
                                    fontSize: "16px"
                                }}>
                                    <strong>Total Amount</strong>
                                    <strong style={{ color: "#0b6e4f" }}>
                                        ₹{order.totalAmount}
                                    </strong>
                                </div>

                            </div>

                        </div>
                    );
                })
            )}

        </div>
    );
}

export default MyOrders;
