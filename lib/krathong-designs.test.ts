import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { krathongDesigns, krathongImage, isSelectableKrathong, withCurrentKrathong } from "./krathong-designs";

test("only ten numbered replacement designs are selectable", () => {
  assert.equal(krathongDesigns.length, 10);
  assert.equal(new Set(krathongDesigns.map(design => design.key)).size, 10);
  for (const [index, design] of krathongDesigns.entries()) {
    assert.ok(isSelectableKrathong(design.key));
    assert.ok(design.image.endsWith(`design-${String(index + 1).padStart(2, "0")}.webp`));
    assert.ok(existsSync(`public${design.image}`));
  }
});

test("saved retired designs render using replacement assets but cannot be selected", () => {
  for (const key of ["thai-11", "thai-12", "thai-13", "thai-14", "thai-15"]) {
    assert.equal(isSelectableKrathong(key), false);
    assert.ok(krathongDesigns.some(design => design.image === krathongImage(key)));
    const wish = withCurrentKrathong({ id: "saved", wish: "สุข", design: { key, name: "old name" } });
    assert.equal(wish.id, "saved");
    assert.equal(wish.wish, "สุข");
    assert.equal(wish.design.key, key);
    assert.notEqual(wish.design.name, "old name");
  }
});
