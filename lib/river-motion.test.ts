import assert from "node:assert/strict";
import test from "node:test";
import { advanceRiverQueue, createRiverQueue, reconcileRiverQueue } from "./river-motion";

const random = () => .5;

test("all boats start outside the left edge", () => {
  for (const width of [154, 196]) {
    const queue = createRiverQueue(["a", "b", "c"], width, 6, random);
    assert.ok(queue.every(boat => boat.x + width <= 0));
  }
});

test("small and large queues only recycle on the left without overlap", () => {
  for (const viewport of [390, 1440, 1920]) {
    for (const count of [1, 3, 24]) {
      const width = viewport < 760 ? 154 : 196;
      const clearance = width + 6;
      const queue = createRiverQueue(Array.from({ length: count }, (_, i) => String(i)), width, 6, random);
      let wraps = 0;
      for (let frame = 0; frame < 20000; frame++) {
        const before = new Map(queue.map(boat => [boat.id, boat.x]));
        advanceRiverQueue(queue, .05, viewport, clearance, random);
        queue.forEach((boat, index) => {
          if (boat.x < before.get(boat.id)!) {
            wraps++;
            assert.ok(boat.x + width < 0, "recycled boat must enter from offscreen");
          }
          if (index) assert.ok(queue[index - 1].x - boat.x >= clearance, "boats must not overlap");
        });
      }
      assert.ok(wraps > 0);
    }
  }
});

test("refreshes and new submissions preserve the boats already moving", () => {
  const previous = [{ id: "a", x: 900, speed: 45, extraGap: 10 }, { id: "b", x: 500, speed: 50, extraGap: 20 }];
  const queue = reconcileRiverQueue(previous, ["new", "a", "b"], 196, 6, random);
  assert.equal(queue[0].x, 900);
  assert.equal(queue[1].x, 500);
  assert.equal(queue[2].id, "new");
  assert.ok(queue[2].x <= -196);
  assert.deepEqual(reconcileRiverQueue(queue, ["new", "a", "b"], 196, 6, random), queue);
});

test("responsive resizing preserves the leader and keeps clearance", () => {
  const queue = reconcileRiverQueue([{ id: "a", x: 400, speed: 45, extraGap: 10 }, { id: "b", x: 230, speed: 50, extraGap: 20 }], ["a", "b"], 196, 6, random);
  assert.equal(queue[0].x, 400);
  assert.ok(queue[0].x - queue[1].x >= 222);
});
