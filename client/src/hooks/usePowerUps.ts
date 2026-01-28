import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserInventory, ShopItem } from "@shared/schema";
import { useShop } from "./useShop";
import { useAuth } from "./useAuth";

interface ActivePowerUp {
  inventoryItem: UserInventory;
  shopItem: ShopItem;
  effectData: any;
  expiresAt: Date | null;
}

export function usePowerUps() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id || "demo-user";
  const { inventory } = useShop();

  // Get all shop items to match with inventory
  const { data: shopItems = [] } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
    queryFn: async () => {
      const response = await fetch("/api/shop/items");
      if (!response.ok) throw new Error("Failed to fetch shop items");
      return response.json();
    },
  });

  // Get active power-ups
  const getActivePowerUps = (): ActivePowerUp[] => {
    const now = new Date();
    
    return inventory
      .filter(inv => {
        // Check if item is active or hasn't expired
        if (inv.expiresAt && new Date(inv.expiresAt) < now) {
          return false;
        }
        return true;
      })
      .map(inv => {
        const shopItem = shopItems.find(item => item.id === inv.itemId);
        if (!shopItem) return null;
        
        const effectData = shopItem.effectValue 
          ? JSON.parse(shopItem.effectValue) 
          : {};
        
        return {
          inventoryItem: inv,
          shopItem,
          effectData,
          expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : null,
        };
      })
      .filter(Boolean) as ActivePowerUp[];
  };

  // Check if a specific power-up type is active
  const hasPowerUp = (effectType: string): boolean => {
    const activePowerUps = getActivePowerUps();
    return activePowerUps.some(pu => pu.shopItem.effectType === effectType);
  };

  // Get multiplier for XP/Coins
  const getXpMultiplier = (): number => {
    const activePowerUps = getActivePowerUps();
    let multiplier = 1;
    
    activePowerUps.forEach(pu => {
      if (pu.shopItem.effectType === "double_xp" && pu.effectData.multiplier) {
        multiplier = Math.max(multiplier, pu.effectData.multiplier);
      } else if (pu.shopItem.effectType === "triple_xp" && pu.effectData.multiplier) {
        multiplier = Math.max(multiplier, pu.effectData.multiplier);
      }
    });
    
    return multiplier;
  };

  const getCoinMultiplier = (): number => {
    const activePowerUps = getActivePowerUps();
    let multiplier = 1;
    
    activePowerUps.forEach(pu => {
      if (pu.shopItem.effectType === "focus_booster" && pu.effectData.multiplier) {
        multiplier = Math.max(multiplier, pu.effectData.multiplier);
      } else if (pu.shopItem.effectType === "coin_multiplier" && pu.effectData.multiplier) {
        multiplier = Math.max(multiplier, pu.effectData.multiplier);
      }
    });
    
    return multiplier;
  };

  // Activate a power-up (set expiry time)
  const activatePowerUp = useMutation({
    mutationFn: async (inventoryItemId: string) => {
      const inventoryItem = inventory.find(inv => inv.id === inventoryItemId);
      if (!inventoryItem) throw new Error("Inventory item not found");

      const shopItem = shopItems.find(item => item.id === inventoryItem.itemId);
      if (!shopItem) throw new Error("Shop item not found");

      const effectData = shopItem.effectValue ? JSON.parse(shopItem.effectValue) : {};
      
      // Calculate expiry time based on duration (in minutes)
      let expiresAt = null;
      if (effectData.duration) {
        expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + effectData.duration);
      }

      // Update inventory item to set as active and set expiry
      const response = await fetch(`/api/inventory/${inventoryItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          isActive: true,
          expiresAt: expiresAt?.toISOString() || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to activate power-up");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", userId] });
    },
  });

  // Get active theme
  const getActiveTheme = (): string | null => {
    const activePowerUps = getActivePowerUps();
    const themeItem = activePowerUps.find(pu => 
      pu.shopItem.effectType === "theme" && pu.inventoryItem.isActive
    );
    return themeItem?.effectData?.themeId || null;
  };

  // Get active cosmetics
  const getActiveCosmetics = (): string[] => {
    const activePowerUps = getActivePowerUps();
    return activePowerUps
      .filter(pu => 
        (pu.shopItem.effectType === "avatar_cosmetic" || 
         pu.shopItem.effectType === "avatar_frame") && 
        pu.inventoryItem.isActive
      )
      .map(pu => pu.effectData?.cosmeticId || pu.effectData?.frameId)
      .filter(Boolean);
  };

  return {
    activePowerUps: getActivePowerUps(),
    hasPowerUp,
    getXpMultiplier,
    getCoinMultiplier,
    getActiveTheme,
    getActiveCosmetics,
    activatePowerUp: activatePowerUp.mutate,
    isActivating: activatePowerUp.isPending,
  };
}
