// src/pages/Signup.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContex";

const Signup = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const [message, setMessage] = useState("");

    // Redirect non-admins
    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate("/");
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/create-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("User created successfully!");
                setFormData({ username: "", password: "" });
            } else {
                setMessage(data.message || "Failed to create user.");
            }
        } catch (err) {
            setMessage("Something went wrong.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <form
                onSubmit={handleSubmit}
                className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm"
            >
                <h2 className="text-2xl mb-4">Create New User (Admin Only)</h2>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 text-black"
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 text-black"
                    required
                />

                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 w-full p-2 rounded"
                >
                    Create User
                </button>

                {message && (
                    <p className="mt-4 text-sm text-center text-yellow-300">{message}</p>
                )}
            </form>
        </div>
    );
};

export default Signup;
