import React, { useState } from 'react';

export default function VoidCode({ onSubmit, onCancel}) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate PIN is exactly 8 digits
        if (code.length !== 8 || !/^\d{8}$/.test(code)) {
            setError('PIN must be exactly 8 digits');
            return;
        }
        
        setError('');
        onSubmit(code);
    };

    const handleCodeChange = (e) => {
        const value = e.target.value;
        // Only allow numeric input and max 8 digits
        if (/^\d*$/.test(value) && value.length <= 8) {
            setCode(value);
            setError('');
        }
    };

    return (
        <div className="fixed inset-0 bg-opacity-40 backdrop-brightness-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 w-96 shadow-xl">
        <h2 className="text-xl font-bold text-center mb-6">Please Enter the PIN Code</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2 text-center">
              Enter your 8-digit PIN code
            </label>
            <input
              type="password"
              value={code}
              onChange={handleCodeChange}
              maxLength="8"
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-700'
              }`}
              placeholder="••••••••"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <p className="text-xs text-gray-500 mt-2 text-center">
              {code.length}/8 digits
            </p>
          </div>

          <button
            type="submit"
            disabled={code.length !== 8}
            className="w-full py-2 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
    )
}