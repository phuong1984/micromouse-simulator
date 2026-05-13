import * as PIXI from 'pixi.js';

export async function createPixiApp(container: HTMLElement): Promise<PIXI.Application | null> {
  const app = new PIXI.Application();
  await app.init({
    backgroundAlpha: 0,
    resolution: window.devicePixelRatio,
    autoDensity: true,
  });
  container.appendChild(app.canvas);
  return app;
}

export function destroyPixiApp(app: PIXI.Application | null): void {
  if (!app) return;
  app.destroy(true, { children: true });
}

export function resizePixiRenderer(
  app: PIXI.Application | null,
  containerRef: HTMLElement | null,
): { width: number; height: number } | null {
  if (!app || !containerRef?.parentElement) return null;
  const rect = containerRef.parentElement.getBoundingClientRect();
  app.renderer.resize(rect.width, rect.height);
  return { width: rect.width, height: rect.height };
}
