import { useMemo } from 'react';
import { applyClimbEvents, type ClimbLog } from '../domain/climbLogUtils';
import { getSessionEvents } from '../domain/sessionStore';

export const useClimbSessionLogs = (sessionId: string, refreshKey: number): ClimbLog[] => {
  return useMemo(() => {
    const events = getSessionEvents(sessionId);
    return applyClimbEvents(events);
  }, [sessionId, refreshKey]);
};
