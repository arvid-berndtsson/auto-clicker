import { mouse, Point } from '@nut-tree-fork/nut-js';

const MIN_MOVEMENT_STEPS = 10;
const MAX_MOVEMENT_STEPS = 50;
const PIXELS_PER_STEP = 20;
const MIN_SPEED_FACTOR = 0.3;
const SPEED_RANGE = 0.7;
const TWITCH_PROBABILITY = 0.7;
const TWITCH_CHECK_THRESHOLD = 0.9;
const TWITCH_MAGNITUDE = 6;
const BASE_MOVEMENT_DELAY_MS = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function smoothMoveMouse(targetX: number, targetY: number): Promise<void> {
  const currentPos = await mouse.getPosition();
  const deltaX = targetX - currentPos.x;
  const deltaY = targetY - currentPos.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance < 1) {
    return;
  }

  const steps = Math.max(
    MIN_MOVEMENT_STEPS,
    Math.min(MAX_MOVEMENT_STEPS, Math.floor(distance / PIXELS_PER_STEP))
  );

  const speedVariation = MIN_SPEED_FACTOR + Math.random() * SPEED_RANGE;
  const shouldAddTwitch = Math.random() > TWITCH_PROBABILITY;

  for (let i = 0; i <= steps; i++) {
    if (i === 0) continue;

    const progress = i / steps;
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    let x = currentPos.x + deltaX * eased;
    let y = currentPos.y + deltaY * eased;

    if (i > 1 && i < steps) {
      x += (Math.random() - 0.5) * 2;
      y += (Math.random() - 0.5) * 2;

      if (shouldAddTwitch && Math.random() > TWITCH_CHECK_THRESHOLD) {
        x += (Math.random() - 0.5) * TWITCH_MAGNITUDE;
        y += (Math.random() - 0.5) * TWITCH_MAGNITUDE;
      }
    } else if (i === steps) {
      x = targetX;
      y = targetY;
    }

    await mouse.setPosition(new Point(Math.round(x), Math.round(y)));

    if (i < steps) {
      const delay = BASE_MOVEMENT_DELAY_MS * speedVariation * (1 + Math.random() * 0.5);
      await sleep(delay);
    }
  }
}
