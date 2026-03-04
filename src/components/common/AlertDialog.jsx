import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, AlertTriangle, InfoIcon, X } from "lucide-react";

export default function AlertDialog({
  isOpen,
  type = "info",
  title,
  message,
  onClose,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  showConfirmButton = true,
  showCancelButton = false,
  isDanger = false,
}) {
  const getStyles = () => {
    const styles = {
      error: {
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
        icon: <AlertCircle size={48} className="text-red-600" />,
        titleColor: "text-red-900",
        buttonBg: "bg-red-600 hover:bg-red-700",
      },
      success: {
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800",
        icon: <CheckCircle size={48} className="text-green-600" />,
        titleColor: "text-green-900",
        buttonBg: "bg-green-600 hover:bg-green-700",
      },
      warning: {
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-800",
        icon: <AlertTriangle size={48} className="text-yellow-600" />,
        titleColor: "text-yellow-900",
        buttonBg: "bg-yellow-600 hover:bg-yellow-700",
      },
      info: {
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        icon: <InfoIcon size={48} className="text-blue-600" />,
        titleColor: "text-blue-900",
        buttonBg: "bg-blue-600 hover:bg-blue-700",
      },
    };
    return styles[type] || styles.info;
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative ${styles.bgColor} border ${styles.borderColor} rounded-2xl shadow-2xl w-full max-w-md p-8`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-gray-200/50 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/50">
                {styles.icon}
              </div>
            </div>

            {/* Title */}
            {title && (
              <h2 className={`text-2xl font-bold text-center mb-3 ${styles.titleColor}`}>
                {title}
              </h2>
            )}

            {/* Message */}
            <p className={`text-center text-base leading-relaxed mb-6 ${styles.textColor}`}>
              {message}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              {showCancelButton && (
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  {cancelText}
                </button>
              )}

              {showConfirmButton && (
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-colors ${
                    isDanger ? "bg-red-600 hover:bg-red-700" : styles.buttonBg
                  }`}
                >
                  {confirmText}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
