/**
 * A tiny in-memory stand-in for the parts of the Firestore Admin SDK that the
 * server modules use. Enough to test ledger maths and idempotency without an emulator.
 */
type Data = Record<string, any>;

function applyValue(current: any, value: any) {
  // FieldValue.increment(n) carries its number in `operand`.
  if (value && typeof value === "object" && typeof value.operand === "number") {
    return (typeof current === "number" ? current : 0) + value.operand;
  }
  return value;
}

export function createFakeFirestore(seed: Record<string, Data> = {}) {
  const store = new Map<string, Data>(Object.entries(seed).map(([k, v]) => [k, { ...v }]));
  let autoId = 0;

  const makeRef = (path: string) => ({
    id: path.split("/").pop()!,
    path,
    get: async () => snapshot(path),
    set: async (data: Data) => void store.set(path, { ...data }),
    update: async (data: Data) => void update(path, data),
    create: async (data: Data) => void create(path, data),
    delete: async () => void store.delete(path),
  });
  type Ref = ReturnType<typeof makeRef>;

  const snapshot = (path: string) => ({
    exists: store.has(path),
    id: path.split("/").pop()!,
    ref: makeRef(path),
    data: () => (store.has(path) ? { ...store.get(path)! } : undefined),
  });

  const update = (path: string, data: Data) => {
    if (!store.has(path)) throw new Error(`update of missing doc ${path}`);
    const next = { ...store.get(path)! };
    for (const [k, v] of Object.entries(data)) next[k] = applyValue(next[k], v);
    store.set(path, next);
  };

  const create = (path: string, data: Data) => {
    if (store.has(path)) throw Object.assign(new Error("ALREADY_EXISTS"), { code: 6 });
    store.set(path, { ...data });
  };

  const collection = (name: string) => ({
    doc: (id?: string) => makeRef(`${name}/${id ?? `auto_${++autoId}`}`),
    where: (field: string, _op: string, value: unknown) => ({
      get: async () => {
        const docs = [...store.entries()]
          .filter(([p, d]) => p.startsWith(`${name}/`) && d[field] === value)
          .map(([p]) => snapshot(p));
        return { size: docs.length, empty: docs.length === 0, docs };
      },
    }),
  });

  const writer = () => {
    const ops: (() => void)[] = [];
    return {
      ops,
      set: (ref: Ref, data: Data) => ops.push(() => store.set(ref.path, { ...data })),
      update: (ref: Ref, data: Data) => ops.push(() => update(ref.path, data)),
      create: (ref: Ref, data: Data) => ops.push(() => create(ref.path, data)),
      delete: (ref: Ref) => ops.push(() => store.delete(ref.path)),
    };
  };

  return {
    store,
    collection,
    batch: () => {
      const w = writer();
      return { ...w, commit: async () => w.ops.forEach((op) => op()) };
    },
    runTransaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
      const w = writer();
      const result = await fn({ ...w, get: async (ref: Ref) => snapshot(ref.path) });
      w.ops.forEach((op) => op()); // only commit if the callback did not throw
      return result;
    },
  };
}
