import type { BackendRepository } from "./apiRepository.ts";

export class BackendRepositoryNotImplementedError extends Error {
  constructor() {
    super("Supabase BackendRepository is not implemented yet.");
    this.name = "BackendRepositoryNotImplementedError";
  }
}

export function createSupabaseBackendRepository(): BackendRepository {
  throw new BackendRepositoryNotImplementedError();
}
