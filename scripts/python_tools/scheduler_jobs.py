"""
Next Gear Automated Trip Reminders & Return Inspection Scheduler
Calculates dispatch schedules for SMS, WhatsApp, and Email trip notifications.
"""
from datetime import datetime, timedelta

def compute_notification_windows(pickup_time_iso, drop_time_iso):
    """
    Computes exact trigger times for:
    1. Pre-trip reminder (2 hours before pickup)
    2. Vehicle handover OTP alert (at pickup)
    3. Return reminder & inspection checklist (2 hours before drop)
    4. Settlement & review prompt (1 hour after drop)
    """
    try:
        p_time = datetime.fromisoformat(pickup_time_iso.replace("Z", "+00:00"))
        d_time = datetime.fromisoformat(drop_time_iso.replace("Z", "+00:00"))
        
        return {
            "pre_trip_reminder_at": (p_time - timedelta(hours=2)).isoformat(),
            "handover_otp_window_at": p_time.isoformat(),
            "return_inspection_reminder_at": (d_time - timedelta(hours=2)).isoformat(),
            "post_trip_review_at": (d_time + timedelta(hours=1)).isoformat()
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    now = datetime.now()
    pickup = (now + timedelta(days=1)).isoformat()
    drop = (now + timedelta(days=3)).isoformat()
    windows = compute_notification_windows(pickup, drop)
    print(f"[SCHEDULER] Dispatch windows calculated: {windows}")
