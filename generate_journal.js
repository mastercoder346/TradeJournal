const ExcelJS = require('exceljs');
const path = require('path');

function getColLetter(col) {
  let temp, letter = '';
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

async function createTradingJournal() {
  const workbook = new ExcelJS.Workbook();

  // Theme Colors & Styles
  const darkBgColor = '0F172A'; // Slate 900
  const cardBgColor = '1E293B'; // Slate 800
  const borderCol = '475569'; // Slate 600
  
  const fillCard = { type: 'pattern', pattern: 'solid', fgColor: { argb: cardBgColor } };
  const thinBorder = {
    top: { style: 'thin', color: { argb: borderCol } },
    left: { style: 'thin', color: { argb: borderCol } },
    bottom: { style: 'thin', color: { argb: borderCol } },
    right: { style: 'thin', color: { argb: borderCol } }
  };

  const fontTitle = { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FFFFFF' } };
  const fontSubtitle = { name: 'Segoe UI', size: 10, italic: true, color: { argb: '94A3B8' } };
  const fontLabel = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '94A3B8' } };
  const fontValue = { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'F8FAFC' } };
  const fontValueGreen = { name: 'Segoe UI', size: 18, bold: true, color: { argb: '10B981' } };

  // -------------------------------------------------------------
  // SHEET 1: SETTINGS
  // -------------------------------------------------------------
  const wsSettings = workbook.addWorksheet('Settings', {
    views: [{ showGridLines: true }]
  });
  
  wsSettings.getCell('B2').value = 'TRADING JOURNAL SETTINGS';
  wsSettings.getCell('B2').font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: '1E293B' } };
  
  wsSettings.getCell('B4').value = 'Stock Commission (per share)';
  wsSettings.getCell('B4').font = { name: 'Segoe UI', size: 10, bold: true };
  wsSettings.getCell('C4').value = 0.00;
  wsSettings.getCell('C4').font = { name: 'Segoe UI', size: 10 };
  wsSettings.getCell('C4').numFmt = '$#,##0.000';
  
  wsSettings.getCell('B5').value = 'Option Commission (per contract)';
  wsSettings.getCell('B5').font = { name: 'Segoe UI', size: 10, bold: true };
  wsSettings.getCell('C5').value = 0.65;
  wsSettings.getCell('C5').font = { name: 'Segoe UI', size: 10 };
  wsSettings.getCell('C5').numFmt = '$#,##0.00';

  // -------------------------------------------------------------
  // SHEET 2: DASHBOARD
  // -------------------------------------------------------------
  const wsDash = workbook.addWorksheet('Dashboard', {
    views: [{ showGridLines: true }]
  });

  // Header Title
  wsDash.getCell('B2').value = 'TRADING PERFORMANCE DASHBOARD';
  wsDash.getCell('B2').font = fontTitle;
  wsDash.getCell('B3').value = 'Real-time updates dynamically computed from your Trade Log sheet';
  wsDash.getCell('B3').font = fontSubtitle;

  // Vertical KPI Blocks
  // KPI 1: Net Profit
  wsDash.getCell('B5').value = 'TOTAL NET PROFIT';
  wsDash.getCell('B5').font = fontLabel;
  wsDash.getCell('B5').fill = fillCard;
  wsDash.getCell('B6').value = { formula: "SUM('Trade Log'!Q:Q)" };
  wsDash.getCell('B6').font = fontValueGreen;
  wsDash.getCell('B6').fill = fillCard;
  wsDash.getCell('B6').numFmt = '$#,##0.00;($#,##0.00);"-"';

  // KPI 2: Win Rate
  wsDash.getCell('B8').value = 'WIN RATE';
  wsDash.getCell('B8').font = fontLabel;
  wsDash.getCell('B8').fill = fillCard;
  wsDash.getCell('B9').value = { formula: "IF(COUNTA('Trade Log'!D:D)-1>0, COUNTIF('Trade Log'!Q:Q,\">0\") / (COUNTIF('Trade Log'!Q:Q,\">0\") + COUNTIF('Trade Log'!Q:Q,\"<0\")), 0)" };
  wsDash.getCell('B9').font = fontValue;
  wsDash.getCell('B9').fill = fillCard;
  wsDash.getCell('B9').numFmt = '0.0%';

  // KPI 3: Total Trades
  wsDash.getCell('B11').value = 'TOTAL TRADES';
  wsDash.getCell('B11').font = fontLabel;
  wsDash.getCell('B11').fill = fillCard;
  wsDash.getCell('B12').value = { formula: "COUNTA('Trade Log'!D:D)-1" };
  wsDash.getCell('B12').font = fontValue;
  wsDash.getCell('B12').fill = fillCard;
  wsDash.getCell('B12').numFmt = '#,##0';

  // KPI 4: Profit Factor
  wsDash.getCell('B14').value = 'PROFIT FACTOR';
  wsDash.getCell('B14').font = fontLabel;
  wsDash.getCell('B14').fill = fillCard;
  wsDash.getCell('B15').value = { formula: "IF(SUMIF('Trade Log'!Q:Q,\"<0\")<>0, ABS(SUMIF('Trade Log'!Q:Q,\">0\") / SUMIF('Trade Log'!Q:Q,\"<0\")), SUMIF('Trade Log'!Q:Q,\">0\"))" };
  wsDash.getCell('B15').font = fontValue;
  wsDash.getCell('B15').fill = fillCard;
  wsDash.getCell('B15').numFmt = '0.00';

  // KPI 5: Avg R:R Ratio
  wsDash.getCell('B17').value = 'AVG RISK-REWARD RATIO';
  wsDash.getCell('B17').font = fontLabel;
  wsDash.getCell('B17').fill = fillCard;
  wsDash.getCell('B18').value = { formula: "AVERAGE('Trade Log'!O:O)" };
  wsDash.getCell('B18').font = fontValue;
  wsDash.getCell('B18').fill = fillCard;
  wsDash.getCell('B18').numFmt = '0.00';

  // Apply borders to vertical KPIs
  const kpiCells = ['B5', 'B6', 'B8', 'B9', 'B11', 'B12', 'B14', 'B15', 'B17', 'B18'];
  kpiCells.forEach(coord => {
    wsDash.getCell(coord).border = thinBorder;
    wsDash.getCell(coord).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Emotional Statistics audit next to the side column
  wsDash.getCell('E5').value = 'PSYCHOLOGICAL PERFORMANCE BREAKDOWN';
  wsDash.getCell('E5').font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '1E293B' } };
  
  wsDash.getCell('E7').value = 'Pre-Trade Emotion';
  wsDash.getCell('F7').value = 'Trades Count';
  wsDash.getCell('G7').value = 'Win Rate';
  wsDash.getCell('H7').value = 'Total P&L';

  const fillLogHdr = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
  ['E', 'F', 'G', 'H'].forEach(col => {
    const cell = wsDash.getCell(`${col}7`);
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = fillLogHdr;
    cell.alignment = { horizontal: 'center' };
  });

  const emotionsList = ['Calm', 'FOMO', 'Greed', 'Fear', 'Stressed', 'Neutral'];
  emotionsList.forEach((emo, index) => {
    const r = index + 8;
    wsDash.getCell(`E${r}`).value = emo;
    wsDash.getCell(`E${r}`).font = { name: 'Segoe UI', size: 10 };

    wsDash.getCell(`F${r}`).value = { formula: `COUNTIF('Trade Log'!R:R, "${emo}")` };
    wsDash.getCell(`F${r}`).font = { name: 'Segoe UI', size: 10 };
    wsDash.getCell(`F${r}`).numFmt = '#,##0';

    wsDash.getCell(`G${r}`).value = { formula: `IF(F${r}>0, COUNTIFS('Trade Log'!R:R, "${emo}", 'Trade Log'!Q:Q, ">0") / F${r}, 0)` };
    wsDash.getCell(`G${r}`).font = { name: 'Segoe UI', size: 10 };
    wsDash.getCell(`G${r}`).numFmt = '0.0%';

    wsDash.getCell(`H${r}`).value = { formula: `SUMIF('Trade Log'!R:R, "${emo}", 'Trade Log'!Q:Q)` };
    wsDash.getCell(`H${r}`).font = { name: 'Segoe UI', size: 10, bold: true };
    wsDash.getCell(`H${r}`).numFmt = '$#,##0.00;($#,##0.00);"-"';
  });


  // -------------------------------------------------------------
  // SHEET 3: TRADE LOG
  // -------------------------------------------------------------
  const wsLog = workbook.addWorksheet('Trade Log', {
    views: [{ showGridLines: true }]
  });

  const headers = [
    "Entry Date", "Exit Date", "Asset Class", "Ticker", "Direction", "Option Strategy", 
    "Strike Price(s)", "Expiry Date", "Days in Trade", "Days to Expiry", "Quantity", 
    "Entry Price", "Stop Loss", "Exit Price", "Risk-Reward Ratio", "Fees & Comm.", "Net P&L", "Emotion Pre", "Emotion Post", "Setup Reason", "Notes"
  ];

  // Shaded Header Color Groups for stunning modern look
  const fillGroup1 = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3F51B5' } }; // Deep Indigo (A-H)
  const fillGroup2 = { type: 'pattern', pattern: 'solid', fgColor: { argb: '009688' } }; // Deep Teal (I-J)
  const fillGroup3 = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0288D1' } }; // Light Blue (K-N)
  const fillGroup4 = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E7D32' } }; // Dark Green (O-Q)
  const fillGroup5 = { type: 'pattern', pattern: 'solid', fgColor: { argb: '9C27B0' } }; // Rich Purple (R-U)

  headers.forEach((h, idx) => {
    const cell = wsLog.getCell(1, idx + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    
    // Assign header coloring based on groups
    const colNum = idx + 1;
    if (colNum <= 8) cell.fill = fillGroup1;
    else if (colNum <= 10) cell.fill = fillGroup2;
    else if (colNum <= 14) cell.fill = fillGroup3;
    else if (colNum <= 17) cell.fill = fillGroup4;
    else cell.fill = fillGroup5;

    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  wsLog.getRow(1).height = 28;

  // Let's set seed trade entry/exit dates relative to current Year and Month dynamically!
  const today = new Date();
  const yr = today.getFullYear();
  const mo = String(today.getMonth() + 1).padStart(2, '0');
  
  const seedRows = [
    [new Date(`${yr}-${mo}-10T10:30:00`), new Date(`${yr}-${mo}-15T16:00:00`), "Stock", "AAPL", "Buy/Long", "N/A", "", "", { formula: `=IF(OR(A2="", B2=""), "", INT(B2-A2))` }, { formula: `=IF(OR(A2="", H2=""), "", INT(H2-A2))` }, 100, 172.50, 170.00, 178.20, { formula: `=IF(OR(L2="", N2="", M2="", M2=L2), "", ROUND(ABS(N2-L2)/ABS(L2-M2), 2))` }, { formula: `=IF(C2="Stock", Settings!$C$4 * K2, IF(C2="Option", Settings!$C$5 * K2, 0))` }, { formula: `=IF(E2="Buy/Long", (N2-L2)*K2-P2, (L2-N2)*K2-P2)` }, "Calm", "Calm", "Breakout", "Perfect textbook breakout of the 50 DMA."],
    [new Date(`${yr}-${mo}-12T14:15:00`), new Date(`${yr}-${mo}-19T10:00:00`), "Option", "TSLA", "Buy/Long", "Single Option", "220 Call", new Date(`${yr}-${mo}-29T00:00:00`), { formula: `=IF(OR(A3="", B3=""), "", INT(B3-A3))` }, { formula: `=IF(OR(A3="", H3=""), "", INT(H3-A3))` }, 5, 4.50, 3.50, 6.20, { formula: `=IF(OR(L3="", N3="", M3="", M3=L3), "", ROUND(ABS(N3-L3)/ABS(L3-M3), 2))` }, { formula: `=IF(C3="Stock", Settings!$C$4 * K3, IF(C3="Option", Settings!$C$5 * K3, 0))` }, { formula: `=IF(E3="Buy/Long", (N3-L3)*K3*100-P3, (L3-N3)*K3*100-P3)` }, "FOMO", "Greed", "Trend Following", "Surged up. Chased slightly due to FOMO."],
    [new Date(`${yr}-${mo}-14T09:50:00`), new Date(`${yr}-${mo}-28T15:30:00`), "Option", "SPY", "Sell/Short", "Credit Spread", "510/505 Put Spread", new Date(`${yr}-${mo}-29T00:00:00`), { formula: `=IF(OR(A4="", B4=""), "", INT(B4-A4))` }, { formula: `=IF(OR(A4="", H4=""), "", INT(H4-A4))` }, 10, 1.20, 1.80, 0.30, { formula: `=IF(OR(L4="", N4="", M4="", M4=L4), "", ROUND(ABS(N4-L4)/ABS(L4-M4), 2))` }, { formula: `=IF(C4="Stock", Settings!$C$4 * K4, IF(C4="Option", Settings!$C$5 * K4, 0))` }, { formula: `=IF(E4="Buy/Long", (N4-L4)*K4*100-P4, (L4-N4)*K4*100-P4)` }, "Calm", "Calm", "Support/Resistance", "Sold put credit spread at solid horizontal support. Worked perfectly."],
    [new Date(`${yr}-${mo}-18T11:30:00`), new Date(`${yr}-${mo}-22T12:00:00`), "Option", "MSFT", "Buy/Long", "Debit Spread", "420/425 Call Spread", new Date(`${yr}-${mo}-29T00:00:00`), { formula: `=IF(OR(A5="", B5=""), "", INT(B5-A5))` }, { formula: `=IF(OR(A5="", H5=""), "", INT(H5-A5))` }, 4, 2.10, 1.50, 3.40, { formula: `=IF(OR(L5="", N5="", M5="", M5=L5), "", ROUND(ABS(N5-L5)/ABS(L5-M5), 2))` }, { formula: `=IF(C5="Stock", Settings!$C$4 * K5, IF(C5="Option", Settings!$C$5 * K5, 0))` }, { formula: `=IF(E5="Buy/Long", (N5-L5)*K5*100-P5, (L5-N5)*K5*100-P5)` }, "Calm", "Stressed", "Trend Following", "Long term call debit spread capturing upward continuation."],
    [new Date(`${yr}-${mo}-20T13:20:00`), new Date(`${yr}-${mo}-23T15:00:00`), "Option", "NVDA", "Buy/Long", "Calendar Spread", "920 Call", new Date(`${yr}-${mo}-29T00:00:00`), { formula: `=IF(OR(A6="", B6=""), "", INT(B6-A6))` }, { formula: `=IF(OR(A6="", H6=""), "", INT(H6-A6))` }, 2, 4.80, 5.50, 2.10, { formula: `=IF(OR(L6="", N6="", M6="", M6=L6), "", ROUND(ABS(N6-L6)/ABS(L6-M6), 2))` }, { formula: `=IF(C6="Stock", Settings!$C$4 * K6, IF(C6="Option", Settings!$C$5 * K6, 0))` }, { formula: `=IF(E6="Buy/Long", (N6-L6)*K6*100-P6, (L6-N6)*K6*100-P6)` }, "Stressed", "Calm", "News/Catalyst", "Traded pre-earnings calendar spread. Implied volatility crush arbitrage caused a solid loss."],
    [new Date(`${yr}-${mo}-22T15:40:00`), new Date(`${yr}-${mo}-23T09:30:00`), "Stock", "AMD", "Buy/Long", "N/A", "", "", { formula: `=IF(OR(A7="", B7=""), "", INT(B7-A7))` }, { formula: `=IF(OR(A7="", H7=""), "", INT(H7-A7))` }, 50, 165.00, 170.00, 158.50, { formula: `=IF(OR(L7="", N7="", M7="", M7=L7), "", ROUND(ABS(N7-L7)/ABS(L7-M7), 2))` }, { formula: `=IF(C7="Stock", Settings!$C$4 * K7, IF(C7="Option", Settings!$C$5 * K7, 0))` }, { formula: `=IF(E7="Buy/Long", (N7-L7)*K7-P7, (L7-N7)*K7-P7)` }, "Fear", "Stressed", "FOMO (No Setup)", "Traded without clear setup feeling extremely anxious. Stop hit quickly causing solid loss."]
  ];

  seedRows.forEach((row, rowIdx) => {
    const curRowIdx = rowIdx + 2;
    row.forEach((val, colIdx) => {
      const cell = wsLog.getCell(curRowIdx, colIdx + 1);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 10 };

      const colNum = colIdx + 1;
      
      // Date formatting for Columns A, B, and H
      if (val instanceof Date) {
        if (colNum === 8) {
          cell.numFmt = 'yyyy-mm-dd';
        } else {
          cell.numFmt = 'yyyy-mm-dd hh:mm';
        }
      }

      if ([11, 12, 13, 14].includes(colNum)) {
        if (typeof val === 'number') {
          cell.value = val;
        }
      }

      if ([12, 13, 14, 16, 17].includes(colNum)) {
        cell.numFmt = '$#,##0.00;($#,##0.00);"-"';
      } else if (colNum === 11) {
        cell.numFmt = '#,##0';
      } else if ([9, 10, 15].includes(colNum)) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'center' };
      }
    });
  });

  // Dropdowns constraints
  const validateAsset = { type: 'list', allowBlank: true, formulae: ['"Stock,Option"'] };
  const validateAction = { type: 'list', allowBlank: true, formulae: ['"Buy/Long,Sell/Short"'] };
  const validateStrategy = { type: 'list', allowBlank: true, formulae: ['"N/A,Single Option,Credit Spread,Debit Spread,Calendar Spread,Diagonal Spread,Iron Condor,Covered Call,Cash Secured Put"'] };
  const validateEmotion = { type: 'list', allowBlank: true, formulae: ['"Calm,FOMO,Greed,Fear,Stressed,Neutral"'] };

  for (let r = 2; r <= 100; r++) {
    wsLog.getCell(r, 3).dataValidation = validateAsset;
    wsLog.getCell(r, 5).dataValidation = validateAction;
    wsLog.getCell(r, 6).dataValidation = validateStrategy;
    wsLog.getCell(r, 16).dataValidation = validateEmotion;
    wsLog.getCell(r, 17).dataValidation = validateEmotion;

    if (r > 7) {
      wsLog.getCell(r, 9).value = { formula: `=IF(OR(A${r}="", B${r}=""), "", INT(B${r}-A${r}))` };
      wsLog.getCell(r, 10).value = { formula: `=IF(OR(A${r}="", H${r}=""), "", INT(H${r}-A${r}))` };
      wsLog.getCell(r, 15).value = { formula: `=IF(OR(L${r}="", N${r}="", M${r}="", M${r}=L${r}), "", ROUND(ABS(N${r}-L${r})/ABS(L${r}-M${r}), 2))` };
      wsLog.getCell(r, 16).value = { formula: `=IF(C${r}="Stock", Settings!$C$4 * K${r}, IF(C${r}="Option", Settings!$C$5 * K${r}, 0))` };
      wsLog.getCell(r, 17).value = { formula: `=IF(C${r}="Stock", IF(E${r}="Buy/Long", (N${r}-L${r})*K${r}-P${r}, (L${r}-N${r})*K${r}-P${r}), IF(C${r}="Option", IF(E${r}="Buy/Long", (N${r}-L${r})*K${r}*100-P${r}, (L${r}-N${r})*K${r}*100-P${r}), ""))` };
      
      wsLog.getCell(r, 9).numFmt = '#,##0';
      wsLog.getCell(r, 10).numFmt = '#,##0';
      wsLog.getCell(r, 15).numFmt = '#,##0.00';
      wsLog.getCell(r, 16).numFmt = '$#,##0.00';
      wsLog.getCell(r, 17).numFmt = '$#,##0.00;($#,##0.00);"-"';
      
      wsLog.getCell(r, 9).alignment = { horizontal: 'center' };
      wsLog.getCell(r, 10).alignment = { horizontal: 'center' };
      wsLog.getCell(r, 15).alignment = { horizontal: 'center' };
    }
  }


  // -------------------------------------------------------------
  // SHEET 4: CALENDAR VIEW (Fully Automated, Dynamic Month & Year)
  // -------------------------------------------------------------
  const wsCal = workbook.addWorksheet('Calendar View', {
    views: [{ showGridLines: true }]
  });

  // Dynamic header based on today's local Month & Year!
  wsCal.getCell('B2').value = { formula: '="DAILY TRADING P&L CALENDAR - " & TEXT(TODAY(), "MMMM YYYY")' };
  wsCal.getCell('B2').font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: '1E293B' } };
  
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  weekdays.forEach((day, idx) => {
    const cell = wsCal.getCell(4, idx + 2); // Start from B4
    cell.value = day;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = fillLogHdr;
    cell.alignment = { horizontal: 'center' };
  });

  // Helper hidden/styled values for dynamic calendar math
  // We determine what date the 1st of the current month falls on, and map the starting Sunday date of week 1 in cell B5!
  // Cell B5: Sunday of Week 1
  wsCal.getCell('B5').value = { formula: '=DATE(YEAR(TODAY()), MONTH(TODAY()), 1) - WEEKDAY(DATE(YEAR(TODAY()), MONTH(TODAY()), 1)) + 1' };

  const fillDayNum = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  const fillDayPnL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };

  // Generate 5 weeks grid dynamically!
  for (let w = 0; w < 5; w++) {
    const rNum = 5 + (w * 2);
    const rPnL = rNum + 1;

    wsCal.getRow(rNum).height = 18;
    wsCal.getRow(rPnL).height = 24;

    for (let d = 0; d < 7; d++) {
      const colNum = d + 2; // Column B to H
      const cellNum = wsCal.getCell(rNum, colNum);
      const cellPnL = wsCal.getCell(rPnL, colNum);

      // Formulas to dynamically increment calendar dates sequentially
      if (w > 0 || d > 0) {
        // Increment date from previous cell
        if (d === 0) {
          // It is a Sunday: link back to the Saturday of the previous row (Column H)
          const prevSatRow = rNum - 2;
          cellNum.value = { formula: `=H${prevSatRow}+1` };
        } else {
          // Increment from left cell
          const prevColLetter = getColLetter(colNum - 1);
          cellNum.value = { formula: `=${prevColLetter}${rNum}+1` };
        }
      }

      cellNum.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '475569' } };
      cellNum.fill = fillDayNum;
      cellNum.border = thinBorder;
      // FORMAT cell to display only day number 'd'!
      cellNum.numFmt = 'd';
      cellNum.alignment = { horizontal: 'left' };

      // Dynamic formula summing net P&L on that exact date!
      // Format: =SUMIFS('Trade Log'!Q:Q, 'Trade Log'!A:A, ">="&B5, 'Trade Log'!A:A, "<"&(B5+1))
      const numCellRef = `${getColLetter(colNum)}${rNum}`;
      cellPnL.value = { formula: `=SUMIFS('Trade Log'!Q:Q, 'Trade Log'!A:A, ">="&${numCellRef}, 'Trade Log'!A:A, "<"&(${numCellRef}+1))` };
      cellPnL.font = { name: 'Segoe UI', size: 10, bold: true };
      cellPnL.fill = fillDayPnL;
      cellPnL.border = thinBorder;
      cellPnL.numFmt = '$#,##0;($#,##0);"-"';
      cellPnL.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }


  // Add Monthly Total P&L Card on the Calendar Sheet (Sum of B6:H6, B8:H8, B10:H10, B12:H12, B14:H14)
  wsCal.getCell('I4').value = 'MONTH TOTAL P&L';
  wsCal.getCell('I4').font = fontLabel;
  wsCal.getCell('I4').fill = fillCard;
  wsCal.getCell('I4').border = thinBorder;
  wsCal.getCell('I4').alignment = { horizontal: 'center', vertical: 'middle' };

  wsCal.getCell('I5').value = { formula: "=SUM(B6:H6, B8:H8, B10:H10, B12:H12, B14:H14)" };
  wsCal.getCell('I5').font = fontValueGreen;
  wsCal.getCell('I5').fill = fillCard;
  wsCal.getCell('I5').border = thinBorder;
  wsCal.getCell('I5').alignment = { horizontal: 'center', vertical: 'middle' };
  wsCal.getCell('I5').numFmt = '$#,##0.00;($#,##0.00);"-"';

  // -------------------------------------------------------------
  // SHEET 5: YEARLY REVIEW (Dynamic current year scorecard cards)
  // -------------------------------------------------------------
  const wsYear = workbook.addWorksheet('Yearly Review', {
    views: [{ showGridLines: true }]
  });

  // Dynamic Header showing current year!
  wsYear.getCell('B2').value = { formula: '="YEARLY PERFORMANCE REVIEW - " & YEAR(TODAY())' };
  wsYear.getCell('B2').font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: '1E293B' } };

  const months = [
    { name: "January", mNum: 1 },
    { name: "February", mNum: 2 },
    { name: "March", mNum: 3 },
    { name: "April", mNum: 4 },
    { name: "May", mNum: 5 },
    { name: "June", mNum: 6 },
    { name: "July", mNum: 7 },
    { name: "August", mNum: 8 },
    { name: "September", mNum: 9 },
    { name: "October", mNum: 10 },
    { name: "November", mNum: 11 },
    { name: "December", mNum: 12 }
  ];

  months.forEach((m, idx) => {
    const gridCol = (idx % 4) * 2 + 2; // B, D, F, H
    const gridRow = Math.floor(idx / 4) * 3 + 5; // Rows 5, 8, 11

    const cellTitle = wsYear.getCell(gridRow, gridCol);
    const cellValue = wsYear.getCell(gridRow + 1, gridCol);

    cellTitle.value = m.name.toUpperCase();
    cellTitle.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    cellTitle.fill = fillLogHdr;
    cellTitle.border = thinBorder;
    cellTitle.alignment = { horizontal: 'center' };

    // Dynamic SUMIFS formulas grouping by current Year
    const nextM = m.mNum + 1;
    const nextYearFormula = nextM > 12 ? "YEAR(TODAY())+1" : "YEAR(TODAY())";
    const nextMonthNum = nextM > 12 ? 1 : nextM;

    cellValue.value = { formula: `=SUMIFS('Trade Log'!Q:Q, 'Trade Log'!A:A, ">="&DATE(YEAR(TODAY()),${m.mNum},1), 'Trade Log'!A:A, "<"&DATE(${nextYearFormula},${nextMonthNum},1))` };
    cellValue.font = { name: 'Segoe UI', size: 12, bold: true };
    cellValue.fill = fillDayPnL;
    cellValue.border = thinBorder;
    cellValue.numFmt = '$#,##0.00;($#,##0.00);"-"';
    cellValue.alignment = { horizontal: 'center', vertical: 'middle' };

    wsYear.getRow(gridRow).height = 18;
    wsYear.getRow(gridRow + 1).height = 28;
  });

  // Add Yearly Total P&L Card on the Yearly Review Sheet (Sum of B6, D6, F6, H6, B9, D9, F9, H9, B12, D12, F12, H12)
  wsYear.getCell('J5').value = 'YEAR TOTAL P&L';
  wsYear.getCell('J5').font = fontLabel;
  wsYear.getCell('J5').fill = fillCard;
  wsYear.getCell('J5').border = thinBorder;
  wsYear.getCell('J5').alignment = { horizontal: 'center', vertical: 'middle' };

  wsYear.getCell('J6').value = { formula: "=SUM(B6, D6, F6, H6, B9, D9, F9, H9, B12, D12, F12, H12)" };
  wsYear.getCell('J6').font = fontValueGreen;
  wsYear.getCell('J6').fill = fillCard;
  wsYear.getCell('J6').border = thinBorder;
  wsYear.getCell('J6').alignment = { horizontal: 'center', vertical: 'middle' };
  wsYear.getCell('J6').numFmt = '$#,##0.00;($#,##0.00);"-"';

  // Apply Conditional Formatting for Profit/Loss on Calendar View Sheet
  const calPnLRows = [6, 8, 10, 12, 14];
  calPnLRows.forEach(r => {
    wsCal.addConditionalFormatting({
      ref: `B${r}:H${r}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: ['0'],
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD1FAE5' }, fgColor: { argb: 'FFD1FAE5' } }, // Soft green
            font: { color: { argb: 'FF000000' }, bold: true } // Black text
          }
        },
        {
          type: 'cellIs',
          operator: 'lessThan',
          formulae: ['0'],
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF991B1B' }, fgColor: { argb: 'FF991B1B' } }, // Dark red background
            font: { color: { argb: 'FFFFFFFF' }, bold: true } // Bold white text
          }
        }
      ]
    });
  });

  // Apply Conditional Formatting for Profit/Loss on Yearly Review Sheet
  const yearValRows = [6, 9, 12];
  yearValRows.forEach(r => {
    wsYear.addConditionalFormatting({
      ref: `B${r}:H${r}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: ['0'],
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD1FAE5' }, fgColor: { argb: 'FFD1FAE5' } }, // Soft green
            font: { color: { argb: 'FF000000' }, bold: true } // Black text
          }
        },
        {
          type: 'cellIs',
          operator: 'lessThan',
          formulae: ['0'],
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF991B1B' }, fgColor: { argb: 'FF991B1B' } }, // Dark red background
            font: { color: { argb: 'FFFFFFFF' }, bold: true } // Bold white text
          }
        }
      ]
    });
  });

  // Adjust Columns Dimensions dynamically
  [wsSettings, wsDash, wsLog, wsCal, wsYear].forEach(ws => {
    ws.columns.forEach(col => {
      let maxLen = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value.formula || cell.value) : '';
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      col.width = Math.max(maxLen + 4, 13);
    });
  });

  // Specifically widen Dashboard columns to prevent numeric display bugs
  wsDash.getColumn('B').width = 25;
  wsDash.getColumn('E').width = 20;
  wsDash.getColumn('F').width = 15;
  wsDash.getColumn('G').width = 15;
  wsDash.getColumn('H').width = 20;

  // Widen calendar columns
  for (let c = 2; c <= 8; c++) {
    wsCal.getColumn(c).width = 15;
  }

  // Widen Yearly scorecard columns
  for (let c = 2; c <= 9; c++) {
    wsYear.getColumn(c).width = 16;
  }
  wsYear.getColumn('J').width = 20;
  wsCal.getColumn('I').width = 20;

  await workbook.xlsx.writeFile(path.join(__dirname, 'Trading_Journal_v11.xlsx'));
  console.log("Spreadsheet successfully re-compiled as Trading_Journal_v11.xlsx");
}

createTradingJournal().catch(console.error);
