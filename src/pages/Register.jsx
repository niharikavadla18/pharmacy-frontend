import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

// Change the pharmacy name here
const PHARMACY_NAME = "MediCare Pharmacy";

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const navigate = useNavigate();

    // Validation
    const nameValid =
        /^[A-Za-z ]+$/.test(name) &&
        name.trim().length >= 3;

    const emailValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const passwordLength = password.length >= 6;
    const passwordLetter = /[A-Za-z]/.test(password);
    const passwordNumber = /\d/.test(password);

    const passwordValid =
        passwordLength &&
        passwordLetter &&
        passwordNumber;

    // NEW: email domain suggestions while typing
    const domains = ["gmail.com", "yahoo.com", "outlook.com"];

    const localPart = email.split("@")[0];
    const typedDomain = email.includes("@") ? email.split("@")[1] : "";

    const emailSuggestions = !localPart
        ? []
        : domains
            .filter((d) =>
                d.startsWith(typedDomain.toLowerCase()) &&
                d !== typedDomain.toLowerCase()
            )
            .map((d) => `${localPart}@${d}`);

    const registerUser = async () => {

        setErrorMessage("");

        if (!name || !email || !password) {
            setErrorMessage("Please fill all fields!");
            return;
        }

        if (!nameValid) {
            setErrorMessage(
                "Name should contain at least 3 letters and only alphabets."
            );
            return;
        }

        if (!emailValid) {
            setErrorMessage("Please enter a valid email address.");
            return;
        }

        if (!passwordValid) {
            setErrorMessage(
                "Password must contain at least 6 characters, one letter and one number."
            );
            return;
        }

        try {

            await axios.post(
                "http://localhost:8081/user/register",
                {
                    name: name,
                    email: email,
                    password: password,
                    role: "CUSTOMER"
                }
            );

            setSuccessMessage(
                "Registration successful! Redirecting to login..."
            );

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {

            console.log(error);

            if (error.response) {
                setErrorMessage(
                    error.response.data?.message ||
                    "Registration failed!"
                );
            } else {
                setErrorMessage("Registration failed!");
            }
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
                borderRadius: "14px",
                boxShadow: "0 6px 25px rgba(0,0,0,0.10)"
            }}>

                <style>
                    {`
                        .register-input {
                            transition: all 0.25s ease;
                        }

                        .register-input:focus {
                            outline: none;
                            border-color: #0b6e4f !important;
                            box-shadow: 0 0 0 3px rgba(11,110,79,0.10);
                        }

                        .register-button {
                            transition: all 0.25s ease;
                        }

                        .register-button:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 5px 12px rgba(11,110,79,0.25);
                        }

                        .suggestion-item:hover {
                            background-color: #f4f8fb;
                        }
                    `}
                </style>

                <div style={{ textAlign: "center", marginBottom: "14px", fontWeight: "bold", fontSize: "15px", letterSpacing: "0.5px", color: "#555" }}>
                    💊 {PHARMACY_NAME}
                </div>

                <h1 style={{
                    fontSize: "28px",
                    marginBottom: "8px",
                    textAlign: "center",
                    color: "#0b6e4f"
                }}>
                    Create Account
                </h1>

                <p style={{
                    textAlign: "center",
                    color: "#666",
                    marginBottom: "22px"
                }}>
                    Register as a customer
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

                {errorMessage && (
                    <div style={{
                        backgroundColor: "#fdecea",
                        color: "#b42318",
                        border: "1px solid #f5c2c0",
                        borderRadius: "8px",
                        padding: "12px 15px",
                        marginBottom: "18px",
                        fontSize: "14px",
                        fontWeight: "500",
                        textAlign: "center"
                    }}>
                        ✕ {errorMessage}
                    </div>
                )}

                {/* NAME */}

                <label style={{ fontWeight: "500" }}>
                    Name
                </label>

                <input
                    className="register-input"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginTop: "6px",
                        border:
                            name && !nameValid
                                ? "1px solid #d32f2f"
                                : "1px solid #ccc",
                        borderRadius: "6px",
                        boxSizing: "border-box"
                    }}
                />

                {name && !nameValid && (
                    <p style={{
                        color: "#d32f2f",
                        fontSize: "12px",
                        marginTop: "5px",
                        marginBottom: "12px"
                    }}>
                        Name must contain at least 3 letters and no numbers.
                    </p>
                )}

                {name && nameValid && (
                    <p style={{
                        color: "#2e7d32",
                        fontSize: "12px",
                        marginTop: "5px",
                        marginBottom: "12px"
                    }}>
                        ✓ Looks good
                    </p>
                )}

                {!name && (
                    <div style={{ height: "12px", marginBottom: "12px" }} />
                )}

                {/* EMAIL */}

                <label style={{ fontWeight: "500" }}>
                    Gmail / Email
                </label>

                <div style={{ position: "relative" }}>

                    <input
                        className="register-input"
                        type="email"
                        autoComplete="off"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() =>
                            setTimeout(() => setShowSuggestions(false), 150)
                        }
                        onKeyDown={(e) => {

                            // Tab accepts the first suggestion
                            if (
                                e.key === "Tab" &&
                                showSuggestions &&
                                emailSuggestions.length > 0
                            ) {
                                e.preventDefault();
                                setEmail(emailSuggestions[0]);
                                setShowSuggestions(false);
                            }
                        }}
                        style={{
                            width: "100%",
                            padding: "11px",
                            marginTop: "6px",
                            border:
                                email && !emailValid
                                    ? "1px solid #d32f2f"
                                    : "1px solid #ccc",
                            borderRadius: "6px",
                            boxSizing: "border-box"
                        }}
                    />

                    {showSuggestions && emailSuggestions.length > 0 && (
                        <div style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: "100%",
                            marginTop: "3px",
                            backgroundColor: "white",
                            border: "1px solid #e2e8ec",
                            borderRadius: "8px",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
                            zIndex: 30
                        }}>
                            {emailSuggestions.map((suggestion) => (
                                <div
                                    key={suggestion}
                                    className="suggestion-item"
                                    onMouseDown={() => {
                                        setEmail(suggestion);
                                        setShowSuggestions(false);
                                    }}
                                    style={{
                                        padding: "9px 12px",
                                        cursor: "pointer",
                                        fontSize: "14px"
                                    }}
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}

                </div>

                {email && !emailValid && (
                    <p style={{
                        color: "#d32f2f",
                        fontSize: "12px",
                        marginTop: "5px",
                        marginBottom: "12px"
                    }}>
                        Please enter a valid email address.
                    </p>
                )}

                {email && emailValid && (
                    <p style={{
                        color: "#2e7d32",
                        fontSize: "12px",
                        marginTop: "5px",
                        marginBottom: "12px"
                    }}>
                        ✓ Valid email
                    </p>
                )}

                {!email && (
                    <div style={{ height: "12px", marginBottom: "12px" }} />
                )}

                {/* PASSWORD */}

                <label style={{ fontWeight: "500" }}>
                    Password
                </label>

                <input
                    className="register-input"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            registerUser();
                        }
                    }}
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginTop: "6px",
                        border:
                            password && !passwordValid
                                ? "1px solid #d32f2f"
                                : "1px solid #ccc",
                        borderRadius: "6px",
                        boxSizing: "border-box"
                    }}
                />

                <div style={{
                    backgroundColor: "#f8faf9",
                    borderRadius: "7px",
                    padding: "10px 12px",
                    marginTop: "8px",
                    marginBottom: "20px"
                }}>

                    <p style={{
                        margin: "0 0 6px",
                        fontSize: "12px",
                        color: "#555",
                        fontWeight: "bold"
                    }}>
                        Password requirements
                    </p>

                    <p style={{
                        margin: "4px 0",
                        fontSize: "12px",
                        color: passwordLength ? "#2e7d32" : "#777"
                    }}>
                        {passwordLength ? "✓" : "○"} At least 6 characters
                    </p>

                    <p style={{
                        margin: "4px 0",
                        fontSize: "12px",
                        color: passwordLetter ? "#2e7d32" : "#777"
                    }}>
                        {passwordLetter ? "✓" : "○"} At least one letter
                    </p>

                    <p style={{
                        margin: "4px 0",
                        fontSize: "12px",
                        color: passwordNumber ? "#2e7d32" : "#777"
                    }}>
                        {passwordNumber ? "✓" : "○"} At least one number
                    </p>

                </div>

                {/* REGISTER BUTTON */}

                <button
                    className="register-button"
                    onClick={registerUser}
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
                    Create Account
                </button>

                <p style={{
                    textAlign: "center",
                    marginTop: "20px",
                    color: "#666"
                }}>
                    Already have an account?{" "}

                    <Link
                        to="/login"
                        style={{
                            color: "#0b6e4f",
                            fontWeight: "bold",
                            textDecoration: "none"
                        }}
                    >
                        Login
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Register;
