const ExcelJS = require('exceljs');
const path = require('path');

async function testSheet() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'Trading_Journal_v11.xlsx'));
  
  const wsLog = workbook.getWorksheet('Trade Log');
  const wsCal = workbook.getWorksheet('Calendar View');
  const wsYear = workbook.getWorksheet('Yearly Review');

  console.log("=== VERIFYING TRADE LOG DATE DATATYPES ===");
  const cellA2 = wsLog.getCell('A2');
  console.log(`Cell A2 (Entry Date) Type: ${cellA2.type}`);
  console.log(`Cell A2 Value:`, cellA2.value);
  
  if (cellA2.value instanceof Date) {
    console.log("ASSERTION PASSED: A2 is a valid JS Date object!");
  } else {
    console.log("ASSERTION FAILED: A2 is a text string!");
  }

  console.log("\n=== VERIFYING DYNAMIC CALENDAR ARCHITECTURE ===");
  console.log(`Calendar Header (B2) Formula:`, wsCal.getCell('B2').value);
  console.log(`Calendar Start Date (B5) Formula:`, wsCal.getCell('B5').value);
  console.log(`Day 2 Cell (C5) Formula:`, wsCal.getCell('C5').value);
  console.log(`Dynamic Daily P&L Cell (C6) Formula:`, wsCal.getCell('C6').value);
  console.log(`Month Total P&L Cell (I5) Formula:`, wsCal.getCell('I5').value);

  console.log("\n=== VERIFYING DYNAMIC YEARLY REVIEWS ===");
  console.log(`Yearly Review Header (B2) Formula:`, wsYear.getCell('B2').value);
  console.log(`May Scorecard Cell (B9) Formula:`, wsYear.getCell('B9').value);
  console.log(`Year Total P&L Cell (J6) Formula:`, wsYear.getCell('J6').value);
}

testSheet().catch(console.error);
