// Utility to get current user ID for backwards compatibility
// This allows hooks to work without direct auth dependency
export function getCurrentUserId(): string {
  // For now, return demo-user as fallback
  // This will be overridden when user is authenticated
  return "demo-user";
}
