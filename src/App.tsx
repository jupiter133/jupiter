import { useMemo } from 'react';
import { usePlacementFlow } from './assessment/usePlacementFlow';
import { loadChildProfile } from './profile';
import { exitToHost } from './host';
import { HandoffScreen } from './screens/HandoffScreen';
import { ParentContextScreen } from './screens/ParentContextScreen';
import { ParentResultsScreen } from './screens/ParentResultsScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { SUBJECT_LABEL } from './assessment/types';
import { SectionIntroScreen } from './screens/SectionIntroScreen';
import { StartScreen } from './screens/StartScreen';
import { DeferredScreen } from './screens/DeferredScreen';
import { FlowChrome } from './components/FlowChrome';
import { SectionCompleteDialog } from './components/SectionCompleteDialog';

export default function App() {
  const profile = useMemo(loadChildProfile, []);
  const flow = usePlacementFlow(profile.name);

  return (
    <div className={`app-shell${flow.goBack ? ' app-shell--has-back' : ''}`}>
      <FlowChrome current={flow.stepIndex} onBack={flow.goBack} />
      {flow.step === 'start' && (
        <StartScreen
          childName={flow.childName}
          track={flow.track}
          isResuming={flow.isResuming}
          nextSubjectLabel={flow.subject ? SUBJECT_LABEL[flow.subject] : null}
          onStart={flow.beginIntake}
          onDefer={flow.defer}
        />
      )}

      {flow.step === 'deferred' && (
        <DeferredScreen onResume={flow.resume} onExit={() => exitToHost(flow.restart)} />
      )}

      {flow.step === 'parent-context' && (
        <ParentContextScreen
          childName={flow.childName}
          knownAge={profile.age}
          knownGrade={profile.grade}
          onContinue={flow.submitContext}
        />
      )}

      {flow.step === 'handoff' && (
        <HandoffScreen childName={flow.childName} track={flow.track} onStart={flow.beginQuest} />
      )}

      {flow.step === 'section-intro' && flow.subject && (
        <SectionIntroScreen
          subject={flow.subject}
          track={flow.track}
          onStart={flow.startSection}
          onDoLater={flow.doThisLater}
        />
      )}

      {(flow.step === 'question' || flow.step === 'section-complete') &&
        (flow.currentQuestion ?? flow.lastQuestion) &&
        flow.subject && (
        <QuestionScreen
          /* Re-keyed for the popup step: the card had already faded itself out
             on the way to the result, so it needs a fresh mount to sit behind
             the scrim rather than leaving a blank screen. */
          key={`${(flow.currentQuestion ?? flow.lastQuestion)!.id}-${flow.step}`}
          question={(flow.currentQuestion ?? flow.lastQuestion)!}
          subject={flow.subject}
          band={flow.band}
          questionNumber={flow.questionNumber}
          questionsPerSubject={flow.questionsPerSubject}
          audioEnabled={flow.audioEnabled}
          onToggleAudio={flow.toggleAudio}
          onAnswer={flow.answer}
        />
      )}

      {flow.step === 'section-complete' && flow.subject && flow.result && (
        <SectionCompleteDialog
          subject={flow.subject}
          done={flow.result.subjects.length}
          total={flow.requiredSubjects.length}
          nextSubject={flow.nextSubject}
          onKeepGoing={flow.continueNext}
          onHandBack={flow.dismissSectionComplete}
        />
      )}

      {flow.step === 'parent-results' && flow.result && (
        <ParentResultsScreen
          context={flow.context}
          childName={flow.childName}
          result={flow.result}
          onContinue={flow.continueNext}
          onRestart={flow.restart}
        />
      )}
    </div>
  );
}
