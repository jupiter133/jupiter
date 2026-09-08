import { Teacher } from '../components/Teacher';

interface Props {
  onResume: () => void;
  /** Leaves the flow. In the host app this returns the parent to wherever
   *  they came from; the demo hands it to the app's exit seam. */
  onExit: () => void;
}

/** Where "Maybe later" lands: one way back in, one way out. */
export function DeferredScreen({ onResume, onExit }: Props) {
  return (
    <div className="stage">
      <div className="start">
        <Teacher size={180} mood="greeting" />
        <h1 className="title">No rush — the trail isn’t going anywhere.</h1>
        <p className="body start__sub">
          You can run the discovery quest whenever it suits. It works best when your child
          is rested and has about five uninterrupted minutes.
        </p>
        <div className="action-row">
          <button type="button" className="btn btn--ghost" onClick={onExit}>
            Exit
          </button>
          <button type="button" className="btn btn--primary" onClick={onResume}>
            Actually, let’s do it now
          </button>
        </div>
      </div>
    </div>
  );
}
