import Matter from 'matter-js';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript/micropython.mjs';
import type { MicroPythonModule } from '@micropython/micropython-webassembly-pyscript/micropython.mjs';
import type { MainToWorker, WorkerToMain } from '../shared/types/workerMessages';
import { createPhysicsWorld, addMazeWalls, addGoalZone, setupGoalDetection, PHYSICS_TIMESTEP_MS } from '../modules/simulation/physicsWorld';
import { createRobotBody, extractRobotState } from '../modules/simulation/robotBody';
import type { RobotPhysicsState } from '../modules/simulation/robotBody';
import { applyMotorForces } from '../modules/simulation/motorModel';
import { SensorSimulator } from '../modules/simulation/sensorSimulator';
import type { RobotSpec } from '../shared/types/robot';
import type { MazeGrid } from '../shared/types/maze';
import type { PathPoint } from '../shared/types/telemetry';
import { cellToWorld, mazeToWallSegments } from '../shared/utils/maze';
import wasmUrl from '@micropython/micropython-webassembly-pyscript/micropython.wasm?url';

let engine: Matter.Engine | null = null;
let robotPhysics: RobotPhysicsState | null = null;
let robotSpec: RobotSpec | null = null;
let sensorSim: SensorSimulator | null = null;
let isRunning = false;
let isFinished = false;
let tickCount = 0;
let startTime = 0;
let micropython: MicroPythonModule | null = null;
let logBuffer: string[] = [];
let replayPath: PathPoint[] = [];
let isAgainstWall = false;
let mazeGrid: MazeGrid | null = null;
let bypassGoalDetect = false;
const userSetWheels = new Map<string, number>();

interface PendingMove {
  type: 'distance' | 'angle';
  startX?: number;
  startY?: number;
  startAngle?: number;
  targetDistance?: number;
  targetAngleDiff?: number;
  resolve: () => void;
  stuckTicks?: number;
  prevCheckX?: number;
  prevCheckY?: number;
}

let pendingMoves: PendingMove[] = [];

function wheelMaxRPM(): number {
  return robotSpec && robotSpec.wheels.length > 0
    ? Math.min(...robotSpec.wheels.map(w => w.maxRPM))
    : 500;
}

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
      if (isAgainstWall) {
        const cx = body.position.x;
        const cy = body.position.y;
        if (move.prevCheckX !== undefined && move.prevCheckY !== undefined) {
          const delta = Math.sqrt((cx - move.prevCheckX) ** 2 + (cy - move.prevCheckY) ** 2);
          move.stuckTicks = (delta < 0.5) ? (move.stuckTicks ?? 0) + 1 : 0;
        } else {
          move.stuckTicks = 0;
        }
        move.prevCheckX = cx;
        move.prevCheckY = cy;

        if ((move.stuckTicks ?? 0) >= 15) {
          logBuffer.push(`[move] stuck at ${traveled.toFixed(1)}mm (target ${move.targetDistance})`);
          robotPhysics!.motorSpeeds.forEach((_, key) => robotPhysics!.motorSpeeds.set(key, 0));
          Matter.Body.setVelocity(body, { x: 0, y: 0 });
          move.resolve();
          return false;
        }
      }
    } else if (move.type === 'angle') {
      const diff = normalizeAngle(body.angle - move.startAngle!);
      const remaining = Math.abs(move.targetAngleDiff!) - Math.abs(diff);
      if (remaining > 0 && remaining < 0.15) {
        const factor = remaining / 0.15;
        const entries = Array.from(robotPhysics!.motorSpeeds.entries());
        for (const [id, speed] of entries) {
          robotPhysics!.motorSpeeds.set(id, speed * factor);
        }
      }
      if (Math.abs(diff) >= Math.abs(move.targetAngleDiff!) - 0.05) {
        robotPhysics!.motorSpeeds.forEach((_, key) => robotPhysics!.motorSpeeds.set(key, 0));
        Matter.Body.setAngle(body, move.startAngle! + move.targetAngleDiff!);
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

  let sensorReadings: Record<string, number> = {};
  try {
    applyMotorForces(engine, robotPhysics, robotSpec, PHYSICS_TIMESTEP_MS / 1000);
    Matter.Engine.update(engine, PHYSICS_TIMESTEP_MS);
    checkPendingMoves();
    if (sensorSim) {
      sensorReadings = sensorSim.update(
        robotPhysics.body.position.x,
        robotPhysics.body.position.y,
        robotPhysics.body.angle,
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logBuffer.push(`[physics error] ${message}`);
  }

  const state = extractRobotState(robotPhysics.body);
  const elapsedMs = performance.now() - startTime;

  replayPath.push({
    tick: tickCount,
    x: state.x,
    y: state.y,
    angle: state.angle,
    sensorReadings: { ...sensorReadings },
    elapsedMs,
  });

  // forward accumulated logs with state update
  const extra: { logs?: string[] } = {};
  if (logBuffer.length > 0) {
    extra.logs = logBuffer.slice();
    logBuffer = [];
  }

  const motorRPMs = robotSpec.wheels.map(w => robotPhysics!.motorSpeeds.get(w.id) ?? 0);

  postToMain({
    type: 'STATE_UPDATE',
    payload: {
      state: {
        tick: tickCount++,
        robot: state,
        sensors: sensorReadings,
        motorRPMs,
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
        robotPhysics!.motorSpeeds.forEach((_, key) => {
          if (userSetWheels.has(key)) {
            robotPhysics!.motorSpeeds.set(key, userSetWheels.get(key)!);
          } else {
            const wheel = robotSpec!.wheels.find(w => w.id === key);
            if (wheel) robotPhysics!.motorSpeeds.set(key, wheel.maxRPM);
          }
        });
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
        const rpm = (userSetWheels.size > 0)
          ? Array.from(userSetWheels.values()).reduce((a, b) => a + Math.abs(b), 0) / userSetWheels.size
          : wheelMaxRPM() * 5;

        const speed = angle > 0 ? rpm : -rpm;
        const wheelIds = robotSpec!.wheels.map(w => w.id);
        if (wheelIds.length >= 2) {
          robotPhysics!.motorSpeeds.set(wheelIds[0], speed);
          robotPhysics!.motorSpeeds.set(wheelIds[1], -speed);
        }
      });
    },

    stop: () => {
      const rp = robotPhysics;
      if (!rp) return;
      rp.motorSpeeds.forEach((_, key) => rp.motorSpeeds.set(key, 0));
    },

    set_wheel_speed: (wheelId: string, rpm: number) => {
      if (!robotPhysics || !robotSpec) return;
      const wheel = robotSpec.wheels.find(w => w.id === wheelId);
      if (wheel) {
        const clamped = Math.sign(rpm) * Math.min(Math.abs(rpm), wheel.maxRPM);
        robotPhysics.motorSpeeds.set(wheelId, clamped);
        userSetWheels.set(wheelId, clamped);
      }
    },

    get_sensor: (sensorId: string) => {
      if (sensorSim && robotPhysics) {
        const readings = sensorSim.update(
          robotPhysics.body.position.x,
          robotPhysics.body.position.y,
          robotPhysics.body.angle,
        );
        return readings[sensorId] ?? -1;
      }
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

    at_goal: () => {
      return isFinished;
    },

    log: (msg: string) => {
      logBuffer.push(`[log] ${msg}`);
    },

    reset_position: () => {
      if (robotPhysics && mazeGrid) {
        const startPos = cellToWorld(mazeGrid, mazeGrid.start.row, mazeGrid.start.col);
        Matter.Body.setPosition(robotPhysics.body, { x: startPos.x, y: startPos.y });
        Matter.Body.setAngle(robotPhysics.body, 0);
        Matter.Body.setVelocity(robotPhysics.body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(robotPhysics.body, 0);
        robotPhysics.motorSpeeds.forEach((_, key) => robotPhysics!.motorSpeeds.set(key, 0));
        pendingMoves = [];
      }
    },

    reset_timer: () => {
      startTime = performance.now();
      tickCount = 0;
      replayPath = [];
    },

    sleep: (ms: number) => {
      return new Promise<void>(resolve => setTimeout(resolve, ms));
    },

    bypass_goal_detect: (enable: boolean) => {
      bypassGoalDetect = !!enable;
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
  mazeGrid = grid;

  engine = createPhysicsWorld();

  const startPos = cellToWorld(grid, grid.start.row, grid.start.col);
  robotPhysics = createRobotBody(spec, startPos.x, startPos.y);
  Matter.Composite.add(engine.world, robotPhysics.body);

  const segments = mazeToWallSegments(grid);
  addMazeWalls(engine, segments);
  addGoalZone(engine, grid);
  sensorSim = new SensorSimulator(spec, segments);

  setupGoalDetection(engine, () => {
    if (!isRunning || isFinished) return;
    logBuffer.push('[goal] detected!');
    
    if (bypassGoalDetect) {
      return;
    }

    isFinished = true;
    isRunning = false;
    pendingMoves = [];
    postToMain({
      type: 'FINISHED',
      payload: { elapsedMs: performance.now() - startTime, path: replayPath, logs: [...logBuffer], reason: 'goal' },
    });
  });

  Matter.Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const labels = [pair.bodyA.label, pair.bodyB.label];
      if (labels.includes('robot') && labels.includes('wall')) {
        isAgainstWall = true;
      }
    }
  });
  Matter.Events.on(engine, 'collisionEnd', (event) => {
    for (const pair of event.pairs) {
      const labels = [pair.bodyA.label, pair.bodyB.label];
      if (labels.includes('robot') && labels.includes('wall')) {
        isAgainstWall = false;
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
  mazeGrid = null;
  sensorSim = null;
  isRunning = false;
  isFinished = false;
  isAgainstWall = false;
  bypassGoalDetect = false;
  userSetWheels.clear();
  tickCount = 0;
  pendingMoves = [];
}

function wheelId(robotSpec: RobotSpec, idx: number): string {
  return robotSpec.wheels[idx]?.id ?? String(idx);
}

function handleKeyboard(payload: { up: boolean; down: boolean; left: boolean; right: boolean }) {
  if (!robotPhysics || !isRunning || !robotSpec) return;

  const { up, down, left, right } = payload;
  const w0 = wheelId(robotSpec, 0);
  const w1 = wheelId(robotSpec, 1);
  const rpm = wheelMaxRPM();
  const inner = Math.round(rpm * 0.5);

  if (up && left) {
    robotPhysics.motorSpeeds.set(w0, inner);
    robotPhysics.motorSpeeds.set(w1, rpm);
  } else if (up && right) {
    robotPhysics.motorSpeeds.set(w0, rpm);
    robotPhysics.motorSpeeds.set(w1, inner);
  } else if (down && left) {
    robotPhysics.motorSpeeds.set(w0, -inner);
    robotPhysics.motorSpeeds.set(w1, -rpm);
  } else if (down && right) {
    robotPhysics.motorSpeeds.set(w0, -rpm);
    robotPhysics.motorSpeeds.set(w1, -inner);
  } else if (up) {
    robotPhysics.motorSpeeds.set(w0, rpm);
    robotPhysics.motorSpeeds.set(w1, rpm);
  } else if (down) {
    robotPhysics.motorSpeeds.set(w0, -rpm);
    robotPhysics.motorSpeeds.set(w1, -rpm);
  } else if (left) {
    robotPhysics.motorSpeeds.set(w0, -rpm);
    robotPhysics.motorSpeeds.set(w1, rpm);
  } else if (right) {
    robotPhysics.motorSpeeds.set(w0, rpm);
    robotPhysics.motorSpeeds.set(w1, -rpm);
  } else {
    robotPhysics.motorSpeeds.set(w0, 0);
    robotPhysics.motorSpeeds.set(w1, 0);
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

    // Keep running while there are pending moves
    while (pendingMoves.length > 0 && isRunning && !isFinished) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Brief extra runtime for braking/coasting after code finishes
    if (isRunning && !isFinished) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (isRunning && !isFinished) {
      isRunning = false;
      postToMain({
        type: 'FINISHED',
        payload: { elapsedMs: performance.now() - startTime, path: replayPath, logs: [...logBuffer], reason: 'completed' },
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
  userSetWheels.clear();
}

function handleReset() {
  stopTickLoop();
  resetPhysics();
  logBuffer = [];
  replayPath = [];
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
