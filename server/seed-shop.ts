// Seed shop items - run this once to populate the shop
import { storage } from "./storage";

const shopItems = [
  // Power-ups
  {
    name: "Streak Freeze",
    description: "Protect your streak for one missed day.",
    price: "500",
    category: "powerups",
    icon: "🧊",
    effectType: "streak_freeze",
    effectValue: JSON.stringify({ duration: 1 }),
  },
  {
    name: "Double XP Potion",
    description: "Earn 2x XP for the next hour.",
    price: "300",
    category: "powerups",
    icon: "🧪",
    effectType: "double_xp",
    effectValue: JSON.stringify({ duration: 60, multiplier: 2 }),
  },
  {
    name: "Focus Booster",
    description: "Get 50% more coins from focus sessions for 24 hours.",
    price: "600",
    category: "powerups",
    icon: "⚡",
    effectType: "focus_booster",
    effectValue: JSON.stringify({ duration: 1440, multiplier: 1.5 }),
  },
  {
    name: "Triple XP Elixir",
    description: "Earn 3x XP for 30 minutes. Perfect for power study sessions!",
    price: "800",
    category: "powerups",
    icon: "🔮",
    effectType: "triple_xp",
    effectValue: JSON.stringify({ duration: 30, multiplier: 3 }),
  },
  {
    name: "Mega Coin Magnet",
    description: "Double coins from all activities for 2 hours.",
    price: "1000",
    category: "powerups",
    icon: "🧲",
    effectType: "coin_multiplier",
    effectValue: JSON.stringify({ duration: 120, multiplier: 2 }),
  },
  {
    name: "Task Auto-Complete",
    description: "Instantly complete one task of your choice.",
    price: "250",
    category: "powerups",
    icon: "✅",
    effectType: "auto_complete_task",
    effectValue: JSON.stringify({ count: 1 }),
  },

  // Themes
  {
    name: "Neon Night Theme",
    description: "A cool dark theme with neon accents.",
    price: "1000",
    category: "themes",
    icon: "🌃",
    effectType: "theme",
    effectValue: JSON.stringify({ themeId: "neon-night" }),
  },
  {
    name: "Rainbow Theme",
    description: "Brighten up your study space with rainbow colors.",
    price: "800",
    category: "themes",
    icon: "🌈",
    effectType: "theme",
    effectValue: JSON.stringify({ themeId: "rainbow" }),
  },
  {
    name: "Ocean Blue Theme",
    description: "Calm ocean-inspired colors for deep focus.",
    price: "900",
    category: "themes",
    icon: "🌊",
    effectType: "theme",
    effectValue: JSON.stringify({ themeId: "ocean-blue" }),
  },
  {
    name: "Sunset Theme",
    description: "Warm sunset gradients for evening study.",
    price: "850",
    category: "themes",
    icon: "🌅",
    effectType: "theme",
    effectValue: JSON.stringify({ themeId: "sunset" }),
  },
  {
    name: "Forest Green Theme",
    description: "Natural green tones for a relaxed vibe.",
    price: "750",
    category: "themes",
    icon: "🌲",
    effectType: "theme",
    effectValue: JSON.stringify({ themeId: "forest-green" }),
  },

  // Cosmetics
  {
    name: "Golden Avatar Frame",
    description: "Show off your wealth with a golden frame.",
    price: "2500",
    category: "cosmetics",
    icon: "🖼️",
    effectType: "avatar_frame",
    effectValue: JSON.stringify({ frameId: "golden" }),
  },
  {
    name: "Wizard Hat",
    description: "A magical hat for your avatar.",
    price: "1500",
    category: "cosmetics",
    icon: "🧙‍♂️",
    effectType: "avatar_cosmetic",
    effectValue: JSON.stringify({ cosmeticId: "wizard-hat" }),
  },
  {
    name: "Crown of Excellence",
    description: "For true champions. Legendary rarity!",
    price: "5000",
    category: "cosmetics",
    icon: "👑",
    effectType: "avatar_cosmetic",
    effectValue: JSON.stringify({ cosmeticId: "crown" }),
  },
  {
    name: "Sunglasses",
    description: "Look cool while studying.",
    price: "600",
    category: "cosmetics",
    icon: "😎",
    effectType: "avatar_cosmetic",
    effectValue: JSON.stringify({ cosmeticId: "sunglasses" }),
  },
  {
    name: "Diamond Frame",
    description: "Ultra-rare diamond avatar frame.",
    price: "8000",
    category: "cosmetics",
    icon: "💎",
    effectType: "avatar_frame",
    effectValue: JSON.stringify({ frameId: "diamond" }),
  },
  {
    name: "Fire Wings",
    description: "Show everyone you're on fire!",
    price: "3500",
    category: "cosmetics",
    icon: "🔥",
    effectType: "avatar_cosmetic",
    effectValue: JSON.stringify({ cosmeticId: "fire-wings" }),
  },

  // Music
  {
    name: "Lofi Beats Pack",
    description: "Unlock 5 new lofi tracks for focus mode.",
    price: "400",
    category: "music",
    icon: "🎧",
    effectType: "music_pack",
    effectValue: JSON.stringify({ packId: "lofi-beats" }),
  },
  {
    name: "Classical Study Pack",
    description: "Mozart, Bach, and more. 8 classical pieces.",
    price: "500",
    category: "music",
    icon: "🎻",
    effectType: "music_pack",
    effectValue: JSON.stringify({ packId: "classical" }),
  },
  {
    name: "Nature Sounds Pack",
    description: "Rain, forest, ocean waves for relaxation.",
    price: "350",
    category: "music",
    icon: "🌿",
    effectType: "music_pack",
    effectValue: JSON.stringify({ packId: "nature-sounds" }),
  },
  {
    name: "Electronic Focus Pack",
    description: "Upbeat electronic music for productivity.",
    price: "450",
    category: "music",
    icon: "🎹",
    effectType: "music_pack",
    effectValue: JSON.stringify({ packId: "electronic" }),
  },
  {
    name: "Binaural Beats Pack",
    description: "Scientific focus-enhancing frequencies.",
    price: "600",
    category: "music",
    icon: "🧠",
    effectType: "music_pack",
    effectValue: JSON.stringify({ packId: "binaural" }),
  },
];

export async function seedShop() {
  console.log("Checking shop items...");
  
  // Check if shop already has items
  const existingItems = await storage.getShopItems();
  
  if (existingItems.length > 0) {
    console.log(`Shop already has ${existingItems.length} items. Skipping seed.`);
    return;
  }
  
  console.log("Seeding shop items...");
  for (const item of shopItems) {
    await storage.createShopItem(item);
  }
  console.log(`Successfully seeded ${shopItems.length} shop items!`);
}
