/**
 * ALERT SYSTEM USAGE GUIDE
 * 
 * This file shows how to use the new professional Alert system throughout the app.
 * Replace browser alert() calls with useAlert hook methods.
 */

import { useAlert } from "@/context/AlertContext";

export function AlertExamples() {
  const { success, error, warning, info, confirm, danger } = useAlert();

  // ==================== SUCCESS ALERT ====================
  const handleSuccess = () => {
    success(
      "Operation Successful",
      "Your changes have been saved successfully."
    );
  };

  // ==================== ERROR ALERT ====================
  const handleError = () => {
    error(
      "Something Went Wrong",
      "Failed to load the data. Please try again."
    );
  };

  // ==================== WARNING ALERT ====================
  const handleWarning = () => {
    warning(
      "Please Review",
      "This action may affect your inventory data."
    );
  };

  // ==================== INFO ALERT ====================
  const handleInfo = () => {
    info(
      "Information",
      "Your session will expire in 5 minutes. Please save your work."
    );
  };

  // ==================== CONFIRMATION DIALOG ====================
  const handleConfirm = () => {
    confirm(
      "Confirm Action",
      "Are you sure you want to proceed? This action cannot be undone.",
      () => {
        // Code to execute if user confirms
        console.log("User confirmed!");
      },
      () => {
        // Code to execute if user cancels (optional)
        console.log("User cancelled!");
      }
    );
  };

  // ==================== DANGER ALERT (For Destructive Actions) ====================
  const handleDanger = () => {
    danger(
      "Delete Item",
      "Are you sure you want to delete this item? This action cannot be undone.",
      () => {
        // Code to execute if user confirms deletion
        console.log("User confirmed deletion!");
      }
    );
  };

  // ==================== WITH CALLBACK ====================
  const handleWithCallback = () => {
    success(
      "Saved",
      "Your profile has been updated.",
      () => {
        // This callback runs when user clicks OK
        console.log("Alert dismissed!");
      }
    );
  };

  // ==================== HANDLING ASYNC OPERATIONS ====================
  const handleAsyncOperation = async () => {
    try {
      const response = await fetch("/api/some-endpoint");
      const data = await response.json();

      if (response.ok) {
        success(
          "Success!",
          "The data has been updated successfully."
        );
      } else {
        error(
          "Error",
          data.message || "An error occurred. Please try again."
        );
      }
    } catch (err) {
      error(
        "Error",
        err.message || "An unexpected error occurred."
      );
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Alert System Examples</h1>

      <button
        onClick={handleSuccess}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Show Success Alert
      </button>

      <button
        onClick={handleError}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Show Error Alert
      </button>

      <button
        onClick={handleWarning}
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
      >
        Show Warning Alert
      </button>

      <button
        onClick={handleInfo}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Show Info Alert
      </button>

      <button
        onClick={handleConfirm}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Show Confirmation
      </button>

      <button
        onClick={handleDanger}
        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
      >
        Show Danger Alert
      </button>

      <button
        onClick={handleAsyncOperation}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Test Async Operation
      </button>
    </div>
  );
}

/**
 * ==================== MIGRATION GUIDE ====================
 * 
 * Replace old alert() calls with new useAlert() methods:
 * 
 * BEFORE:
 * ------
 * alert("Please fill in all fields");
 * alert("Success! Item created.");
 * 
 * AFTER:
 * ------
 * const { error, success } = useAlert();
 * error("Validation Error", "Please fill in all fields");
 * success("Success!", "Item created successfully.");
 * 
 * 
 * ==================== API INTEGRATION ====================
 * 
 * Here's a common pattern for API calls:
 * 
 * const handleSubmit = async (formData) => {
 *   try {
 *     const response = await fetch('/api/endpoint', {
 *       method: 'POST',
 *       body: JSON.stringify(formData),
 *     });
 * 
 *     const data = await response.json();
 * 
 *     if (response.ok) {
 *       success("Success!", "Your changes have been saved.");
 *       // Refresh data, close modal, etc.
 *     } else {
 *       error("Error", data.message || "Something went wrong.");
 *     }
 *   } catch (err) {
 *     error("Error", err.message || "Failed to complete action.");
 *   }
 * };
 * 
 * 
 * ==================== FEATURES ====================
 * 
 * ✅ success(title, message, onConfirm?)
 * ✅ error(title, message, onConfirm?)
 * ✅ warning(title, message, onConfirm?)
 * ✅ info(title, message, onConfirm?)
 * ✅ confirm(title, message, onConfirm, onCancel?)
 * ✅ danger(title, message, onConfirm, onCancel?) - For destructive actions
 * ✅ showAlert({ type, title, message, ... }) - Full control
 * ✅ closeAlert() - Close current alert
 * 
 */

export default AlertExamples;
