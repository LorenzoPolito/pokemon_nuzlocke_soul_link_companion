/** Public API of the auth module. */
export { authorize, ALL_ACTIONS } from './domain/authorize';
export type { Action, Actor, Decision, DenyReason, RunContext, RunRole } from './domain/authorize';
export { decideRegistration } from './domain/registration';
export type { RegistrationMode } from './domain/registration';
export { registerUser } from './application/register';
export type { RegisterError, RegisterInput } from './application/register';
export { getRegistrationMode } from './infrastructure/invites';
