import React, { useState, useEffect } from 'react';
import API_BASE_URL from '@/config/api';

export default function SeniorPWDItemDiscountModal({ 
  cart = [], 
  discountType = 'senior',
  verificationData = null,
  onConfirm, 
  onCancel 
}) {
  const [cartWithDiscounts, setCartWithDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculatedResult, setCalculatedResult] = useState(null);

  // Initialize cart with discountQty (default to 0)
  useEffect(() => {
    const initialized = cart.map(item => ({
      ...item,
      discountQty: item.discountQty || 0
    }));
    setCartWithDiscounts(initialized);
  }, [cart]);

  // Calculate discount whenever cart changes
  useEffect(() => {
    if (cartWithDiscounts.length > 0) {
      calculateDiscount();
    }
  }, [cartWithDiscounts]);

  const calculateDiscount = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/pos/calculate-senior-pwd-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: cartWithDiscounts })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Error calculating discount');
        setCalculatedResult(null);
      } else {
        setCalculatedResult(data.data);
      }
    } catch (err) {
      setError('Failed to calculate discount: ' + err.message);
      setCalculatedResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountQtyChange = (index, newQty) => {
    const updated = [...cartWithDiscounts];
    const maxQty = updated[index].qty;
    const capped = Math.max(0, Math.min(newQty, maxQty));
    updated[index].discountQty = capped;
    setCartWithDiscounts(updated);
  };

  const handleConfirm = () => {
    if (!calculatedResult || !calculatedResult.success) {
      setError('Invalid discount calculation');
      return;
    }

    onConfirm({
      cartWithDiscounts,
      discountCalculation: calculatedResult,
      verificationData
    });
  };

  const typeLabel = discountType === 'senior' ? 'Senior Citizen' : 'Person with Disability (PWD)';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">{typeLabel} - Item Discount Selection</h2>
          <p className="text-blue-100 text-sm mt-1">Select quantities for 20% discount (per item)</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Item List */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {cartWithDiscounts.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      Price: ₱{Number(item.price).toFixed(2)} | Total Qty: {item.qty}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                    Discount Units:
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => handleDiscountQtyChange(index, cartWithDiscounts[index].discountQty - 1)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded font-semibold transition"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={item.qty}
                      value={cartWithDiscounts[index].discountQty}
                      onChange={(e) => handleDiscountQtyChange(index, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-semibold"
                    />
                    <button
                      onClick={() => handleDiscountQtyChange(index, cartWithDiscounts[index].discountQty + 1)}
                      className="bg-green-100 hover:bg-green-200 text-green-600 px-3 py-1 rounded font-semibold transition"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-600 ml-2">of {item.qty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Discount Summary */}
          {calculatedResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal (Original):</span>
                <span className="font-semibold">₱{calculatedResult.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-orange-600">
                <span>Discount Calculated:</span>
                <span className="font-semibold">-₱{calculatedResult.totalDiscountCalculated.toFixed(2)}</span>
              </div>
              {calculatedResult.discountCapped && (
                <div className="flex justify-between text-sm text-red-600 bg-red-50 p-2 rounded">
                  <span>⚠️ Discount Capped:</span>
                  <span className="font-semibold">-₱{calculatedResult.totalDiscountApplied.toFixed(2)}</span>
                </div>
              )}
              {!calculatedResult.discountCapped && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount Applied:</span>
                  <span className="font-semibold">-₱{calculatedResult.totalDiscountApplied.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold">Total Payable:</span>
                <span className="text-lg font-bold text-blue-600">₱{calculatedResult.totalPayable.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !calculatedResult || error}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded transition"
          >
            {loading ? 'Calculating...' : 'Confirm Selection'}
          </button>
        </div>
      </div>
    </div>
  );
}
