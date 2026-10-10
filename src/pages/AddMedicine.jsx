import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const EMPTY = {
    name: "",
    category: "",
    description: "",
    price: "",
    packageSize: "",
    quantity: "",
    expiryDate: "",
    imageUrl: ""
};

const FIELDS = [
    { key: "category", label: "Category", type: "text", placeholder: "Example: Pain Relief" },
    { key: "packageSize", label: "Package Size", type: "text", placeholder: "Example: 500 mg, 100 ml, 50 g" },
    { key: "price", label: "Price (₹)", type: "number", placeholder: "Enter price" },
    { key: "quantity", label: "Quantity / Stock", type: "number", placeholder: "Enter stock quantity" },
    { key: "expiryDate", label: "Expiry Date", type: "date" },
    { key: "imageUrl", label: "Medicine Image URL", type: "text", placeholder: "Paste medicine image URL" }
];

const labelStyle = {
    display: "block",
    fontWeight: "500",
    fontSize: "14px",
    marginBottom: "6px",
    color: "#344054"
};

const inputStyle = { width: "100%" };

function AddMedicine() {

    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [flash, setFlash] = useState(null);

    const showMessage = (text, error = false) => {
        setFlash({ text, error });
        setTimeout(() => setFlash(null), 2800);
    };

    const change = (key, value) => setForm({ ...form, [key]: value });

    const payload = () => ({
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        packageSize: form.packageSize.trim(),
        quantity: Number(form.quantity),
        expiryDate: form.expiryDate,
        imageUrl: form.imageUrl.trim()
    });

    const problem = () => {
        if (!form.name.trim()) return "Please enter the medicine name.";
        if (!form.category.trim()) return "Please enter the category.";
        if (form.price === "" || Number(form.price) <= 0) return "Please enter a valid price.";
        if (form.quantity === "" || Number(form.quantity) < 0) return "Please enter the stock quantity.";
        if (!form.expiryDate) return "Please select the expiry date.";
        return "";
    };

    const save = async () => {

        const error = problem();

        if (error) {
            showMessage(error, true);
            return;
        }

        const user = JSON.parse(sessionStorage.getItem("user"));

        if (!user || !user.token) {
            showMessage("Admin login required!", true);
            return;
        }

        setSaving(true);

        try {

            await axios.post(
                "http://localhost:8081/medicine/add",
                payload(),
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            showMessage("Medicine added successfully!");

            setTimeout(() => navigate("/admin-dashboard"), 1000);

        } catch (error) {

            console.log(error);
            showMessage("Failed to add medicine!", true);
            setSaving(false);
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
                <h1>Add Medicine</h1>
                <p>Add medicine details and an image.</p>
            </div>

            <div className="card" style={{ maxWidth: "680px", margin: "0 auto" }}>

                <label style={labelStyle}>Medicine Name</label>

                <input
                    type="text"
                    placeholder="Enter medicine name"
                    value={form.name}
                    onChange={(e) => change("name", e.target.value)}
                    style={inputStyle}
                />

                <label style={{ ...labelStyle, marginTop: "16px" }}>Description</label>

                <textarea
                    rows={3}
                    placeholder="Enter medicine description"
                    value={form.description}
                    onChange={(e) => change("description", e.target.value)}
                    style={{ ...inputStyle, resize: "vertical" }}
                />

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "16px",
                    marginTop: "16px"
                }}>

                    {FIELDS.map((field) => (

                        <div
                            key={field.key}
                            style={{
                                gridColumn: field.key === "imageUrl" ? "1 / -1" : "auto"
                            }}
                        >

                            <label style={labelStyle}>{field.label}</label>

                            <input
                                type={field.type}
                                placeholder={field.placeholder}
                                value={form[field.key]}
                                min={field.type === "number" ? "0" : undefined}
                                onChange={(e) => change(field.key, e.target.value)}
                                style={inputStyle}
                            />

                        </div>

                    ))}

                </div>

                {form.imageUrl && (
                    <div style={{
                        marginTop: "16px",
                        height: "130px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f8fbfb",
                        borderRadius: "10px"
                    }}>
                        <img
                            src={form.imageUrl}
                            alt="Preview"
                            style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                    </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "22px" }}>

                    <button
                        onClick={save}
                        disabled={saving}
                        style={{ flex: 1, padding: "12px", fontSize: "15px" }}
                    >
                        {saving ? "Saving..." : "+ Add Medicine"}
                    </button>

                    <Link to="/admin-dashboard">
                        <button style={{
                            padding: "12px 20px",
                            fontSize: "15px",
                            backgroundColor: "white",
                            color: "#475467",
                            border: "1px solid #d0d5dd"
                        }}>
                            Cancel
                        </button>
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default AddMedicine;
