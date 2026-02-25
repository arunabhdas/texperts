import EasyStar from "easystarjs";

export class PathfindingService {
  private easystar: EasyStar.js;

  constructor(walkableGrid: boolean[][]) {
    this.easystar = new EasyStar.js();

    // Convert boolean grid to numeric: 0 = walkable, 1 = blocked
    const numericGrid = walkableGrid.map((row) =>
      row.map((cell) => (cell ? 0 : 1)),
    );

    this.easystar.setGrid(numericGrid);
    this.easystar.setAcceptableTiles([0]);
    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();
  }

  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Promise<Array<{ x: number; y: number }> | null> {
    return new Promise((resolve) => {
      this.easystar.findPath(startX, startY, endX, endY, (path) => {
        if (path === null) {
          resolve(null);
        } else {
          // EasyStar returns path including start tile — skip it
          resolve(path.slice(1));
        }
      });
      this.easystar.calculate();
    });
  }
}
