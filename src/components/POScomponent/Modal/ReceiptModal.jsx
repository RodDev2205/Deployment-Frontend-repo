import React, { useState } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../../config/api';

export default function ReceiptModal({
  transactionId,
  transactionNumber,
  total,
  change,
  cart,
  orderType = 'dine-in',
  onClose,
}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const { error } = useAlert();

  const handlePrint = async () => {
    const payload = {
      transactionId,
      transactionNumber,
      cart,
      total,
      change,
      date: new Date().toLocaleString(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/print-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setShowSuccess(true);

        // ✅ Auto close popup + modal
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      } else {
        error("Printer Error", data.message ? `Printer error: ${data.message}` : "Failed to print receipt.");
      }
    } catch (err) {
      console.error(err);
      error("Print Failed", "Failed to print receipt.");
    }
  };

  return (
    <div className="relative space-y-4 w-full">
      {/* ✅ SUCCESS POPUP */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center animate-fade-in">
            <h2 className="text-green-600 text-lg font-bold">
              ✅ Receipt Printed
            </h2>
            <p className="text-sm text-gray-600">Closing receipt...</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-600">
          Food<span className="text-gray-800">Paradise</span>
        </h1>
        <p className="text-gray-600 text-sm">Official Receipt</p>
      </div>

      <div className="border-b pb-2 space-y-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-bold">{transactionNumber}</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        <p className="text-xs text-gray-500">Transaction ID: {transactionId}</p>
        <p className="text-xs text-gray-500">Order type: {orderType}</p>
      </div>

      <div className="space-y-1">
        {cart.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span>
              {item.qty} x {item.item || item.product_name}
            </span>
            <span>₱ {(item.qty * item.price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-2 space-y-1 text-sm">
        <div className="flex justify-between font-bold text-base">
          <span>Total:</span>
          <span>₱ {total.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-bold text-green-600">
          <span>Change:</span>
          <span>₱ {change.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded p-3">
        <p className="text-center text-sm text-green-700 font-semibold">
          ✅ Payment Successful
        </p>
        <p className="text-center text-xs text-gray-600 mt-1">
          {new Date().toLocaleTimeString()}
        </p>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors"
          onClick={handlePrint}
        >
          🖨️ Print Receipt
        </button>
        <button
          className="flex-1 bg-gray-300 hover:bg-gray-400 font-bold py-2 rounded-lg transition-colors"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
