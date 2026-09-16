/**
 * Subjects live in `tracks.ts`, because which subjects exist depends on which
 * assessment a child is sitting. This module stays as the import everything
 * else already uses.
 */
export type { Subject, Track, SubjectColor, TrackConfig } from './tracks';
export {
  SUBJECT_LABEL,
  SUBJECT_SHORT,
  SUBJECT_COLOR,
  SUBJECT_TILE,
  TRACKS,
  LITTLE_READER_MAX_AGE,
  trackFor,
  trackOf,
  subjectsForTrack,
} from './tracks';
