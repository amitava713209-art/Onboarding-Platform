/**
 * Google Apps Script - LastMile Cloud Registry & WhatsApp Dispatcher
 * 
 * INSTRUCTIONS:
 * 1. Create a new Google Sheet in your Google Drive.
 * 2. In the top menu, go to Extensions -> Apps Script.
 * 3. Replace all default code in the editor with this script.
 * 4. Configure your optional Twilio WhatsApp API settings below.
 * 5. Click the "Save" (disk icon) button.
 * 6. Click the "Deploy" dropdown -> "New deployment".
 * 7. Choose type "Web App".
 * 8. Set "Description" to "LastMile Onboarding API".
 * 9. Set "Execute as" to "Me (your-email@gmail.com)".
 * 10. Set "Who has access" to "Anyone" (crucial so your HTML form can post data).
 * 11. Click "Deploy", authorize permissions, and COPY the Web App URL.
 * 12. Paste this URL into your front-end "app.js" under "GOOGLE_SCRIPT_URL".
 */

// ==========================================
// CONFIGURATION (AUTOMATED WHATSAPP SENDERS)
// ==========================================
// You can configure one of the three following methods to send automated background WhatsApp messages.
// If multiple methods are configured, the system will prioritize them in this order: Green API > Ultramsg > Twilio.
// Leave all variables blank if you prefer to only use the instant client-side "WhatsApp Receipt" button in the browser (100% free & zero-setup).

// METHOD 1: GREEN API (Recommended - 100% Free Developer Tier, scan QR code using your own WhatsApp number, no templates or sandbox restrictions)
// Sign up at https://green-api.com to get your Instance ID and Token.
var GREEN_INSTANCE_ID = "";  // e.g. "1101234567"
var GREEN_TOKEN = "";        // e.g. "d7512a84b5c6d7e8f9..."

// METHOD 2: ULTRAMSG (Scan QR code using your own WhatsApp, paid subscription after free trial, no templates or sandbox restrictions)
// Sign up at https://ultramsg.com to get your Instance ID and Token.
var ULTRAMSG_INSTANCE_ID = ""; // e.g. "instance12345"
var ULTRAMSG_TOKEN = "";       // e.g. "your_token_here"

// METHOD 3: TWILIO WHATSAPP BUSINESS API (Official Meta API, requires templates and paid upgraded account to send to arbitrary users)
// SECURITY BEST PRACTICE: Store your credentials in Google Apps Script -> Project Settings -> Script Properties
// instead of hardcoding them in source files pushed to GitHub.
var SCRIPT_PROPS = typeof PropertiesService !== "undefined" ? PropertiesService.getScriptProperties() : null;
var TWILIO_ACCOUNT_SID = SCRIPT_PROPS ? (SCRIPT_PROPS.getProperty("TWILIO_ACCOUNT_SID") || "") : "";
var TWILIO_AUTH_TOKEN = SCRIPT_PROPS ? (SCRIPT_PROPS.getProperty("TWILIO_AUTH_TOKEN") || "") : "";
var TWILIO_FROM_NUMBER = SCRIPT_PROPS ? (SCRIPT_PROPS.getProperty("TWILIO_FROM_NUMBER") || "whatsapp:+918040122660") : "whatsapp:+918040122660";

// ==========================================
// CORE API ROUTERS (doPost & doGet)
// ==========================================

/**
 * Handle incoming POST requests from the front-end onboarding HTML form
 */
function doPost(e) {
  var corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    // Parse incoming JSON payload
    var requestData = JSON.parse(e.postData.contents);
    
    // Open target spreadsheet (binds automatically to the spreadsheet container this script lives in)
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Onboarding");
    
    // Create the "Onboarding" tab if it does not exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet("Onboarding");
    }
    
    // Setup Header Row if sheet is fresh/empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp", 
        "Membership ID", 
        "Exhibitor Name", 
        "WhatsApp Phone", 
        "Age", 
        "Gender", 
        "Location / City", 
        "Full Address", 
        "Business Category", 
        "Brand or Company Name", 
        "Ready for Fairs Outside Kolkata?", 
        "Outstation Cities"
      ];
      sheet.appendRow(headers);
      
      // Style headers beautifully (Bold text, Dark Indigo background, White text)
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4f46e5");
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // Generate sequential Membership ID (Format: MEM-2026-XXXX)
    var lastRow = sheet.getLastRow();
    var nextSequenceNum = 1001; // Start sequence
    
    if (lastRow > 1) {
      var lastMemberId = sheet.getRange(lastRow, 2).getValue().toString(); // Read membership column
      if (lastMemberId.indexOf("MEM-2026-") === 0) {
        var lastNum = parseInt(lastMemberId.substring(9), 10);
        if (!isNaN(lastNum)) {
          nextSequenceNum = lastNum + 1;
        }
      }
    }
    var generatedId = "MEM-2026-" + nextSequenceNum;
    
    // Build row array
    var timestamp = new Date();
    var newRow = [
      timestamp,
      generatedId,
      requestData.fullName,
      requestData.phone,
      requestData.age,
      requestData.gender,
      requestData.location,
      requestData.address,
      requestData.businessNature,
      requestData.businessName,
      requestData.travelReady,
      requestData.outstationCities
    ];
    
    // Append records to sheet
    sheet.appendRow(newRow);
    
    // Auto-adjust column widths for premium dashboard readability
    for (var col = 1; col <= newRow.length; col++) {
      sheet.autoResizeColumn(col);
    }
    
    // Optional: Send background WhatsApp confirmation via selected API gateway
    var smsStatus = "not_configured";
    
    // Build the formatted WhatsApp message text
    var smsMessage = 
      "🌟 *WELCOME TO LASTMILE* 🌟\n\n" +
      "Dear " + requestData.fullName + ",\n" +
      "Your onboarding details are logged in the Central Registry!\n\n" +
      "🏷️ *Brand Name:* " + requestData.businessName + "\n" +
      "🆔 *Membership ID:* " + generatedId + "\n" +
      "💼 *Category:* " + requestData.businessNature + "\n\n" +
      "Your exhibitor credentials are under review. We look forward to seeing your brand represent at upcoming national exhibitions!\n\n" +
      "Warm Regards,\n" +
      "LastMile Guild Team";

    if (GREEN_INSTANCE_ID !== "" && GREEN_TOKEN !== "") {
      smsStatus = sendWhatsAppViaGreenApi(requestData.phone, smsMessage);
    } else if (ULTRAMSG_INSTANCE_ID !== "" && ULTRAMSG_TOKEN !== "") {
      smsStatus = sendWhatsAppViaUltramsg(requestData.phone, smsMessage);
    } else if (TWILIO_ACCOUNT_SID !== "" && TWILIO_AUTH_TOKEN !== "") {
      smsStatus = sendWhatsAppViaTwilio(
        requestData.phone, 
        requestData.fullName, 
        requestData.businessName, 
        generatedId, 
        requestData.businessNature
      );
    }
    
    // Return success response to frontend
    var responseOutput = {
      status: "success",
      membershipId: generatedId,
      message: "Exhibitor registered successfully",
      twilioStatus: smsStatus
    };
    
    return ContentService.createTextOutput(JSON.stringify(responseOutput))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    var errorOutput = {
      status: "error",
      message: error.toString()
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle OPTIONS preflight requests (handles CORS elegantly)
 */
function doOptions(e) {
  var output = ContentService.createTextOutput();
  return output.setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Helper: Sends automated WhatsApp acknowledgment via Twilio API
 */
function sendWhatsAppViaTwilio(recipientPhone, fullName, brandName, memberId, category) {
  try {
    // Format phone number (remove non-digits and add leading country code if not present)
    var cleanedPhone = recipientPhone.replace(/\D/g, "");
    
    // If number doesn't start with a country code (assuming India 91 if length is 10), append it
    if (cleanedPhone.length === 10) {
      cleanedPhone = "91" + cleanedPhone;
    }
    
    var twilioEndpoint = "https://api.twilio.com/2010-04-01/Accounts/" + TWILIO_ACCOUNT_SID + "/Messages.json";
    
    // Compose Message
    var smsMessage = 
      "🌟 *WELCOME TO LASTMILE* 🌟\n\n" +
      "Dear " + fullName + ",\n" +
      "Your onboarding details are logged in the Central Registry!\n\n" +
      "🏷️ *Brand Name:* " + brandName + "\n" +
      "🆔 *Membership ID:* " + memberId + "\n" +
      "💼 *Category:* " + category + "\n\n" +
      "Your exhibitor credentials are under review. We look forward to seeing your brand represent at upcoming national exhibitions!\n\n" +
      "Warm Regards,\n" +
      "LastMile Guild Team";
      
    var payload = {
      "To": "whatsapp:+" + cleanedPhone,
      "From": TWILIO_FROM_NUMBER,
      "Body": smsMessage
    };
    
    var options = {
      "method": "post",
      "headers": {
        "Authorization": "Basic " + Utilities.base64Encode(TWILIO_ACCOUNT_SID + ":" + TWILIO_AUTH_TOKEN)
      },
      "payload": payload,
      "muteHttpExceptions": true
    };
    
    var response = UrlFetchApp.fetch(twilioEndpoint, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode >= 200 && responseCode < 300) {
      return "sent";
    } else {
      Logger.log("Twilio error response: " + responseBody);
      return "failed_api: " + responseCode;
    }
  } catch (err) {
    Logger.log("Error dispatching WhatsApp via Twilio: " + err.toString());
    return "error: " + err.toString();
  }
}

/**
 * Helper: Sends automated WhatsApp acknowledgment via Green API (100% Free Developer Tier)
 */
function sendWhatsAppViaGreenApi(recipientPhone, messageText) {
  try {
    var cleanedPhone = recipientPhone.replace(/\D/g, "");
    if (cleanedPhone.length === 10) {
      cleanedPhone = "91" + cleanedPhone;
    }
    
    var url = "https://api.green-api.com/waInstance" + GREEN_INSTANCE_ID + "/sendMessage/" + GREEN_TOKEN;
    var payload = {
      "chatId": cleanedPhone + "@c.us",
      "message": messageText
    };
    
    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode >= 200 && responseCode < 300) {
      return "sent_green_api";
    } else {
      Logger.log("Green API error response: " + responseBody);
      return "failed_green_api: " + responseCode;
    }
  } catch (err) {
    Logger.log("Error dispatching WhatsApp via Green API: " + err.toString());
    return "error_green_api: " + err.toString();
  }
}

/**
 * Helper: Sends automated WhatsApp acknowledgment via Ultramsg Gateway
 */
function sendWhatsAppViaUltramsg(recipientPhone, messageText) {
  try {
    var cleanedPhone = recipientPhone.replace(/\D/g, "");
    if (cleanedPhone.length === 10) {
      cleanedPhone = "91" + cleanedPhone;
    }
    
    var url = "https://api.ultramsg.com/" + ULTRAMSG_INSTANCE_ID + "/messages/chat";
    var payload = {
      "token": ULTRAMSG_TOKEN,
      "to": "+" + cleanedPhone,
      "body": messageText
    };
    
    var options = {
      "method": "post",
      "payload": payload,
      "muteHttpExceptions": true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode >= 200 && responseCode < 300) {
      return "sent_ultramsg";
    } else {
      Logger.log("Ultramsg error response: " + responseBody);
      return "failed_ultramsg: " + responseCode;
    }
  } catch (err) {
    Logger.log("Error dispatching WhatsApp via Ultramsg: " + err.toString());
    return "error_ultramsg: " + err.toString();
  }
}
