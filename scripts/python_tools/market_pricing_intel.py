"""
Next Gear Dynamic Market Pricing & Intelligence Engine
Analyzes city demand, vehicle category, and seasonality to recommend optimized rental rates.
"""

def calculate_dynamic_rate(base_hourly_rate, city, vehicle_category, is_weekend=False, season="NORMAL"):
    # Seasonal multipliers
    season_multipliers = {
        "PEAK": 1.25,     # Goa in Dec/Jan, Manali in May/June
        "NORMAL": 1.00,
        "MONSOON": 0.85   # Monsoon discount
    }
    
    # City premium adjustments
    city_weights = {
        "goa": 1.15,
        "mumbai": 1.12,
        "bengaluru": 1.08,
        "delhi": 1.05,
        "manali": 1.10,
        "chandigarh": 1.00,
    }

    norm_city = city.lower().strip()
    c_factor = city_weights.get(norm_city, 1.0)
    s_factor = season_multipliers.get(season.upper(), 1.0)
    w_factor = 1.18 if is_weekend else 1.0

    dynamic_price = round(base_hourly_rate * c_factor * s_factor * w_factor)

    return {
        "city": city,
        "category": vehicle_category,
        "base_rate": base_hourly_rate,
        "recommended_rate": dynamic_price,
        "surge_active": dynamic_price > base_hourly_rate,
        "margin_increase_pct": round(((dynamic_price - base_hourly_rate) / base_hourly_rate) * 100, 1)
    }

if __name__ == "__main__":
    result = calculate_dynamic_rate(149, "Goa", "SUV_THAR", is_weekend=True, season="PEAK")
    print(f"[MARKET PRICING INTEL] {result}")
