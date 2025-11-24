// src/components/DebugPanel.js
import React from 'react';
import { useUserData } from '../hooks/useUserData';

const DebugPanel = () => {
  const { userData } = useUserData();
  
  return (
    <div className="debug-panel mt-5 pt-5">
      <strong>Current Role:</strong> {userData?.primary_role?.display_name || 'None'}<br/>
      <strong>Role Name:</strong> {userData?.primary_role?.role_name || 'None'}<br/>
      <strong>User:</strong> {userData?.name || 'None'}
    </div>
  );
};

export default DebugPanel;