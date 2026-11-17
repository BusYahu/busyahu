import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';

type Document = Record<string, unknown>;

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a instanceof ObjectId && b instanceof ObjectId) {
    return a.equals(b);
  }
  if (a instanceof ObjectId || b instanceof ObjectId) {
    return String(a) === String(b);
  }
  return a === b;
}

function matches(document: Document, query: Document): boolean {
  for (const [key, expected] of Object.entries(query)) {
    if (key === '$or') {
      const clauses = expected as Document[];
      if (!clauses.some((clause) => matches(document, clause))) return false;
      continue;
    }

    const value = document[key];
    const operators = expected as Document;
    const isOperatorQuery =
      expected !== null &&
      typeof expected === 'object' &&
      !(expected instanceof ObjectId) &&
      Object.keys(operators).some((operator) => operator.startsWith('$'));

    if (isOperatorQuery) {
      for (const [operator, operand] of Object.entries(operators)) {
        if (operator === '$ne' && valuesEqual(value, operand)) return false;
        if (operator === '$in') {
          const values = Array.isArray(value) ? value : [value];
          const candidates = (operand as unknown[]) ?? [];
          if (!values.some((item) => candidates.some((candidate) => valuesEqual(item, candidate)))) {
            return false;
          }
        }
      }
    } else if (!valuesEqual(value, expected)) {
      return false;
    }
  }
  return true;
}

function sortDocuments(documents: Document[], specification: Record<string, 1 | -1>): void {
  const entries = Object.entries(specification);
  documents.sort((left, right) => {
    for (const [key, direction] of entries) {
      const a = left[key];
      const b = right[key];
      if (a === b) continue;
      if (a === undefined || a === null) return -1 * direction;
      if (b === undefined || b === null) return 1 * direction;
      return (a > b ? 1 : -1) * direction;
    }
    return 0;
  });
}

class FakeCursor {
  constructor(private readonly documents: Document[]) {}

  sort(specification: Record<string, 1 | -1>): this {
    sortDocuments(this.documents, specification);
    return this;
  }

  async toArray(): Promise<Document[]> {
    return [...this.documents];
  }
}

export class FakeCollection {
  documents: Document[] = [];

  async findOne(query: Document = {}): Promise<Document | null> {
    return this.documents.find((document) => matches(document, query)) ?? null;
  }

  find(query: Document = {}): FakeCursor {
    return new FakeCursor(this.documents.filter((document) => matches(document, query)));
  }

  async insertOne(document: Document): Promise<{ insertedId: ObjectId }> {
    const stored = { ...document };
    if (!stored._id) stored._id = new ObjectId();
    this.documents.push(stored);
    return { insertedId: stored._id as ObjectId };
  }

  async updateOne(query: Document, update: Document): Promise<{ modifiedCount: number }> {
    const document = this.documents.find((item) => matches(item, query));
    if (!document) return { modifiedCount: 0 };
    Object.assign(document, update.$set ?? {});
    return { modifiedCount: 1 };
  }
}

export class FakeDatabase {
  collections = new Map<string, FakeCollection>();

  constructor(seed: Record<string, Document[]> = {}) {
    for (const [name, documents] of Object.entries(seed)) {
      const collection = new FakeCollection();
      collection.documents = documents.map((document) => ({ ...document }));
      this.collections.set(name, collection);
    }
  }

  collection<T = Document>(name: string): FakeCollection & { _typed?: T } {
    if (!this.collections.has(name)) {
      this.collections.set(name, new FakeCollection());
    }
    return this.collections.get(name)!;
  }

  asDb(): Db {
    return this as unknown as Db;
  }
}

export function createBrokenDatabase(): Db {
  const throwing = (): never => {
    throw new Error('base de datos no disponible');
  };
  return {
    collection: () => ({
      findOne: throwing,
      find: throwing,
      insertOne: throwing,
      updateOne: throwing,
    }),
  } as unknown as Db;
}
