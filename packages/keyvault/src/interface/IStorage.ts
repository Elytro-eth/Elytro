import { Result } from '@elytro/result';

export interface Serializable {
  toString(): string;
}

export abstract class IStorage {
  public abstract save(value: string): Promise<Result<void, Error>>;
  public abstract load(defaultValue: string): Promise<Result<string, Error>>;
  public abstract selfDestruct(): Promise<Result<void, Error>>;
}
