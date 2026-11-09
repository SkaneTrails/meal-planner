/**
 * Run async operations one at a time, in the order they were requested.
 *
 * The recipe store reads its index, changes it and writes it back, and syncs can be started by
 * several callers at once, so overlapping calls would otherwise overwrite each other's changes.
 */
export function createSerialQueue() {
  let tail: Promise<unknown> = Promise.resolve();

  return function run<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation);
    tail = result.catch(() => undefined);
    return result;
  };
}
