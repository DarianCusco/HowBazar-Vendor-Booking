/**
 * Google Apps Script for Vendor Booking Webhook
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Paste this code
 * 4. Save the project
 * 5. Click Deploy → New deployment
 * 6. Select type: Web app
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Click Deploy
 * 10. Copy the Web App URL and add it to your Django settings
 */

// Replace with your actual sheet names
const FOOD_TRUCK_SHEET_NAME = 'Food Trucks';
const GENERAL_VENDOR_SHEET_NAME = 'General Vendor';

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Determine which sheet to use based on vendor type
    const vendorType = data.vendor_type || data.vendorType || 'general';
    const sheetName = vendorType === 'food' || vendorType === 'food_truck' 
      ? FOOD_TRUCK_SHEET_NAME 
      : GENERAL_VENDOR_SHEET_NAME;
    
    // Get the appropriate sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: `Sheet "${sheetName}" not found`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Prepare row data based on vendor type
    let rowData;
    
    if (vendorType === 'food' || vendorType === 'food_truck') {
      // Food Truck columns - exact order as specified
      rowData = [
        data.event_name || '',                                    // Event Name
        data.event_date || '',                                    // Event Date
        data.first_name || '',                                    // First Name
        data.last_name || '',                                     // Last Name
        data.preferred_name || '',                                // Preferred Name
        data.pronouns || '',                                      // Pronouns
        data.vendor_email || '',                                  // Vendor Email
        data.phone || '',                                         // Phone
        data.business_name || '',                                 // Business Name
        data.instagram || '',                                      // Instagram
        data.booth_slot || '',                                    // Booth Slot
        data.cuisine_type || '',                                  // Cuisine Type
        data.food_items || '',                                    // Food Items Sold
        data.setup_size || '',                                    // Setup Size (Truck Dimensions)
        data.price_range || '',                                   // Price Range
        data.generator || '',                                     // Can Bring Own Quiet Generator
        data.social_media_consent || '',                         // Social Media Consent
        data.photo_consent || '',                                 // Photo Consent
        data.noise_sensitive || '',                              // Noise Sensitive
        data.sharing_booth || '',                                // Sharing Booth
        data.booth_partner_instagram || '',                       // Booth Partner Instagram
        data.additional_notes || '',                              // Additional Notes
        data.stripe_payment_id || '',                             // Stripe Payment ID
        data.stripe_checkout_session_id || '',                    // Stripe Checkout Session ID
        data.stripe_payment_intent_id || '',                      // Stripe Payment Intent ID
        data.is_paid ? 'Yes' : 'No',                             // Is Paid
        data.timestamp || new Date().toISOString()               // Timestamp
      ];
    } else {
      // General Vendor columns - exact order as specified
      rowData = [
        data.event_name || '',                                    // Event Name
        data.event_date || '',                                    // Event Date
        data.first_name || '',                                    // First Name
        data.last_name || '',                                     // Last Name
        data.preferred_name || '',                                // Preferred Name
        data.pronouns || '',                                      // Pronouns
        data.vendor_email || '',                                  // Vendor Email
        data.phone || '',                                         // Phone
        data.business_name || '',                                 // Business Name
        data.instagram || '',                                      // Instagram
        data.booth_slot || '',                                    // Booth Slot
        data.products_selling || '',                              // Products Selling
        data.price_range || '',                                   // Price Range
        data.electricity_cord || '',                              // Can Bring Own Extension Cord
        data.social_media_consent || '',                         // Social Media Consent
        data.photo_consent || '',                                 // Photo Consent
        data.noise_sensitive || '',                              // Noise Sensitive
        data.sharing_booth || '',                                // Sharing Booth
        data.booth_partner_instagram || '',                       // Booth Partner Instagram
        data.additional_notes || '',                              // Additional Notes
        data.stripe_payment_id || '',                             // Stripe Payment ID
        data.stripe_checkout_session_id || '',                    // Stripe Checkout Session ID
        data.stripe_payment_intent_id || '',                      // Stripe Payment Intent ID
        data.is_paid ? 'Yes' : 'No',                             // Is Paid
        data.timestamp || new Date().toISOString()               // Timestamp
      ];
    }
    
    // Append the row to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Data added successfully',
        sheet: sheetName
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function (optional - for testing in Apps Script editor)
function testDoPost() {
  const testData = {
    vendor_type: 'food',
    event_name: 'Test Event',
    event_date: '2024-01-01',
    first_name: 'John',
    last_name: 'Doe',
    vendor_email: 'test@example.com',
    phone: '123-456-7890',
    business_name: 'Test Business',
    cuisine_type: 'Mexican',
    food_items: 'Tacos, Burritos',
    is_paid: false,
    timestamp: new Date().toISOString()
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

