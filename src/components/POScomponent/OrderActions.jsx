import React, { useState } from 'react';
import CheckoutModal from '../modal/Checkout';
import PrintingModal from '../modal/PrintingModal';
import SuccessModal from '../modal/SuccessModal';
import CancelOrderModal from '../modal/CancelOrder';
import ManagerCodeModal from '../modal/Code';
import OrderCanceledModal from '../modal/CanceledModal';

export default function OrderActions({ orderItems, orderType, discountType = "None", discountPercent = "10 % off", onOrderComplete, onResetDiscount }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPrinting, setShowPrinting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showManagerCode, setShowManagerCode] = useState(false);
  const [showOrderCanceled, setShowOrderCanceled] = useState(false);

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const handleProceed = () => {
    setShowCheckout(false);
    setShowPrinting(true);
  
    // Clear items and reset discount when checkout is completed
    if (onOrderComplete) {
      onOrderComplete();
    }
    if (onResetDiscount) {
      onResetDiscount();
    }
  
    setTimeout(() => {
      setShowPrinting(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 2000);
  };

  const handleCancelOrder = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    setShowManagerCode(true);
  };

  const handleManagerCodeSubmit = (code) => {
    if (code) {
      setShowManagerCode(false);
      setShowOrderCanceled(true);
    }
  };

  const handleCancelFromCheckout = () => {
    setShowCheckout(false);
    setShowCancelConfirm(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelConfirm(false);
  };

  const handleCloseManagerCodeModal = () => {
    setShowManagerCode(false);
  };

  const handleCloseOrderCanceled = () => {
    setShowOrderCanceled(false);
  };

  return (
    <>
      <div className="flex gap-2 mt-4">
        <button 
          onClick={handleCheckout}
          className="flex-1 py-3 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-800 transition-colors"
        >
          Checkout
        </button>
        <button 
          onClick={handleCancelOrder}
          className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel Order
        </button>
      </div>

      {showCheckout && (
        <CheckoutModal
          orderItems={orderItems}
          orderType={orderType}
          discountType={discountType}
          discountPercent={discountPercent}
          onProceed={handleProceed}
          onCancel={handleCancelFromCheckout}
        />
      )}

      {showPrinting && <PrintingModal />}

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}

      {showCancelConfirm && (
        <CancelOrderModal
          orderNumber="#####"
          onProceed={handleConfirmCancel}
          onCancel={handleCloseCancelModal}
        />
      )}

      {showManagerCode && (
        <ManagerCodeModal
          onSubmit={handleManagerCodeSubmit}
          onCancel={handleCloseManagerCodeModal}
        />
      )}

      {showOrderCanceled && (
        <OrderCanceledModal onClose={handleCloseOrderCanceled} />
      )}
    </>
  );
}