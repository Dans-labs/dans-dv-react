export function isRectangle(coords: number[][]): boolean {
    if (!Array.isArray(coords) || coords.length < 5) return false;
  
    // Ensure polygon is closed
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) return false;

  
    const corners = coords.slice(0, -1);
    if (corners.length !== 4) return false;
  
    const isPerpendicular = (p1: number[], p2: number[], p3: number[]): boolean => {
      const v1: number[] = [p2[0] - p1[0], p2[1] - p1[1]];
      const v2: number[] = [p3[0] - p2[0], p3[1] - p2[1]];
      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      return Math.abs(dot) < 1e-10;
    };
  
    for (let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];
      const p3 = corners[(i + 2) % 4];
      if (!isPerpendicular(p1, p2, p3)) return false;
    }
  
    return true;
  }