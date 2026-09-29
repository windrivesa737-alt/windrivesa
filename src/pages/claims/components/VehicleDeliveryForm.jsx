import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SA_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];

export default function VehicleDeliveryForm({
  initialData = {},
  onSubmit,
  isSubmitting,
  submitButtonText = 'Submit Vehicle Claim',
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: initialData.fullName || '',
    mobileNumber: initialData.mobileNumber ? initialData.mobileNumber.replace(/^\+27\s*/, '') : '',
    deliveryAddress: initialData.deliveryAddress || '',
    city: initialData.city || '',
    province: initialData.province || 'Gauteng',
    postalCode: initialData.postalCode || '',
    preferredContact: initialData.preferredContact || 'Self',
    deliveryNotes: initialData.deliveryNotes || '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full legal name is required as per official RSA Identity document.';
    }

    const cleanMobile = formData.mobileNumber.replace(/[\s-]/g, '');
    if (!cleanMobile) {
      newErrors.mobileNumber = 'Mobile number is required for flatbed logistics dispatch.';
    } else if (!/^\d{9,10}$/.test(cleanMobile)) {
      newErrors.mobileNumber = 'Please enter a valid 9 or 10 digit South African mobile number.';
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Physical street address is required for trailer/carrier vehicle access.';
    } else if (formData.deliveryAddress.trim().length < 5) {
      newErrors.deliveryAddress = 'Please enter a complete physical delivery address.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City or metropolitan area is required.';
    }

    if (!formData.province) {
      newErrors.province = 'Please select a South African province.';
    }

    const cleanPostal = formData.postalCode.trim();
    if (!cleanPostal) {
      newErrors.postalCode = 'Postal code is required.';
    } else if (!/^\d{4}$/.test(cleanPostal)) {
      newErrors.postalCode = 'Please enter a valid 4-digit South African postal code.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const formattedMobile = formData.mobileNumber.startsWith('0')
      ? `+27 ${formData.mobileNumber.slice(1)}`
      : `+27 ${formData.mobileNumber}`;

    onSubmit({
      ...formData,
      mobileNumber: formattedMobile,
    });
  };

  return (
    <div className="bg-white dark:bg-[#0B2238] rounded-xl p-6 sm:p-8 shadow-sm border border-[#D9E3F1] dark:border-[#1B354F] flex flex-col gap-6 transition-colors">
      <div className="flex flex-col gap-1">
        <h2 className="font-sora text-xl sm:text-2xl text-[#071A2B] dark:text-white font-bold tracking-tight">
          Delivery Details
        </h2>
        <p className="font-manrope text-sm text-[#667085] dark:text-slate-300">
          Enter the physical address and authorized contact to arrange your vehicle transport.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="font-manrope text-sm font-semibold text-[#071A2B] dark:text-white">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className={`w-full h-11 px-3.5 bg-white dark:bg-[#0E1724] border rounded text-sm text-[#071A2B] dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705] transition-colors ${
              errors.fullName ? 'border-red-500 ring-1 ring-red-500' : 'border-[#D9E3F1] dark:border-[#1B354F]'
            }`}
            placeholder="e.g. Nkosana Mthembu"
          />
          {errors.fullName ? (
            <span className="text-xs text-red-500 font-semibold">{errors.fullName}</span>
          ) : (
            <span className="font-manrope text-xs text-[#667085] dark:text-slate-400">
              Must match your official RSA Identity document or passport.
            </span>
          )}
        </div>

        {/* Mobile Number with +27 (ZA) prefix */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mobileNumber" className="font-manrope text-sm font-semibold text-[#071A2B] dark:text-white">
            Mobile Contact Number <span className="text-red-500">*</span>
          </label>
          <div
            className={`flex rounded border shadow-sm overflow-hidden bg-white dark:bg-[#0E1724] ${
              errors.mobileNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-[#D9E3F1] dark:border-[#1B354F]'
            }`}
          >
            <span className="inline-flex items-center px-3.5 bg-[#F5F7FA] dark:bg-[#081827] text-xs font-bold text-[#667085] dark:text-slate-300 select-none border-r border-[#D9E3F1] dark:border-[#1B354F]">
              +27 (ZA)
            </span>
            <input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              className="flex-1 h-11 px-3.5 bg-transparent text-sm text-[#071A2B] dark:text-white focus:outline-none border-none"
              placeholder="82 555 0194"
            />
          </div>
          {errors.mobileNumber ? (
            <span className="text-xs text-red-500 font-semibold">{errors.mobileNumber}</span>
          ) : (
            <span className="font-manrope text-xs text-[#667085] dark:text-slate-400">
              Used by the logistics dispatcher to coordinate flatbed delivery.
            </span>
          )}
        </div>

        {/* Delivery Address */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="deliveryAddress" className="font-manrope text-sm font-semibold text-[#071A2B] dark:text-white">
            Street Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="deliveryAddress"
            name="deliveryAddress"
            rows={2}
            value={formData.deliveryAddress}
            onChange={(e) => handleChange('deliveryAddress', e.target.value)}
            className={`w-full p-3 bg-white dark:bg-[#0E1724] border rounded text-sm text-[#071A2B] dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705] transition-colors ${
              errors.deliveryAddress ? 'border-red-500 ring-1 ring-red-500' : 'border-[#D9E3F1] dark:border-[#1B354F]'
            }`}
            placeholder="e.g. 14 Protea Avenue, Sandhurst"
          />
          {errors.deliveryAddress ? (
            <span className="text-xs text-red-500 font-semibold">{errors.deliveryAddress}</span>
          ) : (
            <span className="font-manrope text-xs text-[#667085] dark:text-slate-400">
              Physical delivery address. Ensure trailer/carrier vehicle access is viable.
            </span>
          )}
        </div>

        {/* City & Province Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="city" className="font-manrope text-sm font-semibold text-[#071A2B] dark:text-white">
              City / Metro <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={`w-full h-11 px-3.5 bg-white dark:bg-[#0E1724] border rounded text-sm text-[#071A2B] dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705] transition-colors ${
                errors.city ? 'border-red-500 ring-1 ring-red-500' : 'border-[#D9E3F1] dark:border-[#1B354F]'
              }`}
              placeholder="e.g. Johannesburg"
            />
            {errors.city && <span className="text-xs text-red-500 font-semibold">{errors.city}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="province" className="font-manrope text-sm font-semibold text-[#071A2B] dark:text-white">
              Province <span className="text-red-500">*</span>
            </label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={(e) => handleChange('province', e.target.value)}
              className={`w-full h-11 px-3.5 bg-white dark:bg-[#0E1724] border rounded text-sm text-[#071A2B] dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705] transition-colors ${
                errors.province ? 'border-red-500 ring-1 ring-red-500' : 'border-[#D9E3F1] dark:border-[#1B354F]'
              }`}
            >
              <option value="">Select Province</option>
              {SA_PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            {errors.province && <span className="text-xs text-red-500 font-semibold">{errors.province}</span>}
          </div>
        </div>

        {/* Postal Code & Preferred Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="postalCode" className="font-manrope text-sm font-semibold text-[#071A2B] dark:text-white">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              maxLength={6}
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              className={`w-full h-11 px-3.5 bg-white dark:bg-[#0E1724] border rounded text-sm text-[#071A2B] dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705] transition-colors ${
                errors.postalCode ? 'border-red-500 ring-1 ring-red-500' : 'border-[#D9E3F1] dark:border-[#1B354F]'
              }`}
              placeholder="e.g. 2196"
            />
            {errors.postalCode && <span className="text-xs text-red-500 font-semibold">{errors.postalCode}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="preferredContact" className="font-manrope text-sm font-semibold text-[#071A2B] dark:text-white">
              Delivery Recipient <span className="text-red-500">*</span>
            </label>
            <select
              id="preferredContact"
              name="preferredContact"
              value={formData.preferredContact}
              onChange={(e) => handleChange('preferredContact', e.target.value)}
              className="w-full h-11 px-3.5 bg-white dark:bg-[#0E1724] border border-[#D9E3F1] dark:border-[#1B354F] rounded text-sm text-[#071A2B] dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705] transition-colors"
            >
              <option value="Self">Self (Account Holder)</option>
              <option value="Representative">Authorized Representative</option>
            </select>
          </div>
        </div>

        {/* Delivery Notes */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="deliveryNotes" className="font-manrope text-sm font-semibold text-[#071A2B] dark:text-white">
              Delivery Notes <span className="text-xs font-normal text-[#667085] dark:text-slate-400">(Optional)</span>
            </label>
            <span className="text-xs text-[#667085] dark:text-slate-400">Carrier coordination</span>
          </div>
          <textarea
            id="deliveryNotes"
            name="deliveryNotes"
            rows={3}
            value={formData.deliveryNotes}
            onChange={(e) => handleChange('deliveryNotes', e.target.value)}
            className="w-full p-3 bg-white dark:bg-[#0E1724] border border-[#D9E3F1] dark:border-[#1B354F] rounded text-sm text-[#071A2B] dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#071A2B] dark:focus:ring-[#F2B705] transition-colors resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="e.g., Gate access code, specific business hours for drop-off, or access road instructions for vehicle carrier trailer..."
          />
        </div>

        {/* Pre-Submission Verification Box */}
        <div className="p-4 bg-[#F5F7FA] dark:bg-[#081827] rounded-lg flex items-start gap-3 text-sm border border-[#D9E3F1] dark:border-[#1B354F]">
          <svg className="w-5 h-5 text-[#785900] dark:text-[#F2B705] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
            <strong className="text-[#071A2B] dark:text-white block font-semibold mb-0.5">Before you submit:</strong>
            Please ensure that all delivery details are accurate. Once submitted, changes must be processed through accredited support.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded text-center text-sm font-semibold text-[#667085] dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-[#071A2B] hover:bg-[#0e2740] dark:bg-[#F2B705] dark:hover:bg-[#dfa704] text-white dark:text-[#071A2B] font-sora text-sm rounded font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white dark:text-[#071A2B]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Submitting to Logistics Review...</span>
              </>
            ) : (
              <>
                <span>{submitButtonText}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
