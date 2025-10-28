import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { NotificationConfig } from '../types';

interface NotificationState {
  notifications: (NotificationConfig & { id: string })[];
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: NotificationConfig & { id: string } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' };

const initialState: NotificationState = {
  notifications: [],
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
}

interface NotificationContextType {
  notifications: (NotificationConfig & { id: string })[];
  addNotification: (notification: Omit<NotificationConfig, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = (notification: Omit<NotificationConfig, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { ...notification, id },
    });

    // Auto-remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    }, duration);
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: state.notifications,
        addNotification,
        removeNotification,
        clearAll,
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onRemove,
}: {
  notification: NotificationConfig & { id: string };
  onRemove: () => void;
}) {
  const getNotificationStyles = () => {
    const baseStyles = 'p-4 rounded-lg shadow-lg max-w-sm border-l-4 flex items-start space-x-3';
    
    switch (notification.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-500 text-gray-800`;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className={getNotificationStyles()}>
      <span className="text-lg">{getIcon()}</span>
      <div className="flex-1">
        <h4 className="font-semibold text-sm">{notification.title}</h4>
        <p className="text-sm mt-1">{notification.message}</p>
      </div>
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
