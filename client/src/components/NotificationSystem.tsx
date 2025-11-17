import React, { createContext, useContext, useReducer } from 'react';
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

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
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
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 space-y-3 pointer-events-none max-w-md md:max-w-sm mx-auto md:mx-0">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto animate-slide-in-right w-full md:w-auto"
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'both',
          }}
        >
          <NotificationItem
            notification={notification}
            onRemove={() => removeNotification(notification.id)}
          />
        </div>
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
    const baseStyles =
      'glass p-4 rounded-xl shadow-2xl max-w-sm border-l-4 flex items-start space-x-3 backdrop-blur-md transition-all duration-300 transform hover:scale-[1.02] hover:shadow-glow relative overflow-hidden';

    switch (notification.type) {
      case 'success':
        return `${baseStyles} bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-green-600/20 border-green-400/60 text-green-100 border-green-400 shadow-green-500/20`;
      case 'error':
        return `${baseStyles} bg-gradient-to-br from-red-500/20 via-orange-500/15 to-red-600/20 border-red-400/60 text-red-100 border-red-400 shadow-red-500/20`;
      case 'warning':
        return `${baseStyles} bg-gradient-to-br from-yellow-500/20 via-amber-500/15 to-yellow-600/20 border-yellow-400/60 text-yellow-100 border-yellow-400 shadow-yellow-500/20`;
      case 'info':
        return `${baseStyles} bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-blue-600/20 border-blue-400/60 text-blue-100 border-blue-400 shadow-blue-500/20`;
      default:
        return `${baseStyles} bg-gradient-to-br from-purple-500/20 via-indigo-500/15 to-purple-600/20 border-purple-400/60 text-purple-100 border-purple-400 shadow-purple-500/20`;
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
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>

      <span className="text-2xl flex-shrink-0 animate-bounce-subtle z-10">{getIcon()}</span>
      <div className="flex-1 min-w-0 z-10">
        <h4 className="font-bold text-sm mb-1 tracking-wide">{notification.title}</h4>
        <p className="text-sm opacity-90 break-words leading-relaxed">{notification.message}</p>
      </div>
      <button
        onClick={onRemove}
        className="text-white/60 hover:text-white transition-all duration-200 flex-shrink-0 ml-2 p-1.5 rounded hover:bg-white/10 hover:rotate-90 z-10"
        aria-label="Close notification"
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
