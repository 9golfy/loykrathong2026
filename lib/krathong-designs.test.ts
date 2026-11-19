import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { krathongDesigns, krathongImage, isSelectableKrathong, withCurrentKrathong } from "./krathong-designs";

test("all twenty-one designs are selectable and have assets", () => {
  assert.equal(krathongDesigns.length, 21);
  assert.equal(new Set(krathongDesigns.map(design => design.key)).size, 21);
  for (const [index, design] of krathongDesigns.entries()) {
    assert.ok(isSelectableKrathong(design.key));
    assert.ok(index >= 15 ? design.image.endsWith('.png') : design.image.endsWith(`design-${String(index + 1).padStart(2, "0")}.webp`));
    assert.ok(existsSync(`public${design.image}`));
  }
});

test("saved retired designs render using replacement assets but cannot be selected", () => {
  for (const [index, key] of ["thai-11", "thai-12", "thai-13", "thai-14", "thai-15"].entries()) {
    assert.equal(isSelectableKrathong(key), false);
    assert.equal(krathongImage(key), krathongDesigns[index].image);
    const wish = withCurrentKrathong({ id: "saved", wish: "สุข", design: { key, name: "old name" } });
    assert.equal(wish.id, "saved");
    assert.equal(wish.wish, "สุข");
    assert.equal(wish.design.key, key);
    assert.notEqual(wish.design.name, "old name");
  }
});
