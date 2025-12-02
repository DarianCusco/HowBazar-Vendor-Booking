# Google Sheets Integration Setup

This guide explains how to set up automatic syncing of vendor bookings to Google Sheets.

## Overview

When a vendor signs up (creates a booking), the data is automatically synced to a Google Sheet. The integration:
- Runs automatically via Django signals (non-blocking)
- Syncs on booking creation and updates
- Handles errors gracefully (won't break booking process if Sheets fails)
- Creates the worksheet automatically if it doesn't exist

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API** and **Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and enable it
   - Search for "Google Drive API" and enable it

### 2. Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `vendor-booking-sheets` (or any name)
   - Description: `Service account for syncing vendor bookings to Google Sheets`
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

### 3. Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file (keep it secure!)

### 4. Create a Google Sheet

1. Create a new Google Sheet or use an existing one
2. Note the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
3. Share the sheet with the service account email:
   - Click "Share" button
   - Add the service account email (found in the JSON file as `client_email`)
   - Give it "Editor" permissions
   - Click "Send"

### 5. Configure Environment Variables

Add these to your `.env` file:

```bash
# Google Sheets Integration
# Option 1: Path to JSON file
GOOGLE_SHEETS_CREDENTIALS=/path/to/your/service-account-key.json

# Option 2: JSON string (for production/deployment)
# GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

# Spreadsheet ID (from the Google Sheet URL)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# Worksheet name (optional, defaults to "Vendor Bookings")
GOOGLE_SHEETS_WORKSHEET_NAME=Vendor Bookings
```

### 6. Install Dependencies

The required packages are already in `requirements.txt`. Install them:

```bash
pip install -r requirements.txt
```

Or if using Docker:
```bash
docker compose exec backend pip install -r requirements.txt
```

### 7. Restart Your Application

Restart your Django application to load the new configuration:

```bash
# If using Docker
docker compose restart backend

# If running locally
# Restart your Django development server
```

## How It Works

### Automatic Syncing

- **On Booking Creation**: When a vendor signs up, a new row is automatically added to the Google Sheet
- **On Booking Update**: When payment status changes (e.g., payment approved), the row is updated

### Sheet Columns

The sheet will have these columns:

1. **Timestamp** - When the booking was created
2. **First Name** - Vendor's first name
3. **Last Name** - Vendor's last name
4. **Email** - Vendor's email
5. **Business Name** - Business name (if provided)
6. **Phone** - Phone number
7. **Event Name** - Name of the event
8. **Event Date** - Date of the event
9. **Event Location** - Location of the event
10. **Spot Number** - Booth spot number
11. **Payment Status** - Not Started / Authorized / Pending Approval / Paid
12. **Stripe Payment ID** - Stripe checkout session ID
13. **Stripe Payment Intent ID** - Stripe payment intent ID
14. **Notes** - Additional booking information (formatted)

### Error Handling

- If Google Sheets is not configured, the integration is disabled (no errors)
- If syncing fails, it's logged but doesn't break the booking process
- The booking is still saved to the database even if Sheets sync fails

## Testing

1. Create a test booking through your application
2. Check the Google Sheet - a new row should appear
3. Update the booking (e.g., mark as paid in admin)
4. Check the sheet - the row should be updated

## Troubleshooting

### "Google Sheets disabled: GOOGLE_SHEETS_CREDENTIALS not configured"
- Make sure you've set the environment variables in `.env`
- Restart your application after adding them

### "Failed to initialize Google Sheets client"
- Check that the credentials JSON is valid
- Verify the service account has access to the sheet
- Make sure the Spreadsheet ID is correct

### "Worksheet not found"
- The worksheet will be created automatically
- Make sure the service account has Editor permissions on the sheet

### No data appearing in sheet
- Check Django logs for errors
- Verify the service account email has access to the sheet
- Ensure the Spreadsheet ID is correct

## Security Notes

- **Never commit** the service account JSON file to version control
- Store credentials securely (use environment variables or secret management)
- The service account should only have access to the specific sheet it needs
- Consider using a separate service account for production vs development

## Production Deployment

For production (e.g., Railway, Heroku):

1. Convert the JSON file to a JSON string
2. Set `GOOGLE_SHEETS_CREDENTIALS` as an environment variable with the JSON string
3. Or use a secure secret management service
4. Make sure the service account has access to your production sheet

Example for Railway:
```bash
railway variables set GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
railway variables set GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
railway variables set GOOGLE_SHEETS_WORKSHEET_NAME=Vendor Bookings
```

