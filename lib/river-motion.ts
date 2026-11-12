export type RiverBoatMotion = { id: string; x: number; speed: number; extraGap: number };

export function createRiverQueue(ids: string[], boatWidth: number, gap: number, random = Math.random): RiverBoatMotion[] {
  let x = -boatWidth;
  return ids.map((id, index) => {
    const extraGap = random() * 37.5;
    if (index > 0) x -= boatWidth + gap + extraGap + random() * 27.5;
    const boat = { id, x, speed: 32 + random() * 26, extraGap };
    return boat;
  });
}

/** Keep boats already moving; new arrivals must always queue outside the left edge. */
export function reconcileRiverQueue(previous: RiverBoatMotion[], ids: string[], boatWidth: number, gap: number, random = Math.random): RiverBoatMotion[] {
  if (!previous.length) return createRiverQueue(ids, boatWidth, gap, random);
  const wanted = new Set(ids);
  const queue = previous.filter(boat => wanted.has(boat.id));
  const existing = new Set(queue.map(boat => boat.id));
  for (const id of ids) {
    if (existing.has(id)) continue;
    const extraGap = random() * 37.5;
    const tail = queue[queue.length - 1];
    const x = Math.min(-boatWidth, tail ? tail.x - boatWidth - gap - extraGap - random() * 27.5 : -boatWidth);
    queue.push({ id, x, speed: 32 + random() * 26, extraGap });
  }
  // Widening boats at a responsive breakpoint must not cause collisions.
  for (let index = 1; index < queue.length; index++) {
    queue[index].x = Math.min(queue[index].x, queue[index - 1].x - boatWidth - gap - queue[index].extraGap);
  }
  return queue;
}

/** Front-to-back updates cap every follower at the leader's safe clearance. */
export function advanceRiverQueue(queue: RiverBoatMotion[], seconds: number, viewport: number, clearance: number, random = Math.random): void {
  for (let index = 0; index < queue.length; index++) {
    const boat = queue[index];
    const desired = boat.x + boat.speed * seconds;
    boat.x = index === 0 ? desired : Math.min(desired, queue[index - 1].x - clearance - boat.extraGap);
  }
  // A boat only re-enters behind the final queued boat, never inside a gap.
  while (queue.length && queue[0].x > viewport + clearance) {
    const boat = queue.shift()!;
    boat.extraGap = random() * 37.5;
    boat.x = Math.min(-clearance, queue.length ? queue[queue.length - 1].x - clearance - boat.extraGap - random() * 27.5 : -clearance);
    boat.speed = 32 + random() * 26;
    queue.push(boat);
  }
}

