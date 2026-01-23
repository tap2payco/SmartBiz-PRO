
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "@serwist/precaching";
import { installSerwist } from "@serwist/sw";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __WB_MANIFEST: (PrecacheEntry | string)[] | undefined;
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

installSerwist({
    precacheEntries: self.__WB_MANIFEST || self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
});
