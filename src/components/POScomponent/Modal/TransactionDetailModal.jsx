import React from "react";
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

  const [showVoidForm, setShowVoidForm] = React.useState(false);
  const [voidType, setVoidType] = React.useState("full");
  const [reason, setReason] = React.useState("");
  const [adminPin, setAdminPin] = React.useState("");
  const [submittingVoid, setSubmittingVoid] = React.useState(false);
  const [voidError, setVoidError] = React.useState("");
  const [voidQuantities, setVoidQuantities] = React.useState({});

  const [showRefundForm, setShowRefundForm] = React.useState(false);
  const [refundType, setRefundType] = React.useState("full");
  const [refundReason, setRefundReason] = React.useState("");
  const [refundAdminPin, setRefundAdminPin] = React.useState("");
  const [submittingRefund, setSubmittingRefund] = React.useState(false);
  const [refundError, setRefundError] = React.useState("");
  const [refundQuantities, setRefundQuantities] = React.useState({});

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
  const voidAllowed = status === 'Completed' && minutesElapsed <= 30;
  const isVoidedOrRefunded = status === 'Voided' || status === 'Refunded';

  // compute remaining quantities after any prior partial refunds
  const remainingItems = items.map(it => {
    const refunded = Number(it.refunded_qty || 0);
    const remaining = Math.max(0, Number(it.quantity || 0) - refunded);
    return { ...it, refunded_qty: refunded, remaining };
  });
  const remainingTotalCount = remainingItems.reduce((s, it) => s + it.remaining, 0);
  const remainingTotalAmount = remainingItems.reduce((s, it) => s + (it.remaining * it.price), 0);

  return (
    <div className="space-y-4 w-full max-w-md">
      {/* header info */}
      <div className="border-b pb-2">
        <h2 className="text-xl font-semibold">Transaction Details</h2>
        <p className="text-sm">#{transaction.transaction_number}</p>
      </div>

      <div className="text-sm space-y-1">
        <p><span className="font-semibold">Cashier:</span> {transaction.cashier_name || "-"}</p>
        <p><span className="font-semibold">Branch:</span> {transaction.branch_name || "-"}</p>
        <p><span className="font-semibold">Status:</span> {transaction.status}</p>
        <p><span className="font-semibold">Date:</span> {formatDate(transaction.created_at)}</p>
      </div>

      <div className="border-t pt-2">
        <h3 className="font-semibold">Items</h3>
        <div className="space-y-1 text-sm">
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{it.quantity} x {it.product_name || it.menu_id}</span>
              <span>₱ {(it.quantity * it.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-2 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₱ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>₱ {discountAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
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

      {/* actions area - void form */}
      {showVoidForm ? (
        <div className="space-y-2 mt-4 border-t pt-4">
          <h3 className="font-semibold text-red-700">VOID TRANSACTION</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Void Type:</label>
            <div className="space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="voidType"
                  value="full"
                  checked={voidType === 'full'}
                  onChange={() => { setVoidType('full'); setVoidQuantities({}); }}
                  className="mr-2"
                />Full
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="voidType"
                  value="partial"
                  checked={voidType === 'partial'}
                  onChange={() => setVoidType('partial')}
                  className="mr-2"
                />Partial
              </label>
            </div>
          </div>

          {voidType === 'partial' && (
            <div className="space-y-2 mt-2">
              <label className="block text-sm font-medium">Select items to void:</label>
              <div className="bg-gray-50 p-2 rounded space-y-2 text-sm">
                {remainingItems.map((it) => {
                  const qty = voidQuantities[it.menu_id] || 0;
                  const maxQty = it.remaining;
                  return (
                    <div key={it.menu_id} className="flex items-center justify-between">
                      <span>{it.product_name || it.menu_id} (x{it.remaining})</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setVoidQuantities(prev => ({
                            ...prev,
                            [it.menu_id]: Math.max(0, qty - 1)
                          }))}
                          className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
                          disabled={maxQty === 0}
                        >
                          −
                        </button>
                        <span className="w-6 text-center">{qty}</span>
                        <button
                          onClick={() => setVoidQuantities(prev => ({
                            ...prev,
                            [it.menu_id]: Math.min(maxQty, qty + 1)
                          }))}
                          className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
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

          <div className="mt-2">
            <label className="block text-sm font-medium">Reason for void:</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Admin PIN:</label>
            <input
              type="password"
              className="w-32 border rounded px-3 py-2"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">*Only admins can approve void*</p>
          </div>
          {voidError && <p className="text-red-500 text-sm">{voidError}</p>}
          <div className="flex gap-2">
            <button
              disabled={submittingVoid}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg disabled:opacity-50"
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
                  onVoid && onVoid(transaction.transaction_id, newStatus);
                  onClose();
                } catch (err) {
                  setVoidError(err.message);
                } finally {
                  setSubmittingVoid(false);
                }
              }}
            >
              Confirm Void
            </button>
            <button
              className="flex-1 bg-gray-300 hover:bg-gray-400 font-bold py-2 rounded-lg"
              onClick={() => setShowVoidForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : showRefundForm ? (
        <div className="space-y-3 mt-4 border-t pt-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-orange-700">REFUND TRANSACTION</h3>
          
          {/* Refund Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Refund Type:</label>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="full"
                  checked={refundType === "full"}
                  onChange={(e) => {
                    setRefundType(e.target.value);
                    setRefundQuantities({});
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Full Refund</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="partial"
                  checked={refundType === "partial"}
                  onChange={(e) => setRefundType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Partial Refund</span>
              </label>
            </div>
          </div>

          {/* Full Refund */}
          {refundType === "full" && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600 mb-2">Refund Amount (Read-only):</p>
              <p className="text-xl font-bold">₱ {(status === 'Partial Refunded' ? remainingTotalAmount : total).toFixed(2)}</p>
            </div>
          )}

          {/* Partial Refund */}
          {refundType === "partial" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Select Items to Refund:</label>
              <div className="bg-gray-50 p-2 rounded space-y-2 text-sm">
                {remainingItems.map((it) => {
                  const qty = refundQuantities[it.menu_id] || 0;
                  const maxQty = it.remaining;
                  return (
                    <div key={it.menu_id} className="flex items-center justify-between">
                      <span>{it.product_name || it.menu_id} (x{it.remaining})</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setRefundQuantities(prev => ({
                            ...prev,
                            [it.menu_id]: Math.max(0, qty - 1)
                          }))}
                          className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
                          disabled={maxQty === 0}
                        >
                          −
                        </button>
                        <span className="w-6 text-center">{qty}</span>
                        <button
                          onClick={() => setRefundQuantities(prev => ({
                            ...prev,
                            [it.menu_id]: Math.min(maxQty, qty + 1)
                          }))}
                          className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
                          disabled={maxQty === 0}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-gray-100 p-2 rounded">
                <p className="text-sm font-semibold">Calculated Refund: ₱ {(
                  items.reduce((sum, it) => sum + ((refundQuantities[it.menu_id] || 0) * it.price), 0)
                ).toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Reason & PIN */}
          <div>
            <label className="block text-sm font-medium">Reason for Refund:</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Manager Approval (Admin PIN):</label>
            <input
              type="password"
              className="w-32 border rounded px-3 py-2 text-sm"
              value={refundAdminPin}
              onChange={(e) => setRefundAdminPin(e.target.value)}
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
            <p className="font-semibold text-yellow-800 mb-1">⚠ WARNING</p>
            <p className="text-yellow-700">This action will restore inventory and create a permanent refund record. This action cannot be undone.</p>
          </div>

          {refundError && <p className="text-red-500 text-sm">{refundError}</p>}

          <div className="flex gap-2">
            <button
              className="flex-1 bg-gray-300 hover:bg-gray-400 font-bold py-2 rounded-lg text-sm"
              onClick={() => setShowRefundForm(false)}
            >
              Back
            </button>
            <button
              disabled={submittingRefund}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg disabled:opacity-50 text-sm"
              onClick={async () => {
                if (!refundReason.trim() || !refundAdminPin.trim()) {
                  setRefundError("Reason and PIN are required");
                  return;
                }
                if (refundType === "partial") {
                  const hasSelection = Object.values(refundQuantities).some(q => q > 0);
                  if (!hasSelection) {
                    setRefundError("Please select at least one item to refund");
                    return;
                  }
                }
                setSubmittingRefund(true);
                try {
                  const token = localStorage.getItem("token");
                  // build payload: if transaction already partially refunded and user selects Full,
                  // treat as partial refund for remaining items to avoid double-refunding.
                  let payloadRefundType = refundType;
                  let payloadRefundItems = null;

                  if (refundType === 'partial') {
                    payloadRefundItems = Object.entries(refundQuantities)
                      .filter(([_, qty]) => qty > 0)
                      .map(([menuId, qty]) => ({ menu_id: parseInt(menuId), refund_qty: qty }));
                  } else if (refundType === 'full' && status === 'Partial Refunded') {
                    // convert to partial using remaining quantities
                    payloadRefundType = 'partial';
                    payloadRefundItems = remainingItems
                      .map(it => ({ menu_id: it.menu_id, refund_qty: it.remaining }))
                      .filter(it => it.refund_qty > 0);
                  }

                  const res = await fetch(`${API_BASE_URL}/api/pos/refund`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      transaction_id: transaction.transaction_id,
                      refund_type: payloadRefundType,
                      refund_items: payloadRefundItems,
                      reason: refundReason,
                      admin_pin: refundAdminPin,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || "Refund failed");
                  const newStatus = data.status || 'Refunded';
                  onRefund && onRefund(transaction.transaction_id, newStatus);
                  onClose();
                } catch (err) {
                  setRefundError(err.message);
                } finally {
                  setSubmittingRefund(false);
                }
              }}
            >
              Confirm Refund
            </button>
          </div>
        </div>
      ) : (
          <div className="flex gap-2 mt-4">
            {/* hide actions for voided/refunded or when nothing left to refund */}
            {isVoidedOrRefunded || remainingTotalCount === 0 ? (
              <div className="text-sm text-gray-600">No actions available for this transaction.</div>
            ) : (
              <>
                {voidAllowed ? (
                  <button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-sm"
                    onClick={() => { setShowVoidForm(true); setVoidError(""); }}
                  >
                    Void
                  </button>
                ) : (
                  <button
                    className="flex-1 bg-red-200 text-white font-bold py-2 rounded-lg text-sm opacity-50 cursor-not-allowed"
                    disabled
                    title={status === 'Completed' ? 'Void not allowed after 30 minutes' : 'Void not available'}
                  >
                    Void
                  </button>
                )}

                {/* Refund is allowed for Completed or Partial Refunded when there are remaining items */}
                {(status === 'Completed' || status === 'Partial Refunded') && remainingTotalCount > 0 ? (
                  <button
                    className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-bold py-2 rounded-lg text-sm"
                    onClick={() => { setShowRefundForm(true); setRefundError(""); setRefundType('full'); setRefundQuantities({}); }}
                  >
                    Refund
                  </button>
                ) : (
                  <button
                    className="flex-1 bg-orange-200 text-white font-bold py-2 rounded-lg text-sm opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Refund
                  </button>
                )}
              </>
            )}
          </div>
      )}
    </div>
  );
}