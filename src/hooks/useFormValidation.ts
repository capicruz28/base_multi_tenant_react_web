import { useState, useCallback, useEffect } from 'react';

interface ValidationRule<T> {
  validate: (value: T, formData?: any) => boolean | string;
  message?: string;
}

interface ValidationRules<T> {
  [key: string]: ValidationRule<T> | ValidationRule<T>[];
}

interface UseFormValidationOptions<T> {
  rules: ValidationRules<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Hook para validación en tiempo real de formularios
 * Proporciona validación preventiva mientras el usuario escribe
 */
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  options: UseFormValidationOptions<T>
) {
  const { rules, validateOnChange = true, validateOnBlur = true } = options;
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      const fieldRules = rules[fieldName];
      if (!fieldRules) return null;

      const rulesArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

      for (const rule of rulesArray) {
        const result = rule.validate(value, formData);
        if (result !== true) {
          return typeof result === 'string' ? result : rule.message || 'Campo inválido';
        }
      }

      return null;
    },
    [rules, formData]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    Object.keys(rules).forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, rules, validateField]);

  const handleChange = useCallback(
    (name: string, value: any) => {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Validar en tiempo real si está habilitado y el campo ha sido tocado
      if (validateOnChange && (touched[name] || Object.keys(touched).length > 0)) {
        const error = validateField(name, value);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [name]: error };
          } else {
            const { [name]: _, ...rest } = prev;
            return rest;
          }
        });
      }
    },
    [validateOnChange, touched, validateField]
  );

  const handleBlur = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validateOnBlur) {
        const error = validateField(name, formData[name]);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [name]: error };
          } else {
            const { [name]: _, ...rest } = prev;
            return rest;
          }
        });
      }
    },
    [validateOnBlur, formData, validateField]
  );

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  return {
    formData,
    errors,
    touched,
    setFormData,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
}

