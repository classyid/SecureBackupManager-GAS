// Konfigurasi
var CONFIG = {
  spreadsheetId: '<ID-SPREADSHEET>',
  sheetName: '<SHEETNAME',
  logSheetName: '<NamaSheetLog>',
  telegramBotToken: '<ID-TOKEN-TELEGRAM>',
  telegramChatId: '<ID-CHAT-TELEGRAM>',
  accessPassword: '<PASSWORD>'  // Ganti dengan password yang aman
};

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('<TITLE-WEB>')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function checkPassword(password) {
  return password === CONFIG.accessPassword;
}

function getData() {
  var sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheetName);
  var data = sheet.getDataRange().getValues();
  
  // Mengoptimalkan pemrosesan data
  var processedData = data.map((row, index) => {
    if (index === 0) return row; // Mengembalikan header tanpa perubahan
    return [row[0], row[1], row[2] + ' MB', row[3]];
  });

  return processedData;
}

function getUniqueFolderPaths() {
  var sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheetName);
  var data = sheet.getDataRange().getValues();
  
  // Menggunakan Set untuk mendapatkan nilai unik
  var uniquePaths = new Set(data.slice(1).map(row => row[3]));
  return Array.from(uniquePaths);
}

function getDetails(rowData) {
  return {
    fileName: rowData[0],
    driveLink: rowData[1],
    fileSize: rowData[2],
    folderPath: rowData[3]
  };
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getMetadata() {
  var sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheetName);
  var totalFiles = sheet.getLastRow() - 1; // Exclude header row

  var now = new Date();
  var dateTime = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");

  var userIp = getIpAddress();

  return {
    totalFiles: totalFiles,
    dateTime: dateTime,
    userIp: userIp
  };
}

function getIpAddress() {
  var url = 'https://api.ipify.org';
  var options = {
    'method': 'GET',
    'muteHttpExceptions': true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      return response.getContentText();
    } else {
      console.error('Error fetching IP address. Response code:', response.getResponseCode());
      return 'Unknown';
    }
  } catch (e) {
    console.error('Error fetching IP address:', e);
    return 'Unknown';
  }
}

function logAccess(action, ipAddress) {
  var sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.logSheetName);
  var now = new Date();
  var dateTime = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  
  sheet.appendRow([dateTime, action, ipAddress]);
  
  // Kirim pesan ke Telegram
  sendTelegramMessage(`New access log <ID WEB>: ${dateTime}, Action: ${action}, IP: ${ipAddress}`);
}

function sendTelegramMessage(message) {
  var url = `https://api.telegram.org/bot${CONFIG.telegramBotToken}/sendMessage`;
  var payload = {
    'chat_id': CONFIG.telegramChatId,
    'text': message
  };
  var options = {
    'method': 'post',
    'payload': payload
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    console.error('Error sending Telegram message:', e);
  }
}
