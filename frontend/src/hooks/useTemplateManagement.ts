import { useState, useCallback } from 'react';
import { goGentAPI } from '../api/client';
import { AlertAPI } from '../components/CustomAlert';
import { ExecutionTemplate, TemplateFormData, TemplateParameter } from '../types/templates';

export const useTemplateManagement = () => {
  const [templates, setTemplates] = useState<ExecutionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📋 Fetching execution templates...');
      
      const response = await goGentAPI.getTemplates();
      
      if (response.success && response.data) {
        const templatesWithDefaults = (response.data.templates || []).map(template => ({
          ...template,
          parameters: template.parameters || [],
          authTokens: template.authTokens || [],
          tags: template.tags || [],
          enableFunctionCalling: template.enableFunctionCalling || false,
          isActive: template.isActive !== false,
        }));

        console.log('📋 Templates loaded:', templatesWithDefaults.map(t => ({
          id: t.id,
          name: t.name,
          userId: t.userId,
          parametersCount: t.parameters?.length || 0,
          tokensCount: t.authTokens?.length || 0,
          functionsCount: t.functionIds?.length || 0,
          isActive: t.isActive,
          enableFunctionCalling: t.enableFunctionCalling
        })));

        setTemplates(templatesWithDefaults);
      } else {
        console.error('Failed to fetch templates:', response.error);
        setError(response.error || 'Failed to load templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Network error while loading templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (
    formData: TemplateFormData,
    parameters: Omit<TemplateParameter, 'id'>[],
    selectedFunctions: string[]
  ) => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      AlertAPI.alert(
        'Validation Error',
        'Template name and prompt are required.',
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }

    // Validate parameters
    for (const param of parameters) {
      if (!param.name || param.name.trim().length === 0) {
        AlertAPI.alert(
          'Parameter Error',
          'All parameters must have a name.',
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }

      if (param.name.length > 50) {
        AlertAPI.alert(
          'Parameter Error',
          `Parameter name "${param.name}" is too long (max 50 characters).`,
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }

      if (param.description && param.description.length > 500) {
        AlertAPI.alert(
          'Parameter Error',
          `Parameter description for "${param.name}" is too long (max 500 characters).`,
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }

      if (param.parameterType && param.parameterType.length > 20) {
        AlertAPI.alert(
          'Parameter Error',
          `Parameter type for "${param.name}" is too long (max 20 characters).`,
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }
    }

    try {
      const templateData = {
        template: {
          name: formData.name.trim(),
          description: formData.description.trim(),
          templatePrompt: formData.prompt.trim(),
          contextTemplate: formData.context.trim(),
          enableFunctionCalling: formData.enableFunctionCalling,
          tags: formData.tags 
            ? formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0).reduce((acc, tag) => {
                acc[tag] = true;
                return acc;
              }, {} as Record<string, boolean>)
            : {},
          isActive: true,
          isPublic: false,
          category: 'custom',
        },
        parameters: parameters.map(p => ({
          parameterName: p.name,
          description: p.description,
          parameterType: p.parameterType || 'string',
          isRequired: p.isRequired,
          defaultValue: p.defaultValue || '',
          validationRules: p.validationRules || null,
        })),
        functionIds: selectedFunctions,
      };

      console.log('📋 Sending template data:', {
        templateName: templateData.template.name,
        templatePrompt: templateData.template.templatePrompt.substring(0, 100) + '...',
        enableFunctionCalling: templateData.template.enableFunctionCalling,
        parametersCount: templateData.parameters.length,
        parameters: templateData.parameters.map(p => ({
          name: p.parameterName,
          type: p.parameterType,
          required: p.isRequired
        })),
        functionIdsCount: templateData.functionIds.length
      });

      const response = await goGentAPI.createTemplate(templateData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create template');
      }

      await fetchTemplates();
      AlertAPI.alert(
        'Success',
        'Template created successfully',
        [{ text: 'OK', style: 'default' }]
      );
      return true;
    } catch (err) {
      console.error('Error creating template:', err);
      AlertAPI.alert(
        'Error',
        'Failed to create template. Please try again.',
        [{ text: 'OK', style: 'destructive' }]
      );
      return false;
    }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    AlertAPI.alert(
      'Delete Template',
      'Are you sure you want to delete this template? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await goGentAPI.deleteTemplate(templateId);

              if (!response.success) {
                throw new Error(response.error || 'Failed to delete template');
              }

              await fetchTemplates();
              AlertAPI.alert(
                'Success',
                'Template deleted successfully',
                [{ text: 'OK', style: 'default' }]
              );
            } catch (err) {
              console.error('Error deleting template:', err);
              AlertAPI.alert(
                'Error',
                'Failed to delete template. Please try again.',
                [{ text: 'OK', style: 'destructive' }]
              );
            }
          }
        }
      ]
    );
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
  };
}; 