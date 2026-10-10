import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// Change the pharmacy name here
const PHARMACY_NAME = "MediCare Pharmacy";

function AdminDashboard() {

    const [medicines, setMedicines] = useState([]);
    const [search, setSearch] = useState("");
    const [flash, setFlash] = useState(null);

    const navigate = useNavigate();

    const showMessage = (text, error = false) => {
        setFlash({ text, error });
        setTimeout(() => setFlash(null), 2800);
    };

    useEffect(() => {

        const user = JSON.parse(sessionStorage.getItem("user"));

        if (!user) {
            navigate("/login");
            return;
        }

        if (user.role !== "ADMIN") {
            navigate("/customer-dashboard");
            return;
        }

        getMedicines();

    }, []);

    const getMedicines = async () => {

        try {

            const response = await axios.get(
                "http://localhost:8081/medicine/all"
            );

            setMedicines(response.data);

        } catch (error) {

            console.log(error);
            showMessage("Unable to load medicines", true);
        }
    };

    const deleteMedicine = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this medicine?"
        );

        if (!confirmDelete) {
            return;
        }

        try {

            const user = JSON.parse(sessionStorage.getItem("user"));

            if (!user || !user.token) {
                showMessage("Admin login required!", true);
                return;
            }

            await axios.delete(
                `http://localhost:8081/medicine/delete/${id}`,
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            showMessage("Medicine deleted successfully!");

            getMedicines();

        } catch (error) {

            console.log(error);

            if (error.response) {

                if (error.response.status === 403) {
                    showMessage("Delete failed! Admin authorization is required.", true);
                } else if (error.response.status === 404) {
                    showMessage("Medicine not found!", true);
                } else {
                    showMessage("Failed to delete medicine!", true);
                }

            } else {

                showMessage("Unable to connect to the backend!", true);
            }
        }
    };

    const typed = search.trim().toLowerCase();

    const visibleMedicines = medicines.filter((m) =>
        !typed || (m.name && m.name.toLowerCase().includes(typed))
    );

    const lowStock = medicines.filter((m) => m.quantity > 0 && m.quantity <= 10).length;
    const outOfStock = medicines.filter((m) => m.quantity <= 0).length;

    const statCard = (label, value, color) => (
        <div className="card" style={{
            flex: "1 1 160px",
            padding: "16px 20px",
            textAlign: "left"
        }}>
            <div style={{ fontSize: "13px", color: "#667085" }}>{label}</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: color }}>
                {value}
            </div>
        </div>
    );

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
                <h1>💊 {PHARMACY_NAME}</h1>
                <p>Welcome, Pharmacy Staff! Manage medicines and orders here.</p>
            </div>

            {/* Quick numbers */}

            <div style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                marginBottom: "22px"
            }}>
                {statCard("Total medicines", medicines.length, "#1d2939")}
                {statCard("Low stock (10 or less)", lowStock, "#b54708")}
                {statCard("Out of stock", outOfStock, "#b42318")}
            </div>

            {/* Actions + search */}

            <div style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: "20px"
            }}>

                <input
                    type="text"
                    placeholder="Search medicine..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: "1 1 240px", maxWidth: "340px" }}
                />

                <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>

                    <Link to="/add-medicine">
                        <button>+ Add Medicine</button>
                    </Link>

                    <Link to="/admin-orders">
                        <button>📦 Manage Orders</button>
                    </Link>

                </div>

            </div>

            <h2>Medicine Management</h2>

            {visibleMedicines.length === 0 ? (

                <div className="card" style={{ textAlign: "center" }}>
                    <p>No medicines found.</p>
                </div>

            ) : (

                <div className="medicine-grid">

                    {visibleMedicines.map((medicine) => (

                        <div className="medicine-card" key={medicine.id}>

                            <div style={{
                                height: "140px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#f8fbfb",
                                borderRadius: "10px",
                                marginBottom: "12px",
                                overflow: "hidden"
                            }}>

                                {medicine.imageUrl ? (

                                    <img
                                        src={medicine.imageUrl}
                                        alt={medicine.name}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain"
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />

                                ) : (

                                    <span style={{ fontSize: "46px" }}>💊</span>

                                )}

                            </div>

                            <h3 style={{ marginBottom: "4px" }}>{medicine.name}</h3>

                            {medicine.category && (
                                <span style={{
                                    display: "inline-block",
                                    backgroundColor: "#eef2f6",
                                    color: "#475467",
                                    padding: "2px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    marginBottom: "8px"
                                }}>
                                    {medicine.category}
                                </span>
                            )}

                            <p className="desc-clamp" style={{ color: "#667085", minHeight: "40px" }}>
                                {medicine.description}
                            </p>

                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                margin: "10px 0 4px"
                            }}>
                                <strong style={{ color: "#0b6e4f", fontSize: "18px" }}>
                                    ₹{medicine.price}
                                </strong>

                                {medicine.quantity <= 0 ? (
                                    <strong style={{ color: "#b42318" }}>Out of stock</strong>
                                ) : medicine.quantity <= 10 ? (
                                    <strong style={{ color: "#b54708" }}>
                                        Low stock: {medicine.quantity}
                                    </strong>
                                ) : (
                                    <span>Stock: {medicine.quantity}</span>
                                )}
                            </div>

                            <p style={{ fontSize: "13px", color: "#667085" }}>
                                Expiry: {medicine.expiryDate}
                            </p>

                            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>

                                <Link
                                    to={`/update-medicine/${medicine.id}`}
                                    style={{ flex: 1 }}
                                >
                                    <button style={{ width: "100%" }}>Update</button>
                                </Link>

                                <button
                                    onClick={() => deleteMedicine(medicine.id)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: "white",
                                        color: "#b42318",
                                        border: "1px solid #f1c4c1"
                                    }}
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default AdminDashboard;
