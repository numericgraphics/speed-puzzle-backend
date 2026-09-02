// Strongly-typed event constants + derived union type
export const EVENTS = {
  USER_ALREADY_EXIST: "userAlreadyExist",
  USER_CREATED: "userCreated",
  USER_RECOGNIZED: "userRecognized",
  REMOVE_USER: "removeUser",
  SCORE_REJECTED: "scoreRejected",
  SCORED: "scored",
} as const;

export type EventKey = keyof typeof EVENTS;
export type EventValue = (typeof EVENTS)[EventKey];

export default EVENTS;
