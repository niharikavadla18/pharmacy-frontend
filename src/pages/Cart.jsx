import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const getUser = () => {
    try {
        return JSON.parse(sessionStorage.getItem("user"));
    } catch {
        return null;
    }
};

// Every user has his own cart (so two customers on one browser do not share it)
const cartKey = () => {
    const user = getUser();
    return user ? `cart_${user.id}` : "cart";
};

const readCart = () => {
    try {
        return JSON.parse(localStorage.getItem(cartKey())) || [];
    } catch {
        return [];
    }
};

function Cart() {

    const navigate = useNavigate();

    const [cart, setCart] = useState([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [flash, setFlash] = useState(null);

    const showMessage = (text, error = false) => {
        setFlash({ text, error });
        setTimeout(() => setFlash(null), 2800);
    };

    useEffect(() => {

        setCart(readCart());

        // cart changed in another tab of the same user
        const handleStorage = (e) => {
            if (e.key === cartKey()) {
                setCart(readCart());
            }
        };

        window.addEventListener("storage", handleStorage);

        return () => window.removeEventListener("storage", handleStorage);

    }, []);

    const saveCart = (newCart) => {

        setCart(newCart);

        localStorage.setItem(cartKey(), JSON.stringify(newCart));
    };

    const increaseQuantity = (index) => {

        const newCart = [...cart];

        const currentQuantity = newCart[index].cartQuantity || 1;

        if (currentQuantity >= newCart[index].quantity) {
            showMessage("Cannot add more than available stock!", true);
            return;
        }

        newCart[index].cartQuantity = currentQuantity + 1;

        saveCart(newCart);
    };

    const decreaseQuantity = (index) => {

        const newCart = [...cart];

        const currentQuantity = newCart[index].cartQuantity || 1;

        if (currentQuantity === 1) {
            newCart.splice(index, 1);
        } else {
            newCart[index].cartQuantity = currentQuantity - 1;
        }

        saveCart(newCart);
    };

    const removeFromCart = (index) => {

        const newCart = [...cart];

        newCart.splice(index, 1);

        saveCart(newCart);
    };

    const getTotal = () => {

        let total = 0;

        cart.forEach((medicine) => {
            total = total + medicine.price * (medicine.cartQuantity || 1);
        });

        return total;
    };

    const getItemCount = () => {

        let count = 0;

        cart.forEach((medicine) => {
            count = count + (medicine.cartQuantity || 1);
        });

        return count;
    };

    const placeOrder = async () => {

        if (placingOrder) {
            return;
        }

        if (cart.length === 0) {
            showMessage("Your cart is empty!", true);
            return;
        }

        const user = getUser();

        if (!user || !user.token) {
            showMessage("Please login first!", true);
            return;
        }

        setPlacingOrder(true);

        try {

            // Check latest stock before creating the order
            for (const medicine of cart) {

                const response = await axios.get(
                    `http://localhost:8081/medicine/${medicine.id}`
                );

                const latestMedicine = response.data;

                const requestedQuantity = medicine.cartQuantity || 1;

                if (latestMedicine.quantity < requestedQuantity) {

                    showMessage(
                        `${latestMedicine.name} has only ${latestMedicine.quantity} available in stock.`,
                        true
                    );

                    setPlacingOrder(false);
                    return;
                }
            }

            // ONE request: the server reads the real prices and calculates the total
            await axios.post(
                "http://localhost:8081/order/checkout",
                {
                    items: cart.map((medicine) => ({
                        medicineId: medicine.id,
                        quantity: medicine.cartQuantity || 1
                    }))
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            localStorage.removeItem(cartKey());

            setCart([]);

            // tell the admin tab about the new order immediately
            try {
                const channel = new BroadcastChannel("pharmacy-orders");
                channel.postMessage("changed");
                channel.close();
            } catch (e) {
                console.log(e);
            }

            showMessage("Order placed successfully! Opening My Orders...");

            setTimeout(() => navigate("/my-orders"), 1300);

        } catch (error) {

            console.log(error);

            if (error.response) {
                console.log("Status:", error.response.status);
                console.log("Response:", error.response.data);
            }

            showMessage(
                (error.response && error.response.data && error.response.data.message) ||
                "Order failed! Please try again.",
                true
            );

        } finally {

            setPlacingOrder(false);
        }
    };

    return (

        <div className="page-container">

            {flash && (
                <div style={{
                    position: "fixed",
                    top: "70px",
                    right: "16px",
                    zIndex: 999,
                    backgroundColor: "white",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    borderLeft: `4px solid ${flash.error ? "#b42318" : "#2e7d32"}`,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                    maxWidth: "320px"
                }}>
                    {flash.error ? "✕" : "✓"} {flash.text}
                </div>
            )}

            <div className="dashboard-header">
                <h1>🛒 My Cart</h1>
                <p>Review your medicines before placing the order.</p>
            </div>

            {cart.length === 0 ? (

                <div className="card" style={{
                    textAlign: "center",
                    maxWidth: "520px",
                    margin: "0 auto"
                }}>

                    <div style={{ fontSize: "46px" }}>🛒</div>

                    <h3>Your cart is empty</h3>

                    <p style={{ color: "#667085" }}>
                        Add medicines from the Customer Dashboard.
                    </p>

                    <Link to="/customer-dashboard">
                        <button style={{ marginTop: "10px" }}>
                            Browse Medicines
                        </button>
                    </Link>

                </div>

            ) : (

                <div style={{
                    display: "flex",
                    gap: "22px",
                    flexWrap: "wrap",
                    alignItems: "flex-start"
                }}>

                    {/* Items */}

                    <div style={{ flex: "1 1 420px" }}>

                        {cart.map((medicine, index) => {

                            const quantity = medicine.cartQuantity || 1;

                            return (

                                <div
                                    key={medicine.id}
                                    className="card"
                                    style={{
                                        display: "flex",
                                        gap: "14px",
                                        marginBottom: "14px",
                                        padding: "18px"
                                    }}
                                >

                                    <div style={{
                                        width: "46px",
                                        height: "46px",
                                        minWidth: "46px",
                                        borderRadius: "50%",
                                        backgroundColor: "#e0f2f1",
                                        color: "#0b6e4f",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "bold",
                                        fontSize: "19px"
                                    }}>
                                        {medicine.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div style={{ flex: 1 }}>

                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: "10px",
                                            flexWrap: "wrap"
                                        }}>
                                            <strong style={{ color: "#1d2939", fontSize: "16px" }}>
                                                {medicine.name}
                                            </strong>

                                            <strong style={{ color: "#0b6e4f" }}>
                                                ₹{medicine.price * quantity}
                                            </strong>
                                        </div>

                                        <div style={{
                                            fontSize: "13px",
                                            color: "#667085",
                                            marginTop: "4px"
                                        }}>
                                            {medicine.category}
                                            {" • "}
                                            {medicine.packageSize || "Pack not specified"}
                                            {" • "}
                                            ₹{medicine.price} each
                                        </div>

                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            marginTop: "12px"
                                        }}>

                                            <button
                                                onClick={() => decreaseQuantity(index)}
                                                style={{ padding: "4px 12px" }}
                                            >
                                                −
                                            </button>

                                            <strong style={{
                                                minWidth: "24px",
                                                textAlign: "center"
                                            }}>
                                                {quantity}
                                            </strong>

                                            <button
                                                onClick={() => increaseQuantity(index)}
                                                style={{ padding: "4px 12px" }}
                                            >
                                                +
                                            </button>

                                            <button
                                                onClick={() => removeFromCart(index)}
                                                style={{
                                                    marginLeft: "auto",
                                                    backgroundColor: "transparent",
                                                    color: "#b42318",
                                                    border: "1px solid #f1c4c1",
                                                    padding: "5px 12px"
                                                }}
                                            >
                                                Remove
                                            </button>

                                        </div>

                                    </div>

                                </div>
                            );
                        })}

                    </div>

                    {/* Summary */}

                    <div
                        className="card"
                        style={{
                            flex: "0 0 290px",
                            position: "sticky",
                            top: "80px"
                        }}
                    >

                        <h3>Order Summary</h3>

                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            margin: "14px 0 8px"
                        }}>
                            <span>Items</span>
                            <strong>{getItemCount()}</strong>
                        </div>

                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingTop: "12px",
                            borderTop: "1px dashed #d9dfe3",
                            fontSize: "18px"
                        }}>
                            <strong>Total</strong>
                            <strong style={{ color: "#0b6e4f" }}>
                                ₹{getTotal()}
                            </strong>
                        </div>

                        <button
                            onClick={placeOrder}
                            disabled={placingOrder}
                            style={{
                                width: "100%",
                                marginTop: "18px",
                                padding: "12px"
                            }}
                        >
                            {placingOrder ? "Placing order..." : "📦 Place Order"}
                        </button>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Cart;
