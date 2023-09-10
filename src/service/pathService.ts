import { Types } from "mongoose";
import createHttpError from "http-errors";
import pathfinding, { DiagonalMovement } from "pathfinding";
import MapModel, { Map, MapCellTypes } from "../models/map";
import { PopulatedShoppingList } from "./shoppingListService";

export interface CellCoordinates {
  x: number;
  y: number;
  type?: string;
  productId?: Types.ObjectId;
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

  private generatePermutations(arr: CellCoordinates[]) {
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
    shelfNodes: CellCoordinates[],
    returnTrip?: boolean
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

      if (returnTrip) {
        const returnTrip = finder.findPath(
          startNode.x,
          startNode.y,
          entranceNode.x,
          entranceNode.y,
          grid.clone()
        );

        if (returnTrip.length > 0) {
          totalLength += returnTrip.length;
        } else {
          totalLength = Infinity;
        }

        if (totalLength < shortestLength) {
          shortestLength = totalLength;
          shortestPath = permutation.concat([{ ...entranceNode }]);
        }
      } else {
        if (totalLength < shortestLength) {
          shortestLength = totalLength;
          shortestPath = permutation;
        }
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

    const grid = new pathfinding.Grid(10, 10);

    coordinates.forEach((cell) => {
      if (cell.type !== MapCellTypes.entrance)
        grid.setWalkableAt(cell.x, cell.y, false);
    });

    const finder = new pathfinding.AStarFinder({
      diagonalMovement: DiagonalMovement.OnlyWhenNoObstacles,
    });

    const entranceNode = entrance;
    const shelfNodes = shoppingList.products
      .map((product) => {
        return {
          ...product.product.location,
          productId: product.product._id,
        };
      })
      .filter((v) => v !== undefined) as CellCoordinates[];

    const shelfNodesWalkable = shelfNodes
      .map((node) => {
        return {
          ...this.findNearestAccessiblePoint(grid, 0, 0, node.x, node.y),
          productId: node.productId,
        };
      })
      .filter((point) => point !== null);

    let start = entranceNode;
    const result = this.calculateShortestPath(
      grid,
      finder,
      entranceNode,
      shelfNodesWalkable,
      true
    );

    const shortestPaths = result.map((shelfNode: any) => {
      const gridBackup = grid.clone();
      const path = finder.findPath(
        start.x,
        start.y,
        shelfNode.x,
        shelfNode.y,
        gridBackup
      );
      start = shelfNode;
      return { path: path, productId: shelfNode.productId };
    });

    const formattedPaths = shortestPaths.map((path) => {
      const formattedPath = path.path.map((node) => ({
        x: node[0],
        y: node[1],
        productId: path.productId,
      }));

      return formattedPath;
    });

    return formattedPaths;
  }
}
