# Google Apps Script Web App Setup

This guide explains how to set up automatic syncing of vendor bookings to Google Sheets using Google Apps Script Web App (simpler than the Google Sheets API).

## Overview

When a vendor signs up (creates a booking), the data is automatically sent to a Google Apps Script webhook, which then writes the data to the appropriate sheet tab (Food Trucks or General Vendor).

## Setup Instructions

### 1. Create Your Google Sheet

1. Create a new Google Sheet or use an existing one
2. Create two tabs:
   - **Food Trucks** (exact name)
   - **General Vendor** (exact name)

### 2. Set Up Headers

#### Food Trucks Tab Headers:
```
Event Name | Event Date | First Name | Last Name | Preferred Name | Pronouns | Vendor Email | Phone | Business Name | Instagram | Booth Slot | Cuisine Type | Food Items Sold | Setup Size (Truck Dimensions) | Price Range | Can Bring Own Quiet Generator | Social Media Consent | Photo Consent | Noise Sensitive | Sharing Booth | Booth Partner Instagram | Additional Notes | Stripe Payment ID | Stripe Checkout Session ID | Stripe Payment Intent ID | Is Paid | Timestamp
```

#### General Vendor Tab Headers:
```
Event Name | Event Date | First Name | Last Name | Preferred Name | Pronouns | Vendor Email | Phone | Business Name | Instagram | Booth Slot | Products Selling | Price Range | Can Bring Own Extension Cord | Social Media Consent | Photo Consent | Noise Sensitive | Sharing Booth | Booth Partner Instagram | Additional Notes | Stripe Payment ID | Stripe Checkout Session ID | Stripe Payment Intent ID | Is Paid | Timestamp
```

**Important:** Make sure the headers are in row 1 and match exactly (case-sensitive).

### 3. Create Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Copy the code from `GOOGLE_APPS_SCRIPT.js` in this repository
4. Paste it into the Apps Script editor
5. **Update the sheet names** if yours are different:
   ```javascript
   const FOOD_TRUCK_SHEET_NAME = 'Food Trucks';
   const GENERAL_VENDOR_SHEET_NAME = 'General Vendor';
   ```
6. Click **Save** (💾) and give your project a name (e.g., "Vendor Booking Webhook")

### 4. Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Fill in the deployment settings:
   - **Description:** "Vendor Booking Webhook" (optional)
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone (this allows your backend to call it)
5. Click **Deploy**
6. **Copy the Web App URL** - you'll need this for your backend configuration
7. Click **Done**

### 5. Authorize the Script

1. The first time you deploy, you'll need to authorize the script
2. Click **Authorize access**
3. Choose your Google account
4. Click **Advanced → Go to [Project Name] (unsafe)**
5. Click **Allow**

### 6. Configure Backend

Add the webhook URL to your `.env` file:

```bash
GOOGLE_APPS_SCRIPT_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**Important:** Use the `/exec` endpoint (not `/dev`), and make sure the URL is the full deployment URL.

### 7. Install Dependencies

The required package (`requests`) is already in `requirements.txt`. Install it:

```bash
pip install -r requirements.txt
```

Or if using Docker:
```bash
docker compose exec backend pip install -r requirements.txt
```

### 8. Restart Your Application

Restart your Django application to load the new configuration:

```bash
# If using Docker
docker compose restart backend

# If running locally
# Restart your Django development server
```

## How It Works

### Automatic Syncing

- **On Booking Creation**: When a vendor signs up, data is automatically sent to the Apps Script webhook
- **On Booking Update**: When payment status changes, updated data is sent (appended as new row)

### Data Flow

1. Vendor submits booking form
2. Django creates `GeneralVendorBooking` or `FoodTruckBooking` record
3. Django signal triggers
4. Backend sends POST request to Apps Script webhook with booking data
5. Apps Script receives data and appends to appropriate sheet tab
6. Data appears in your Google Sheet

### Sheet Organization

- **Food Truck bookings** → "Food Trucks" tab
- **General Vendor bookings** → "General Vendor" tab

The Apps Script automatically routes data to the correct tab based on the `vendor_type` field.

## Testing

### Test in Apps Script Editor

1. Open your Apps Script project
2. Click on the `testDoPost` function
3. Click **Run** (▶️)
4. Check your sheet - a test row should appear

### Test from Backend

1. Create a test booking through your application
2. Check the Google Sheet - a new row should appear in the appropriate tab
3. Check Django logs for any errors

## Troubleshooting

### "Apps Script disabled: GOOGLE_APPS_SCRIPT_WEBHOOK_URL not configured"
- Make sure you've set `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` in your `.env` file
- Restart your application after adding it

### "Sheet 'Food Trucks' not found"
- Check that your sheet tab names match exactly (case-sensitive)
- Update the sheet names in the Apps Script code if needed

### "Failed to sync booking: HTTP 401"
- Make sure you deployed with "Anyone" access
- Re-deploy the web app if you changed access settings

### "Failed to sync booking: HTTP 403"
- The script may need re-authorization
- Try running the script manually once in the Apps Script editor

### No data appearing in sheet
- Check Django logs for errors
- Verify the webhook URL is correct (should end with `/exec`)
- Test the Apps Script manually using `testDoPost`
- Check Apps Script execution logs: **Executions** in the Apps Script editor

### Data going to wrong tab
- Verify the `vendor_type` field is being sent correctly
- Check that the sheet names in Apps Script match your actual tab names

## Security Notes

- The webhook URL is public, but only accepts POST requests with valid booking data
- Consider adding a simple authentication token if needed (modify Apps Script to check for a token)
- The Apps Script runs with your Google account permissions
- Only authorized users (you) can modify the script

## Production Deployment

For production (e.g., Railway, Heroku):

1. Set `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` as an environment variable
2. Make sure the Apps Script is deployed with "Anyone" access
3. Test the webhook from production environment

Example for Railway:
```bash
railway variables set GOOGLE_APPS_SCRIPT_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Advanced: Adding Authentication (Optional)

If you want to add basic authentication to your webhook:

1. Add a token check in Apps Script:
   ```javascript
   const AUTH_TOKEN = 'your-secret-token-here';
   
   function doPost(e) {
     const token = e.parameter.token || JSON.parse(e.postData.contents).token;
     if (token !== AUTH_TOKEN) {
       return ContentService.createTextOutput(JSON.stringify({
         success: false,
         error: 'Unauthorized'
       })).setMimeType(ContentService.MimeType.JSON);
     }
     // ... rest of code
   }
   ```

2. Update backend to send token:
   ```python
   data['token'] = settings.GOOGLE_APPS_SCRIPT_TOKEN
   ```

## Updating Existing Bookings

Currently, the Apps Script appends new rows. If you want to update existing rows:

1. Add a `doPut` function in Apps Script that finds rows by booking ID
2. Update the backend `update_booking` method to use PUT instead of POST
3. Implement row finding logic in Apps Script (search by email + timestamp or booking ID)

For now, updates will create new rows, which can be useful for tracking payment status changes.

