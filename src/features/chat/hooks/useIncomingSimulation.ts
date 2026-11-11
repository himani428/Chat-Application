import { useEffect } from 'react';
import { startIncomingSimulation } from '../services/simulator';

export function useIncomingSimulation() {
  useEffect(() => startIncomingSimulation(), []);
}
