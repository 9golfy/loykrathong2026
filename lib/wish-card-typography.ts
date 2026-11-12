const graphemes = new Intl.Segmenter("th", { granularity: "grapheme" });

function renderedLines(quote: HTMLQuoteElement) {
  const text = quote.firstChild;
  if (!(text instanceof Text)) return [];

  const range = document.createRange();
  const lineHeight = parseFloat(getComputedStyle(quote).lineHeight);
  const lines: { start: number; end: number; top: number }[] = [];

  for (const { segment, index } of graphemes.segment(text.data)) {
    if (!segment.trim()) continue;
    const end = index + segment.length;
    range.setStart(text, index);
    range.setEnd(text, end);
    const { top } = range.getBoundingClientRect();
    const last = lines.at(-1);
    if (last && Math.abs(last.top - top) < lineHeight / 2) last.end = end;
    else lines.push({ start: index, end, top });
  }

  return lines.map(({ start, end }) => {
    range.setStart(text, start);
    range.setEnd(text, end);
    return { text: text.data.slice(start, end), bounds: range.getBoundingClientRect() };
  });
}

export function drawWishCardTypography(ctx: CanvasRenderingContext2D, card: HTMLElement) {
  const cardBounds = card.getBoundingClientRect();
  const scale = ctx.canvas.width / cardBounds.width;
  const quote = card.querySelector("blockquote");
  const author = card.querySelector<HTMLElement>(".wish-framed-author");
  const name = author?.querySelector("span");

  function applyTextStyle(element: HTMLElement) {
    const style = getComputedStyle(element);
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.fillStyle = style.color;
    ctx.direction = style.direction === "rtl" ? "rtl" : "ltr";
    return style.color;
  }

  function drawText(text: string, bounds: DOMRect) {
    const { fontBoundingBoxAscent, fontBoundingBoxDescent } = ctx.measureText(text);
    const baseline = bounds.top - cardBounds.top + (bounds.height + fontBoundingBoxAscent - fontBoundingBoxDescent) / 2;
    ctx.fillText(text, bounds.left - cardBounds.left + bounds.width / 2, baseline);
  }

  ctx.save();
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  if (quote) {
    ctx.save();
    applyTextStyle(quote);
    ctx.shadowColor = "#000";
    ctx.shadowOffsetY = 2 * scale;
    ctx.shadowBlur = 5 * scale;
    for (const line of renderedLines(quote)) drawText(line.text, line.bounds);
    ctx.restore();
  }

  if (author && name) {
    const ink = applyTextStyle(name);
    const bounds = name.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(author).columnGap);
    const ornament = getComputedStyle(author, "::before");
    const width = parseFloat(ornament.width);
    const height = parseFloat(ornament.height);
    const y = bounds.top - cardBounds.top + (bounds.height - height) / 2;
    const left = bounds.left - cardBounds.left - gap - width;
    const right = bounds.right - cardBounds.left + gap;
    for (const x of [left, right]) {
      const fade = ctx.createLinearGradient(x, y, x + width, y);
      fade.addColorStop(x === left ? 0 : 1, "transparent");
      fade.addColorStop(x === left ? 1 : 0, ink);
      ctx.fillStyle = fade;
      ctx.fillRect(x, y, width, height);
    }

    let label = name.textContent ?? "";
    if (name.scrollWidth > name.clientWidth) {
      const segments = [...graphemes.segment(label)].map(({ segment }) => segment);
      while (segments.length && ctx.measureText(`${segments.join("")}…`).width > bounds.width) segments.pop();
      label = `${segments.join("")}…`;
    }
    const range = document.createRange();
    range.selectNodeContents(name);
    const textBounds = range.getBoundingClientRect();
    ctx.fillStyle = ink;
    drawText(label, new DOMRect(bounds.left, textBounds.top, bounds.width, textBounds.height));
  }

  ctx.restore();
}
