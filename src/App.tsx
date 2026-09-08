import { useMemo } from 'react';
import { usePlacementFlow } from './assessment/usePlacementFlow';
import { loadChildProfile } from './profile';
import { HandoffScreen } from './screens/HandoffScreen';
import { KidCompletionScreen } from './screens/KidCompletionScreen';
import { ParentContextScreen } from './screens/ParentContextScreen';
import { ParentResultsScreen } from './screens/ParentResultsScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { SectionIntroScreen } from './screens/SectionIntroScreen';
import { StartScreen } from './screens/StartScreen';
import { DeferredScreen } from './screens/DeferredScreen';

export default function App() {
  const profile = useMemo(loadChildProfile, []);
  const flow = usePlacementFlow(profile.name);

  return (
    <div className="app-shell">
      {flow.step === 'start' && (
        <StartScreen
          childName={flow.childName}
          onStart={flow.beginIntake}
          onDefer={flow.defer}
        />
      )}

      {flow.step === 'deferred' && <DeferredScreen onResume={flow.resume} />}

      {flow.step === 'parent-context' && (
        <ParentContextScreen childName={flow.childName} onContinue={flow.submitContext} />
      )}

      {flow.step === 'handoff' && (
        <HandoffScreen childName={flow.childName} onStart={flow.beginQuest} />
      )}

      {flow.step === 'section-intro' && flow.subject && (
        <SectionIntroScreen subject={flow.subject} onStart={flow.startSection} />
      )}

      {flow.step === 'question' && flow.currentQuestion && flow.subject && (
        <QuestionScreen
          key={flow.currentQuestion.id}
          question={flow.currentQuestion}
          subject={flow.subject}
          band={flow.band}
          questionNumber={flow.questionNumber}
          questionsPerSubject={flow.questionsPerSubject}
          audioEnabled={flow.audioEnabled}
          onToggleAudio={flow.toggleAudio}
          onAnswer={flow.answer}
        />
      )}

      {flow.step === 'kid-complete' && (
        <KidCompletionScreen
          childName={flow.childName}
          coins={flow.coins}
          onHandBack={flow.handBackToParent}
        />
      )}

      {flow.step === 'parent-results' && flow.context && flow.result && (
        <ParentResultsScreen
          context={flow.context}
          result={flow.result}
          onRestart={flow.restart}
        />
      )}
    </div>
  );
}
