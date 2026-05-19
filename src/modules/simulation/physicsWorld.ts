import Matter from 'matter-js';
import type { WallSegment } from '../../shared/types/simulation';
import type { MazeGrid } from '../../shared/types/maze';
import { cellToWorld } from '../../shared/utils/maze';

export const PHYSICS_TIMESTEP_MS = 1000 / 60;

export function createPhysicsWorld(): Matter.Engine {
  return Matter.Engine.create({
    gravity: { x: 0, y: 0 },
    positionIterations: 10,
    velocityIterations: 8,
  });
}

export function addMazeWalls(engine: Matter.Engine, segments: WallSegment[]): Matter.Body[] {
  const wallBodies = segments.map(seg => {
    const body = Matter.Bodies.rectangle(seg.x, seg.y, seg.width, seg.height, {
      isStatic: true,
      label: 'wall',
      restitution: 0.1,
      friction: 0.8,
      collisionFilter: { category: 0x0002, mask: 0x0001 },
    });
    return body;
  });

  Matter.Composite.add(engine.world, wallBodies);
  return wallBodies;
}

export function addGoalZone(engine: Matter.Engine, grid: MazeGrid): Matter.Body {
  const isCenter2x2 = grid.goalType === 'center2x2';
  const goal = cellToWorld(grid, grid.goal.row, grid.goal.col);

  // For 2x2, the center is between the 4 cells
  let goalX = goal.x;
  let goalY = goal.y;
  let sizeX = grid.cellSize * 0.8;
  let sizeY = grid.cellSize * 0.8;

  if (isCenter2x2) {
    const cs = grid.cellSize;
    goalX = goal.x + cs / 2;
    goalY = goal.y + cs / 2;
    sizeX = cs * 1.8;
    sizeY = cs * 1.8;
  }

  const goalBody = Matter.Bodies.rectangle(goalX, goalY, sizeX, sizeY, {
    isStatic: true,
    isSensor: true,
    label: 'goal-zone',
    collisionFilter: { category: 0x0002, mask: 0x0001 },
  });
  Matter.Composite.add(engine.world, goalBody);
  return goalBody;
}

export function setupGoalDetection(engine: Matter.Engine, onGoal: () => void): void {
  Matter.Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const labels = [pair.bodyA.label, pair.bodyB.label];
      if (labels.includes('robot') && labels.includes('goal-zone')) {
        onGoal();
      }
    }
  });
}
