import React from "react";
import { useAlert } from '../../../context/AlertContext';
import API_BASE_URL from '../../../config/api';

export default function TransactionDetailModal({
  data,
  onClose,
  onVoid,
  onRefund,
}) {
  if (!data) return null;

  const {
    transaction,
    items,
  } = data;

  const { success, error: alertError } = useAlert();

  const [showVoidForm, setShowVoidForm] = React.useState(false);
  const [voidType, setVoidType] = React.useState("full");
  const [reason, setReason] = React.useState("");
  const [adminPin, setAdminPin] = React.useState("");
  const [submittingVoid, setSubmittingVoid] = React.useState(false);
  const [voidError, setVoidError] = React.useState("");
  const [voidQuantities, setVoidQuantities] = React.useState({});



  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (_e) {
      return iso;
    }
  };

  const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.price), 0);
  const discountAmount = Number(transaction.discount_amount) || 0;
  const total = Number(transaction.total_amount) || 0;
  const change = Number(transaction.change_amount) || 0;

  const status = transaction.status;
  const createdAt = new Date(transaction.created_at);
  const minutesElapsed = (Date.now() - createdAt.getTime()) / 60000;

  // compute remaining quantities (for voids, quantity is already reduced by previous voids)
  const remainingItems = items.map(it => {
    const remaining = Math.max(0, Number(it.quantity || 0));
    return { ...it, remaining };
  });
  const remainingTotalCount = remainingItems.reduce((s, it) => s + it.remaining, 0);
  const remainingTotalAmount = remainingItems.reduce((s, it) => s + (it.remaining * it.price), 0);

  const voidAllowed = (status === 'Completed' || status === 'Partial Voided') && minutesElapsed <= 60 && remainingTotalCount > 0;
  const isVoidedOrRefunded = status === 'Voided' || status === 'Refunded';

  return (
    <div className="space-y-4 w-full max-w-5xl">
      {/* Header with Close Button */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold">Transaction Details</h2>
          <p className="text-sm text-gray-600">#{transaction.transaction_number}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
          title="Close modal"
        >
          ×
        </button>
      </div>

      {/* header info */}
      <div className="border-b pb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <p className="text-xs text-gray-600">Additional Info</p>
          </div>
          <div className="text-sm space-y-1 md:text-right">
            <p><span className="font-semibold">Cashier:</span> {transaction.cashier_name || "-"}</p>
            <p><span className="font-semibold">Branch:</span> {transaction.branch_name || "-"}</p>
            <p><span className="font-semibold">Status:</span> {transaction.status}</p>
            <p><span className="font-semibold">Date:</span> {formatDate(transaction.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="border-t pt-2">
            <h3 className="font-semibold mb-2">Items</h3>
            <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-gray-100">
                  <span>{it.quantity} x {it.product_name || it.menu_id}</span>
                  <span>₱ {(it.quantity * it.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-64">
          <div className="border-t pt-2 space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₱ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>₱ {discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>₱ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment:</span>
              <span>{transaction.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span>₱ {Number(transaction.amount_paid).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change:</span>
              <span>₱ {Number(change).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* actions area - void form */}
      {showVoidForm ? (
        <div className="space-y-4 mt-4 border-t pt-4 bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-700 text-lg">VOID TRANSACTION</h3>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side - Void options */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Void Type:</label>
                <div className="space-x-6">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="voidType"
                      value="full"
                      checked={voidType === 'full'}
                      onChange={() => { setVoidType('full'); setVoidQuantities({}); }}
                      className="mr-2"
                    />Full Void
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="voidType"
                      value="partial"
                      checked={voidType === 'partial'}
                      onChange={() => setVoidType('partial')}
                      className="mr-2"
                    />Partial Void
                  </label>
                </div>
              </div>

              {voidType === 'partial' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Select items to void:</label>
                  <div className="bg-white p-3 rounded border space-y-2 text-sm max-h-64 overflow-y-auto">
                    {remainingItems.map((it) => {
                      const qty = voidQuantities[it.menu_id] || 0;
                      const maxQty = it.remaining;
                      return (
                        <div key={it.menu_id} className="flex items-center justify-between py-2">
                          <span className="flex-1">{it.product_name || it.menu_id} (max: {it.remaining})</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setVoidQuantities(prev => ({
                                ...prev,
                                [it.menu_id]: Math.max(0, qty - 1)
                              }))}
                              className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400 text-sm"
                              disabled={maxQty === 0}
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-medium">{qty}</span>
                            <button
                              onClick={() => setVoidQuantities(prev => ({
                                ...prev,
                                [it.menu_id]: Math.min(maxQty, qty + 1)
                              }))}
                              className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400 text-sm"
                              disabled={maxQty === 0}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Form inputs */}
            <div className="md:w-80 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reason for void:</label>
                <textarea
                  className="w-full border rounded px-3 py-2 resize-none"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for voiding..."
                  autoComplete="off"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Admin PIN:</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Enter admin PIN"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">*Only admins can approve void*</p>
              </div>
              {voidError && <p className="text-red-500 text-sm bg-red-100 p-2 rounded">{voidError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  disabled={submittingVoid}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                  onClick={async () => {
                    if (!reason.trim() || !adminPin.trim()) {
                      setVoidError("Reason and PIN are required");
                      return;
                    }
                    setSubmittingVoid(true);
                    try {
                      const token = localStorage.getItem("token");
                      const body = {
                        transaction_id: transaction.transaction_id,
                        reason,
                        admin_pin: adminPin,
                      };
                      if (voidType === 'partial') {
                        body.void_items = voidQuantities; // {menu_id:qty}
                      }
                      const res = await fetch(`${API_BASE_URL}/api/pos/void`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(body),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message || "Void failed");
                      const newStatus = data.status || 'Voided';
                      success("Void Successful", "Transaction has been voided successfully.");
                      onVoid && onVoid(transaction.transaction_id, newStatus);
                      onClose();
                    } catch (err) {
                      alertError("Void Failed", err.message);
                      setVoidError(err.message);
                    } finally {
                      setSubmittingVoid(false);
                    }
                  }}
                >
                  {submittingVoid ? 'Processing...' : 'Confirm Void'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 border-t">
          {/* hide actions for voided/refunded or when nothing left to refund */}
          {isVoidedOrRefunded || remainingTotalCount === 0 ? (
            <div className="w-full text-center py-4">
              <p className="text-sm text-gray-600 font-medium">No actions available for this transaction.</p>
            </div>
          ) : (
            <div className="w-full">
              {voidAllowed ? (
                <button
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg text-base transition-colors"
                  onClick={() => { setShowVoidForm(true); setVoidError(""); }}
                >
                  Void Transaction
                </button>
              ) : (
                <button
                  className="w-full bg-red-200 text-white font-bold py-4 rounded-lg text-base opacity-50 cursor-not-allowed"
                  disabled
                  title={status === 'Completed' ? 'Void not allowed after 1 hour' : 'Void not available'}
                >
                  Void Transaction
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}