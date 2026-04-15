import React, { useState } from "react";
import { useAlert } from "@/context/AlertContext";

export default function SeniorPWDVerificationModal({
  discountType, // 'senior' or 'pwd'
  onConfirm,
  onCancel,
}) {
  const { error: alertError, success: alertSuccess } = useAlert();
  const [idNumber, setIdNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const labelText = discountType === "senior" ? "Senior ID" : "PWD ID";
  const titleText = discountType === "senior" ? "Senior Citizen" : "Person with Disability (PWD)";

  const handleValidateAndConfirm = async () => {
    // Validation
    if (!idNumber.trim()) {
      alertError("Validation Error", `Please enter ${labelText}`);
      return;
    }

    if (!fullName.trim()) {
      alertError("Validation Error", "Please enter the person's name");
      return;
    }

    // Basic validation: ID should have at least 5 characters
    if (idNumber.trim().length < 5) {
      alertError("Validation Error", `${labelText} must be at least 5 characters`);
      return;
    }

    // Full name should have at least 2 words or 5 characters
    if (fullName.trim().length < 5) {
      alertError("Validation Error", "Please enter a complete name");
      return;
    }

    setIsValidating(true);

    // Simulate API validation (replace with real API if needed)
    setTimeout(() => {
      setIsValidating(false);
      alertSuccess(
        "Verification Successful",
        `${titleText} verified: ${fullName}`
      );

      onConfirm({
        idNumber: idNumber.trim(),
        fullName: fullName.trim(),
        discountType,
      });
    }, 800);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          {titleText} Verification
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Please provide the required information to apply this discount
        </p>

        {/* Form */}
        <div className="space-y-4">
          {/* ID Number Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {labelText}
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={`Enter ${labelText}...`}
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
              disabled={isValidating}
              autoFocus
            />
          </div>

          {/* Full Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name..."
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
              disabled={isValidating}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onCancel}
            disabled={isValidating}
            className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={handleValidateAndConfirm}
            disabled={isValidating}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              isValidating
                ? "bg-emerald-400 text-white cursor-not-allowed opacity-50"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isValidating && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isValidating ? "Verifying..." : "Verify & Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
