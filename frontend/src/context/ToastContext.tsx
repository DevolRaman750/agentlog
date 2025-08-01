import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer, ToastData, ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, options?: {
    duration?: number;
    action?: { label: string; onPress: () => void };
  }) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: { label: string; onPress: () => void };
    }
  ) => {
    const id = generateId();
    const newToast: ToastData = {
      id,
      type,
      title,
      message,
      duration: options?.duration || 4000,
      action: options?.action,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration + animation time
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, (options?.duration || 4000) + 500);
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast('error', title, message, { duration: 6000 }); // Longer duration for errors
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message, { duration: 5000 });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast('info', title, message);
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Convenience hooks for specific toast types
export const useSuccessToast = () => {
  const { showSuccess } = useToast();
  return showSuccess;
};

export const useErrorToast = () => {
  const { showError } = useToast();
  return showError;
};

export const useWarningToast = () => {
  const { showWarning } = useToast();
  return showWarning;
};

export const useInfoToast = () => {
  const { showInfo } = useToast();
  return showInfo;
}; 