// Strongly-typed event constants + derived union type
export const EVENTS = {
  USER_ALREADY_EXIST: "userAlreadyExist",
  USER_CREATED: "userCreated",
  LOGIN_SUCCESS: "loginSuccess",
  LOGIN_FAILED: "loginFailed",
  REMOVE_USER: "removeUser",
  SCORE_REJECTED: "scoreRejected",
  SCORED: "scored",
} as const;

export type EventKey = keyof typeof EVENTS;
export type EventValue = (typeof EVENTS)[EventKey];

export default EVENTS;
