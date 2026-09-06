/**
 * Vehicle Model-Aware Image Registry & Smart Fallback Matcher
 * Automatically matches vehicle titles (e.g. "Royal Enfield Classic 350", "Thar", "Activa 6G", "Swift", "i20")
 * to high-resolution, model-accurate photos when vendor/admin doesn't upload a custom photo.
 */

interface VehicleModelPreset {
  keywords: string[];
  imageUrl: string;
  category: "bike" | "car" | "scooty";
  categoryLabel: string;
}

const VEHICLE_MODEL_PRESETS: VehicleModelPreset[] = [
  // ==========================================
  // 🏍️ BIKES (Royal Enfield, KTM, Yamaha, etc.)
  // ==========================================
  {
    keywords: ["hunter", "hunter 350"],
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Cruiser Bike",
  },
  {
    keywords: ["classic 350", "classic", "bullet", "bullet 350", "meteor", "standard 350"],
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Classic Cruiser",
  },
  {
    keywords: ["himalayan", "himalayan 450", "scram", "scram 411", "xpulse", "adventure"],
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Adventure Tourer",
  },
  {
    keywords: ["continental", "interceptor", "gt 650", "super meteor"],
    imageUrl: "https://images.unsplash.com/photo-1558980664-3a031cf67ea8?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Cafe Racer",
  },
  {
    keywords: ["royal enfield", "enfield"],
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Cruiser Bike",
  },
  {
    keywords: ["duke", "duke 200", "duke 250", "duke 390", "ktm"],
    imageUrl: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Naked Sports Bike",
  },
  {
    keywords: ["rc 200", "rc 390", "rc 125", "r15", "r15 v3", "r15 v4", "ninja", "sports"],
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Super Sport",
  },
  {
    keywords: ["mt 15", "mt-15", "mt15", "fz", "fzs", "fzx"],
    imageUrl: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Street Fighter",
  },
  {
    keywords: ["pulsar", "pulsar ns", "ns200", "ns160", "pulsar 150", "pulsar 220", "dominar"],
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Sports Commuter",
  },
  {
    keywords: ["splendor", "splendor plus", "hf deluxe", "glamour", "shine", "unicorn"],
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Daily Commuter",
  },
  {
    keywords: ["apache", "apache rtr", "rtr 160", "rtr 200", "raider"],
    imageUrl: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Track Racing Bike",
  },
  {
    keywords: ["jawa", "jawa 42", "yezdi", "roadster"],
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Vintage Cruiser",
  },
  {
    keywords: ["harley", "x440", "iron 883"],
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
    category: "bike",
    categoryLabel: "Power Cruiser",
  },

  // ==========================================
  // 🛵 SCOOTERS (Activa, Ntorq, Jupiter, etc.)
  // ==========================================
  {
    keywords: ["activa", "activa 6g", "activa 125", "dio", "honda activa"],
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop",
    category: "scooty",
    categoryLabel: "Family Scooter",
  },
  {
    keywords: ["ntorq", "ntorq 125", "tvs ntorq", "aerox", "rayzr"],
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop",
    category: "scooty",
    categoryLabel: "Sport Scooter",
  },
  {
    keywords: ["jupiter", "jupiter 125", "access", "access 125", "burgman", "fascino"],
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop",
    category: "scooty",
    categoryLabel: "Premium Scooter",
  },
  {
    keywords: ["ola", "ola s1", "ather", "ather 450", "chetak", "iqube", "electric"],
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop",
    category: "scooty",
    categoryLabel: "Smart Electric Scooter",
  },

  // ==========================================
  // 🚗 CARS & SUVS (Thar, i20, Swift, Creta, etc.)
  // ==========================================
  {
    keywords: ["thar", "mahindra thar", "thar 4x4", "jimny", "gurkha"],
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop",
    category: "car",
    categoryLabel: "4x4 Off-Road SUV",
  },
  {
    keywords: ["scorpio", "scorpio n", "scorpio-n", "xuv700", "xuv300", "bolero", "harrier", "safari"],
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
    category: "car",
    categoryLabel: "Full-Size SUV",
  },
  {
    keywords: ["creta", "venue", "seltos", "sonet", "brezza", "nexon", "grand vitara", "hyryder", "kushaq", "taigun"],
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
    category: "car",
    categoryLabel: "Compact SUV",
  },
  {
    keywords: ["i20", "hyundai i20", "i20 asta", "i20 sportz", "swift", "maruti swift", "baleno", "polo", "altroz", "glanza", "tiago", "i10", "grand i10"],
    imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop",
    category: "car",
    categoryLabel: "Premium Hatchback",
  },
  {
    keywords: ["dzire", "swift dzire", "city", "honda city", "verna", "amaze", "slavia", "virtus", "ciaz"],
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop",
    category: "car",
    categoryLabel: "Executive Sedan",
  },
  {
    keywords: ["innova", "innova crysta", "hycross", "ertiga", "carens", "marazzo", "fortuner"],
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
    category: "car",
    categoryLabel: "7-Seater Luxury MUV",
  },
];

// Fallback images when no keyword matches
const CATEGORY_DEFAULT_IMAGES = {
  car: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop",
  scooty: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop",
  bike: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
};

/**
 * Given a vehicle title (e.g. "Hyundai i20", "Royal Enfield Hunter 350", "Honda Activa 6G")
 * and optional type string, returns the best matching real photo and category details.
 */
export function getModelMatchedVehicleInfo(title?: string, type?: string): {
  imageUrl: string;
  category: "bike" | "car" | "scooty";
  categoryLabel: string;
} {
  const cleanTitle = (title || "").toLowerCase().trim();
  const cleanType = (type || "").toLowerCase().trim();

  // Determine baseline category
  const isCar = cleanType.includes("car") || cleanType.includes("suv") || cleanType.includes("sedan") || cleanType.includes("hatchback");
  const isScooty = cleanType.includes("scooter") || cleanType.includes("scooty");
  const baselineCategory: "bike" | "car" | "scooty" = isCar ? "car" : isScooty ? "scooty" : "bike";

  // Try matching against vehicle model presets by keyword in title
  for (const preset of VEHICLE_MODEL_PRESETS) {
    const matched = preset.keywords.some((kw) => cleanTitle.includes(kw));
    if (matched) {
      return {
        imageUrl: preset.imageUrl,
        category: preset.category,
        categoryLabel: preset.categoryLabel,
      };
    }
  }

  // Fallback based on category
  return {
    imageUrl: CATEGORY_DEFAULT_IMAGES[baselineCategory],
    category: baselineCategory,
    categoryLabel: baselineCategory === "car" ? "Rental Car" : baselineCategory === "scooty" ? "Automatic Scooter" : "Cruiser Bike",
  };
}
