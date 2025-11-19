import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SectionType = 'contactInfo' | 'attributes' | 'systemInfo' | 'relationships' | 'membershipInfo' | 'tags' | 'touchpoints' | 'parentGroup' | 'description' | 'statistics' | 'groupInfo' | 'subGroups' | 'members';

interface SectionCollapseState {
  person: {
    [key in SectionType]?: boolean;
  };
  organization: {
    [key in SectionType]?: boolean;
  };
  group: {
    [key in SectionType]?: boolean;
  };
}

interface SectionCollapseContextType {
  collapseState: SectionCollapseState;
  toggleSection: (resourceType: 'person' | 'organization' | 'group', section: SectionType) => void;
  isSectionCollapsed: (resourceType: 'person' | 'organization' | 'group', section: SectionType) => boolean;
}

const SectionCollapseContext = createContext<SectionCollapseContextType | undefined>(undefined);

const STORAGE_KEY = 'sectionCollapseState';

export const SectionCollapseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapseState, setCollapseState] = useState<SectionCollapseState>({
    person: {},
    organization: {},
    group: {},
  });

  // Load saved state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Ensure all resource types are initialized
          setCollapseState({
            person: parsedState.person || {},
            organization: parsedState.organization || {},
            group: parsedState.group || {},
          });
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

  const toggleSection = (resourceType: 'person' | 'organization' | 'group', section: SectionType) => {
    setCollapseState(prev => ({
      ...prev,
      [resourceType]: {
        ...prev[resourceType],
        [section]: !prev[resourceType][section],
      },
    }));
  };

  const isSectionCollapsed = (resourceType: 'person' | 'organization' | 'group', section: SectionType) => {
    return collapseState[resourceType]?.[section] || false;
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