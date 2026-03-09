import React, { useState } from 'react';

export default function Checkout({ orderItems = [], orderType, discountType = "None", discountPercent = "10 % off", onProceed, onCancel }) {
  const [cashGiven, setCashGiven] = useState('');
  const [error, setError] = useState('');

  const subtotal = orderItems.reduce(
    (sum, item) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price.replace('₱', '').replace(',', '')) 
        : Number(item.price);
      return sum + (Number(item.quantity) * price);
    },
    0
  );

  const percentValue = parseInt(discountPercent);
  let discountAmount = 0;

  if (discountType !== "None") {
    discountAmount = subtotal * (percentValue / 100);
  }

  const total = subtotal - discountAmount;
  const numericCash = parseFloat(cashGiven) || 0;
  const changeDue = numericCash - total;
  const displayChange = cashGiven === '' ? 0 : changeDue;

  const handleProceed = () => {
    setError('');
    if (!cashGiven && numericCash === 0) {
      setError('Please enter cash amount.');
      return;
    }
    if (numericCash < total) {
      setError('Insufficient cash given.');
      return;
    }

    const orderData = {
      date: new Date().toLocaleString(),
      orderId: Math.floor(Math.random() * 100000), // generate random for now
      orderType,
      paymentMethod: "Cash",
      given: cashGiven,
      change: displayChange,
      total,
      cart: orderItems.map(item => ({
        qty: item.quantity,
        item: item.name,
        price: typeof item.price === 'string' ? parseFloat(item.price.replace('₱', '').replace(',', '')) : Number(item.price)
      }))
    };

    onProceed && onProceed(orderData);
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-brightness-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-bold mb-2 text-center">Check out - {orderType}</h2>
        <div className="text-sm text-gray-600 mb-1 text-center">Date and Time: Jan 20, 2026 | 12:20 pm</div>
        <div className="text-sm text-gray-600 mb-1 text-center">Sale Id #: 00192</div>
        <div className="text-sm text-gray-600 mb-4 text-center">Cashier: Employee Name</div>

        {/* Order Items */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Order Items</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                <div className="flex-1">
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">x{item.quantity}</span>
                  <span className="font-semibold">₱{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-semibold">₱{subtotal.toFixed(2)}</span>
            </div>
            {discountType !== "None" && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount ({discountType} - {discountPercent}):</span>
                <span className="font-semibold">-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total Due:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-green-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Payment</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Payment Type:</span>
              <span className="text-sm font-medium">Cash</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Cash Given:</span>
              <input
                type="number"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                className="w-28 px-3 py-2 border border-gray-300 rounded font-semibold text-center"
                placeholder="0.00"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-100 p-2 rounded">{error}</div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Change Due:</span>
              <span className={`text-lg font-bold ${displayChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₱{displayChange.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
          >
            Cancel Order
          </button>
          <button
            onClick={handleProceed}
            disabled={numericCash < total}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              numericCash < total
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            Proceed Order
          </button>
        </div>
      </div>
    </div>
  );
}