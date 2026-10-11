import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_URL = "https://pharmacy-backend-1-wreu.onrender.com";
const PHARMACY_NAME = "MediCare Pharmacy";

const STATUS_COLORS = {
    PLACED: ["#eef2f6", "#475467"],
    ACCEPTED: ["#e0f2f1", "#0b6e4f"],
    SHIPPED: ["#e8eefc", "#2c4fb3"],
    DELIVERED: ["#e3f6ec", "#157f4b"]
};

const FILTERS = [
    ["ALL", "All"],
    ["PLACED", "New"],
    ["ACCEPTED", "Accepted"],
    ["SHIPPED", "Shipped"],
    ["DELIVERED", "Delivered"]
];

function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [orderItems, setOrderItems] = useState({});
    const [message, setMessage] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [filter, setFilter] = useState("ALL");
    const [offline, setOffline] = useState(false);

    const medicineCache = useRef({});

    const getUser = () => {
        try {
            return JSON.parse(sessionStorage.getItem("user"));
        } catch {
            return null;
        }
    };

    const getHeaders = () => {
        const user = getUser();

        if (!user?.token) {
            throw new Error("Please log in again.");
        }

        return {
            Authorization: `Bearer ${user.token}`
        };
    };

    const showMessage = (text, error = false) => {
        setMessage({ text, error });
    };

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => setMessage(null), 2500);

        return () => clearTimeout(timer);
    }, [message]);

    const getMedicine = async (medicineId, headers) => {
        if (!medicineId) return null;

        if (medicineCache.current[medicineId]) {
            return medicineCache.current[medicineId];
        }

        try {
            const response = await axios.get(
                `${API_URL}/medicine/${medicineId}`,
                { headers }
            );

            medicineCache.current[medicineId] = response.data;
            return response.data;
        } catch (error) {
            console.error("Medicine lookup error:", error);
            return null;
        }
    };

    const getOrderItems = async (orderId, headers) => {
        try {
            const response = await axios.get(
                `${API_URL}/order-item/order/${orderId}`,
                { headers }
            );

            const rawItems = Array.isArray(response.data)
                ? response.data
                : [];

            return await Promise.all(
                rawItems.map(async (item) => {
                    const medicineId =
                        item.medicineId ?? item.medicine?.id;

                    const medicine = item.medicine?.name
                        ? item.medicine
                        : await getMedicine(medicineId, headers);

                    return {
                        ...item,
                        medicineId,
                        medicine
                    };
                })
            );
        } catch (error) {
            console.error(
                `Could not load items for order ${orderId}:`,
                error
            );

            return null;
        }
    };

    const getOrders = async () => {
        try {
            const headers = getHeaders();

            // Correct endpoint: fetch orders, not medicines.
            const response = await axios.get(
                `${API_URL}/order/all`,
                { headers }
            );

            if (!Array.isArray(response.data)) {
                throw new Error("Invalid orders response.");
            }

            const sorted = [...response.data].sort(
                (a, b) => Number(b.id) - Number(a.id)
            );

            setOrders(sorted);
            setOffline(false);

            const results = await Promise.all(
                sorted.map(async (order) => {
                    const items = await getOrderItems(order.id, headers);
                    return [order.id, items];
                })
            );

            setOrderItems((previous) => {
                const updated = { ...previous };

                results.forEach(([orderId, items]) => {
                    if (items !== null) {
                        updated[orderId] = items;
                    }
                });

                return updated;
            });
        } catch (error) {
            console.error("Could not load orders:", error);
            setOffline(true);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                showMessage(
                    "Admin access denied. Please log in again.",
                    true
                );
            }
        }
    };

    useEffect(() => {
        getOrders();

        const interval = setInterval(getOrders, 5000);

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                getOrders();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        let channel;

        try {
            channel = new BroadcastChannel("pharmacy-orders");
            channel.onmessage = () => getOrders();
        } catch (error) {
            console.log("BroadcastChannel unavailable:", error);
        }

        return () => {
            clearInterval(interval);
            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            );

            if (channel) channel.close();
        };
    }, []);

    const updateStatus = async (orderId, status) => {
        setUpdatingId(orderId);

        try {
            const headers = getHeaders();

            // Correct endpoint and order ID.
            await axios.put(
                `${API_URL}/order/status/${orderId}`,
                {},
                {
                    headers,
                    params: { status }
                }
            );

            showMessage(`Order #${orderId} updated to ${status}`);

            await getOrders();

            // Notify customer pages in other tabs.
            try {
                const channel = new BroadcastChannel("pharmacy-orders");

                channel.postMessage({
                    type: "ORDER_UPDATED",
                    orderId,
                    status
                });

                channel.close();
            } catch (error) {
                console.log("Could not notify other tabs:", error);
            }
        } catch (error) {
            console.error("Status update failed:", error);

            showMessage(
                error.response?.data?.message ||
                    "Failed to update order status!",
                true
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const nextAction = (status) => {
        const currentStatus = (status || "PLACED").toUpperCase();

        if (currentStatus === "PLACED") {
            return { value: "ACCEPTED", label: "Accept Order" };
        }

        if (currentStatus === "ACCEPTED") {
            return { value: "SHIPPED", label: "Mark as Shipped" };
        }

        if (currentStatus === "SHIPPED") {
            return { value: "DELIVERED", label: "Mark as Delivered" };
        }

        return null;
    };

    const statusOf = (order) =>
        (order.status || "PLACED").toUpperCase();

    const countOf = (key) =>
        key === "ALL"
            ? orders.length
            : orders.filter((order) => statusOf(order) === key).length;

    const visibleOrders =
        filter === "ALL"
            ? orders
            : orders.filter((order) => statusOf(order) === filter);

    return (
        <div
            style={{
                minHeight: "85vh",
                backgroundColor: "#f6f8f9",
                padding: "30px 20px"
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div
                    style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        letterSpacing: "0.5px",
                        color: "#555"
                    }}
                >
                    💊 {PHARMACY_NAME}
                </div>

                <h1 style={{ color: "#0b6e4f", margin: "6px 0 0" }}>
                    Manage Customer Orders
                </h1>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginBottom: "20px"
                }}
            >
                {FILTERS.map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        style={{
                            backgroundColor:
                                filter === key ? "#0b6e4f" : "white",
                            color: filter === key ? "white" : "#475467",
                            border: "1px solid #d9dfe3",
                            borderRadius: "999px",
                            padding: "6px 14px",
                            fontSize: "13px",
                            cursor: "pointer"
                        }}
                    >
                        {label} ({countOf(key)})
                    </button>
                ))}
            </div>

            {message && (
                <div
                    style={{
                        position: "fixed",
                        top: "70px",
                        right: "16px",
                        zIndex: 999,
                        backgroundColor: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        borderLeft: `4px solid ${
                            message.error ? "#b42318" : "#2e7d32"
                        }`,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                        maxWidth: "320px"
                    }}
                >
                    {message.error ? "✕" : "✓"} {message.text}
                </div>
            )}

            {offline && (
                <p
                    style={{
                        maxWidth: "700px",
                        margin: "0 auto 14px",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        backgroundColor: "#fff4e5",
                        color: "#8a5300",
                        fontSize: "13px"
                    }}
                >
                    Connection problem. Showing the last loaded orders and
                    trying again...
                </p>
            )}

            {visibleOrders.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666" }}>
                    No orders found.
                </p>
            ) : (
                visibleOrders.map((order) => {
                    const status = statusOf(order);
                    const colors =
                        STATUS_COLORS[status] || STATUS_COLORS.PLACED;
                    const action = nextAction(status);
                    const items = orderItems[order.id];

                    return (
                        <div
                            key={order.id}
                            style={{
                                backgroundColor: "white",
                                maxWidth: "700px",
                                margin: "16px auto",
                                borderRadius: "14px",
                                border: "1px solid #e2e8ec",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                                overflow: "hidden"
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "10px",
                                    padding: "14px 22px",
                                    backgroundColor: "#fbfcfc",
                                    borderBottom: "1px solid #eef1f3"
                                }}
                            >
                                <div>
                                    <strong
                                        style={{
                                            fontSize: "17px",
                                            color: "#1d2939"
                                        }}
                                    >
                                        Order #{order.id}
                                    </strong>

                                    <span
                                        style={{
                                            marginLeft: "10px",
                                            fontSize: "13px",
                                            color: "#667085"
                                        }}
                                    >
                                        Customer ID: {order.userId}
                                    </span>
                                </div>

                                <span
                                    style={{
                                        backgroundColor: colors[0],
                                        color: colors[1],
                                        padding: "5px 14px",
                                        borderRadius: "999px",
                                        fontSize: "12px",
                                        fontWeight: "bold"
                                    }}
                                >
                                    {status}
                                </span>
                            </div>

                            <div style={{ padding: "16px 22px" }}>
                                <div
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: "bold",
                                        color: "#667085",
                                        marginBottom: "8px"
                                    }}
                                >
                                    ITEMS TO PREPARE
                                </div>

                                {items === undefined ? (
                                    <p style={{ color: "#888", fontSize: "14px" }}>
                                        Loading products...
                                    </p>
                                ) : items === null ? (
                                    <p style={{ color: "#b42318", fontSize: "14px" }}>
                                        Unable to load order products.
                                    </p>
                                ) : items.length === 0 ? (
                                    <p style={{ color: "#888", fontSize: "14px" }}>
                                        No products found for this order.
                                    </p>
                                ) : (
                                    items.map((item, index) => (
                                        <div
                                            key={item.id ?? index}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: "10px",
                                                padding: "7px 0",
                                                borderBottom: "1px solid #f0f2f4",
                                                fontSize: "14px"
                                            }}
                                        >
                                            <span>
                                                <strong style={{ color: "#1d2939" }}>
                                                    {item.medicine?.name ||
                                                        `Medicine #${item.medicineId ?? "Unknown"}`}
                                                </strong>

                                                {item.medicine?.packageSize
                                                    ? ` (${item.medicine.packageSize})`
                                                    : ""}
                                            </span>

                                            <span style={{ color: "#555" }}>
                                                Qty {item.quantity} × ₹{item.price}
                                            </span>
                                        </div>
                                    ))
                                )}

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "10px",
                                        marginTop: "16px"
                                    }}
                                >
                                    <div style={{ fontSize: "16px" }}>
                                        <strong>Total: </strong>
                                        <strong style={{ color: "#0b6e4f" }}>
                                            ₹{order.totalAmount}
                                        </strong>
                                    </div>

                                    {action ? (
                                        <button
                                            disabled={updatingId === order.id}
                                            onClick={() =>
                                                updateStatus(order.id, action.value)
                                            }
                                            style={{ padding: "10px 20px" }}
                                        >
                                            {updatingId === order.id
                                                ? "Updating..."
                                                : action.label}
                                        </button>
                                    ) : (
                                        <span
                                            style={{
                                                color: "#157f4b",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            ✓ Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default AdminOrders;
