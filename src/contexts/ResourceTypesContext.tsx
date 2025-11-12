import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ResourceType } from '../types/api';
import { resourceTypesApi } from '../api';

interface ResourceTypesContextType {
  organizationTypes: Map<string, ResourceType>;
  getOrganizationTypeLabel: (slug: string) => string;
  isLoading: boolean;
  error: Error | null;
  refreshResourceTypes: () => Promise<void>;
}

const ResourceTypesContext = createContext<ResourceTypesContextType | undefined>(undefined);

export const ResourceTypesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [organizationTypes, setOrganizationTypes] = useState<Map<string, ResourceType>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchResourceTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch organization types
      const response = await resourceTypesApi.getOrganizationTypes();
      
      // Convert array to Map for quick lookup by slug
      const typesMap = new Map<string, ResourceType>();
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(type => {
          typesMap.set(type.attributes.slug, type);
        });
      }
      
      setOrganizationTypes(typesMap);
    } catch (err) {
      console.error('Error fetching resource types:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResourceTypes();
  }, []);

  const getOrganizationTypeLabel = (slug: string): string => {
    if (!slug) return '';
    
    const type = organizationTypes.get(slug);
    if (type) {
      // Return the localized name based on user's locale
      // For now, we'll default to the main 'name' field
      return type.attributes.name;
    }
    
    // Fallback: Convert slug to title case
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const value: ResourceTypesContextType = {
    organizationTypes,
    getOrganizationTypeLabel,
    isLoading,
    error,
    refreshResourceTypes: fetchResourceTypes,
  };

  return (
    <ResourceTypesContext.Provider value={value}>
      {children}
    </ResourceTypesContext.Provider>
  );
};

export const useResourceTypes = () => {
  const context = useContext(ResourceTypesContext);
  if (context === undefined) {
    throw new Error('useResourceTypes must be used within a ResourceTypesProvider');
  }
  return context;
};