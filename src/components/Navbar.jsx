import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

// Change the pharmacy name here
const PHARMACY_NAME = "MediCare Pharmacy";

function Navbar() {

    const navigate = useNavigate();

    const readUser = () => {
        try {
            return JSON.parse(sessionStorage.getItem("user"));
        } catch {
            return null;
        }
    };

    const [user, setUser] = useState(readUser());

    useEffect(() => {

        const updateUser = () => setUser(readUser());

        window.addEventListener("storage", updateUser);
        window.addEventListener("authChanged", updateUser);

        return () => {
            window.removeEventListener("storage", updateUser);
            window.removeEventListener("authChanged", updateUser);
        };

    }, []);

    const logout = () => {

        sessionStorage.removeItem("user");

        window.dispatchEvent(new Event("authChanged"));

        navigate("/login");
    };

    const linkStyle = ({ isActive }) => ({
        color: "white",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: isActive ? "bold" : "500",
        padding: "6px 4px",
        margin: "0 8px",
        borderBottom: isActive
            ? "2px solid white"
            : "2px solid transparent",
        opacity: isActive ? 1 : 0.85
    });

    const rolePill = {
        backgroundColor: "rgba(255,255,255,0.15)",
        color: "white",
        padding: "5px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "bold",
        marginLeft: "8px"
    };

    const logoutButton = {
        backgroundColor: "transparent",
        color: "white",
        border: "1px solid rgba(255,255,255,0.7)",
        borderRadius: "8px",
        padding: "6px 14px",
        cursor: "pointer",
        marginLeft: "8px",
        fontSize: "13px"
    };

    return (

        <nav style={{
            backgroundColor: "#0b6e4f",
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
        }}>

            <NavLink
                to="/"
                style={{
                    color: "white",
                    textDecoration: "none",
                    fontSize: "19px",
                    fontWeight: "bold",
                    letterSpacing: "0.3px"
                }}
            >
                💊 {PHARMACY_NAME}
            </NavLink>

            <div style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "2px"
            }}>

                <NavLink to="/" end style={linkStyle}>
                    Home
                </NavLink>

                {!user && (
                    <>
                        <NavLink to="/login" style={linkStyle}>
                            Login
                        </NavLink>

                        <NavLink to="/register" style={linkStyle}>
                            Register
                        </NavLink>
                    </>
                )}

                {user && user.role === "CUSTOMER" && (
                    <>
                        <NavLink to="/customer-dashboard" style={linkStyle}>
                            Dashboard
                        </NavLink>

                        <NavLink to="/cart" style={linkStyle}>
                            Cart
                        </NavLink>

                        <NavLink to="/my-orders" style={linkStyle}>
                            My Orders
                        </NavLink>

                        <span style={rolePill}>👤 Customer</span>

                        <button onClick={logout} style={logoutButton}>
                            Logout
                        </button>
                    </>
                )}

                {user && user.role === "ADMIN" && (
                    <>
                        <NavLink to="/admin-dashboard" style={linkStyle}>
                            Dashboard
                        </NavLink>

                        <NavLink to="/admin-orders" style={linkStyle}>
                            Manage Orders
                        </NavLink>

                        <span style={rolePill}>👨‍💼 Pharmacy Staff</span>

                        <button onClick={logout} style={logoutButton}>
                            Logout
                        </button>
                    </>
                )}

            </div>

        </nav>
    );
}

export default Navbar;
