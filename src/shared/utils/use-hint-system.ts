import { useEffect, useRef } from 'react';
import type { SimState } from '../types/simulation';

type Hint = {
  message: string;
  key: string;
};

const ALL_HINTS: Hint[] = [
  { message: '💡 Robot không di chuyển — thử dùng get_sensor("front") để kiểm tra tường trước khi move()', key: 'stuck' },
  { message: '💡 Robot quay vòng — thử dùng get_sensor() để tìm hướng có khoảng trống rồi move()', key: 'spinning' },
  { message: '💡 Robot đâm tường liên tục — kiểm tra sensor trước khi move, dùng turn() để đổi hướng', key: 'wall-bang' },
  { message: '💡 Hãy thử dùng vòng lặp while not robot.at_goal() để lặp cho đến khi đến đích', key: 'no-loop' },
];

export function useHintSystem(
  simState: SimState | null,
  status: string,
  onHint: (msg: string) => void
) {
  const shownRef = useRef(new Set<string>());
  const posHistoryRef = useRef<{ t: number; x: number; y: number; angle: number }[]>([]);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (status === 'running' && prevStatusRef.current !== 'running') {
      shownRef.current.clear();
      posHistoryRef.current = [];
    }
    prevStatusRef.current = status;

    if (status !== 'running' || !simState || simState.tick === 0) return;

    const { x, y, angle } = simState.robot;
    posHistoryRef.current.push({ t: simState.elapsedMs, x, y, angle });

    const history = posHistoryRef.current;
    if (history.length < 30) return;

    const recent30 = history.slice(-30);
    const first = recent30[0];
    const last = recent30[recent30.length - 1];
    const dt = last.t - first.t;

    if (dt < 2000) return;

    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dAngle = Math.abs(last.angle - first.angle);

    const angleDeltas = [];
    for (let i = 1; i < recent30.length; i++) {
      angleDeltas.push(Math.abs(recent30[i].angle - recent30[i - 1].angle));
    }

    if (!shownRef.current.has('no-loop')) {
      shownRef.current.add('no-loop');
      const hint = ALL_HINTS.find((h) => h.key === 'no-loop')!;
      setTimeout(() => onHint(hint.message), 500);
      return;
    }

    if (dist < 5 && dAngle < 0.1 && !shownRef.current.has('stuck')) {
      shownRef.current.add('stuck');
      const hint = ALL_HINTS.find((h) => h.key === 'stuck')!;
      onHint(hint.message);
      return;
    }

    if (dist < 10 && dAngle > 2 && !shownRef.current.has('spinning')) {
      shownRef.current.add('spinning');
      const hint = ALL_HINTS.find((h) => h.key === 'spinning')!;
      onHint(hint.message);
      return;
    }

    if (dt < 3000 && !shownRef.current.has('wall-bang')) {
      const directionChanges = angleDeltas.filter((a) => a > 0.5).length;
      if (directionChanges > recent30.length * 0.4) {
        shownRef.current.add('wall-bang');
        const hint = ALL_HINTS.find((h) => h.key === 'wall-bang')!;
        onHint(hint.message);
      }
    }
  }, [simState, status, onHint]);
}
