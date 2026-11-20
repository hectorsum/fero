import type { Availability } from "../entities/Availability";

export interface AvailabilityRepository {
  get(): Promise<Availability>;
  /** Solo admins. Lanza ForbiddenError si la sesión no tiene permiso. */
  save(av: Availability): Promise<void>;
}

export class ForbiddenError extends Error {
  constructor() {
    super("forbidden");
    this.name = "ForbiddenError";
  }
}
