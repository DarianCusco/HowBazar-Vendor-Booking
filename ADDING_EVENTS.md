# How to Add Events to the Calendar

There are several ways to add events to your vendor booking system:

## Method 1: Django Admin Interface (Recommended) ⭐

### Step 1: Access Admin Panel
1. Make sure your Docker containers are running: `docker compose up`
2. Go to: http://localhost:8000/admin
3. Log in with your superuser credentials

### Step 2: Create an Event
1. Click on **"Events"** in the admin panel
2. Click the **"Add Event"** button (top right)
3. Fill in the form:
   - **Name**: e.g., "Summer Market Festival"
   - **Date**: Select the event date (YYYY-MM-DD format)
   - **Location**: e.g., "Central Park, Main Plaza"
   - **Description**: Optional description of the event
4. Click **"Save"**

### Step 3: Add Booth Slots
After saving the event, you'll see a section at the bottom to add booth slots inline:

1. Scroll down to the **"Booth slots"** section
2. Fill in the booth slot details:
   - **Spot number**: e.g., "A01", "B12", "VIP-1"
   - **Price**: Enter the price (e.g., 150.00)
   - **Is available**: Check this box (default)
3. Click **"Save and add another"** to add more slots, or **"Save"** when done

**Tip**: You can add multiple booth slots at once - the form shows 5 empty slots by default.

---

## Method 2: Using the Seed Script

The seed script creates example events automatically:

```powershell
docker compose exec backend python manage.py seed_data
```

This creates 3 example events with booth slots. **Note**: The script only runs if no events exist.

---

## Method 3: Django Shell (Advanced)

For programmatic creation:

```powershell
# Access Django shell
docker compose exec backend python manage.py shell
```

Then in the shell:
```python
from bookings.models import Event, BoothSlot
from datetime import date, timedelta

# Create an event
event = Event.objects.create(
    name="Holiday Market",
    date=date.today() + timedelta(days=90),
    location="Town Square",
    description="Annual holiday market with local vendors"
)

# Add booth slots
for i in range(1, 21):
    BoothSlot.objects.create(
        event=event,
        spot_number=f"A{i:02d}",
        price=125.00,
        is_available=True
    )

print(f"Created event: {event.name} with {event.booth_slots.count()} booth slots")
```

---

## Method 4: Bulk Import via Admin

You can also add multiple booth slots after creating an event:

1. Go to **Booth Slots** in the admin
2. Click **"Add Booth Slot"**
3. Select your event from the dropdown
4. Add spot number and price
5. Repeat for each slot

---

## Quick Tips

- **Event dates** should be in the future to appear on the calendar
- **Booth slot numbers** should be unique per event (e.g., "A01", "A02", "B01")
- **Prices** are in USD by default (can be changed in Stripe checkout)
- Events are automatically sorted by date on the calendar
- The calendar highlights dates that have events with available booth slots

---

## Viewing Your Events

After adding events:
- **Calendar View**: http://localhost:3000 (frontend)
- **Admin View**: http://localhost:8000/admin/bookings/event/
- **API View**: http://localhost:8000/api/events/

---

## Troubleshooting

**Events not showing on calendar?**
- Check that the event date is in the future
- Verify the event has at least one available booth slot
- Refresh the frontend page

**Can't access admin?**
- Create a superuser: `docker compose exec backend python manage.py createsuperuser`
- Make sure backend is running: `docker compose ps`

