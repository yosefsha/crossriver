import React, { useState } from 'react';
import AgentSearch from './AgentSearch';
import OrchestratorSearch from './OrchestratorSearch';
import './AppRouter.css';

const AppRouter: React.FC = () => {
  const [useOrchestrator, setUseOrchestrator] = useState(true);

  return (
    <div className="app-router">
      <div className="app-toggle">
        <button
          className={`toggle-btn ${!useOrchestrator ? 'active' : ''}`}
          onClick={() => setUseOrchestrator(false)}
        >
          🔗 Classic Agent Chat
        </button>
        <button
          className={`toggle-btn ${useOrchestrator ? 'active' : ''}`}
          onClick={() => setUseOrchestrator(true)}
        >
          🎯 Smart Orchestrator
        </button>
      </div>

      {useOrchestrator ? <OrchestratorSearch /> : <AgentSearch />}
    </div>
  );
};

export default AppRouter;