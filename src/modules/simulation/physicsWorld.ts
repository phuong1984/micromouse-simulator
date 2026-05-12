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
  const goal = cellToWorld(grid, grid.goal.row, grid.goal.col);
  const size = grid.cellSize * 0.8;
  const goalBody = Matter.Bodies.rectangle(goal.x, goal.y, size, size, {
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
