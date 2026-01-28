import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register advanced service worker with caching and push notifications
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
	window.addEventListener("load", async () => {
		try {
			// Register the advanced service worker
			const reg = await navigator.serviceWorker.register("/sw-advanced.js");
			console.log("Service worker registered:", reg);
			
			// Listen for updates
			reg.addEventListener('updatefound', () => {
				const newWorker = reg.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							console.log('New service worker available, will activate on next page load');
							// Optionally notify user about update
						}
					});
				}
			});
			
			// Attempt to subscribe to push notifications
			try {
				const { subscribeToPush } = await import("./lib/push");
				subscribeToPush(reg).catch((err) => console.error("Push subscribe failed:", err));
			} catch (err) {
				console.warn("Push helper not available:", err);
			}
			
			// Register background sync for offline queue
			try {
				const { offlineSyncManager } = await import("./lib/offlineSync");
				await offlineSyncManager.registerBackgroundSync();
			} catch (err) {
				console.warn("Background sync not available:", err);
			}
		} catch (err) {
			console.error("Service worker registration failed:", err);
		}
	});
}
