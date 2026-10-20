/* Geometry shared by automatic placement, dragging and keyboard placement. */
export const HugoWidgetLayout = (() => {
  const GAP = 16;

  function overlaps(a, b, gap = GAP) {
    return (
      a.x < b.x + b.width + gap &&
      a.x + a.width + gap > b.x &&
      a.y < b.y + b.height + gap &&
      a.y + a.height + gap > b.y
    );
  }

  function resolve(size, preferred, canvas, occupied = []) {
    const maxX = canvas.width - size.width;
    const maxY = canvas.height - size.height;
    if (maxX < 0 || maxY < 0) return null;

    const clamp = (value, max) => Math.max(0, Math.min(max, value));
    const candidates = [
      { x: clamp(preferred.x, maxX), y: clamp(preferred.y, maxY) },
    ];
    // Side lanes reserve the complete middle for the conversation and avatar.
    for (const x of [0, maxX]) {
      candidates.push({ x, y: clamp(preferred.y, maxY) });
      for (let y = 0; y <= maxY; y += 8) candidates.push({ x, y });
      candidates.push({ x, y: maxY });
    }
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - preferred.x, a.y - preferred.y) -
        Math.hypot(b.x - preferred.x, b.y - preferred.y),
    );
    return (
      candidates.find(
        (point) =>
          !occupied.some((rect) => overlaps({ ...point, ...size }, rect)),
      ) || null
    );
  }

  return { resolve, overlaps, gap: GAP };
})();
