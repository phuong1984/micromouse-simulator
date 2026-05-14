import { useState } from 'react';

interface Step {
  title: string;
  content: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    icon: '🤖',
    title: 'Welcome to Micromouse Simulator!',
    content: 'Learn how to program a micromouse robot to solve a maze. Drag and drop blocks (or write Python code) to control your robot\'s movement and sensors.',
  },
  {
    icon: '🧩',
    title: 'The Maze',
    content: 'The maze is a grid of cells with walls. Your robot starts at the green cell (S) and needs to reach the red goal cell (G). Use the Maze Editor tab to design custom mazes.',
  },
  {
    icon: '🔧',
    title: 'Robot Configuration',
    content: 'In the Robot Config tab, you can customize your robot\'s body size, wheel specifications, and sensor placements. Changes take effect immediately in the simulation.',
  },
  {
    icon: '📝',
    title: 'Writing Code',
    content: 'Use Blockly to drag-and-drop code blocks, or switch to the Python tab for text editing. The robot API includes: move(), turn(), get_sensor(), set_wheel_speed(), and more.',
  },
  {
    icon: '▶',
    title: 'Running Simulation',
    content: 'Press Space or the ▶ button to run your code. Watch your robot navigate the maze in real-time. Use ⏹ to stop and ↺ to reset.',
  },
  {
    icon: '📊',
    title: 'Sensor Readings & Telemetry',
    content: 'The sensor panel shows real-time distance readings from each sensor. After a run, use the replay panel to review the robot\'s path step by step.',
  },
  {
    icon: '🎯',
    title: 'Ready to Go!',
    content: 'Try the example programs from the 📚 menu in the toolbar. Experiment with different maze layouts and robot configurations. Happy coding!',
  },
];

export function TutorialOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const handleFinish = () => {
    localStorage.setItem('micromouse-tutorial-done', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('micromouse-tutorial-done', 'true');
    onClose();
  };

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <div className="tutorial-icon">{current.icon}</div>
        <h2 className="tutorial-title">{current.title}</h2>
        <p className="tutorial-content">{current.content}</p>

        <div className="tutorial-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`tutorial-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
          ))}
        </div>

        <div className="tutorial-actions">
          <button className="tutorial-btn tutorial-btn-skip" onClick={handleSkip}>
            Skip
          </button>
          <div className="tutorial-actions-right">
            {step > 0 && (
              <button className="tutorial-btn tutorial-btn-back" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="tutorial-btn tutorial-btn-next" onClick={() => setStep(step + 1)}>
                Next
              </button>
            ) : (
              <button className="tutorial-btn tutorial-btn-next" onClick={handleFinish}>
                Let's Go!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
