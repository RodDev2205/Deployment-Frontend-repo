import qz from "qz-tray";

// Print receipt using Windows printer
export const printReceipt = async (orderData) => {
  try {

    console.log("🔍 Connecting to QZ Tray...");
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
    }

    console.log("✅ Connected to QZ Tray");

    // Change this to EXACT printer name in Windows
    const printer = qz.configs.create("POS-58(copy of 1)");

    console.log("📄 Formatting receipt...");

    const receipt = [
      '\x1B\x40', // Initialize printer
      '\x1B\x61\x01', // Center align
      '*** Food Paradise POS ***\n',
      'Pasonanca, Zamboanga City\n',
      'Contact: +63 111 222 4444\n',
      'SALES INVOICE\n',
      '-------------------------------\n',

      '\x1B\x61\x00', // Left align
      `Time: ${orderData.date}\n`,
      `Receipt No: #${orderData.orderId}\n`,
      `Order Type: ${orderData.orderType}\n`,
      `Payment: ${orderData.paymentMethod}\n`,
      '-------------------------------\n',
      'Qty  Item                  Price\n',
      '-------------------------------\n'
    ];

    // Items
    orderData.cart.forEach(item => {
      const total = item.qty * item.price;

      receipt.push(
        `${item.qty.toString().padStart(3)}  ${item.item.padEnd(20)} ₱${total.toFixed(2).padStart(6)}\n`
      );

      receipt.push(`      @ ₱${item.price.toFixed(2)}\n`);
    });

    receipt.push('-------------------------------\n');
    receipt.push(`Subtotal:                ₱${orderData.total.toFixed(2)}\n`);

    if (orderData.paymentMethod === "Cash") {
      receipt.push(`Given:                   ₱${parseFloat(orderData.given).toFixed(2)}\n`);
      receipt.push(`Change:                  ₱${parseFloat(orderData.change).toFixed(2)}\n`);
    }

    receipt.push(`TOTAL:                   ₱${orderData.total.toFixed(2)}\n`);
    receipt.push('-------------------------------\n');

    receipt.push('\x1B\x61\x01'); // Center
    receipt.push('Thank you for dining!\n');
    receipt.push('This is not an official receipt\n\n\n');

    receipt.push('\x1B\x64\x03'); // Feed paper
    receipt.push('\x1D\x56\x00'); // Cut paper

    console.log("🖨️ Sending to printer...");

    await qz.print(printer, receipt);

    console.log("✅ Print successful");

  } catch (err) {
    console.error("❌ Print failed:", err);
  }
};