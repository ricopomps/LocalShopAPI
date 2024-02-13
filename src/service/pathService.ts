import createHttpError from "http-errors";
import { Types } from "mongoose";
import pathfinding, { DiagonalMovement } from "pathfinding";
import MapModel, { Map, MapCellTypes } from "../models/map";
import { PopulatedShoppingList } from "./shoppingListService";

export interface CellCoordinates {
  x: number;
  y: number;
  type?: string;
  productId?: Types.ObjectId;
  parent?: CellCoordinates | null;
}

export interface Path {
  nodes: CellCoordinates[];
}

export interface IPathService {
  calculatePath(
    storeId: Types.ObjectId,
    shoppingList: PopulatedShoppingList
  ): Promise<CellCoordinates[][]>;

  calculatePathProfundidade(
    storeId: Types.ObjectId,
    shoppingList: PopulatedShoppingList
  ): Promise<CellCoordinates[][]>;

  calculatePathLargura(
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

  async calculatePathProfundidade(
    storeId: Types.ObjectId,
    shoppingList: PopulatedShoppingList
  ): Promise<CellCoordinates[][]> {
    console.log("calculatePathProfundidade");
    const map = await this.mapRepository.findOne({ storeId }).exec(); // Obter o mapa da loja
    const coordinates = map?.items;
    if (!coordinates) throw createHttpError(404, "Mapa sem locais");
    const entrance = this.findEntrance(map as Map); // Encontra entrada da loja

    const gridWidth = 10;
    const gridHeight = 10;
    const grid: boolean[][] = Array.from({ length: gridHeight }, () =>
      Array(gridWidth).fill(true)
    ); // monta grid booleana, true = pode andar, false = não pode andar

    coordinates.forEach((cell) => {
      if (cell.type !== MapCellTypes.entrance) grid[cell.y][cell.x] = false; // Marca grids que não pode passar como falso
    });

    const entranceNode = entrance;
    const shelfNodes = shoppingList.products //Obtém os endereços das estantes dos produtos
      .map((product) => {
        return {
          ...product.product.location,
          productId: product.product._id,
        };
      })
      .filter((v) => v !== undefined) as CellCoordinates[];

    const shelfNodesWalkable = shelfNodes //Obtém os endereços da célula andável mais próximas das estantes dos produtos
      .map((node) => {
        console.log(
          "findNearestAccessiblePointProfundidade",
          node,
          this.findNearestAccessiblePointProfundidade(
            grid,
            0,
            0,
            node.x,
            node.y
          )
        );
        return {
          ...this.findNearestAccessiblePointProfundidade(
            grid,
            0,
            0,
            node.x,
            node.y
          ),
          productId: node.productId,
        };
      })
      .filter((point) => point !== null) as CellCoordinates[];

    let start = entranceNode;
    const shortestPaths: any[] = [];

    console.log("shelfNodesWalkable", shelfNodesWalkable);

    for (const shelfNode of shelfNodesWalkable) {
      const path = this.depthFirstSearch(grid, start, shelfNode); //Realiza a busca
      console.log("path", path);
      if (path) {
        shortestPaths.push({ path, productId: shelfNode.productId });
        start = shelfNode;
      }
    }
    console.log("shortestPaths", shortestPaths);
    const formattedPaths = shortestPaths.map((path) => {
      //Formata os caminhos para que o caminho fique vinculado a um produto, e o front consiga mostrar ele do jeito certo
      const formattedPath = path.path.map((node: any) => {
        console.log("formattedPathNode", node);
        return {
          x: node.x,
          y: node.y,
          productId: path.productId,
        };
      });

      return formattedPath;
    });

    console.log("formattedPaths", formattedPaths);
    return formattedPaths;
  }

  depthFirstSearch(
    grid: boolean[][],
    start: CellCoordinates,
    end: CellCoordinates
  ): CellCoordinates[] | null {
    console.log("start", start);
    console.log("end", end);
    const stack: CellCoordinates[] = [];
    const visited: Set<string> = new Set();

    stack.push(start);
    visited.add(`${start.x},${start.y}`);

    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      if (currentNode.x === end.x && currentNode.y === end.y) {
        console.log("Found path", currentNode);
        return this.reconstructPath(currentNode);
      }

      const neighbors = this.getNeighbors(grid, currentNode);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        neighbor.parent = currentNode;
        if (!visited.has(neighborKey)) {
          console.log("pushToStack", neighbor);
          stack.push(neighbor);
          visited.add(neighborKey);
        }
      }
    }
    console.log("stack", stack);
    return null;
  }

  reconstructPath(end: CellCoordinates): CellCoordinates[] {
    const path: CellCoordinates[] = [];
    let current: CellCoordinates | undefined | null = end;
    while (current) {
      path.push(current);
      current = current.parent;
    }
    return path.reverse();
  }

  getNeighbors(grid: boolean[][], node: CellCoordinates): CellCoordinates[] {
    const neighbors: CellCoordinates[] = [];
    const { x, y } = node;
    const offsets = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // Assuming 4-directional movement

    for (const [dx, dy] of offsets) {
      const newX = x + dx;
      const newY = y + dy;

      if (
        newX >= 0 &&
        newX < grid[0].length &&
        newY >= 0 &&
        newY < grid.length &&
        grid[newY][newX]
      ) {
        neighbors.push({ x: newX, y: newY, parent: node });
      }
    }

    return neighbors;
  }

  findNearestAccessiblePointProfundidade(
    grid: boolean[][],
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
  ): CellCoordinates | null {
    if (grid[targetY][targetX]) {
      return { x: targetX, y: targetY, parent: null };
    }

    const targetNeighbors = this.getNeighbors(grid, {
      x: targetX,
      y: targetY,
      parent: null,
    });

    let closestNode: CellCoordinates | null = null;
    let currentDistance: number | null = null;
    targetNeighbors.forEach((currentNode) => {
      if (grid[currentNode.y][currentNode.x]) {
        const distance = this.calculateManhattanDistance(
          startX,
          startY,
          currentNode.x,
          currentNode.y
        );
        if (!currentDistance || distance < currentDistance) {
          closestNode = currentNode;
          currentDistance = distance;
        }
      }
    });

    return closestNode;
  }

  calculateManhattanDistance(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
  ): number {
    return Math.abs(targetX - startX) + Math.abs(targetY - startY);
  }

  async calculatePathLargura(
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
