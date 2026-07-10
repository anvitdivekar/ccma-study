import type { SRState, SRRating } from '../types';

const MIN_EF = 1.3;

export function sm2(state: SRState, rating: SRRating): SRState {
  const { easeFactor, interval, repetitions } = state;

  let newEF = easeFactor + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02));
  newEF = Math.max(MIN_EF, newEF);

  let newInterval: number;
  let newReps: number;

  if (rating === 0) {
    // Again — restart
    newInterval = 1;
    newReps = 0;
  } else if (rating === 1) {
    // Hard
    newInterval = Math.max(1, Math.round(interval * 1.2));
    newReps = repetitions + 1;
  } else {
    // Good or Easy
    if (repetitions === 0) newInterval = 1;
    else if (repetitions === 1) newInterval = 6;
    else newInterval = Math.round(interval * newEF);
    if (rating === 3) newInterval = Math.round(newInterval * 1.3); // Easy bonus
    newReps = repetitions + 1;
  }

  const due = new Date();
  due.setDate(due.getDate() + newInterval);

  return {
    ...state,
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
    dueDate: due.toISOString().split('T')[0],
    lastRating: rating,
  };
}

export function defaultSRState(cardId: string): SRState {
  return {
    cardId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: new Date().toISOString().split('T')[0],
  };
}

export function isDue(state: SRState): boolean {
  const today = new Date().toISOString().split('T')[0];
  return state.dueDate <= today;
}
