import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript/micropython.mjs';
import type { MicroPythonModule } from '@micropython/micropython-webassembly-pyscript/micropython.mjs';
import type { MainToWorker, WorkerToMain } from '../shared/types/workerMessages';

// Vite resolves this to the correct hashed URL of the wasm asset
import wasmUrl from '@micropython/micropython-webassembly-pyscript/micropython.wasm?url';

let micropython: MicroPythonModule | null = null;
let isRunning = false;
let logBuffer: string[] = [];

function postToMain(msg: WorkerToMain) {
  self.postMessage(msg);
}

function setupRobotAPI(mp: MicroPythonModule) {
  const robotModule: Record<string, unknown> = {
    move: (distance: number) => {
      logBuffer.push(`[move] ${distance}mm`);
    },
    turn: (angle: number) => {
      const dir = angle < 0 ? 'left' : 'right';
      logBuffer.push(`[turn] ${dir} ${Math.abs(angle)}deg`);
    },
    stop: () => {
      logBuffer.push('[stop]');
    },
    set_motor_speeds: (left: number, right: number) => {
      logBuffer.push(`[set_motor_speeds] left=${left} right=${right}`);
    },
    get_sensor: (sensorId: string) => {
      logBuffer.push(`[get_sensor] ${sensorId}`);
      return -1;
    },
    get_position: () => ({ x: 0, y: 0 }),
    get_angle: () => 0,
    log: (msg: string) => {
      logBuffer.push(`[log] ${msg}`);
    },
  };

  mp.registerJsModule('robot', robotModule);
}

async function initMicroPython(): Promise<void> {
  const mp = await loadMicroPython({
    url: wasmUrl,
    stdout: (data: string) => {
      logBuffer.push(data);
    },
    stderr: (data: string) => {
      logBuffer.push(`[stderr] ${data}`);
    },
  });

  setupRobotAPI(mp);
  micropython = mp;
}

async function runUserCode(code: string): Promise<void> {
  const mp = micropython;
  if (!mp) return;

  const withImport = `import robot\n${code}`;
  await mp.runPythonAsync(withImport);
}

async function handleStart(payload: { pythonCode: string }) {
  logBuffer = [];
  isRunning = true;

  try {
    if (!micropython) {
      await initMicroPython();
    }

    await runUserCode(payload.pythonCode);

    if (isRunning) {
      postToMain({
        type: 'FINISHED',
        payload: { elapsedMs: 0, path: [], logs: [...logBuffer] },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    postToMain({
      type: 'PYTHON_ERROR',
      payload: { error: message },
    });
  } finally {
    isRunning = false;
  }
}

function handleStop() {
  isRunning = false;
}

function handleReset() {
  isRunning = false;
  micropython = null;
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
  }
};

postToMain({ type: 'READY' });
