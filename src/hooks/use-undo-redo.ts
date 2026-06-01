// Copyright 2025 GriffinGuard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import { useCallback, useRef, useState } from "react";

interface UndoRedoState<T> {
  push: (snapshot: T) => void;
  undo: () => T | null;
  redo: () => T | null;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useUndoRedo<T>(initialSnapshot: T, maxSize = 50): UndoRedoState<T> {
  const historyRef = useRef<T[]>([initialSnapshot]);
  const positionRef = useRef(0);
  const [, forceUpdate] = useState(0);

  const push = useCallback(
    (snapshot: T) => {
      const h = historyRef.current;
      const p = positionRef.current;
      const next = [...h.slice(0, p + 1), snapshot];
      if (next.length > maxSize) {
        historyRef.current = next.slice(-maxSize);
        positionRef.current = maxSize - 1;
      } else {
        historyRef.current = next;
        positionRef.current = p + 1;
      }
      forceUpdate((prev) => prev + 1);
    },
    [maxSize],
  );

  const undo = useCallback((): T | null => {
    if (positionRef.current <= 0) return null;
    positionRef.current--;
    forceUpdate((prev) => prev + 1);
    return historyRef.current[positionRef.current];
  }, []);

  const redo = useCallback((): T | null => {
    if (positionRef.current >= historyRef.current.length - 1) return null;
    positionRef.current++;
    forceUpdate((prev) => prev + 1);
    return historyRef.current[positionRef.current];
  }, []);

  const clear = useCallback(() => {
    historyRef.current = [initialSnapshot];
    positionRef.current = 0;
    forceUpdate((prev) => prev + 1);
  }, [initialSnapshot]);

  const canUndo = positionRef.current > 0;
  const canRedo = positionRef.current < historyRef.current.length - 1;

  return { push, undo, redo, clear, canUndo, canRedo };
}
