"""
Next Gear Bulk Fleet & City Seeder
Generates and seeds structured vehicle and hub records safely.
"""
import json

DEFAULT_POPULAR_FLEET = [
    {
        "title": "Mahindra Thar 4x4 Hardtop",
        "category": "CAR",
        "hourlyRate": 249,
        "dailyRate": 3499,
        "transmission": "Automatic",
        "fuelType": "Diesel",
        "seats": 4,
        "popularIn": ["Goa", "Manali", "Leh Ladakh", "Chandigarh"]
    },
    {
        "title": "Hyundai Creta SX (O)",
        "category": "CAR",
        "hourlyRate": 189,
        "dailyRate": 2799,
        "transmission": "Automatic",
        "fuelType": "Petrol",
        "seats": 5,
        "popularIn": ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad"]
    },
    {
        "title": "Royal Enfield Himalayan 450",
        "category": "BIKE",
        "hourlyRate": 119,
        "dailyRate": 1599,
        "transmission": "Manual",
        "fuelType": "Petrol",
        "seats": 2,
        "popularIn": ["Manali", "Rishikesh", "Leh Ladakh", "Dehradun"]
    },
    {
        "title": "Honda Activa 6G Premium",
        "category": "SCOOTY",
        "hourlyRate": 49,
        "dailyRate": 499,
        "transmission": "Automatic",
        "fuelType": "Petrol",
        "seats": 2,
        "popularIn": ["Goa", "Pondicherry", "Jaipur", "Udaipur"]
    }
]

def export_fleet_json(output_path="scripts/python_tools/fleet_seed_data.json"):
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_POPULAR_FLEET, f, indent=2)
    print(f"[SEEDED] {len(DEFAULT_POPULAR_FLEET)} premium vehicle records exported to {output_path}")

if __name__ == "__main__":
    export_fleet_json()
