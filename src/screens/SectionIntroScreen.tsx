import type { Subject } from '../assessment/types';
import { SUBJECT_LABEL } from '../assessment/types';
import { STRAND_TAG, Tag } from '../components/Tag';
import { SUBJECT_INTROS } from '../content/subjectIntros';

interface Props {
  subject: Subject;
  onStart: () => void;
  /** "Do this one later" — skips to the next subject without a result. */
  onDoLater: () => void;
}

/**
 * Shown before each subject sitting, one per subject, built to the assessment
 * intro design: kicker, the subject as a straight highlighter tag, a one-line
 * lead, three fact chips, and four collapsible rule cards a child (or the
 * grown-up beside them) can open before starting.
 */
export function SectionIntroScreen({ subject, onStart, onDoLater }: Props) {
  const intro = SUBJECT_INTROS[subject];

  return (
    <div className="stage">
      <div className="card card--center">
        <div className="intro">
          <div className="intro__head">
            <p className="label intro__kicker">{intro.kicker}</p>
            <h1 className="display intro__title">
              The{' '}
              <Tag color={STRAND_TAG[subject]}>
                {SUBJECT_LABEL[subject]}
              </Tag>{' '}
              test
            </h1>
            <p className="body intro__lead">{intro.lead}</p>
            <div className="intro-chips">
              {intro.chips.map((chip) => (
                <span
                  key={chip.label}
                  className="intro-chip"
                  style={{ background: chip.bg, boxShadow: `0 4px 0 ${chip.edge}` }}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rules">
            {intro.sections.map((section) => (
              <details key={section.num} className="rule">
                <summary className="rule__summary">
                  <span className="rule__num" style={{ background: section.chip }}>
                    {section.num}
                  </span>
                  <span className="rule__title">{section.title}</span>
                  <span className="rule__chevron" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <p className="rule__body">{section.body}</p>
              </details>
            ))}
          </div>

          <div className="intro__go">
            <button type="button" className="btn btn--primary btn--large" onClick={onStart}>
              {intro.cta}
            </button>
            <button type="button" className="text-btn text-btn--sm" onClick={onDoLater}>
              Do this one later
            </button>
            <span className="field__hint">No pass or fail · Just do your best</span>
          </div>
        </div>
      </div>
    </div>
  );
}
