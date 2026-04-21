import React, { useState, useMemo } from "react";
import { useAlert } from "@/context/AlertContext";
import SeniorPWDVerificationModal from "./SeniorPWDVerificationModal";

export default function PaymentModal({ subtotal = 0, vatAdjustedSubtotal = 0, totalAmount = 0, cart = [], onConfirm, onClose }) {
  const { error: alertError } = useAlert();

  const [amountPaid, setAmountPaid] = useState("");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [orderType, setOrderType] = useState("dine-in"); // dine-in or takeout
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [selectedDiscountItem, setSelectedDiscountItem] = useState(null); // For PWD/Senior item discount

  const SENIOR_DISCOUNT_PERCENTAGE = 20; // 20% fixed discount for seniors
  const PWD_DISCOUNT_PERCENTAGE = 20; // 20% fixed discount for PWD

  // Ensure numbers are always safe
  const safeSubtotal = Number(subtotal) || 0;
  const safeVatAdjustedSubtotal = Number(vatAdjustedSubtotal) || 0;
  const safeTotalWithTax = Number(totalAmount) || 0;
  const safeDiscountValue = Number(discountValue) || 0;
  const safeAmountPaid = Number(amountPaid) || 0;

  const effectiveSubtotal = (discountType === "senior" || discountType === "pwd")
    ? (safeVatAdjustedSubtotal || safeSubtotal)
    : safeSubtotal;

  const discountAmount = useMemo(() => {
    if (discountType === "percentage") {
      return (effectiveSubtotal * safeDiscountValue) / 100;
    }
    if (discountType === "fixed") {
      return safeDiscountValue;
    }
    if (discountType === "senior") {
      return (effectiveSubtotal * SENIOR_DISCOUNT_PERCENTAGE) / 100;
    }
    if (discountType === "pwd") {
      return (effectiveSubtotal * PWD_DISCOUNT_PERCENTAGE) / 100;
    }
    return 0;
  }, [discountType, safeDiscountValue, effectiveSubtotal]);

  const finalAmount = Math.max(effectiveSubtotal - discountAmount, 0);
  const change = safeAmountPaid - finalAmount;
  const isValidPayment = safeAmountPaid >= finalAmount && finalAmount > 0;

  // ensure orderType is valid
  const validOrder = orderType === 'dine-in' || orderType === 'takeout';

  const handleConfirm = () => {
    if (finalAmount <= 0) {
      alertError("Payment", "Invalid total amount.");
      return;
    }

    if (!isValidPayment) {
      alertError("Payment", "Amount paid is insufficient.");
      return;
    }


    // Check if verification is required but not completed
    if ((discountType === "senior" || discountType === "pwd") && !verificationData) {
      alertError("Verification Required", "Please verify Senior/PWD information first.");
      return;
    }

    // Check if item is selected for PWD/Senior discount
    if ((discountType === "senior" || discountType === "pwd") && selectedDiscountItem === null) {
      alertError("Item Selection Required", "Please select which item to apply the discount on.");
      return;
    }

    const discountValueToSend = discountType === "senior" || discountType === "pwd" ? 0.2 : safeDiscountValue;

    onConfirm({
      paymentMethod: "cash",
      amountPaid: safeAmountPaid,
      finalAmount,
      change,
      orderType,
      discount: {
        type: discountType,
        value: discountValueToSend,
        amount: discountAmount,
        verification: verificationData || null,
        selectedItemIndex: selectedDiscountItem, // Index of the item to apply discount to
      },
    });

    onClose();
  };

  const handleDiscountChange = (newDiscountType) => {
    setDiscountType(newDiscountType);
    setDiscountValue("");
    setSelectedDiscountItem(null); // Reset selected item when discount type changes
    
    // Show verification modal for senior/pwd discounts
    if (newDiscountType === "senior" || newDiscountType === "pwd") {
      // Reset verification data when changing discount type
      setVerificationData(null);
      setShowVerificationModal(true);
    }
  };

  const handleVerificationConfirm = (data) => {
    setVerificationData(data);
    setShowVerificationModal(false);
  };

  const handleVerificationCancel = () => {
    setShowVerificationModal(false);
    setDiscountType("none");
    setVerificationData(null);
    setSelectedDiscountItem(null); // Reset selected item when verification is cancelled
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Complete Payment
      </h2>

      <div className="flex flex-col lg:flex-row gap-4">

        {/* LEFT COLUMN */}
        <div className="lg:w-1/2 space-y-6">

{/* Order Type */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Order Type
        </label>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="orderType"
              value="dine-in"
              checked={orderType === 'dine-in'}
              onChange={() => setOrderType('dine-in')}
              className="form-radio"
            />
            <span className="ml-2 text-sm">Dine-in</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="orderType"
              value="takeout"
              checked={orderType === 'takeout'}
              onChange={() => setOrderType('takeout')}
              className="form-radio"
            />
            <span className="ml-2 text-sm">Takeout</span>
          </label>
        </div>
      </div>

      {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <h3 className="font-semibold text-gray-700 mb-3">
              Order Summary
            </h3>

            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">
                ₱{effectiveSubtotal.toFixed(2)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>- ₱{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₱{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Discount Section */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Apply Discount
            </label>


            <div className="flex gap-4 flex-wrap">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="none"
                  checked={discountType === "none"}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2 text-sm">No Discount</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="senior"
                  checked={discountType === "senior"}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2 text-sm">Senior Discount ({SENIOR_DISCOUNT_PERCENTAGE}%)</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="pwd"
                  checked={discountType === "pwd"}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2 text-sm">PWD Discount ({PWD_DISCOUNT_PERCENTAGE}%)</span>
              </label>
            </div>

            {/* Verification Status for Senior/PWD */}
            {(discountType === "senior" || discountType === "pwd") && (
              <div className={`text-xs p-2 rounded ${
                verificationData 
                  ? "bg-green-100 text-green-700" 
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {verificationData 
                  ? `✓ Verified: ${verificationData.fullName}` 
                  : "⚠ Please verify information"}
              </div>
            )}

            {discountAmount > 0 && (
              <p className="text-xs text-blue-600 mt-2">
                Discount Amount: ₱{discountAmount.toFixed(2)}
              </p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:w-1/2 space-y-6">

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount Paid
            </label>

            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full border px-4 py-3 rounded text-xl font-semibold text-center"
              min="0"
              step="0.01"
              placeholder="0.00"
              autoFocus
            />
          </div>

          {/* Select Item for Discount (PWD/Senior) */}
          {(discountType === "senior" || discountType === "pwd") && verificationData && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Item for {discountType === "senior" ? "Senior" : "PWD"} Discount (1 item only)
              </label>
              
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500">No items in cart</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cart.map((item, idx) => (
                    <label key={idx} className="flex items-start p-3 hover:bg-purple-100 rounded cursor-pointer border border-transparent hover:border-purple-300 transition">
                      <input
                        type="radio"
                        name="discountItem"
                        checked={selectedDiscountItem === idx}
                        onChange={() => setSelectedDiscountItem(idx)}
                        className="form-radio mt-1"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-gray-800">{item.item}</p>
                        <p className="text-xs text-gray-600">Qty: {item.qty} × ₱{item.price.toFixed(2)} = ₱{(item.qty * item.price).toFixed(2)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedDiscountItem !== null && (
                <p className="text-xs text-purple-600 mt-3 p-2 bg-purple-100 rounded">
                  ✓ Selected: <span className="font-semibold">{cart[selectedDiscountItem]?.item}</span>
                </p>
              )}
            </div>
          )}

          {/* Change */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">
                Change
              </span>
              <span
                className={`text-2xl font-bold ${
                  change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ₱{change.toFixed(2)}
              </span>
            </div>

            {change < 0 && (
              <p className="text-xs text-red-600 mt-1">
                Amount paid is insufficient.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={!isValidPayment || !validOrder}
              className={`flex-1 px-4 py-3 rounded font-semibold transition-colors ${
                isValidPayment && validOrder
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
            >
              Confirm Payment
            </button>
          </div>

        </div>
      </div>

      {/* Senior/PWD Verification Modal */}
      {showVerificationModal && (
        <SeniorPWDVerificationModal
          discountType={discountType}
          onConfirm={handleVerificationConfirm}
          onCancel={handleVerificationCancel}
        />
      )}
    </div>
  );
}