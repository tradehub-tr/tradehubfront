import { Capacitor } from "@capacitor/core";
import { App, type URLOpenListenerEvent } from "@capacitor/app";

export function initDeepLinks(): void {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
    const url = new URL(event.url);
    const path = url.pathname;
    if (path) {
      window.location.href = path;
    }
  });
}

initDeepLinks();
