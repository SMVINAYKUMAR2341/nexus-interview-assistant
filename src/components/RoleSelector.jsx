import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

const RoleSelector = () => {
  const { role, setRole } = useAuthStore();

  const handleRoleChange = (newRole) => {
    if (role !== newRole) {
      setRole(newRole);
    }
  };

  return (
    <div className="role-selector-container">
      <div className={`role-toggle ${role === 'Interviewee' ? 'interviewee-active' : ''}`}>
        <div className="slider-background"></div>
        <button
          className={`shiny-button ${role === 'Interviewer' ? 'active' : ''}`}
          onClick={() => handleRoleChange('Interviewer')}
          type="button"
        >
          Interviewer
        </button>
        <button
          className={`shiny-button ${role === 'Interviewee' ? 'active' : ''}`}
          onClick={() => handleRoleChange('Interviewee')}
          type="button"
        >
          Interviewee
        </button>
      </div>
    </div>
  );
};

export default RoleSelector;