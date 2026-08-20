/**
 * x-video-src — `:src` yerine HLS-farkındalıklı reaktif video kaynağı.
 *
 * Kullanım: `<video x-video-src="current.src">`. İfade her değiştiğinde
 * (`effect`) kaynak yeniden bağlanır: HLS değilse ya da tarayıcı yerli
 * çözüyorsa düz `video.src`; değilse hls.js dinamik import ile bağlanır
 * (karar `utils/hlsVideo.ts`'te). Element DOM'dan düşünce `cleanup` motoru
 * söker — `x-if` ile yeniden yaratılan videolarda motor sızmaz.
 *
 * Alpine V3 `Alpine.directive` + `evaluateLater`/`effect`/`cleanup` deseni
 * (alpinejs.dev / advanced/extending, Context7 doğrulandı 2026-08-20).
 */
import Alpine from "alpinejs";

import { attachVideoSource, detachHlsEngine } from "../utils/hlsVideo";

Alpine.directive("video-src", (el, { expression }, { evaluateLater, effect, cleanup }) => {
  const getUrl = evaluateLater(expression);

  effect(() => {
    getUrl((url) => {
      void attachVideoSource(el as HTMLVideoElement, typeof url === "string" ? url : "");
    });
  });

  cleanup(() => {
    detachHlsEngine(el as HTMLVideoElement);
  });
});
