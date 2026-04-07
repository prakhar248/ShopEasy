// ============================================================
//  src/pages/Profile.jsx — User profile with Lucide icons
// ============================================================
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { User, Mail, Phone, Calendar, Package, ShoppingCart, CheckCircle, AlertCircle, Pencil } from "lucide-react";

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="card mb-6">
        {/* Avatar + info */}
        <div className="flex items-center gap-4 mb-5">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name}
                 className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
              <User className="w-7 h-7 text-brand" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500 text-sm flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 inline-block border
              ${user.role === "admin"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-brand-light text-brand border-brand/20"}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Verification */}
        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg mb-5
          ${user.isVerified ? "bg-accent-light text-accent-dark" : "bg-amber-50 text-amber-700"}`}>
          {user.isVerified
            ? <><CheckCircle className="w-4 h-4" /> Email verified</>
            : <><AlertCircle className="w-4 h-4" /> Email not verified</>
          }
        </div>

        {/* Edit form */}
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field pl-9" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX" className="input-field pl-9" />
              </div>
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
              <span className="text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
              <span className="text-gray-800 font-medium">{user.phone || "Not set"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Member since</span>
              <span className="text-gray-800 font-medium">
                {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
            </div>
            <button onClick={() => setEditing(true)} className="btn-primary mt-4">
              <Pencil className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/orders" className="card-hover text-center group">
          <div className="w-10 h-10 rounded-lg bg-brand-light mx-auto mb-2.5 flex items-center justify-center group-hover:bg-brand transition-colors">
            <Package className="w-5 h-5 text-brand group-hover:text-white transition-colors" />
          </div>
          <p className="font-semibold text-gray-800 text-sm">My Orders</p>
        </Link>
        <Link to="/cart" className="card-hover text-center group">
          <div className="w-10 h-10 rounded-lg bg-brand-light mx-auto mb-2.5 flex items-center justify-center group-hover:bg-brand transition-colors">
            <ShoppingCart className="w-5 h-5 text-brand group-hover:text-white transition-colors" />
          </div>
          <p className="font-semibold text-gray-800 text-sm">My Cart</p>
        </Link>
      </div>
    </div>
  );
};

export default Profile;
