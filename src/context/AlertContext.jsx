import React, { createContext, useContext, useState } from "react";
import AlertDialog from "../components/common/AlertDialog";

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Cancel",
    onConfirm: null,
    showConfirmButton: true,
    showCancelButton: false,
    isDanger: false,
  });

  const showAlert = ({
    type = "info",
    title = "",
    message = "",
    confirmText = "OK",
    cancelText = "Cancel",
    onConfirm = null,
    showConfirmButton = true,
    showCancelButton = false,
    isDanger = false,
  }) => {
    setAlert((prev) => ({
      ...prev,
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      showConfirmButton,
      showCancelButton,
      isDanger,
    }));
  };

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  };

  // Convenience methods with pre-filled types
  const success = (title = "Success", message = "", onConfirm = null) => {
    showAlert({
      type: "success",
      title,
      message,
      onConfirm,
      confirmText: "OK",
      showConfirmButton: true,
    });
  };

  const error = (title = "Error", message = "", onConfirm = null) => {
    showAlert({
      type: "error",
      title,
      message,
      onConfirm,
      confirmText: "OK",
      showConfirmButton: true,
    });
  };

  const warning = (title = "Warning", message = "", onConfirm = null) => {
    showAlert({
      type: "warning",
      title,
      message,
      onConfirm,
      confirmText: "OK",
      showConfirmButton: true,
    });
  };

  const info = (title = "Info", message = "", onConfirm = null) => {
    showAlert({
      type: "info",
      title,
      message,
      onConfirm,
      confirmText: "OK",
      showConfirmButton: true,
    });
  };

  // Confirmation dialog (requires user to confirm)
  const confirm = (
    title = "Confirm",
    message = "",
    onConfirm = null,
    onCancel = null
  ) => {
    showAlert({
      type: "warning",
      title,
      message,
      onConfirm: () => {
        onConfirm?.();
        closeAlert();
      },
      showConfirmButton: true,
      showCancelButton: true,
      confirmText: "Confirm",
      cancelText: "Cancel",
    });
  };

  // Danger confirmation (red button for destructive operations)
  const danger = (
    title = "Confirm Delete",
    message = "",
    onConfirm = null,
    onCancel = null
  ) => {
    showAlert({
      type: "error",
      title,
      message,
      onConfirm,
      showConfirmButton: true,
      showCancelButton: true,
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
    });
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        closeAlert,
        success,
        error,
        warning,
        info,
        confirm,
        danger,
      }}
    >
      {children}
      <AlertDialog
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm}
        onClose={closeAlert}
        showConfirmButton={alert.showConfirmButton}
        showCancelButton={alert.showCancelButton}
        isDanger={alert.isDanger}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}
