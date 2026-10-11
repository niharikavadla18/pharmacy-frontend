import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_URL = "https://pharmacy-backend-1-wreu.onrender.com";

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
    {
        key: "category",
        label: "Category",
        type: "text",
        placeholder: "Example: Pain Relief"
    },
    {
        key: "packageSize",
        label: "Package Size",
        type: "text",
        placeholder: "Example: 500 mg, 100 ml, 50 g"
    },
    {
        key: "price",
        label: "Price (₹)",
        type: "number",
        placeholder: "Enter price"
    },
    {
        key: "quantity",
        label: "Quantity / Stock",
        type: "number",
        placeholder: "Enter stock quantity"
    },
    {
        key: "expiryDate",
        label: "Expiry Date",
        type: "date"
    },
    {
        key: "imageUrl",
        label: "Medicine Image URL",
        type: "text",
        placeholder: "Paste medicine image URL"
    }
];

const labelStyle = {
    display: "block",
    fontWeight: "500",
    fontSize: "14px",
    marginBottom: "6px",
    color: "#344054"
};

const inputStyle = {
    width: "100%",
    boxSizing: "border-box"
};

function UpdateMedicine() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [flash, setFlash] = useState(null);

    const showMessage = (text, error = false) => {
        setFlash({ text, error });
    };

    useEffect(() => {
        const timer = flash
            ? setTimeout(() => setFlash(null), 2800)
            : null;

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [flash]);

    useEffect(() => {
        let active = true;

        const loadMedicine = async () => {
            setLoaded(false);

            const user = JSON.parse(
                sessionStorage.getItem("user") || "null"
            );

            if (!user || !user.token) {
                if (active) {
                    showMessage("Admin login required!", true);
                    setLoaded(true);
                }
                return;
            }

            try {
                const response = await axios.get(
                    `${API_URL}/medicine/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`
                        }
                    }
                );

                const medicine = response.data;

                if (active) {
                    setForm({
                        name: medicine.name ?? "",
                        category: medicine.category ?? "",
                        description: medicine.description ?? "",
                        price: medicine.price ?? "",
                        packageSize: medicine.packageSize ?? "",
                        quantity: medicine.quantity ?? "",
                        expiryDate: medicine.expiryDate
                            ? String(medicine.expiryDate).substring(0, 10)
                            : "",
                        imageUrl: medicine.imageUrl ?? ""
                    });

                    setLoaded(true);
                }
            } catch (error) {
                console.error("Load medicine error:", error);

                if (active) {
                    showMessage(
                        error.response?.data?.message ||
                        "Unable to load medicine details.",
                        true
                    );
                    setLoaded(true);
                }
            }
        };

        loadMedicine();

        return () => {
            active = false;
        };
    }, [id]);

    const change = (key, value) => {
        setForm((previous) => ({
            ...previous,
            [key]: value
        }));
    };

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
        if (!form.name.trim()) {
            return "Please enter the medicine name.";
        }

        if (!form.category.trim()) {
            return "Please enter the category.";
        }

        if (form.price === "" || !Number.isFinite(Number(form.price)) ||
            Number(form.price) <= 0) {
            return "Please enter a valid price.";
        }

        if (form.quantity === "" || !Number.isFinite(Number(form.quantity)) ||
            Number(form.quantity) < 0) {
            return "Please enter a valid stock quantity.";
        }

        if (!form.expiryDate) {
            return "Please select the expiry date.";
        }

        return "";
    };

    const save = async () => {
        const errorMessage = problem();

        if (errorMessage) {
            showMessage(errorMessage, true);
            return;
        }

        const user = JSON.parse(
            sessionStorage.getItem("user") || "null"
        );

        if (!user || !user.token) {
            showMessage("Admin login required! Please log in again.", true);
            return;
        }

        setSaving(true);

        try {
            await axios.put(
                `${API_URL}/medicine/update/${id}`,
                payload(),
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );

            showMessage("Medicine updated successfully!");

            setTimeout(() => {
                navigate("/admin-dashboard");
            }, 1000);
        } catch (error) {
            console.error("Update medicine error:", error);

            showMessage(
                error.response?.data?.message ||
                "Failed to update medicine. Please check your login and try again.",
                true
            );

            setSaving(false);
        }
    };

    return (
        <div className="page-container">

            {flash && (
                <div
                    role="status"
                    style={{
                        position: "fixed",
                        top: "70px",
                        right: "16px",
                        zIndex: 999,
                        backgroundColor: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        borderLeft: `4px solid ${
                            flash.error ? "#b42318" : "#2e7d32"
                        }`,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                        maxWidth: "320px"
                    }}
                >
                    {flash.error ? "✕" : "✓"} {flash.text}
                </div>
            )}

            <div className="dashboard-header">
                <h1>Update Medicine</h1>
                <p>Change the details and save.</p>
            </div>

            {!loaded ? (
                <p style={{ textAlign: "center", color: "#667085" }}>
                    Loading medicine details...
                </p>
            ) : (
                <div
                    className="card"
                    style={{
                        maxWidth: "680px",
                        margin: "0 auto"
                    }}
                >
                    <label style={labelStyle}>Medicine Name</label>

                    <input
                        type="text"
                        placeholder="Enter medicine name"
                        value={form.name}
                        onChange={(e) => change("name", e.target.value)}
                        style={inputStyle}
                    />

                    <label style={{ ...labelStyle, marginTop: "16px" }}>
                        Description
                    </label>

                    <textarea
                        rows={3}
                        placeholder="Enter medicine description"
                        value={form.description}
                        onChange={(e) => change("description", e.target.value)}
                        style={{
                            ...inputStyle,
                            resize: "vertical"
                        }}
                    />

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "16px",
                            marginTop: "16px"
                        }}
                    >
                        {FIELDS.map((field) => (
                            <div
                                key={field.key}
                                style={{
                                    gridColumn:
                                        field.key === "imageUrl"
                                            ? "1 / -1"
                                            : "auto"
                                }}
                            >
                                <label style={labelStyle}>
                                    {field.label}
                                </label>

                                <input
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    value={form[field.key]}
                                    min={
                                        field.type === "number" ? "0" : undefined
                                    }
                                    step={
                                        field.key === "price" ? "0.01" : undefined
                                    }
                                    onChange={(e) =>
                                        change(field.key, e.target.value)
                                    }
                                    style={inputStyle}
                                />
                            </div>
                        ))}
                    </div>

                    {form.imageUrl && (
                        <div
                            style={{
                                marginTop: "16px",
                                height: "130px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#f8fbfb",
                                borderRadius: "10px"
                            }}
                        >
                            <img
                                src={form.imageUrl}
                                alt="Medicine preview"
                                style={{
                                    maxHeight: "100%",
                                    maxWidth: "100%",
                                    objectFit: "contain"
                                }}
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "22px"
                        }}
                    >
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving}
                            style={{
                                flex: 1,
                                padding: "12px",
                                fontSize: "15px"
                            }}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>

                        <Link to="/admin-dashboard">
                            <button
                                type="button"
                                style={{
                                    padding: "12px 20px",
                                    fontSize: "15px",
                                    backgroundColor: "white",
                                    color: "#475467",
                                    border: "1px solid #d0d5dd"
                                }}
                            >
                                Cancel
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UpdateMedicine;