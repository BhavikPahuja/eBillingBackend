const Bill = require("../models/Bill");
const generatePdf = require("../utils/generatePdf");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

const createBill = async (req, res) => {
    console.log("Received request:", req.body);
  try {
    const lastBill = await Bill.findOne().sort({ serial: -1 });
    const newSerial = lastBill ? lastBill.serial + 1 : 1;

    const billData = {
      serial: newSerial,
      billerName: req.body.billerName,
      billerNumber: req.body.billerNumber,
      billToAddress: req.body.billToAddress,
      billToCity: req.body.billToCity,
      products: req.body.products,
      totalAmount: req.body.products.reduce(
        (sum, p) => sum + p.quantity * p.price,
        0
      ),
      date: new Date(),
    };

    const newBill = new Bill(billData);
    await newBill.save();
    res.status(201).json({ message: "Bill created", invoiceNo: newBill.serial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const getBills = async (req, res) => {
  try {
    const { from, to } = req.query;

    let filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
            const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    filter.date.$lt = toDate;
      }
    }

    const bills = await Bill.find(filter).sort({ date: -1 });
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const getBillPdf = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    const pdfBuffer = await generatePdf(bill.toObject());

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Bill.pdf`);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ error: "Error generating PDF" });
  }
};

const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    // Ensure items array is always present
    const billObj = bill.toObject();
    billObj.items = billObj.items || billObj.products || [];
    res.json(billObj);
  } catch (err) {
    console.error("Error fetching bill:", err);
    res.status(500).json({ error: "Error fetching bill" });
  }
};

const getBillsExcel = async (req, res) => {
  try {
    const bills = await Bill.find();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bills");

    worksheet.columns = [
      { header: "Serial", key: "serial", width: 10 },
      { header: "Biller", key: "billerName", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Total", key: "totalAmount", width: 15, style: { numFmt: '"₹"#,##0.00' } },
    ];

    bills.forEach(bill => {
      worksheet.addRow({
        serial: bill.serial,
        billerName: bill.billerName,
        date: bill.date.toISOString().slice(0, 10),
        totalAmount: Number(bill.totalAmount),
      });
    });

    worksheet.getColumn('totalAmount').numFmt = '"₹"#,##0.00';

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=bills.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).send("Error generating Excel");
  }
};

module.exports = { createBill, getBills, getBillPdf, getBillsExcel, getBillById };
