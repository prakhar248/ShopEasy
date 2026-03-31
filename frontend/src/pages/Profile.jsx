// ============================================================
//  src/pages/Profile.jsx  —  View and update user profile
// ============================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      updateUser(data.user);
      toast.success("Profile updated!");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

      <div className="card mb-6">
        {/* Avatar + basic info */}
        <div className="flex items-center gap-5 mb-6">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-brand"
          />
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block
              ${user.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-brand-light text-brand"}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Verification badge */}
        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg mb-5
          ${user.isEmailVerified ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-600"}`}>
          <span>{user.isEmailVerified ? "✓" : "⚠"}</span>
          <span>{user.isEmailVerified ? "Email verified" : "Email not verified"}</span>
        </div>

        {/* Edit form */}
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                className="input-field"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-700 font-medium">{user.phone || "Not set"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-700 font-medium">
                {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
            </div>
            <button onClick={() => setEditing(true)} className="btn-primary mt-4">
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/orders" className="card text-center hover:shadow-md transition-shadow">
          <p className="text-3xl mb-2">📦</p>
          <p className="font-semibold text-gray-700">My Orders</p>
        </Link>
        <Link to="/cart" className="card text-center hover:shadow-md transition-shadow">
          <p className="text-3xl mb-2">🛒</p>
          <p className="font-semibold text-gray-700">My Cart</p>
        </Link>
      </div>
    </div>
  );
};

export default Profile;
