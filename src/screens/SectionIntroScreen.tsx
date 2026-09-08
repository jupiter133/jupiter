import { Teacher } from '../components/Teacher';
import type { Subject } from '../assessment/types';

const COPY: Record<Subject, { eyebrow: string; heading: string; body: string; cta: string }> = {
  reading: {
    eyebrow: 'Leg 1 of 3',
    heading: 'First stop: the Story Woods',
    body: 'We’ll read some short stories and puzzle out a few words together. Pick whatever you think fits.',
    cta: 'Into the woods',
  },
  math: {
    eyebrow: 'Leg 2 of 3',
    heading: 'Next stop: the Number Ridge',
    body: 'Now some numbers and puzzles. Take your time — counting on your fingers is allowed up here.',
    cta: 'Climb the ridge',
  },
  writing: {
    eyebrow: 'Leg 3 of 3',
    heading: 'Last stop: the Word Workshop',
    body: 'Almost done! Help me fix up some sentences before I write them in the trail journal.',
    cta: 'Finish the trail',
  },
};

interface Props {
  subject: Subject;
  onStart: () => void;
}

/** Shown before each strand. Gives the child a breather and keeps the quest
 *  framing across a ~5 minute sitting. */
export function SectionIntroScreen({ subject, onStart }: Props) {
  const copy = COPY[subject];
  return (
    <div className="stage">
      <div className="card">
        <div className="handoff">
          <Teacher size={240} mood="greeting" />
          <div className="stack">
            <div className="speech-bubble stack stack--tight">
              <p className="label">{copy.eyebrow}</p>
              <h1 className="display">{copy.heading}</h1>
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
