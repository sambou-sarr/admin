export class ApiError extends Error {
  constructor(public status: number, public code: string | undefined, message: string) { super(message); }
}
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Erreur inconnue');
