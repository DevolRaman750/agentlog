import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface FormState {
  executionName: string;
  description: string;
  prompt: string;
  context: string;
  selectedConfigs: string[];
  comparisonEnabled: boolean;
  selectedMetrics: string[];
  selectedFunctions: string[];
  functionExecutionMode: 'mock' | 'real' | 'auto';
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: any }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_SAVED_STATE'; state: Partial<FormState> };

interface FormContextType {
  state: FormState;
  updateField: (field: keyof FormState, value: any) => void;
  resetForm: () => void;
}

// Initial state
const initialState: FormState = {
  executionName: '',
  description: '',
  prompt: '',
  context: '',
  selectedConfigs: [],
  comparisonEnabled: true,
  selectedMetrics: ['response_time', 'creativity_score'],
  selectedFunctions: [],
  functionExecutionMode: 'real',
};

// Reducer
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET_FORM':
      return initialState;
    case 'LOAD_SAVED_STATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

// Context
const FormStateContext = createContext<FormContextType | undefined>(undefined);

// Provider
export const FormStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const updateField = (field: keyof FormState, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  const value: FormContextType = {
    state,
    updateField,
    resetForm,
  };

  return (
    <FormStateContext.Provider value={value}>
      {children}
    </FormStateContext.Provider>
  );
};

// Hook
export const useFormState = (): FormContextType => {
  const context = useContext(FormStateContext);
  if (context === undefined) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  return context;
}; 