// ============================================================
//  src/pages/AddressPage.jsx
//  Manage user addresses - Amazon-like interface
// ============================================================

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import addressService from "../services/addressService";
import { toast } from "react-toastify";

const AddressPage = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: "home",
    name: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  // Fetch addresses
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(data.addresses || []);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      label: "home",
      name: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.street || !formData.city || !formData.state || !formData.pincode || !formData.phone) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);
      if (editingId) {
        // Update existing address
        await addressService.updateAddress(editingId, formData);
        toast.success("Address updated successfully");
      } else {
        // Add new address
        await addressService.addAddress({
          ...formData,
          isDefault: addresses.length === 0, // First address is default
        });
        toast.success("Address added successfully");
      }
      await fetchAddresses();
      resetForm();
    } catch (err) {
      console.error("Error saving address:", err);
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address) => {
    setFormData({
      label: address.label,
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone,
    });
    setEditingId(address._id);
    setShowForm(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      setLoading(true);
      await addressService.deleteAddress(addressId);
      toast.success("Address deleted successfully");
      await fetchAddresses();
    } catch (err) {
      console.error("Error deleting address:", err);
      toast.error("Failed to delete address");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      setLoading(true);
      await addressService.setDefaultAddress(addressId);
      toast.success("Default address updated");
      await fetchAddresses();
    } catch (err) {
      console.error("Error setting default address:", err);
      toast.error("Failed to set default address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Addresses</h1>
          <p className="text-gray-600">Manage your delivery addresses</p>
        </div>

        {/* Add Address Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Add New Address
          </button>
        )}

        {/* Address Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Address" : "Add New Address"}
            </h2>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Label
                </label>
                <select
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="House no., Building name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Pincode & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit PIN code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Address"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        {loading && !showForm ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
            <p className="text-gray-600 mb-4">No addresses saved yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 transition ${
                  address.isDefault ? "border-blue-600" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Default Badge */}
                {address.isDefault && (
                  <div className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mb-3">
                    DEFAULT
                  </div>
                )}

                {/* Label */}
                <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                  {address.label}
                </p>

                {/* Address Details */}
                <h3 className="font-semibold text-gray-900 mb-1">{address.name}</h3>
                <p className="text-gray-700 text-sm mb-1">{address.street}</p>
                <p className="text-gray-700 text-sm mb-1">
                  {address.city}, {address.state} {address.pincode}
                </p>
                <p className="text-gray-700 text-sm mb-4">Phone: {address.phone}</p>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address._id)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition font-medium"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address._id)}
                    className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressPage;
