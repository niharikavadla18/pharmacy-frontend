import { Link } from "react-router-dom";

// Change the pharmacy name here
const PHARMACY_NAME = "MediCare Pharmacy";

function Home() {

    let user = null;

    try {
        user = JSON.parse(sessionStorage.getItem("user"));
    } catch {
        user = null;
    }

    const features = [
        {
            icon: "🔍",
            title: "Find medicines fast",
            text: "Type the first letters and see matching medicines instantly."
        },
        {
            icon: "🛒",
            title: "Easy ordering",
            text: "Add medicines to your cart and place your order in a few clicks."
        },
        {
            icon: "📦",
            title: "Track every order",
            text: "See when your order is accepted, shipped and delivered."
        }
    ];

    return (

        <div style={{ flex: 1 }}>

            {/* Hero */}

            <div style={{
                textAlign: "center",
                padding: "70px 20px 60px",
                background: "linear-gradient(180deg, #e8f4f0 0%, #f6f8f9 100%)"
            }}>

                <div style={{ fontSize: "54px" }}></div>

                <h1 style={{
                    fontSize: "40px",
                    color: "#0b6e4f",
                    margin: "10px 0 12px"
                }}>
                    {PHARMACY_NAME}
                </h1>

                <p style={{
                    fontSize: "18px",
                    color: "#667085",
                    maxWidth: "520px",
                    margin: "0 auto 28px"
                }}>
                    Genuine medicines, simple ordering and quick delivery,
                    all in one place.
                </p>

                <div style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "center",
                    flexWrap: "wrap"
                }}>

                    {!user && (
                        <>
                            <Link to="/login">
                                <button style={{ padding: "12px 28px", fontSize: "15px" }}>
                                    Login
                                </button>
                            </Link>

                            <Link to="/register">
                                <button style={{
                                    padding: "12px 28px",
                                    fontSize: "15px",
                                    backgroundColor: "white",
                                    color: "#0b6e4f",
                                    border: "1px solid #0b6e4f"
                                }}>
                                    Create Account
                                </button>
                            </Link>
                        </>
                    )}

                    {user && user.role === "CUSTOMER" && (
                        <>
                            <Link to="/customer-dashboard">
                                <button style={{ padding: "12px 28px", fontSize: "15px" }}>
                                    Browse Medicines
                                </button>
                            </Link>

                            <Link to="/my-orders">
                                <button style={{
                                    padding: "12px 28px",
                                    fontSize: "15px",
                                    backgroundColor: "white",
                                    color: "#0b6e4f",
                                    border: "1px solid #0b6e4f"
                                }}>
                                    My Orders
                                </button>
                            </Link>
                        </>
                    )}

                    {user && user.role === "ADMIN" && (
                        <>
                            <Link to="/admin-dashboard">
                                <button style={{ padding: "12px 28px", fontSize: "15px" }}>
                                    Open Dashboard
                                </button>
                            </Link>

                            <Link to="/admin-orders">
                                <button style={{
                                    padding: "12px 28px",
                                    fontSize: "15px",
                                    backgroundColor: "white",
                                    color: "#0b6e4f",
                                    border: "1px solid #0b6e4f"
                                }}>
                                    Manage Orders
                                </button>
                            </Link>
                        </>
                    )}

                </div>

            </div>

            {/* Features */}

            <div style={{
                maxWidth: "1000px",
                margin: "0 auto",
                padding: "10px 20px 60px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "20px"
            }}>

                {features.map((feature) => (

                    <div
                        key={feature.title}
                        className="card"
                        style={{ textAlign: "center" }}
                    >
                        <div style={{ fontSize: "34px" }}>{feature.icon}</div>

                        <h3 style={{ margin: "8px 0" }}>{feature.title}</h3>

                        <p style={{ color: "#667085", margin: 0 }}>
                            {feature.text}
                        </p>
                    </div>

                ))}

            </div>

        </div>
    );
}

export default Home;
