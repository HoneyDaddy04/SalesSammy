import { useState, useCallback, useMemo } from "react";

export const TOTAL_SETUP_STEPS = 7;

export interface AgentConfig {
  dataSources: string[];
  channels: string[];
  knowledgeBase: {
    companyDesc: string;
    faqs: { q: string; a: string }[];
    docs: string[];
  };
  workflows: string[];
  workflowConfigs: Record<string, Record<string, string>>;
  workflowContext: Record<string, string>;
  escalation: {
    sentimentEscalate: boolean;
    keywords: string[];
    handoffEmail: string;
    maxReplies: number;
  };
  voice: {
    greeting: string;
    signoff: string;
    tone: string;
  };
  completedSteps: number[];
}

export interface AgentSetupState {
  user: { name: string; email: string; company: string; industry: string };
  selectedAgents: string[];
  selectedChannels: string[];
  brandTone: string;
  agentConfigs: Record<string, AgentConfig>;
}

const STORAGE_KEY = "vaigence_setup";

const defaultAgentConfig = (): AgentConfig => ({
  dataSources: [],
  channels: [],
  knowledgeBase: { companyDesc: "", faqs: [], docs: [] },
  workflows: [],
  workflowConfigs: {},
  workflowContext: {},
  escalation: { sentimentEscalate: false, keywords: [], handoffEmail: "", maxReplies: 5 },
  voice: { greeting: "", signoff: "", tone: "professional" },
  completedSteps: [],
});

const defaultState: AgentSetupState = {
  user: { name: "", email: "", company: "", industry: "" },
  selectedAgents: [],
  selectedChannels: [],
  brandTone: "professional",
  agentConfigs: {},
};

function loadState(): AgentSetupState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return defaultState;
}

function persistState(state: AgentSetupState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAgentSetup() {
  const [state, setState] = useState<AgentSetupState>(loadState);

  const save = useCallback((next: AgentSetupState) => {
    setState(next);
    persistState(next);
  }, []);

  const saveOnboarding = useCallback(
    (data: {
      user: AgentSetupState["user"];
      selectedAgents: string[];
      selectedChannels: string[];
      brandTone: string;
    }) => {
      const configs: Record<string, AgentConfig> = {};
      data.selectedAgents.forEach((id) => {
        configs[id] = defaultAgentConfig();
        configs[id].voice.tone = data.brandTone;
      });
      const next: AgentSetupState = { ...data, agentConfigs: configs };
      save(next);
    },
    [save]
  );

  const getAgentConfig = useCallback(
    (agentId: string): AgentConfig =>
      state.agentConfigs[agentId] ?? defaultAgentConfig(),
    [state.agentConfigs]
  );

  const getAgentProgress = useCallback(
    (agentId: string): number => {
      const config = state.agentConfigs[agentId];
      if (!config) return 0;
      return Math.round((config.completedSteps.length / TOTAL_SETUP_STEPS) * 100);
    },
    [state.agentConfigs]
  );

  const isAgentSelected = useCallback(
    (agentId: string): boolean => state.selectedAgents.includes(agentId),
    [state.selectedAgents]
  );

  const updateAgentConfig = useCallback(
    (agentId: string, updates: Partial<AgentConfig>) => {
      const current = state.agentConfigs[agentId] ?? defaultAgentConfig();
      const next: AgentSetupState = {
        ...state,
        agentConfigs: {
          ...state.agentConfigs,
          [agentId]: { ...current, ...updates },
        },
      };
      save(next);
    },
    [state, save]
  );

  const completeStep = useCallback(
    (agentId: string, step: number) => {
      const config = state.agentConfigs[agentId] ?? defaultAgentConfig();
      if (config.completedSteps.includes(step)) return;
      updateAgentConfig(agentId, {
        completedSteps: [...config.completedSteps, step].sort(),
      });
    },
    [state.agentConfigs, updateAgentConfig]
  );

  const hasSetupData = useMemo(
    () => state.selectedAgents.length > 0,
    [state.selectedAgents]
  );

  const initDemoMode = useCallback(() => {
    const configs: Record<string, AgentConfig> = {};
    ["sales", "support", "success"].forEach((id) => {
      configs[id] = defaultAgentConfig();
    });
    const next: AgentSetupState = {
      user: { name: "Demo User", email: "demo@vaigence.com", company: "Demo Company", industry: "saas" },
      selectedAgents: ["sales", "support", "success"],
      selectedChannels: ["sandbox", "whatsapp", "email"],
      brandTone: "professional",
      agentConfigs: configs,
    };
    save(next);
  }, [save]);

  return {
    state,
    saveOnboarding,
    getAgentConfig,
    getAgentProgress,
    isAgentSelected,
    updateAgentConfig,
    completeStep,
    hasSetupData,
    initDemoMode,
  };
}
