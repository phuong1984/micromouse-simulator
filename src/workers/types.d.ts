declare module '@micropython/micropython-webassembly-pyscript/micropython.wasm?url' {
  const url: string;
  export default url;
}

declare module '@micropython/micropython-webassembly-pyscript/micropython.mjs' {
  export interface MicroPythonModule {
    _module: unknown;
    FS: unknown;
    globals: {
      __dict__: unknown;
      get: (key: string) => unknown;
      set: (key: string, value: unknown) => void;
      delete: (key: string) => void;
    };
    registerJsModule: (name: string, module: Record<string, unknown>) => void;
    pyimport: (name: string) => unknown;
    runPython: (code: string) => unknown;
    runPythonAsync: (code: string) => Promise<unknown>;
    replInit: () => void;
    replProcessChar: (chr: number) => number;
    replProcessCharWithAsyncify: (chr: number) => Promise<number>;
  }

  export function loadMicroPython(options?: {
    pystack?: number;
    heapsize?: number;
    url?: string;
    stdin?: () => number | null;
    stdout?: (data: string) => void;
    stderr?: (data: string) => void;
    linebuffer?: boolean;
    romfs?: Uint8Array;
  }): Promise<MicroPythonModule>;
}
