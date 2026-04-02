// ============================================================
//  src/components/AddressForm.jsx
//  Reusable address form for Checkout & AddressPage
//  NOTE: This is NOT a form element to prevent nested <form> bugs
// ============================================================

const AddressForm = ({
  formData,
  onInputChange,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Save Address",
  showCancel = true,
}) => {
  const handleSubmitClick = (e) => {
    e.preventDefault();
    console.log("🔘 Address form submit clicked, formData:", formData);
    onSubmit(e);
  };

  return (
    <div className="bg-gray-50 p-5 rounded-lg space-y-4 border border-gray-200">
      {/* Full Name */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Full Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          placeholder="Your full name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Phone Number *
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          placeholder="10-digit mobile number"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          required
        />
      </div>

      {/* Street Address */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Street Address *
        </label>
        <input
          type="text"
          name="street"
          value={formData.street}
          onChange={onInputChange}
          placeholder="House no., Building name, Road name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          required
        />
      </div>

      {/* City & State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={onInputChange}
            placeholder="City"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            State *
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={onInputChange}
            placeholder="State"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Pincode */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          PIN Code *
        </label>
        <input
          type="text"
          name="pincode"
          value={formData.pincode}
          onChange={onInputChange}
          placeholder="6-digit PIN code"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          required
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default AddressForm;
