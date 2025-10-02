import React, { useEffect, useState } from 'react';
import { useInterviewStore } from '../store/useInterviewStore';

const Timer = ({ isActive = false, questionType = 'easy' }) => {
  const { timer } = useInterviewStore();
  const [displayTime, setDisplayTime] = useState(timer);

  useEffect(() => {
    setDisplayTime(timer);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (!isActive) return 'timer-display';
    if (timer <= 10) return 'timer-display timer-warning';
    return 'timer-display timer-running';
  };

  const getTimerColor = () => {
    if (!isActive) return '#666';
    if (timer <= 10) return '#ff4d4f';
    if (timer <= 30) return '#fa8c16';
    return '#52c41a';
  };

  if (!isActive && timer === 0) {
    return null;
  }

  return (
    <div className={getTimerClass()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <div style={{ 
        fontSize: '20px', 
        fontWeight: 'bold', 
        color: getTimerColor(),
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        ⏱️ {formatTime(displayTime)}
      </div>
      <div style={{ 
        fontSize: '12px', 
        color: '#94a3b8', 
        fontWeight: 500
      }}>
        {isActive ? `${questionType.toUpperCase()} Question` : 'Paused'}
      </div>
    </div>
  );
};

export default Timer;