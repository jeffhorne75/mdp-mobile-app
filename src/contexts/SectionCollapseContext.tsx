import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SectionCollapseState {
  person: {
    contactInfo?: boolean;
    attributes?: boolean;
    systemInfo?: boolean;
    relationships?: boolean;
    membershipInfo?: boolean;
    tags?: boolean;
  };
  organization: {
    contactInfo?: boolean;
    attributes?: boolean;
    systemInfo?: boolean;
    relationships?: boolean;
    membershipInfo?: boolean;
    tags?: boolean;
  };
}

interface SectionCollapseContextType {
  collapseState: SectionCollapseState;
  toggleSection: (resourceType: 'person' | 'organization', section: string) => void;
  isSectionCollapsed: (resourceType: 'person' | 'organization', section: string) => boolean;
}

const SectionCollapseContext = createContext<SectionCollapseContextType | undefined>(undefined);

const STORAGE_KEY = 'sectionCollapseState';

export const SectionCollapseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapseState, setCollapseState] = useState<SectionCollapseState>({
    person: {},
    organization: {},
  });

  // Load saved state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          setCollapseState(JSON.parse(savedState));
        }
      } catch (error) {
        console.error('Failed to load collapse state:', error);
      }
    };
    loadState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collapseState)).catch(error => {
      console.error('Failed to save collapse state:', error);
    });
  }, [collapseState]);

  const toggleSection = (resourceType: 'person' | 'organization', section: string) => {
    setCollapseState(prev => ({
      ...prev,
      [resourceType]: {
        ...prev[resourceType],
        [section]: !prev[resourceType][section],
      },
    }));
  };

  const isSectionCollapsed = (resourceType: 'person' | 'organization', section: string) => {
    return collapseState[resourceType][section] || false;
  };

  return (
    <SectionCollapseContext.Provider value={{ collapseState, toggleSection, isSectionCollapsed }}>
      {children}
    </SectionCollapseContext.Provider>
  );
};

export const useSectionCollapse = () => {
  const context = useContext(SectionCollapseContext);
  if (!context) {
    throw new Error('useSectionCollapse must be used within SectionCollapseProvider');
  }
  return context;
};