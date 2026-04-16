import qz from 'qz-tray';

// Initialize QZ Tray connection (optional helper)
export const initQZ = async () => {
  try {
    await qz.websocket.connect();
    console.log("✅ Connected to QZ Tray");
    const printers = await qz.printers.find();
    console.log("Available printers:", printers);
    return printers;
  } catch (err) {
    console.error("❌ QZ Tray connection error:", err);
    throw err;
  }
};

// Print receipt function using serial/config
export const printReceipt = async (orderData) => {
  try {
    // Ensure QZ Tray is connected
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
      console.log("✅ Connected to QZ Tray");
    }

    // Configure the printer (serial connection COM6)
    const printer = qz.configs.create("XP-80C");


    console.log("📄 Formatting receipt for print...");

    const receipt = [];
    receipt.push('\x1B\x40'); // init
    receipt.push('\x1B\x61\x01'); // center
    receipt.push('*** Food Paradise POS ***\n');
    // use branch location/contact if provided
    if (orderData.location) {
      receipt.push(`${orderData.location}\n`);
    } else {
      receipt.push('Pasonanca, Zamboanga City\n');
    }
    if (orderData.contact) {
      receipt.push(`Contact: ${orderData.contact}\n`);
    } else {
      receipt.push('Contact: +63 111 222 4444\n');
    }
    receipt.push('SALES INVOICE\n');
    receipt.push('-------------------------------\n');
    receipt.push('\x1B\x61\x00'); // left
    receipt.push(`Time: ${orderData.date}\n`);
    receipt.push(`Receipt No: #${orderData.orderId}\n`);
    receipt.push(`Cashier: ${orderData.cashierName || 'N/A'}\n`);
    receipt.push(`Order Type: ${orderData.orderType}\n`);
    receipt.push(`Payment: ${orderData.paymentMethod}\n`);
    receipt.push('-------------------------------\n');
    if (orderData.discountType && orderData.discountType !== 'none') {
    receipt.push('-------------------------------\n');
    receipt.push(`Discount: ${orderData.discountType}\n`);
    if (orderData.discountHolderName) receipt.push(`Name: ${orderData.discountHolderName}\n`);
    if (orderData.discountHolderId) receipt.push(`ID No: ${orderData.discountHolderId}\n`);
    }
    receipt.push('Qty  Item                  Price\n');
    receipt.push('-------------------------------\n');
    orderData.cart.forEach(item => {
     const total = (item.qty || 0) * (item.price || 0);
  const priceField = `PHP${(total || 0).toFixed(2)}`.padStart(10);
  receipt.push(`${(item.qty || 0).toString().padStart(3)}  ${(item.item || '').padEnd(16)} ${priceField}\n`);
  const unitPriceField = `PHP${(item.price || 0).toFixed(2)}`.padStart(10);
      receipt.push(`   @ ${unitPriceField}\n`);
    });
    receipt.push('-------------------------------\n');
    receipt.push(`Subtotal:              PHP${(orderData.subtotal || 0).toFixed(2)}\n`);
    if (orderData.paymentMethod === "Cash") {
      receipt.push(`Cash:                 PHP${parseFloat(orderData.given).toFixed(2)}\n`);
      receipt.push(`Change:                PHP${parseFloat(orderData.change).toFixed(2)}\n`);
    }
    receipt.push(`TOTAL:                 PHP${(orderData.total || 0).toFixed(2)}\n`);
    receipt.push('-------------------------------\n');
    receipt.push('\x1B\x61\x01');
    receipt.push('Thank you for dining!\n');
    receipt.push('This is not an official receipt\n\n\n');
    receipt.push('\x1B\x64\x03');
    receipt.push('\x1D\x56\x00');

    console.log("🖨️ Sending to printer...");
    await qz.print(printer, receipt);
    console.log("✅ Print successful");
  } catch (err) {
    console.error("❌ Print failed:", err);
    throw err;
  }
};
