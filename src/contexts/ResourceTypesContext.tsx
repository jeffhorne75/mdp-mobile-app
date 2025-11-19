import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ResourceType } from '../types/api';
import { resourceTypesApi } from '../api';

interface ResourceTypesContextType {
  organizationTypes: Map<string, ResourceType>;
  organizationStatuses: Map<string, ResourceType>;
  connectionTypes: Map<string, ResourceType>;
  groupTypes: Map<string, ResourceType>;
  getOrganizationTypeLabel: (slug: string) => string;
  getOrganizationStatusLabel: (slug: string) => string;
  getConnectionTypeLabel: (slug: string) => string;
  getGroupTypeLabel: (slug: string) => string;
  isLoading: boolean;
  error: Error | null;
  refreshResourceTypes: () => Promise<void>;
}

const ResourceTypesContext = createContext<ResourceTypesContextType | undefined>(undefined);

export const ResourceTypesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [organizationTypes, setOrganizationTypes] = useState<Map<string, ResourceType>>(new Map());
  const [organizationStatuses, setOrganizationStatuses] = useState<Map<string, ResourceType>>(new Map());
  const [connectionTypes, setConnectionTypes] = useState<Map<string, ResourceType>>(new Map());
  const [groupTypes, setGroupTypes] = useState<Map<string, ResourceType>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchResourceTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch organization types
      const orgTypesResponse = await resourceTypesApi.getOrganizationTypes();
      
      // Convert array to Map for quick lookup by slug
      const typesMap = new Map<string, ResourceType>();
      if (orgTypesResponse.data && Array.isArray(orgTypesResponse.data)) {
        orgTypesResponse.data.forEach(type => {
          typesMap.set(type.attributes.slug, type);
        });
      }
      
      setOrganizationTypes(typesMap);
      
      // Fetch organization statuses
      const statusResponse = await resourceTypesApi.getOrganizationStatuses();
      
      // Convert array to Map for quick lookup by slug
      const statusMap = new Map<string, ResourceType>();
      if (statusResponse.data && Array.isArray(statusResponse.data)) {
        statusResponse.data.forEach(status => {
          statusMap.set(status.attributes.slug, status);
        });
      }
      
      setOrganizationStatuses(statusMap);
      
      // Fetch connection types
      const connectionResponse = await resourceTypesApi.getConnectionTypes();
      
      // Convert array to Map for quick lookup by slug
      const connectionMap = new Map<string, ResourceType>();
      if (connectionResponse.data && Array.isArray(connectionResponse.data)) {
        connectionResponse.data.forEach(conn => {
          connectionMap.set(conn.attributes.slug, conn);
        });
      }
      
      setConnectionTypes(connectionMap);
      
      // Fetch group types
      try {
        const groupResponse = await resourceTypesApi.getGroupTypes();
        
        // Convert array to Map for quick lookup by slug
        const groupMap = new Map<string, ResourceType>();
        if (groupResponse.data && Array.isArray(groupResponse.data)) {
          groupResponse.data.forEach(group => {
            groupMap.set(group.attributes.slug, group);
          });
        }
        
        setGroupTypes(groupMap);
      } catch (groupErr) {
        // Groups API might not be available in all environments
        console.warn('Could not fetch group types:', groupErr);
        setGroupTypes(new Map());
      }
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
      // Try to get the best available name, preferring English
      const name = type.attributes.name_en || 
                   type.attributes.name || 
                   type.attributes.name_fr || 
                   type.attributes.name_es ||
                   type.attributes.slug;
      return name || slug;
    }
    
    // Fallback: Convert slug to title case
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getOrganizationStatusLabel = (slug: string): string => {
    if (!slug) return '';
    
    const status = organizationStatuses.get(slug);
    if (status) {
      // Try to get the best available name, preferring English
      const name = status.attributes.name_en || 
                   status.attributes.name || 
                   status.attributes.name_fr || 
                   status.attributes.name_es ||
                   status.attributes.slug;
      return name || slug;
    }
    
    // Fallback: Convert slug to title case
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getConnectionTypeLabel = (slug: string): string => {
    if (!slug) return '';
    
    const type = connectionTypes.get(slug);
    if (type) {
      // Try to get the best available name, preferring English
      const name = type.attributes.name_en || 
                   type.attributes.name || 
                   type.attributes.name_fr || 
                   type.attributes.name_es ||
                   type.attributes.slug;
      return name || slug;
    }
    
    // Fallback: Convert slug to title case (handles both hyphens and underscores)
    return slug
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getGroupTypeLabel = (slug: string): string => {
    if (!slug) return '';
    
    const type = groupTypes.get(slug);
    if (type) {
      // Try to get the best available name, preferring English
      const name = type.attributes.name_en || 
                   type.attributes.name || 
                   type.attributes.name_fr || 
                   type.attributes.name_es ||
                   type.attributes.slug;
      return name || slug;
    }
    
    // Fallback: Convert slug to title case
    return slug
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const value: ResourceTypesContextType = {
    organizationTypes,
    organizationStatuses,
    connectionTypes,
    groupTypes,
    getOrganizationTypeLabel,
    getOrganizationStatusLabel,
    getConnectionTypeLabel,
    getGroupTypeLabel,
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