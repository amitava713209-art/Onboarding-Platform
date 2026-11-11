# LastMile Onboarding & Membership Platform

Welcome to **LastMile**, a high-end, responsive, and ultra-premium business onboarding portal. This platform is designed specifically for exhibitors to register their organizational details, automatically log data into a cloud-based Google Sheets database (stored securely in Google Drive), and receive immediate membership numbers along with an automated WhatsApp acknowledgment message.

---

## 🎨 Architectural Overview

```
 ┌─────────────────┐             ┌─────────────────────┐             ┌─────────────────┐
 │   HTML5 Form    │  POST Fetch   │  Google Apps Script │  Append Row │  Google Sheets  │
 │  (Client View)  ├──────────────>│  (Serverless API)   ├────────────>│ (Google Drive)  │
 └────────┬────────┘  (JSON Data)  └──────────┬──────────┘             └─────────────────┘
          │                                   │
          │ User Triggered                    │ Auto Background
          │ (Click-to-Chat)                   │ (Twilio API Integration)
          ▼                                   ▼
 ┌─────────────────┐             ┌─────────────────────┐
 │    WhatsApp     │             │    WhatsApp API     │
 │ (Member Device) │             │  (Automated Alert)  │
 └─────────────────┘             └─────────────────────┘
```

The system employs a dual-channel design to ensure maximum reliability and ease of deployment:
1. **Cloud Database (Google Drive & Sheets):** A lightweight serverless **Google Apps Script Web App** acts as the backend API. It handles incoming requests, formats columns, automatically increments sequential Membership IDs (e.g. `MEM-2026-1001`), and writes records.
2. **Automated WhatsApp Delivery:** Supported via two parallel mechanisms:
   - **Background Dispatch (Zero-User Interaction):** Sends a silent out-of-band notification directly to the registered phone number using a Twilio WhatsApp API webhook inside the Apps Script.
   - **Client-Side Trigger (Instant & Free):** A stunning glassmorphic ticket screen presents a primary "Get WhatsApp Receipt" button. On click, it triggers a custom prefilled WhatsApp Click-to-Chat URL (`wa.me`) carrying their custom membership card details, supporting both mobile app launch and web redirects.

## 💾 Where is the data saved & How does the admin see it?

All the onboarding and membership data collected via the onboarding form is saved directly in real-time to a **Google Sheet** in the admin's **Google Drive**.

### How to Access the Data:
1. **Locate the File:** Go to your [Google Drive](https://drive.google.com) and open the spreadsheet you created during setup (e.g., `Exhibitor Registry`).
2. **View the Sheet:** Inside the spreadsheet, you will find a tab named **`Onboarding`** (created automatically by the system on first submission).
3. **Data Organization:** Every time a user successfully finishes onboarding, a new row is appended in real-time. The sheet contains the following columns:
   - **Timestamp:** The exact date and time of registration.
   - **Membership ID:** The unique sequential ID generated automatically (e.g., `MEM-2026-1001`).
   - **Exhibitor Name:** Full name of the user.
   - **WhatsApp Phone:** User's contact number.
   - **Age & Gender:** Registered demographics.
   - **Location / City & Full Address:** Registered geographical details (validated with 5 and 10 character minimums respectively).
   - **Business Category:** Selected business nature (or custom value if "Other" was specified).
   - **Brand or Company Name:** Name of the company.
   - **Ready for Fairs Outside Kolkata & Outstation Cities:** Outstation travel preferences.
4. **Dashboard Features:** The header row is automatically styled with an elegant dark indigo theme (`#4f46e5`) and frozen at the top. The column widths are auto-resized dynamically upon new entries for premium readability.

---

## 🛠️ Step-by-Step Deployment Guide

Follow these simple steps to go live in under 5 minutes:

### Phase 1: Set up the Cloud Database (Google Sheets)

1. Open your **Google Drive** and create a new **Google Sheet**. Name it something like `Exhibitor Registry`.
2. In the top menu bar of the sheet, click **Extensions** -> **Apps Script**.
3. Clear out any default placeholder code in the script editor.
4. Open the [GoogleAppsScript.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/onboarding-platform/GoogleAppsScript.js) file from this project, copy its entire contents, and paste it into the Google Apps Script editor.
5. *(Optional)* If you want fully automated background WhatsApp messages to be sent to registrants on form completion (without needing them to click a button), choose and configure one of these three options in the configuration variables at the top of the Apps Script:
   - **Method 1: Green API (Highly Recommended & 100% Free Developer Tier)**
     1. Go to [green-api.com](https://green-api.com) and sign up for a free developer account.
     2. Scan the provided QR code using your phone's WhatsApp app (in Settings > Linked Devices, just like WhatsApp Web).
     3. Copy your **Instance ID** and **Token** and paste them into `GREEN_INSTANCE_ID` and `GREEN_TOKEN`.
     4. This allows sending custom templates and freeform texts automatically to any number!
   - **Method 2: Ultramsg (QR-code scan, paid after a short free trial)**
     1. Sign up at [ultramsg.com](https://ultramsg.com).
     2. Scan the QR code using your WhatsApp app.
     3. Copy your Instance ID and Token and paste them into `ULTRAMSG_INSTANCE_ID` and `ULTRAMSG_TOKEN`.
   - **Method 3: Twilio API (Official Meta API, Paid & strictly template-based)**
     1. Enter `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`.
     2. *Note: With Twilio Sandbox (Trial), users will NOT receive the message unless they first send a manual "join <sandbox-keyword>" text to your sandbox number. To bypass this, you must upgrade to a paid Twilio Production account and request pre-approved Meta message templates.*
   *If you leave all configuration variables blank, the system will log to the Google Sheet and frontend success pass flawlessly, and users can trigger the WhatsApp alert instantly by clicking the 'Get WhatsApp Receipt' button on their screen.*
6. Click the **Save Project** (floppy disk) icon at the top of the editor.

---

### Phase 2: Deploy the Script as a Web App

1. In the top-right corner of the Apps Script dashboard, click the **Deploy** button and select **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web App**.
3. Configure the fields exactly as follows:
   - **Description:** `LastMile Onboarding Portal API`
   - **Execute as:** `Me (your-email@gmail.com)`
   - **Who has access:** `Anyone` *(This is mandatory so that the front-end web form can submit data).*
4. Click **Deploy**.
5. Google will ask you to authorize access. Click **Authorize access**, choose your Google account, click **Advanced** (at the bottom of the prompt), and then click **Go to Exhibitor Registry (unsafe)** to grant permissions.
6. Once the deployment finishes, copy the **Web app URL** generated under the "Web App" section. (It will look like `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Phase 3: Bind the Web Form to the API

1. Open the [app.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/onboarding-platform/app.js) file in your project folder.
2. Locate the `GOOGLE_SCRIPT_URL` variable at the top of the file:
   ```javascript
   const GOOGLE_SCRIPT_URL = ""; 
   ```
3. Paste your copied Google Web App URL inside the quotation marks:
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbXXXXXXXXXXXX/exec";
   ```
4. Locate the `ADMIN_WHATSAPP_NUMBER` variable and configure your preferred coordinator number:
   ```javascript
   const ADMIN_WHATSAPP_NUMBER = "918040122660"; // Pre-configured with your active number!
   ```
5. Save the file.

---

## ⚡ Running & Testing

1. Open the [index.html](file:///C:/Users/Admin/.gemini/antigravity/scratch/onboarding-platform/index.html) file directly in any modern web browser.
2. **Offline Sandboxed Mock Mode:** If you run the index file without configuring the `GOOGLE_SCRIPT_URL` in `app.js`, the platform intelligently falls back to an **offline preview mode**. The submission loader will spin for 2.5 seconds (simulating cloud sync latency) and then generate a mock membership ID, allowing you to test form steps, animations, and WhatsApp links instantly without a server!
3. **Live Sync Mode:** Once your script is configured, filling out the form will automatically:
   - Insert a row into the Google Sheet.
   - Set up custom columns, auto-resized widths, and dark-indigo styling on first run.
   - Return a custom formatted sequential member ID (e.g. `MEM-2026-1002`).
   - Trigger the automated WhatsApp notification!

---

## ✨ Features Checklist
- [x] **Premium UI/UX:** Stunning glassmorphism, responsive grid layout, dynamic interactive hover/checked cards, and floating input focus indicators.
- [x] **Step Stepper Wizard:** Fluid panel navigation with validation check points to prevent partial submissions.
- [x] **Dual-Mode WhatsApp:** Twilio-powered silent background alerts combined with dynamic `wa.me` customer click-to-chat triggers.
- [x] **Dynamic Cities Selection:** Outstation fair city checklist (Mumbai, Delhi, Bangalore, Pune) toggles visibility smoothly depending on whether the user is ready to travel.
- [x] **Robust Validations:** Regex phone filtering, strict 18-100 age limits, and custom selector validity markers.
