import type { CSSProperties } from "react";

// Animate strips of the photo's river while keeping the temple and sky still.
export default function WaterScene() {
  return <div className="water-scene" aria-hidden="true">
    <div className="water-panorama" />
    <div className="water-reflection">
      {Array.from({ length: 32 }, (_, index) => <span key={index} className="reflection-band" style={{
        "--band": index,
        "--flow-speed": `${3.1 + (index % 7) * .29}s`,
        "--flow-delay": `${-index * .37}s`,
        "--flow-drift": `${2 + index % 6}px`,
      } as CSSProperties} />)}
      <div className="water-shimmer" />
      <div className="water-surface-current" />
    </div>
  </div>;
}
