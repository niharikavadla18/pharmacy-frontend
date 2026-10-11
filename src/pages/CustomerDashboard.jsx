import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// Change the pharmacy name here
const PHARMACY_NAME = "MediCare Pharmacy";

// Every user has his own cart (two customers on one browser do not share it)
const cartKey = () => {
    try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        return user ? `cart_${user.id}` : "cart";
    } catch {
        return "cart";
    }
};

function CustomerDashboard() {

    const [medicines, setMedicines] = useState([]);

    // NEW: full list, used only for search suggestions
    const [allMedicines, setAllMedicines] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [search, setSearch] = useState("");
    const [cartCount, setCartCount] = useState(0);

    // NEW: small message tag (replaces alert)
    const [flash, setFlash] = useState(null);

    const [selectedQuantity, setSelectedQuantity] =
        useState({});

    const showMessage = (text, error = false) => {
        setFlash({ text, error });
        setTimeout(() => setFlash(null), 2500);
    };

    useEffect(() => {

        getMedicines();
        updateCartCount();

        // NEW: cart count updates when another tab changes the cart
        const handleStorage = (e) => {
            if (e.key === cartKey()) {
                updateCartCount();
            }
        };

        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener("storage", handleStorage);
        };

    }, []);

    const getMedicines = async () => {

        try {

            const response = await axios.get(
                "https://pharmacy-backend-1-wreu.onrender.com/medicine/all"
            );

            setMedicines(response.data);
            setAllMedicines(response.data);

            const quantities = {};

            response.data.forEach((medicine) => {
                quantities[medicine.id] = 1;
            });

            setSelectedQuantity(quantities);

        } catch (error) {

            console.log(error);

            showMessage("Unable to load medicines", true);
        }
    };

    // CHANGED: accepts a term (used by the suggestion list)
    const searchMedicines = async (term = search) => {

        setShowSuggestions(false);

        try {

            if (term.trim() === "") {
                getMedicines();
                return;
            }

            const response = await axios.get(
                "https://pharmacy-backend-1-wreu.onrender.com/medicine/all"
            );

            setMedicines(response.data);

            const quantities = {};

            response.data.forEach((medicine) => {
                quantities[medicine.id] = 1;
            });

            setSelectedQuantity(quantities);

        } catch (error) {

            console.log(error);

            showMessage("Search failed", true);
        }
    };

    // NEW: suggestions while typing (names starting with the letters come first)
    const typed = search.trim().toLowerCase();

    const suggestions = typed
        ? allMedicines
            .filter((m) =>
                m.name && m.name.toLowerCase().includes(typed)
            )
            .sort((a, b) =>
                Number(b.name.toLowerCase().startsWith(typed)) -
                Number(a.name.toLowerCase().startsWith(typed))
            )
            .slice(0, 6)
        : [];

    const increaseQuantity = (medicine) => {

        const currentQuantity =
            selectedQuantity[medicine.id] || 1;

        if (currentQuantity >= medicine.quantity) {

            showMessage(
                "You cannot select more than available stock!",
                true
            );

            return;
        }

        setSelectedQuantity({
            ...selectedQuantity,
            [medicine.id]: currentQuantity + 1
        });
    };

    const decreaseQuantity = (medicine) => {

        const currentQuantity =
            selectedQuantity[medicine.id] || 1;

        if (currentQuantity <= 1) {
            return;
        }

        setSelectedQuantity({
            ...selectedQuantity,
            [medicine.id]: currentQuantity - 1
        });
    };

    const addToCart = (medicine) => {

        if (medicine.quantity <= 0) {

            showMessage("This medicine is out of stock!", true);

            return;
        }

        const selected =
            selectedQuantity[medicine.id] || 1;

        const cart =
            JSON.parse(localStorage.getItem(cartKey())) || [];

        const existingIndex = cart.findIndex(
            (item) => item.id === medicine.id
        );

        if (existingIndex !== -1) {

            const existingQuantity =
                cart[existingIndex].cartQuantity || 1;

            const newQuantity =
                existingQuantity + selected;

            if (newQuantity > medicine.quantity) {

                showMessage(
                    `Only ${medicine.quantity} available in stock.`,
                    true
                );

                return;
            }

            cart[existingIndex].cartQuantity =
                newQuantity;

        } else {

            if (selected > medicine.quantity) {

                showMessage(
                    `Only ${medicine.quantity} available in stock.`,
                    true
                );

                return;
            }

            cart.push({
                ...medicine,
                cartQuantity: selected
            });
        }

        localStorage.setItem(
            cartKey(),
            JSON.stringify(cart)
        );

        updateCartCount();

        showMessage(
            `${medicine.name} (${selected}) added to cart!`
        );

        setSelectedQuantity({
            ...selectedQuantity,
            [medicine.id]: 1
        });
    };

    const updateCartCount = () => {

        const cart =
            JSON.parse(localStorage.getItem(cartKey())) || [];

        let count = 0;

        cart.forEach((medicine) => {

            count =
                count +
                (medicine.cartQuantity || 1);
        });

        setCartCount(count);
    };

    return (
        <div className="page-container">

            {/* NEW: message tag */}
            {flash && (
                <div style={{
                    position: "fixed",
                    top: "16px",
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

                <h1>
                    💊 {PHARMACY_NAME}
                </h1>

                <p>
                    Search and choose your medicines easily.
                </p>

            </div>

            <div
                className="card"
                style={{
                    textAlign: "center",
                    marginBottom: "25px"
                }}
            >

                <h2>
                    🔍 Find Your Medicine
                </h2>

                <p style={{
                    color: "#666"
                }}>
                    Search for medicines by name
                </p>

                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "20px"
                }}>

                    {/* CHANGED: input with suggestion list */}
                    <div style={{
                        position: "relative",
                        width: "300px"
                    }}>

                        <input
                            type="text"
                            placeholder="Search medicine..."
                            value={search}
                            autoComplete="off"
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() =>
                                setTimeout(
                                    () => setShowSuggestions(false),
                                    150
                                )
                            }
                            onKeyDown={(e) => {

                                if (e.key === "Enter") {
                                    searchMedicines();
                                }

                            }}
                            style={{
                                width: "100%",
                                boxSizing: "border-box"
                            }}
                        />

                        {showSuggestions && suggestions.length > 0 && (

                            <div style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: "100%",
                                marginTop: "4px",
                                backgroundColor: "white",
                                border: "1px solid #e2e8ec",
                                borderRadius: "8px",
                                boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                                zIndex: 30,
                                textAlign: "left"
                            }}>

                                {suggestions.map((m) => (

                                    <div
                                        key={m.id}
                                        onMouseDown={() => {
                                            setSearch(m.name);
                                            searchMedicines(m.name);
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = "#f4f8fb")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = "white")
                                        }
                                        style={{
                                            padding: "9px 12px",
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between"
                                        }}
                                    >
                                        <span>{m.name}</span>

                                        <small style={{ color: "#777" }}>
                                            ₹{m.price}
                                        </small>
                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                    <button
                        onClick={() => searchMedicines()}
                    >
                        🔍 Search
                    </button>

                    <button
                        onClick={() => {

                            setSearch("");

                            getMedicines();

                        }}
                    >
                        Show All
                    </button>

                </div>

            </div>

            <div style={{
                textAlign: "center",
                marginBottom: "30px"
            }}>

                <Link to="/cart">

                    <button>
                        🛒 Cart ({cartCount})
                    </button>

                </Link>

                {" "}

                <Link to="/my-orders">

                    <button>
                        📦 My Orders
                    </button>

                </Link>

            </div>

            <h2 className="page-title">
                Available Medicines
            </h2>

            <p className="page-subtitle">
                Choose a medicine and select the quantity you need.
            </p>

            {medicines.length === 0 ? (

                <div
                    className="card"
                    style={{
                        textAlign: "center"
                    }}
                >

                    <div style={{
                        fontSize: "45px"
                    }}>
                        🔍
                    </div>

                    <h3>
                        No medicines found
                    </h3>

                    <p>
                        Try searching with another medicine name.
                    </p>

                </div>

            ) : (

                <div className="medicine-grid">

                    {medicines.map((medicine) => {

                        const currentQuantity =
                            selectedQuantity[medicine.id] || 1;

                        return (

                            <div
                                className="medicine-card"
                                key={medicine.id}
                            >

                                {/* MEDICINE IMAGE */}

                                <div style={{
                                    width: "100%",
                                    height: "190px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginBottom: "15px",
                                    background: "#f8fbff",
                                    borderRadius: "10px"
                                }}>

                                    {medicine.imageUrl ? (

                                        <img
                                            src={medicine.imageUrl}
                                            alt={medicine.name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                borderRadius: "10px"
                                            }}
                                            onError={(e) => {

                                                e.target.style.display =
                                                    "none";

                                                e.target.parentElement.innerHTML =
                                                    "💊";

                                                e.target.parentElement.style.fontSize =
                                                    "55px";
                                            }}
                                        />

                                    ) : (

                                        <span style={{
                                            fontSize: "55px"
                                        }}>
                                            💊
                                        </span>

                                    )}

                                </div>

                                <h3 style={{
                                    textAlign: "center"
                                }}>
                                    {medicine.name}
                                </h3>

                                <p>
                                    <strong>
                                        Category:
                                    </strong>{" "}
                                    {medicine.category}
                                </p>

                                <p>
                                    <strong>
                                        Package Size:
                                    </strong>{" "}
                                    {medicine.packageSize || "Not specified"}
                                </p>

                                <p style={{
                                    color: "#666",
                                    minHeight: "45px"
                                }}>
                                    {medicine.description}
                                </p>

                                <p>
                                    <strong>
                                        Price:
                                    </strong>{" "}

                                    <span style={{
                                        color: "#0b5ed7",
                                        fontSize: "18px",
                                        fontWeight: "bold"
                                    }}>
                                        ₹{medicine.price}
                                    </span>
                                </p>

                                <p>
                                    <strong>
                                        Available:
                                    </strong>{" "}

                                    {medicine.quantity > 0 ? (

                                        <span style={{
                                            color: "green",
                                            fontWeight: "bold"
                                        }}>
                                            {medicine.quantity}
                                        </span>

                                    ) : (

                                        <span style={{
                                            color: "red",
                                            fontWeight: "bold"
                                        }}>
                                            Out of Stock
                                        </span>

                                    )}

                                </p>

                                <p>
                                    <strong>
                                        Expiry:
                                    </strong>{" "}
                                    {medicine.expiryDate}
                                </p>

                                {/* quantity + add to cart stay together at the bottom */}
                                <div style={{ marginTop: "auto" }}>

                                {medicine.quantity > 0 && (

                                    <div style={{
                                        textAlign: "center",
                                        marginTop: "15px"
                                    }}>

                                        <p>
                                            <strong>
                                                Quantity
                                            </strong>
                                        </p>

                                        <button
                                            onClick={() =>
                                                decreaseQuantity(
                                                    medicine
                                                )
                                            }
                                        >
                                            −
                                        </button>

                                        <span style={{
                                            display: "inline-block",
                                            minWidth: "50px",
                                            fontSize: "20px",
                                            fontWeight: "bold"
                                        }}>
                                            {currentQuantity}
                                        </span>

                                        <button
                                            onClick={() =>
                                                increaseQuantity(
                                                    medicine
                                                )
                                            }
                                        >
                                            +
                                        </button>

                                    </div>

                                )}

                                <div style={{
                                    textAlign: "center",
                                    marginTop: "14px"
                                }}>

                                    {medicine.quantity > 0 ? (

                                        <button
                                            style={{ width: "100%", padding: "11px" }}
                                            onClick={() =>
                                                addToCart(
                                                    medicine
                                                )
                                            }
                                        >
                                            🛒 Add to Cart
                                        </button>

                                    ) : (

                                        <button
                                            disabled
                                            style={{ width: "100%", padding: "11px" }}
                                        >
                                            Out of Stock
                                        </button>

                                    )}

                                </div>

                                </div>

                            </div>

                        );

                    })}

                </div>

            )}

        </div>
    );
}

export default CustomerDashboard;
