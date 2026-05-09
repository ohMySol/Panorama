"use client"

import { createContext, useContext, useState, ReactNode } from 'react';
import type { GraphNode } from '@risk-terminal/shared';

interface SelectedNodeContextType {
  selectedNode: GraphNode | null;
  setSelectedNode: (node: GraphNode | null) => void;
}

const SelectedNodeContext = createContext<SelectedNodeContextType | undefined>(undefined);

export function SelectedNodeProvider({ children }: { children: ReactNode }) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <SelectedNodeContext.Provider value={{ selectedNode, setSelectedNode }}>
      {children}
    </SelectedNodeContext.Provider>
  );
}

export function useSelectedNode() {
  const context = useContext(SelectedNodeContext);
  if (context === undefined) {
    throw new Error('useSelectedNode must be used within a SelectedNodeProvider');
  }
  return context;
}
