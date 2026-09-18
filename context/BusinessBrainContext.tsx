"use client";

import React, { createContext, useContext, useState } from "react";

export interface BusinessBrainContextType {
  activeEntity: {
    type: "lead" | "client" | "proposal" | "invoice" | "dashboard" | "general";
    id?: string;
    name?: string;
    data?: any;
  };
  setActiveEntity: (entity: {
    type: "lead" | "client" | "proposal" | "invoice" | "dashboard" | "general";
    id?: string;
    name?: string;
    data?: any;
  }) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
  prefilledPrompt: string;
  setPrefilledPrompt: (prompt: string) => void;
  openCopilotWithPrompt: (prompt: string) => void;
}

const BusinessBrainContext = createContext<BusinessBrainContextType | undefined>(undefined);

export const BusinessBrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEntity, setActiveEntity] = useState<BusinessBrainContextType["activeEntity"]>({
    type: "dashboard",
    name: "Global Overview",
  });
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string>("");

  const toggleCopilot = () => setIsCopilotOpen((prev) => !prev);

  const openCopilotWithPrompt = (prompt: string) => {
    setPrefilledPrompt(prompt);
    setIsCopilotOpen(true);
  };

  return (
    <BusinessBrainContext.Provider
      value={{
        activeEntity,
        setActiveEntity,
        isCopilotOpen,
        setIsCopilotOpen,
        toggleCopilot,
        prefilledPrompt,
        setPrefilledPrompt,
        openCopilotWithPrompt,
      }}
    >
      {children}
    </BusinessBrainContext.Provider>
  );
};

export const useBusinessBrain = () => {
  const ctx = useContext(BusinessBrainContext);
  if (!ctx) {
    throw new Error("useBusinessBrain must be used within BusinessBrainProvider");
  }
  return ctx;
};
