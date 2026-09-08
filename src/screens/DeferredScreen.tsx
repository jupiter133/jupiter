import { PolarBear } from '../components/PolarBear';

interface Props {
  onResume: () => void;
}

/**
 * Where "Maybe later" lands. In the host app this slot is wherever the parent
 * came from — a dashboard, say. Standalone, it holds the door open rather than
 * dead-ending the flow.
 */
export function DeferredScreen({ onResume }: Props) {
  return (
    <div className="stage stage--narrow">
      <div className="start">
        <PolarBear size={180} mood="greeting" />
        <h1 className="title">No rush — the trail isn’t going anywhere.</h1>
        <p className="body start__sub">
          You can run the discovery quest whenever it suits. It works best when your child
          is rested and has about five uninterrupted minutes.
        </p>
        <button type="button" className="btn btn--primary" onClick={onResume}>
          Actually, let’s do it now
        </button>
      </div>
    </div>
  );
}
