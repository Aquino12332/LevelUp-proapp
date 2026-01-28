import React, { useState } from "react";
import { useGamification } from "@/lib/gamification";
import { useShop } from "@/hooks/useShop";
import { usePowerUps } from "@/hooks/usePowerUps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Zap, Clock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import coinImg from '@assets/generated_images/3d_gold_coin_icon.png';

export default function Shop() {
  const { stats } = useGamification();
  const { items, inventory, isLoading, purchaseItem, isPurchasing } = useShop();
  const { activePowerUps, activatePowerUp, isActivating, getXpMultiplier, getCoinMultiplier } = usePowerUps();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  const handleBuy = (itemId: string, itemName: string, price: number) => {
    if (stats.coins < parseInt(price.toString())) {
      toast({
        title: "Not enough coins!",
        description: `You need ${price} coins to purchase ${itemName}.`,
        variant: "destructive",
      });
      return;
    }

    purchaseItem(itemId, {
      onSuccess: () => {
        toast({
          title: "Purchase successful!",
          description: `You bought ${itemName}! Check your inventory.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Purchase failed",
          description: error.message || "Something went wrong.",
          variant: "destructive",
        });
      },
    });
  };

  const filteredItems = activeTab === "all" 
    ? items 
    : items.filter(item => item.category === activeTab);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-100 to-orange-100 p-8 rounded-3xl">
        <div>
          <h1 className="text-4xl font-heading font-bold text-amber-900">Campus Store</h1>
          <p className="text-amber-800 mt-2">Spend your hard-earned coins on rewards!</p>
        </div>
        <div className="bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/50 flex items-center gap-3 shadow-lg">
          <img src={coinImg} className="h-12 w-12" />
          <div>
            <span className="block text-xs font-bold text-amber-800 uppercase tracking-wider">Balance</span>
            <span className="text-3xl font-bold text-amber-600">{stats.coins}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="powerups">Power-ups</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="cosmetics">Cosmetics</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="inventory">
            <Sparkles className="h-4 w-4 mr-2" />
            My Inventory ({inventory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              <p>No items in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-all border-2 hover:border-primary/20">
                  <div className="h-32 bg-muted/50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                          {item.category}
                        </span>
                      </div>
                      {item.owned && <Badge variant="secondary" className="bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" /> Owned</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 min-h-[2.5rem]">{item.description}</p>
                    <Button 
                      className="w-full font-bold" 
                      variant={item.owned ? "secondary" : "default"}
                      disabled={item.owned || isPurchasing}
                      onClick={() => handleBuy(item.id, item.name, parseInt(item.price))}
                    >
                      {isPurchasing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : item.owned ? (
                        <span className="flex items-center gap-2">
                          <Check className="h-4 w-4" /> Owned
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Buy for {item.price} <img src={coinImg} className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Active Power-ups Banner */}
              {activePowerUps.length > 0 && (
                <Card className="mb-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Active Power-ups
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activePowerUps.map((powerUp) => {
                        const timeLeft = powerUp.expiresAt 
                          ? Math.max(0, Math.floor((powerUp.expiresAt.getTime() - Date.now()) / 1000 / 60))
                          : null;
                        
                        return (
                          <div key={powerUp.inventoryItem.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                            <div className="text-3xl">{powerUp.shopItem.icon}</div>
                            <div className="flex-1">
                              <div className="font-semibold">{powerUp.shopItem.name}</div>
                              {timeLeft !== null && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {timeLeft > 0 ? `${timeLeft} minutes left` : 'Expired'}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Show current multipliers */}
                    <div className="mt-4 flex gap-4">
                      {getXpMultiplier() > 1 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {getXpMultiplier()}x XP
                        </Badge>
                      )}
                      {getCoinMultiplier() > 1 && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          {getCoinMultiplier()}x Coins
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {inventory.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <p className="text-lg mb-2">Your inventory is empty</p>
                  <p className="text-sm">Purchase items from the shop to see them here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inventory.map((invItem) => {
                    const shopItem = items.find(item => item.id === invItem.itemId);
                    if (!shopItem) return null;
                    
                    const isExpired = invItem.expiresAt && new Date(invItem.expiresAt) < new Date();
                    const isPowerUp = shopItem.category === "powerups";
                    const canActivate = isPowerUp && !invItem.isActive && !isExpired;

                    return (
                      <Card key={invItem.id} className="overflow-hidden border-2 border-primary/20">
                        <div className="h-32 bg-gradient-to-br from-primary/10 to-purple-500/5 flex items-center justify-center text-6xl">
                          {shopItem.icon}
                        </div>
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-lg">{shopItem.name}</h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                                {shopItem.category}
                              </span>
                            </div>
                            {invItem.isActive && (
                              <Badge className="bg-green-500">
                                <Zap className="h-3 w-3 mr-1" /> Active
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{shopItem.description}</p>
                          
                          {isExpired && (
                            <Badge variant="secondary" className="mb-3 bg-red-100 text-red-700">
                              Expired
                            </Badge>
                          )}
                          
                          {invItem.expiresAt && !isExpired && (
                            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {new Date(invItem.expiresAt).toLocaleString()}
                            </div>
                          )}

                          {canActivate && (
                            <Button 
                              className="w-full" 
                              size="sm"
                              disabled={isActivating}
                              onClick={() => {
                                activatePowerUp(invItem.id);
                                toast({
                                  title: "Power-up activated!",
                                  description: `${shopItem.name} is now active.`,
                                });
                              }}
                            >
                              {isActivating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Zap className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </Button>
                          )}
                          
                          {invItem.isActive && isPowerUp && (
                            <Button className="w-full" size="sm" variant="secondary" disabled>
                              <Check className="h-4 w-4 mr-2" />
                              Currently Active
                            </Button>
                          )}
                          
                          {!isPowerUp && (
                            <Button 
                              className="w-full" 
                              size="sm"
                              variant={invItem.isActive ? "default" : "secondary"}
                              onClick={() => {
                                // Toggle active state for themes/cosmetics
                                toast({
                                  title: invItem.isActive ? "Item deactivated" : "Item activated",
                                  description: `${shopItem.name} ${invItem.isActive ? 'is no longer active' : 'is now active'}.`,
                                });
                              }}
                            >
                              {invItem.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
