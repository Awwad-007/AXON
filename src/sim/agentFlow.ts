import { useCallback, useEffect, useRef, useState } from 'react';

export type AgentStep =
  | 'IDLE'
  | 'ANOMALY_DETECTED'
  | 'SCHEDULING'
  | 'LOGISTICS'
  | 'COMMS'
  | 'WAITING_USER_APPROVAL'
  | 'BOOKED'
  | 'FALSE_ALARM';

export interface ChatMsg {
  id: string;
  sender: 'agent' | 'user' | 'system';
  text: string;
  time: string;
  actions?: { label: string; value: 'yes' | 'no' }[];
}

export interface AgentFlowProps {
  anomaly: boolean;
  reason: string;
  machineName?: string;
  onApprove: () => void;
  onReject: () => void;
}

const getTimeStr = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * Headless Cloud Swarm Agent State Machine (AXON MSME).
 * Manages autonomous fault verification, idle window scheduling, logistics dispatch, and user approval.
 */
export function useAgentFlow({ anomaly, reason, machineName = 'MSME Compressor C-01', onApprove, onReject }: AgentFlowProps) {
  const [step, setStep] = useState<AgentStep>('IDLE');
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      id: 'm-init',
      sender: 'system',
      text: 'AXON Plant Agent connected via factory mesh gateway.',
      time: getTimeStr(),
    },
    {
      id: 'm-welcome',
      sender: 'agent',
      text: `Monitoring ${machineName}. All telemetry normal within dynamic baseline.`,
      time: getTimeStr(),
    },
  ]);

  const handledRef = useRef(false);

  // Trigger agent workflow when anomaly is detected
  useEffect(() => {
    if (anomaly && !handledRef.current && (step === 'IDLE' || step === 'BOOKED' || step === 'FALSE_ALARM')) {
      handledRef.current = true;
      setStep('ANOMALY_DETECTED');
      setTyping(true);

      // Transition: ANOMALY_DETECTED -> SCHEDULING (800ms)
      const t1 = setTimeout(() => {
        setStep('SCHEDULING');

        // Transition: SCHEDULING -> LOGISTICS (800ms)
        const t2 = setTimeout(() => {
          setStep('LOGISTICS');

          // Transition: LOGISTICS -> COMMS (800ms)
          const t3 = setTimeout(() => {
            setStep('COMMS');

            // Transition: COMMS -> WAITING_USER_APPROVAL (600ms)
            const t4 = setTimeout(() => {
              setTyping(false);
              setStep('WAITING_USER_APPROVAL');

              const alertMsg: ChatMsg = {
                id: `m-alert-${Date.now()}`,
                sender: 'agent',
                text: `[ALERT] ${machineName} variance detected: ${reason || 'Acoustic & pressure deviation'}.\n\n` +
                  `Auto-Analysis:\n` +
                  `- Shift window: 14:00 - 16:00 (Zero production impact)\n` +
                  `- Assigned Tech: Ramesh K. (4.9 rating, 3.2 km away)\n` +
                  `- Required part: Intake Reed Valve Kit (In Stock)\n\n` +
                  `Approve dispatch for 14:00 today?`,
                time: getTimeStr(),
                actions: [
                  { label: 'Yes, Dispatch Tech', value: 'yes' },
                  { label: 'No, False Alarm', value: 'no' },
                ],
              };
              setMsgs((prev) => [...prev, alertMsg]);
            }, 600);
            return () => clearTimeout(t4);
          }, 800);
          return () => clearTimeout(t3);
        }, 800);
        return () => clearTimeout(t2);
      }, 800);
      return () => clearTimeout(t1);
    }
  }, [anomaly, reason, step]);

  // User Action: Approve booking
  const handleApprove = useCallback(() => {
    setStep('BOOKED');
    handledRef.current = false;
    onApprove();

    const userReply: ChatMsg = {
      id: `m-user-${Date.now()}`,
      sender: 'user',
      text: 'Yes, Dispatch Tech',
      time: getTimeStr(),
    };

    setMsgs((prev) => [...prev, userReply]);
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const confirmMsg: ChatMsg = {
        id: `m-conf-${Date.now()}`,
        sender: 'agent',
        text: `[CONFIRMED] Work order #AX-8821 created.\n` +
          `- Tech Ramesh K. dispatched for 14:00 window.\n` +
          `- Part reserved: Reed Valve Gasket Set.\n` +
          `- Machine interlock reset to monitoring state.`,
        time: getTimeStr(),
      };
      setMsgs((prev) => [...prev, confirmMsg]);
    }, 700);
  }, [onApprove]);

  // User Action: Reject booking (false alarm)
  const handleReject = useCallback(() => {
    setStep('FALSE_ALARM');
    handledRef.current = false;
    onReject();

    const userReply: ChatMsg = {
      id: `m-user-${Date.now()}`,
      sender: 'user',
      text: 'No, False Alarm',
      time: getTimeStr(),
    };

    setMsgs((prev) => [...prev, userReply]);
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const feedbackMsg: ChatMsg = {
        id: `m-fb-${Date.now()}`,
        sender: 'agent',
        text: `[UPDATED] Logged as factory baseline tolerance.\n` +
          `- Dynamic envelope widened (+0.6s tolerance).\n` +
          `- Model sensitivity auto-tuned for current shift conditions.`,
        time: getTimeStr(),
      };
      setMsgs((prev) => [...prev, feedbackMsg]);
    }, 700);
  }, [onReject]);

  const clearChat = useCallback(() => {
    handledRef.current = false;
    setStep('IDLE');
    setMsgs([
      {
        id: `m-reset-${Date.now()}`,
        sender: 'system',
        text: 'Agent session reset. Monitoring active factory mesh.',
        time: getTimeStr(),
      },
    ]);
  }, []);

  return {
    step,
    typing,
    msgs,
    handleApprove,
    handleReject,
    clearChat,
  };
}
