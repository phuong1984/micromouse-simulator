import Matter from 'matter-js';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript/micropython.mjs';
import type { MicroPythonModule } from '@micropython/micropython-webassembly-pyscript/micropython.mjs';
import type { MainToWorker, WorkerToMain } from '../shared/types/workerMessages';
import { createPhysicsWorld, addMazeWalls, addGoalZone, setupGoalDetection, PHYSICS_TIMESTEP_MS } from '../modules/simulation/physicsWorld';
import { createRobotBody, extractRobotState } from '../modules/simulation/robotBody';
import type { RobotPhysicsState } from '../modules/simulation/robotBody';
import { applyMotorForces } from '../modules/simulation/motorModel';
import type { RobotSpec } from '../shared/types/robot';
import type { MazeGrid } from '../shared/types/maze';
import { cellToWorld, mazeToWallSegments } from '../shared/utils/maze';
import wasmUrl from '@micropython/micropython-webassembly-pyscript/micropython.wasm?url';

let engine: Matter.Engine | null = null;
let robotPhysics: RobotPhysicsState | null = null;
let robotSpec: RobotSpec | null = null;
let isRunning = false;
let isFinished = false;
let tickCount = 0;
let startTime = 0;
let micropython: MicroPythonModule | null = null;
let logBuffer: string[] = [];

interface PendingMove {
  type: 'distance' | 'angle';
  startX?: number;
  startY?: number;
  startAngle?: number;
  targetDistance?: number;
  targetAngleDiff?: number;
  resolve: () => void;
}

let pendingMoves: PendingMove[] = [];

const FORWARD_RPM = 1200;
const TURN_RPM = 1200;
const DIAGONAL_INNER_RPM = 600;

function postToMain(msg: WorkerToMain) {
  self.postMessage(msg);
}

function checkPendingMoves() {
  if (!robotPhysics) return;

  const body = robotPhysics.body;
  pendingMoves = pendingMoves.filter(move => {
    if (move.type === 'distance') {
      const dx = body.position.x - move.startX!;
      const dy = body.position.y - move.startY!;
      const traveled = Math.sqrt(dx * dx + dy * dy);
      if (traveled >= move.targetDistance! - 0.5) {
        robotPhysics!.motorSpeeds.forEach((_, key) => robotPhysics!.motorSpeeds.set(key, 0));
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
        move.resolve();
        return false;
      }
    } else if (move.type === 'angle') {
      const diff = normalizeAngle(body.angle - move.startAngle!);
      if (Math.abs(diff) >= Math.abs(move.targetAngleDiff!) - 0.02) {
        robotPhysics!.motorSpeeds.forEach((_, key) => robotPhysics!.motorSpeeds.set(key, 0));
        Matter.Body.setAngularVelocity(body, 0);
        move.resolve();
        return false;
      }
    }
    return true;
  });
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function tick() {
  if (!isRunning || isFinished || !engine || !robotPhysics || !robotSpec) return;

  try {
    applyMotorForces(engine, robotPhysics, robotSpec, PHYSICS_TIMESTEP_MS / 1000);
    Matter.Engine.update(engine, PHYSICS_TIMESTEP_MS);
    checkPendingMoves();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logBuffer.push(`[physics error] ${message}`);
  }

  const state = extractRobotState(robotPhysics.body);

  const elapsedMs = performance.now() - startTime;

  // forward accumulated logs with state update
  const extra: { logs?: string[] } = {};
  if (logBuffer.length > 0) {
    extra.logs = logBuffer.slice();
    logBuffer = [];
  }

  postToMain({
    type: 'STATE_UPDATE',
    payload: {
      state: {
        tick: tickCount++,
        robot: state,
        sensors: {},
        motorRPMs: [0, 0],
        isFinished: false,
        elapsedMs,
        status: 'running',
      },
      ...extra,
    },
  });

  setTimeout(tick, PHYSICS_TIMESTEP_MS);
}

function startTickLoop() {
  if (!engine || !robotPhysics || !robotSpec) return;
  isRunning = true;
  isFinished = false;
  tickCount = 0;
  startTime = performance.now();
  pendingMoves = [];
  setTimeout(tick, PHYSICS_TIMESTEP_MS);
}

function stopTickLoop() {
  isRunning = false;
}

function setupAsyncRobotAPI(mp: MicroPythonModule) {
  const robotModule: Record<string, unknown> = {
    move: (distance: number) => {
      if (!robotPhysics || !isRunning) return Promise.resolve();

      const body = robotPhysics.body;
      return new Promise<void>((resolve) => {
        pendingMoves.push({
          type: 'distance',
          startX: body.position.x,
          startY: body.position.y,
          targetDistance: distance,
          resolve,
        });
        robotPhysics!.motorSpeeds.forEach((_, key) => robotPhysics!.motorSpeeds.set(key, FORWARD_RPM));
      });
    },

    turn: (angle: number) => {
      if (!robotPhysics || !isRunning) return Promise.resolve();

      const body = robotPhysics.body;
      return new Promise<void>((resolve) => {
        pendingMoves.push({
          type: 'angle',
          startAngle: body.angle,
          targetAngleDiff: (angle * Math.PI) / 180,
          resolve,
        });
        const speed = angle > 0 ? TURN_RPM : -TURN_RPM;
        robotPhysics!.motorSpeeds.set('0', -speed);
        robotPhysics!.motorSpeeds.set('1', speed);
      });
    },

    stop: () => {
      logBuffer.push('[stop]');
      const rp = robotPhysics;
      if (!rp) return;
      rp.motorSpeeds.forEach((_, key) => rp.motorSpeeds.set(key, 0));
    },

    set_motor_speeds: (left: number, right: number) => {
      logBuffer.push(`[set_motor_speeds] left=${left} right=${right}`);
      if (!robotPhysics) return;
      robotPhysics.motorSpeeds.set('0', left);
      robotPhysics.motorSpeeds.set('1', right);
    },

    get_sensor: (_sensorId: string) => {
      return -1;
    },

    get_position: () => {
      if (!robotPhysics) return { x: 0, y: 0 };
      return { x: robotPhysics.body.position.x, y: robotPhysics.body.position.y };
    },

    get_angle: () => {
      if (!robotPhysics) return 0;
      return (robotPhysics.body.angle * 180) / Math.PI;
    },

    log: (msg: string) => {
      logBuffer.push(`[log] ${msg}`);
    },
  };

  mp.registerJsModule('robot', robotModule);
}

async function initMicroPython(): Promise<void> {
  if (micropython) return;

  const mp = await loadMicroPython({
    url: wasmUrl,
    stdout: (data: string) => {
      logBuffer.push(data);
    },
    stderr: (data: string) => {
      logBuffer.push(`[stderr] ${data}`);
    },
  });

  setupAsyncRobotAPI(mp);
  micropython = mp;
}

async function runUserCode(code: string): Promise<void> {
  const mp = micropython;
  if (!mp) return;

  const withImport = `import robot\n${code}`;
  await mp.runPythonAsync(withImport);
}

function initPhysics(spec: RobotSpec, grid: MazeGrid) {
  robotSpec = spec;

  engine = createPhysicsWorld();

  const startPos = cellToWorld(grid, grid.start.row, grid.start.col);
  robotPhysics = createRobotBody(spec, startPos.x, startPos.y);
  Matter.Composite.add(engine.world, robotPhysics.body);

  const segments = mazeToWallSegments(grid);
  addMazeWalls(engine, segments);
  addGoalZone(engine, grid);

  setupGoalDetection(engine, () => {
    if (!isRunning || isFinished) return;
    logBuffer.push('[goal] detected!');
    isFinished = true;
    isRunning = false;
    pendingMoves = [];
    postToMain({
      type: 'FINISHED',
      payload: { elapsedMs: performance.now() - startTime, path: [], logs: [...logBuffer] },
    });
  });

  // log wall collisions
  Matter.Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const labels = [pair.bodyA.label, pair.bodyB.label];
      if (labels.includes('robot') && labels.includes('wall')) {
        const body = robotPhysics!.body;
        logBuffer.push(`[collision] tick=${tickCount} pos=(${body.position.x.toFixed(1)},${body.position.y.toFixed(1)}) vel=(${body.velocity.x.toFixed(3)},${body.velocity.y.toFixed(3)})`);
      }
    }
  });
}

function resetPhysics() {
  if (engine) {
    Matter.World.clear(engine.world, false);
    Matter.Engine.clear(engine);
  }
  engine = null;
  robotPhysics = null;
  robotSpec = null;
  isRunning = false;
  isFinished = false;
  tickCount = 0;
  pendingMoves = [];
}

function handleKeyboard(payload: { up: boolean; down: boolean; left: boolean; right: boolean }) {
  if (!robotPhysics || !isRunning) return;

  const { up, down, left, right } = payload;

  if (up && left) {
    robotPhysics.motorSpeeds.set('0', DIAGONAL_INNER_RPM);
    robotPhysics.motorSpeeds.set('1', FORWARD_RPM);
  } else if (up && right) {
    robotPhysics.motorSpeeds.set('0', FORWARD_RPM);
    robotPhysics.motorSpeeds.set('1', DIAGONAL_INNER_RPM);
  } else if (down && left) {
    robotPhysics.motorSpeeds.set('0', -DIAGONAL_INNER_RPM);
    robotPhysics.motorSpeeds.set('1', -FORWARD_RPM);
  } else if (down && right) {
    robotPhysics.motorSpeeds.set('0', -FORWARD_RPM);
    robotPhysics.motorSpeeds.set('1', -DIAGONAL_INNER_RPM);
  } else if (up) {
    robotPhysics.motorSpeeds.set('0', FORWARD_RPM);
    robotPhysics.motorSpeeds.set('1', FORWARD_RPM);
  } else if (down) {
    robotPhysics.motorSpeeds.set('0', -FORWARD_RPM);
    robotPhysics.motorSpeeds.set('1', -FORWARD_RPM);
  } else if (left) {
    robotPhysics.motorSpeeds.set('0', -TURN_RPM);
    robotPhysics.motorSpeeds.set('1', TURN_RPM);
  } else if (right) {
    robotPhysics.motorSpeeds.set('0', TURN_RPM);
    robotPhysics.motorSpeeds.set('1', -TURN_RPM);
  } else {
    robotPhysics.motorSpeeds.set('0', 0);
    robotPhysics.motorSpeeds.set('1', 0);
  }
}

async function handleStart(payload: { robotSpec: RobotSpec; mazeGrid: MazeGrid; pythonCode: string }) {
  logBuffer = [];
  initPhysics(payload.robotSpec, payload.mazeGrid);
  startTickLoop();

  if (!payload.pythonCode.trim()) {
    return;
  }

  try {
    await initMicroPython();
    await runUserCode(payload.pythonCode);

    if (isRunning && !isFinished) {
      isRunning = false;
      postToMain({
        type: 'FINISHED',
        payload: { elapsedMs: performance.now() - startTime, path: [], logs: [...logBuffer] },
      });
    }
  } catch (err: unknown) {
    isRunning = false;
    const message = err instanceof Error ? err.message : String(err);
    postToMain({
      type: 'PYTHON_ERROR',
      payload: { error: message },
    });
  }
}

function handleStop() {
  isRunning = false;
  pendingMoves = [];
}

function handleReset() {
  stopTickLoop();
  resetPhysics();
  logBuffer = [];
}

self.onmessage = (event: MessageEvent<MainToWorker>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'START':
      handleStart(msg.payload);
      break;
    case 'STOP':
      handleStop();
      break;
    case 'STEP':
      break;
    case 'RESET':
      handleReset();
      break;
    case 'KEYBOARD':
      handleKeyboard(msg.payload);
      break;
  }
};

postToMain({ type: 'READY' });
