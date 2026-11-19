import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { krathongDesigns } from "./krathong-designs";
import { pierCouples } from "./pier-couples";
import { getWishCardLayout, wishCardSize } from "./wish-card-layout";

test("all 798 outfit, krathong, and text-mode combinations stay within the card", () => {
  assert.equal(pierCouples.length, 19);
  assert.equal(krathongDesigns.length, 21);
  for (const character of pierCouples) {
    assert.ok(existsSync(join("public", "images", "wish-card-outfits", character.key + ".png")), character.key);
    for (const design of krathongDesigns) {
      for (const artOnly of [false, true]) {
        const label = [character.key, design.key, artOnly ? "art only" : "with text"].join(" / ");
        const layout = getWishCardLayout(character, design.key, artOnly);
        assert.ok(layout, label);
        const { characterRect, boatRect } = layout;
        assert.ok(boatRect.left >= 0 && boatRect.left + boatRect.width <= wishCardSize.width, label);
        assert.ok(boatRect.top >= characterRect.top + characterRect.height * .27, label);
        assert.ok(boatRect.top + boatRect.height < wishCardSize.height * (artOnly ? .82 : .64), label);
        assert.ok(boatRect.top + boatRect.height > characterRect.top + characterRect.height * .69, label);
      }
    }
  }
});
