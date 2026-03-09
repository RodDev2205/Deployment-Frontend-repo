import { useEffect } from "react";
import { initQZ, printReceipt } from '../utils/printUtils';

function ReceiptPrinter({ orderData }) {
  useEffect(() => {
    initQZ();
  }, []);

  const handlePrint = async () => {
    try {
      await printReceipt(orderData);
    } catch (err) {
      alert("Printing failed: " + err.message);
    }
  };

  return <button onClick={handlePrint}>Print Receipt</button>;
}

export default ReceiptPrinter;