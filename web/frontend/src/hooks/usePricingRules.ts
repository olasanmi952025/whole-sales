import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import type { PricingRule } from '../types';

export function usePricingRules() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const { loading, error, request } = useApi<PricingRule[]>();

  const fetchRules = useCallback(async () => {
    const data = await request('/api/rules');
    if (data) {
      setRules(data);
    }
  }, [request]);

  const createRule = useCallback(async (rule: PricingRule): Promise<boolean> => {
    const data = await request('/api/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
    
    if (data) {
      await fetchRules();
      return true;
    }
    return false;
  }, [request, fetchRules]);

  const updateRule = useCallback(async (id: number, rule: Partial<PricingRule>): Promise<boolean> => {
    const data = await request(`/api/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
    
    if (data) {
      await fetchRules();
      return true;
    }
    return false;
  }, [request, fetchRules]);

  const deleteRule = useCallback(async (id: number): Promise<boolean> => {
    const response = await fetch(`/api/rules/${id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      await fetchRules();
      return true;
    }
    return false;
  }, [fetchRules]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    loading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
  };
}

