import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";
import { Bill, Product } from "../types";

const calculateTotal = (products: Product[] | undefined) => {
  if (!products) return 0;
  return products.reduce((acc, product) => {
    const quantity = parseFloat(product.quantity) || 0;
    const price = parseFloat(product.price) || 0;
    return acc + (quantity * price);
  }, 0);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};


export async function generateBillsPDF(selectedBills: Bill[]) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const A4_WIDTH = 595.28; // A4 width
  const A4_HEIGHT = 841.89; // A4 height

  const COLS = 2; // Two columns per page (you can change to 3x4 later)
  const ROWS = 4;
  const BILL_WIDTH = A4_WIDTH / COLS;
  const BILL_HEIGHT = A4_HEIGHT / ROWS;

  let mainPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let billBlockIndex = 0;

  for (let bill of selectedBills) {
    // Prepare bill-level pagination
    const productsPerPage = 10;
    const totalPagesForBill = Math.ceil(bill.products.length / productsPerPage);
    const grandTotal = calculateTotal(bill.products);

    for (let pageIndex = 0; pageIndex < totalPagesForBill; pageIndex++) {
      const col = billBlockIndex % COLS;
      const row = Math.floor(billBlockIndex / COLS) % ROWS;

      const x = col * BILL_WIDTH + 10;
      const y = A4_HEIGHT - (row + 1) * BILL_HEIGHT + BILL_HEIGHT - 10;

      // Draw bill block border
      mainPage.drawRectangle({
        x: col * BILL_WIDTH,
        y: A4_HEIGHT - (row + 1) * BILL_HEIGHT,
        width: BILL_WIDTH,
        height: BILL_HEIGHT,
        borderWidth: 0.5,
        borderColor: rgb(0.8, 0.8, 0.8),
      });

      // Draw content
      let cursorY = y;
      const fontSize = 10;

      const drawText = (text: string, offsetX: number = 0) => {
        mainPage.drawText(text, {
          x: x + offsetX,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        cursorY -= 10;
      };
      drawText(` `);
      mainPage.drawText("Bill Number :", { x: x, y: cursorY, size: fontSize, font });
      mainPage.drawText(bill.billNumber || "", { x: x + 90, y: cursorY, size: fontSize, font });
      cursorY -= 10;

      mainPage.drawText("Customer Name :", { x: x, y: cursorY, size: fontSize, font });
      mainPage.drawText(bill.customerName || "N/A", { x: x + 90, y: cursorY, size: fontSize, font });
      cursorY -= 10;

      mainPage.drawText("Date :", { x: x, y: cursorY, size: fontSize, font });
      mainPage.drawText(formatDate(bill.createdAt.toString()), { x: x + 90, y: cursorY, size: fontSize, font });
      cursorY -= 12;
      drawText("--------------------------------------------------------------------------------");

      const startIndex = pageIndex * productsPerPage;
      const products = bill.products.slice(startIndex, startIndex + productsPerPage);


      mainPage.drawText("Item", { x: x, y: cursorY, size: fontSize, font });
      mainPage.drawText("Qty", { x: x + 120, y: cursorY, size: fontSize, font });
      mainPage.drawText("Price", { x: x + 140, y: cursorY, size: fontSize, font });
      mainPage.drawText("Total", { x: x + 190, y: cursorY, size: fontSize, font });
      cursorY -= 10;

      drawText("--------------------------------------------------------------------------------");

      // Draw each product row
      for (let p of products) {
        const quantity = parseFloat(p.quantity) || 0;
        const price = parseFloat(p.price) || 0;
        const total = (quantity * price).toFixed(2);

        // Column alignment
        mainPage.drawText(p.name || "", { x: x, y: cursorY, size: fontSize, font });
        mainPage.drawText(quantity.toString(), { x: x + 120, y: cursorY, size: fontSize, font });
        mainPage.drawText(price.toString(), { x: x + 140, y: cursorY, size: fontSize, font });
        mainPage.drawText(total.toString(), { x: x + 190, y: cursorY, size: fontSize, font });

        cursorY -= 10;
      }
      drawText("---------------------------------------------------------------------------------");

      const footerY = A4_HEIGHT - (row + 1) * BILL_HEIGHT + 20;

      // Footer Text
      const footerFontSize = 10;
      mainPage.drawText(`Page ${pageIndex + 1} of ${totalPagesForBill}`, {
        x: x,
        y: footerY,
        size: footerFontSize,
        font,
        color: rgb(0, 0, 0),
      });

      // Show grand total on last page of the bill
      if (pageIndex + 1 === totalPagesForBill) {
        mainPage.drawText(`Grand Total: ${grandTotal.toFixed(2)} INR`, {
          x: x + BILL_WIDTH - 200,
          y: footerY,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
      }

      billBlockIndex++;

      // If 4 bills have been drawn on this A4 sheet (2x2 grid), start a new sheet
      if (billBlockIndex % (COLS * ROWS) === 0 && !(pageIndex + 1 === totalPagesForBill && selectedBills.indexOf(bill) === selectedBills.length - 1)) {
        mainPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      }
    }
  }

  // Save & open
  const base64Data = await pdfDoc.saveAsBase64();
  const fileName = `Bills_${Date.now()}.pdf`;

  await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Documents,
  });

  const { uri } = await Filesystem.getUri({
    path: fileName,
    directory: Directory.Documents,
  });

  await FileOpener.open({
    filePath: uri,
    contentType: "application/pdf",
  });
}
