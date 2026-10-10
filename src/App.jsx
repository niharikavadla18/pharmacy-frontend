import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";
import AddMedicine from "./pages/AddMedicine";
import UpdateMedicine from "./pages/UpdateMedicine";
import AdminOrders from "./pages/AdminOrders";

import "./App.css";

function App() {

    return (
        <BrowserRouter>

            <Navbar />

            <Routes>

                <Route path="/" element={<Home />} />

                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route
                    path="/customer-dashboard"
                    element={
                        <ProtectedRoute role="CUSTOMER">
                            <CustomerDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cart"
                    element={
                        <ProtectedRoute role="CUSTOMER">
                            <Cart />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-orders"
                    element={
                        <ProtectedRoute role="CUSTOMER">
                            <MyOrders />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute role="ADMIN">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/add-medicine"
                    element={
                        <ProtectedRoute role="ADMIN">
                            <AddMedicine />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/update-medicine/:id"
                    element={
                        <ProtectedRoute role="ADMIN">
                            <UpdateMedicine />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin-orders"
                    element={
                        <ProtectedRoute role="ADMIN">
                            <AdminOrders />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;