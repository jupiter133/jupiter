import { Teacher } from '../components/Teacher';
import { STRAND_TAG, Tag } from '../components/Tag';
import type { Subject } from '../assessment/types';

const COPY: Record<Subject, { lead: string; place: string; body: string; cta: string }> = {
  reading: {
    lead: 'Welcome to the',
    place: 'Story Woods',
    body: 'We’ll read some short pieces and puzzle out a few words together. Pick whatever you think fits.',
    cta: 'Into the woods',
  },
  math: {
    lead: 'Welcome to the',
    place: 'Number Ridge',
    body: 'Now some numbers and puzzles. Take your time — counting on your fingers is allowed up here.',
    cta: 'Climb the ridge',
  },
  writing: {
    lead: 'Welcome to the',
    place: 'Word Workshop',
    body: 'Help me fix up some sentences before I write them in the trail journal.',
    cta: 'Open the workshop',
  },
};

interface Props {
  subject: Subject;
  /** Which sitting this is, and how many the grade has in total. */
  sessionNumber: number;
  sessionCount: number;
  onStart: () => void;
}

/** Shown before each strand. Gives the child a breather and keeps the quest
 *  framing across a ~5 minute sitting. */
export function SectionIntroScreen({ subject, sessionNumber, sessionCount, onStart }: Props) {
  const copy = COPY[subject];
  // K-3 sit one subject, so there is no "part 1 of 3" to announce.
  const eyebrow = sessionCount > 1 ? `Part ${sessionNumber} of ${sessionCount}` : 'Your turn';
  return (
    <div className="stage">
      <div className="card card--center">
        <div className="handoff">
          <Teacher size={240} mood="greeting" />
          <div className="stack">
            <div className="speech-bubble stack stack--tight">
              <p className="label">{eyebrow}</p>
              <h1 className="display">
                {copy.lead} <Tag color={STRAND_TAG[subject]}>{copy.place}</Tag>
              </h1>
              <p className="body" style={{ color: 'var(--text-primary)' }}>{copy.body}</p>
            </div>
            <button type="button" className="btn btn--primary" onClick={onStart}>
              {copy.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
