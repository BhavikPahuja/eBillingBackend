const express = require("express");
const router = express.Router();

const { createBill, getBills, getBillPdf, getBillsExcel, getBillById } = require("../controllers/billController");

router.post("/bills", createBill);
router.get("/bills/excel", getBillsExcel);
router.get("/bills", getBills);
router.get("/bills/:id/pdf", getBillPdf);
router.get("/bills/:id", getBillById); 

module.exports = router;
