export const wishCardSize = { width: 1122, height: 1402 };

type Point = readonly [x: number, y: number];
type BoatSilhouette = readonly [
  width: number, height: number, opaqueWidth: number, basketCenterX: number, opaqueTop: number, opaqueBottom: number, handContactY: number,
];

const handPositions: Record<string, Point> = {
  "amarin-pair": [0.56, 0.942],
  "amarin": [0.66, 0.837],
  "royal-shirt-orange": [0.64, 0.828],
  "royal-shirt-blue": [0.665, 0.828],
  "royal-shirt-short": [0.65, 0.844],
  "chakkraphat-pair": [0.57, 0.949],
  "chakkraphat": [0.68, 0.844],
  "chakkri-pair": [0.53, 0.947],
  "chakkri": [0.65, 0.838],
  "chitralada-pair": [0.53, 0.935],
  "chitralada": [0.67, 0.843],
  "dusit-pair": [0.538, 0.951],
  "dusit": [0.665, 0.839],
  "boromphiman-pair": [0.543, 0.948],
  "boromphiman": [0.643, 0.843],
  "rueanton-pair": [0.56, 0.946],
  "rueanton": [0.627, 0.842],
  "siwalai-pair": [0.606, 0.947],
  "siwalai": [0.64, 0.835],
};

const soloCharacterBounds: Record<string, readonly [top: number, bottom: number]> = {
  "amarin": [0.123288, 0.889690],
  "royal-shirt-orange": [0.082192, 0.909877],
  "royal-shirt-blue": [0.082913, 0.908435],
  "royal-shirt-short": [0.082913, 0.918529],
  "chakkraphat": [0.130497, 0.897621],
  "chakkri": [0.129056, 0.894737],
  "chitralada": [0.126893, 0.896179],
  "dusit": [0.130497, 0.894737],
  "boromphiman": [0.118241, 0.901947],
  "rueanton": [0.126172, 0.898342],
  "siwalai": [0.102379, 0.901947],
};

// Opaque bounds and basket center measured from the transparent design assets.
const boatSilhouettes: Record<string, BoatSilhouette> = {
  "lotus": [1000, 914, 0.805, 0.5, 0.009, 0.978, 0.923],
  "banana-leaf": [1000, 914, 0.755, 0.5, 0.004, 0.963, 0.909],
  "silk": [1000, 937, 0.866, 0.494, 0.01, 0.972, 0.893],
  "moonlight": [1000, 914, 0.708, 0.497, 0.032, 0.945, 0.895],
  "thai-05": [1000, 978, 0.778, 0.497, 0.025, 0.98, 0.926],
  "thai-06": [1000, 934, 0.786, 0.499, 0.017, 0.943, 0.891],
  "thai-07": [1000, 1000, 0.811, 0.496, 0.013, 0.987, 0.933],
  "thai-08": [1000, 928, 0.901, 0.501, 0.022, 0.977, 0.884],
  "thai-09": [1000, 914, 0.892, 0.495, 0.025, 0.944, 0.887],
  "thai-10": [1000, 978, 0.801, 0.494, 0.022, 0.956, 0.904],
  "rice-stalk": [1000, 1000, 0.948, 0.502, 0.017, 0.991, 0.935],
  "tiered-spire": [1000, 1000, 0.881, 0.5, 0.003, 0.942, 0.889],
  "coconut-lotus": [1000, 1000, 0.887, 0.497, 0.041, 0.924, 0.871],
  "flower-boat": [1000, 1000, 0.937, 0.494, 0.055, 0.943, 0.833],
  "festival-barge": [1000, 1000, 0.966, 0.497, 0.045, 0.95, 0.897],
  "lotus-color-pink": [1536, 1024, 0.76, 0.5, 0.033, 0.973, 0.916],
  "lotus-color-purple": [1536, 1024, 0.755, 0.5, 0.034, 0.968, 0.912],
  "lotus-color-blue": [1536, 1024, 0.682, 0.497, 0.069, 0.915, 0.864],
  "lotus-color-cyan": [1536, 1024, 0.729, 0.5, 0.049, 0.962, 0.907],
  "lotus-color-lime": [1536, 1024, 0.708, 0.499, 0.048, 0.95, 0.896],
  "lotus-color-green": [1536, 1024, 0.719, 0.5, 0.081, 0.946, 0.894],
};

export type WishCardRect = { left: number; top: number; width: number; height: number };

export function getWishCardLayout(
  character: { key: string; width: number; height: number },
  designKey: string,
  artOnly: boolean,
) {
  const hand = handPositions[character.key];
  const silhouette = boatSilhouettes[designKey];
  if (!hand || !silhouette) return undefined;

  const { width: cardWidth, height: cardHeight } = wishCardSize;
  const characterBoxHeight = cardHeight * (artOnly ? .44 : .34);
  const characterScale = Math.min(cardWidth * .54 / character.width, characterBoxHeight / character.height);
  const nominalCharacterHeight = character.height * characterScale;
  const bounds = soloCharacterBounds[character.key];
  const referenceHeight = Math.min(cardWidth * .54, characterBoxHeight);
  const characterHeight = bounds ? referenceHeight * .97 / (bounds[1] - bounds[0]) : nominalCharacterHeight;
  const characterWidth = character.width / character.height * characterHeight;
  const characterTop = cardHeight * (artOnly ? .32 : .27) + (characterBoxHeight - referenceHeight) / 2;
  const characterRect = {
    left: cardWidth * .515 - characterWidth / 2,
    top: bounds
      ? characterTop + referenceHeight * .985 - bounds[1] * characterHeight
      : cardHeight * (artOnly ? .32 : .27) + (characterBoxHeight - characterHeight) / 2,
    width: characterWidth,
    height: characterHeight,
  };

  const [width, height, opaqueWidth, basketCenterX, opaqueTop, opaqueBottom, handContactY] = silhouette;
  const opaqueHeight = opaqueBottom - opaqueTop;
  const boatScale = Math.min(nominalCharacterHeight * .64 / (width * opaqueWidth), nominalCharacterHeight * .53 / (height * opaqueHeight));
  const boatWidth = width * boatScale;
  const boatHeight = height * boatScale;
  const boatRect = {
    left: characterRect.left + hand[0] * characterWidth - basketCenterX * boatWidth,
    top: characterRect.top + hand[1] * characterHeight - handContactY * boatHeight,
    width: boatWidth,
    height: boatHeight,
  };

  return { characterRect, boatRect, boatSize: { width, height }, boatAnchor: { x: basketCenterX, y: handContactY } };
}
