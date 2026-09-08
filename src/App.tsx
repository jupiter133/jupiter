import { usePlacementFlow } from './assessment/usePlacementFlow';
import { HandoffScreen } from './screens/HandoffScreen';
import { KidCompletionScreen } from './screens/KidCompletionScreen';
import { ParentContextScreen } from './screens/ParentContextScreen';
import { ParentResultsScreen } from './screens/ParentResultsScreen';
import { QuestionScreen } from './screens/QuestionScreen';

export default function App() {
  const flow = usePlacementFlow();

  return (
    <div className="app-shell">
      {flow.step === 'parent-context' && <ParentContextScreen onContinue={flow.submitContext} />}

      {flow.step === 'handoff' && <HandoffScreen onStart={flow.beginQuest} />}

      {flow.step === 'question' && flow.currentQuestion && (
        <QuestionScreen
          key={flow.currentQuestion.id}
          question={flow.currentQuestion}
          questionNumber={flow.questionNumber}
          totalEstimate={flow.totalEstimate}
          onAnswer={flow.answer}
        />
      )}

      {flow.step === 'kid-complete' && (
        <KidCompletionScreen coins={flow.coins} onHandBack={flow.handBackToParent} />
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
