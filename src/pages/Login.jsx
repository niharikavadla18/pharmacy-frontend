import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// Change the pharmacy name here
const PHARMACY_NAME = "MediCare Pharmacy";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const navigate = useNavigate();

    const loginUser = async () => {

        if (!email || !password) {
            alert("Please enter email and password!");
            return;
        }

        try {

            const response = await axios.post(
                "https://pharmacy-backend-1-wreu.onrender.com/user/login",
                { email: email, password: password }
            );

            const data = response.data;

            // Read the role from the login response
            const roleValue =
                data.role ??
                data.user?.role ??
                data.userRole ??
                data.user?.userRole ??
                "";

            const role = String(roleValue)
                .replace(/^ROLE_/i, "")
                .toUpperCase();

            // Do not redirect if the backend did not return a role
            if (role !== "ADMIN" && role !== "CUSTOMER") {
                console.log("Login response:", data);
                alert("Login successful, but user role is missing or incorrect. Please check the backend login response!");
                return;
            }

            // Preserve the original response and store the normalized role
            const userData = {
                ...data,
                role: role
            };

            // Keep the original user object if one is returned
            if (data.user && typeof data.user === "object") {
                userData.user = {
                    ...data.user,
                    role: role
                };
            }

            sessionStorage.setItem(
                "user",
                JSON.stringify(userData)
            );

            window.dispatchEvent(new Event("authChanged"));

            setSuccessMessage("Login successful! Redirecting...");

            setTimeout(() => {

                if (role === "ADMIN") {
                    navigate("/admin-dashboard");
                } else {
                    navigate("/customer-dashboard");
                }

            }, 1000);

        } catch (error) {

            console.log(error);
            alert("Invalid email or password!");
        }
    };

    return (

        <div style={{
            minHeight: "85vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f4f8fb",
            padding: "30px 20px"
        }}>

            <div style={{
                width: "100%",
                maxWidth: "420px",
                backgroundColor: "white",
                padding: "35px",
                borderRadius: "12px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.10)"
            }}>

                <div style={{ textAlign: "center", marginBottom: "14px", fontWeight: "bold", fontSize: "15px", letterSpacing: "0.5px", color: "#555" }}>
                    💊 {PHARMACY_NAME}
                </div>

                <h1 style={{
                    fontSize: "28px",
                    marginBottom: "8px",
                    textAlign: "center",
                    color: "#0b6e4f"
                }}>
                    Login
                </h1>

                <p style={{
                    textAlign: "center",
                    color: "#666",
                    marginBottom: "22px"
                }}>
                    Login to your pharmacy account
                </p>

                {successMessage && (
                    <div style={{
                        backgroundColor: "#e8f5e9",
                        color: "#2e7d32",
                        border: "1px solid #a5d6a7",
                        borderRadius: "8px",
                        padding: "12px 15px",
                        marginBottom: "18px",
                        fontSize: "14px",
                        fontWeight: "500",
                        textAlign: "center"
                    }}>
                        ✓ {successMessage}
                    </div>
                )}

                <label>Email</label>

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginTop: "6px",
                        marginBottom: "15px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        boxSizing: "border-box"
                    }}
                />

                <label>Password</label>

                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            loginUser();
                        }
                    }}
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginTop: "6px",
                        marginBottom: "20px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        boxSizing: "border-box"
                    }}
                />

                <button
                    onClick={loginUser}
                    style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#0b6e4f",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}
                >
                    Login
                </button>

                <p style={{
                    textAlign: "center",
                    marginTop: "20px",
                    color: "#666"
                }}>
                    Don't have an account?{" "}

                    <Link
                        to="/register"
                        style={{
                            color: "#0b6e4f",
                            fontWeight: "bold",
                            textDecoration: "none"
                        }}
                    >
                        Create Account
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Login;