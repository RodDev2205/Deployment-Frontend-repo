import qz from 'qz-tray';

// Initialize QZ Tray connection
export const initQZ = async () => {
  try {
    await qz.websocket.connect();
    console.log("✅ Connected to QZ Tray");
    // List available printers
    const printers = await qz.printers.find();
    console.log("Available printers:", printers);
    return printers;
  } catch (err) {
    console.error("❌ QZ Tray connection error:", err);
    throw err;
  }
};

// Print receipt function
export const printReceipt = async (orderData, printerName = "JK-5802H") => {
  try {
    // Ensure connected
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
      console.log("✅ Connected to QZ Tray");
    }

    const config = qz.configs.create(printerName);

    const cmds = [];

    cmds.push('\x1B\x40'); // init printer
    cmds.push('\x1B\x61\x01'); // center align
    cmds.push("🍔 Food Paradise POS\n");
    cmds.push("Pasonanca, Zamboanga City\n");
    cmds.push("Contact: +63 111 222 4444\n");
    cmds.push("SALES INVOICE\n");
    cmds.push("-------------------------------\n");

    cmds.push('\x1B\x61\x00'); // left align
    cmds.push(`Time: ${orderData.date}\n`);
    cmds.push(`Receipt No: #${orderData.orderId}\n`);
    cmds.push(`Order Type: ${orderData.orderType}\n`);
    cmds.push(`Payment: ${orderData.paymentMethod}\n`);
    cmds.push("-------------------------------\n");

    cmds.push("Qty  Item             Price\n");
    cmds.push("-------------------------------\n");
    orderData.cart.forEach(item => {
      const total = item.qty * item.price;
      cmds.push(`${item.qty.toString().padStart(3)}  ${item.item.padEnd(16)} Php ${total.toFixed(2).padStart(6)}\n`);
      cmds.push(`      @ Php ${item.price.toFixed(2)}\n`);
    });
    cmds.push("-------------------------------\n");

    cmds.push(`Subtotal:           Php ${orderData.total.toFixed(2)}\n`);
    if (orderData.paymentMethod === "Cash") {
      cmds.push(`Given:              Php ${parseFloat(orderData.given).toFixed(2)}\n`);
      cmds.push(`Change:             Php ${parseFloat(orderData.change).toFixed(2)}\n`);
    }
    cmds.push(`TOTAL:              Php ${orderData.total.toFixed(2)}\n`);
    cmds.push("-------------------------------\n");

    cmds.push('\x1B\x61\x01'); // center
    cmds.push("Thank you for dining!\n");
    cmds.push("This is not an official receipt\n\n\n");

    cmds.push('\x1B\x64\x03'); // feed 3 lines
    cmds.push('\x1D\x56\x00'); // cut

    await qz.print(config, cmds);
    console.log("✅ Print successful");
  } catch (err) {
    console.error("❌ Print failed:", err);
    throw err;
  }
};