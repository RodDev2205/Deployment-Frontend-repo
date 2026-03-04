import React from "react";

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose} // close when clicking outside
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* X button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-600 hover:text-black font-bold"
        >
          ✕
        </button>

        {/* Modal content */}
        {children}
      </div>
    </div>
  );
}
