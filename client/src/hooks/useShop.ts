import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ShopItem, UserInventory } from "@shared/schema";
import { useAuth } from "./useAuth";

export function useShop() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id || "demo-user";

  // Fetch shop items
  const { data: items = [], isLoading: isLoadingItems } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
    queryFn: async () => {
      const response = await fetch("/api/shop/items");
      if (!response.ok) {
        throw new Error("Failed to fetch shop items");
      }
      return response.json();
    },
  });

  // Fetch user inventory
  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery<UserInventory[]>({
    queryKey: ["/api/inventory", userId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }
      return response.json();
    },
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch("/api/inventory/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, itemId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to purchase item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats", userId] });
    },
  });

  // Check if user owns an item
  const ownsItem = (itemId: string) => {
    return inventory.some(inv => inv.itemId === itemId);
  };

  // Get item with ownership status
  const itemsWithOwnership = items.map(item => ({
    ...item,
    owned: ownsItem(item.id),
  }));

  return {
    items: itemsWithOwnership,
    inventory,
    isLoading: isLoadingItems || isLoadingInventory,
    purchaseItem: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
    ownsItem,
  };
}
