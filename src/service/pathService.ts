import { Types } from "mongoose";
import createHttpError from "http-errors";
import pathfinding, { DiagonalMovement } from "pathfinding";
import MapModel, { Map, MapCellTypes } from "../models/map";
import { PopulatedShoppingList } from "./shoppingListService";

export interface CellCoordinates {
  x: number;
  y: number;
  type?: string;
}

export interface Path {
  nodes: CellCoordinates[];
}

export interface IPathService {
  calculatePath(
    storeId: Types.ObjectId,
    shoppingList: PopulatedShoppingList
  ): Promise<CellCoordinates[][]>;
}

export class PathService implements IPathService {
  private mapRepository;
  constructor() {
    this.mapRepository = MapModel;
  }

  private calculateDiagonalDistance(
    cell1: CellCoordinates,
    cell2: CellCoordinates
  ) {
    const dx = cell1.x - cell2.x;
    const dy = cell1.y - cell2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private findNearestAccessiblePoint(
    grid: pathfinding.Grid,
    x: number,
    y: number,
    targetX: number,
    targetY: number
  ) {
    if (grid.isWalkableAt(targetX, targetY)) return { x: targetX, y: targetY };
    const up = { x: targetX - 1, y: targetY };
    const down = { x: targetX + 1, y: targetY };
    const left = { x: targetX, y: targetY - 1 };
    const right = { x: targetX, y: targetY + 1 };

    let distance = -1;
    let nearestPoint = null;

    if (grid.isWalkableAt(up.x, up.y)) {
      const dist = this.calculateDiagonalDistance({ x, y }, up);
      if (distance === -1 || dist < distance) {
        distance = dist;
        nearestPoint = up;
      }
    }

    if (grid.isWalkableAt(down.x, down.y)) {
      const dist = this.calculateDiagonalDistance({ x, y }, down);
      if (distance === -1 || dist < distance) {
        distance = dist;
        nearestPoint = down;
      }
    }

    if (grid.isWalkableAt(left.x, left.y)) {
      const dist = this.calculateDiagonalDistance({ x, y }, left);
      if (distance === -1 || dist < distance) {
        distance = dist;
        nearestPoint = left;
      }
    }

    if (grid.isWalkableAt(right.x, right.y)) {
      const dist = this.calculateDiagonalDistance({ x, y }, right);
      if (distance === -1 || dist < distance) {
        distance = dist;
        nearestPoint = right;
      }
    }
    if (!nearestPoint) throw new Error("invalid locations");
    return nearestPoint;
  }

  private findEntrance(map: Map): CellCoordinates {
    const positions = map.items;
    let location: CellCoordinates | null = null;
    positions.forEach((position) => {
      if (position.type === MapCellTypes.entrance)
        location = { x: position.x, y: position.y };
    });
    if (!location)
      throw createHttpError(404, "Loja não possui entrada cadastrada");
    return location;
  }

  private generatePermutations(arr: any) {
    const permutations: any[] = [];

    const permute = (arr: any, m = []) => {
      if (arr.length === 0) {
        permutations.push(m);
      } else {
        for (let i = 0; i < arr.length; i++) {
          const curr = arr.slice();
          const next = curr.splice(i, 1);
          permute(curr.slice(), m.concat(next));
        }
      }
    };

    permute(arr);
    return permutations;
  }

  private calculateShortestPath(
    grid: pathfinding.Grid,
    finder: pathfinding.Finder,
    entranceNode: CellCoordinates,
    shelfNodes: CellCoordinates[]
  ): CellCoordinates[] {
    let shortestPath = null;
    let shortestLength = Infinity;

    const permutations = this.generatePermutations(shelfNodes);

    for (const permutation of permutations) {
      let totalLength = 0;
      let startNode = entranceNode;

      for (const shelfNode of permutation) {
        const path = finder.findPath(
          startNode.x,
          startNode.y,
          shelfNode.x,
          shelfNode.y,
          grid.clone()
        );

        if (path.length > 0) {
          totalLength += path.length;
          startNode = shelfNode;
        } else {
          totalLength = Infinity;
          break;
        }
      }

      if (totalLength < shortestLength) {
        shortestLength = totalLength;
        shortestPath = permutation;
      }
    }

    return shortestPath;
  }

  async calculatePath(
    storeId: Types.ObjectId,
    shoppingList: PopulatedShoppingList
  ): Promise<CellCoordinates[][]> {
    const map = await this.mapRepository.findOne({ storeId }).exec();
    const coordinates = map?.items;
    if (!coordinates) throw createHttpError(404, "Mapa sem locais");
    const entrance = this.findEntrance(map as Map);
    console.log(entrance);

    const grid = new pathfinding.Grid(10, 10);

    coordinates.forEach((cell) => {
      if (cell.type !== MapCellTypes.entrance)
        grid.setWalkableAt(cell.x, cell.y, false);
    });
    console.log(coordinates);
    console.log(grid);
    const finder = new pathfinding.AStarFinder({
      diagonalMovement: DiagonalMovement.OnlyWhenNoObstacles,
    });
    const entranceNode = entrance;
    const shelfNodes = shoppingList.products
      .map((product) => product.product.location)
      .filter((v) => v !== undefined) as { x: number; y: number }[];
    // const shelfNodes = [
    //   { x: 6, y: 5 },
    //   { x: 4, y: 8 },
    //   { x: 9, y: 6 },
    // ];

    const shelfNodesWalkable = shelfNodes
      .map((node) =>
        this.findNearestAccessiblePoint(grid, 0, 0, node.x, node.y)
      )
      .filter((point) => point !== null);
    console.log("shelfNodesWalkable", shelfNodesWalkable);
    let start = entranceNode;
    const result = this.calculateShortestPath(
      grid,
      finder,
      entranceNode,
      shelfNodesWalkable
    );

    const shortestPaths = result.map((shelfNode: any) => {
      console.log("shelfNode", shelfNode);
      const gridBackup = grid.clone();
      const path = finder.findPath(
        start.x,
        start.y,
        shelfNode.x,
        shelfNode.y,
        gridBackup
      );
      start = shelfNode;
      return path;
    });

    console.log("shortestPaths", shortestPaths);
    const formattedPaths = shortestPaths.map((path) => {
      return path.map((node) => ({ x: node[0], y: node[1] }));
    });

    console.log("formattedPaths", formattedPaths);
    console.log("shortestPaths", shortestPaths);

    return formattedPaths;
  }
}
