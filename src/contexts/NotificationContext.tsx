import React, { createContext, useContext, useState, useCallback } from 'react';
import { TopNotification, TopNotificationProps } from '../components/TopNotification';

interface NotificationContextType {
  showNotification: (notification: Omit<TopNotificationProps, 'onHide'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<TopNotificationProps | null>(null);

  const showNotification = useCallback((notificationProps: Omit<TopNotificationProps, 'onHide'>) => {
    setNotification({
      ...notificationProps,
      onHide: () => setNotification(null),
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && <TopNotification {...notification} />}
    </NotificationContext.Provider>
  );
};