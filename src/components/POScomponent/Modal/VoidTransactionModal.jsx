import React, { useState } from "react";
import { useAlert } from "@/context/AlertContext";

export default function VoidTransactionModal({ onClose, onConfirm }) {
  const [passkey, setPasskey] = useState("");
  const { error: alertError } = useAlert();
  const ADMIN_PASSKEY = "1234"; // Replace with secure key or fetch from backend

  const handleConfirm = () => {
    if (passkey === ADMIN_PASSKEY) {
      onConfirm();
    } else {
      alertError("Authorization", "Incorrect passkey! Access denied.");
    }
  };

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-xl font-bold text-center">Admin Authorization Required</h2>
      <p className="text-gray-600 text-center text-sm">
        Enter passkey to void this transaction
      </p>
      <input
        type="password"
        placeholder="Enter Admin Passkey"
        className="w-full border rounded p-2"
        value={passkey}
        onChange={(e) => setPasskey(e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        <button
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg"
          onClick={handleConfirm}
        >
          Confirm
        </button>
        <button
          className="flex-1 bg-gray-300 hover:bg-gray-400 font-bold py-2 rounded-lg"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
