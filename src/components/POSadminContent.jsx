import React, { useState, useEffect, useMemo } from "react";
import Modal from "../components/POScomponent/Modal/Modal";
import ItemsPanel from "../components/POScomponent/Panel/ItemsPanel";
import ReceiptPanel from "../components/POScomponent/Panel/ReceiptPanel";
import ReceiptModal from "../components/POScomponent/Modal/ReceiptModal";
import VoidTransactionModal from "../components/POScomponent/Modal/VoidTransactionModal";
import PaymentModal from "../components/POScomponent/Modal/PaymentModal";
import Notification from "../components/common/Notification";
import API_BASE_URL from '../config/api';

export default function POSCashier({ isCashier, isAdmin }) {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);

  // ================== FETCH PRODUCTS ==================
  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE_URL}/api/menu`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Menu loaded:", data);
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setError(`Failed to load menu: ${err.message}`);
        setLoading(false);
        setItems([]); // Set empty array as fallback
      });
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  const filteredItems = useMemo(() => {
    let result = items.filter(
      (item) => {
        const name = item.product_name ? item.product_name.toLowerCase() : "";
        return (
          (activeCategory === "All" || item.category_name === activeCategory) &&
          name.includes(searchTerm.toLowerCase())
        );
      }
    );

    switch (sortOption) {
      case "nameAsc":
        return result.sort((a, b) => a.product_name.localeCompare(b.product_name));
      case "priceAsc":
        return result.sort((a, b) => a.price - b.price);
      case "priceDesc":
        return result.sort((a, b) => b.price - a.price);
      default:
        return result;
    }
  }, [activeCategory, searchTerm, sortOption, items]);

  // ================== HANDLE CHECKOUT ==================
  const handleCheckout = async (paymentData) => {
    if (cart.length === 0) {
      setNotification({ type: "warning", message: "Cart is empty!" });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/pos/complete-sale`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          cart,
          paymentMethod: paymentData.paymentMethod,
          amountPaid: paymentData.amountPaid,
          discount: paymentData.discount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotification({ type: "success", message: "Sale completed successfully!" });
        setModalContent(
          <ReceiptModal
            transactionId={data.transactionId}
            transactionNumber={data.transactionNumber}
            total={data.totalAmount}
            change={data.changeAmount}
            cart={cart}
            onClose={() => setModalOpen(false)}
          />
        );

        setModalOpen(true);
        setCart([]);
      } else {
        setNotification({ type: "error", message: data.message });
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: "Error completing sale: " + err.message });
    }
  };

  const handleVoidTransaction = () => {
    // previously showed a confirm modal; now simply clear cart
    setCart([]);
    setNotification({ type: "success", message: "Cart cleared" });
  };

  const decrementItem = (productId) => {
    setCart((prev) => {
      const updated = prev.map((i) => ({ ...i }));
      const idx = updated.findIndex((i) => i.product_id === productId);
      if (idx === -1) return updated;

      if (updated[idx].qty > 1) {
        updated[idx].qty -= 1;
      } else {
        updated.splice(idx, 1);
      }
      return updated;
    });
  };

  const handleOpenPayment = () => {
    setModalContent(
      <PaymentModal
        totalAmount={totalAmount}
        onConfirm={handleCheckout}
        onClose={() => setModalOpen(false)}
      />
    );
    setModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-800 px-6 py-3 flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm">⚠️ Error Loading Menu</p>
            <p className="text-xs">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && items.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="border-4 border-emerald-200 border-t-emerald-600 rounded-full w-16 h-16 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Loading menu items...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}

      {/* No Items State */}
      {!loading && items.length === 0 && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 font-medium text-lg">No menu items available</p>
        </div>
      )}

      {/* POS Layout */}
      {items.length > 0 && (
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          <ItemsPanel
            items={filteredItems}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOption={sortOption}
            setSortOption={setSortOption}
            cart={cart}
            setCart={setCart}
          />
          <ReceiptPanel
            cart={cart}
            totalAmount={totalAmount}
            handleCheckout={handleOpenPayment}
            setCart={setCart}
            decrementItem={decrementItem}
            isCashier={isCashier}
            isAdmin={isAdmin}
            handleVoidTransaction={handleVoidTransaction}
          />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {modalContent}
      </Modal>
    </div>
  );
}
