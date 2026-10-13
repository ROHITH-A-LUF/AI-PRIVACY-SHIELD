import React, { createContext, useContext, useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { AppItem, PermissionKey } from '../models/types';
import { INITIAL_APP_INVENTORY, getAuditedInventory } from '../core/initialData';
import { KNOWN_PERMISSIONS } from '../constants/permissions';

interface AuditStats {
  totalApps: number;
  sensitiveCount: number;
  mismatchCount: number;
  threatsCount: number;
  avgRisk: number;
}

interface AuditContextType {
  apps: AppItem[];
  stats: AuditStats;
  healthScore: number;
  healthStatus: string;
  healthLevel: 'HEALTHY' | 'CAUTION' | 'AT RISK';
  healthDescription: string;
  currentFilter: string;
  setCurrentFilter: (f: string) => void;
  isScanning: boolean;
  scanStep: string;
  scanProgress: number;
  triggerAuditScan: () => Promise<void>;
  findAppById: (id: string) => AppItem | undefined;
  updateAppPermissions: (id: string, newPerms: PermissionKey[]) => void;
  toggleCameraPermission: (id: string, allow: boolean) => void;
  toggleMicPermission: (id: string, allow: boolean) => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [apps, setApps] = useState<AppItem[]>(() =>
    getAuditedInventory(INITIAL_APP_INVENTORY)
  );
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanProgress, setScanProgress] = useState<number>(0);

  const stats = useMemo<AuditStats>(() => {
    let totalRisk = 0;
    let sensitiveCount = 0;
    let mismatchCount = 0;
    let threatsCount = 0;

    apps.forEach((app) => {
      const res = app.auditResult;
      if (res) {
        totalRisk += res.finalScore;
        if (res.mismatchPenalty > 0) mismatchCount++;
        if (res.threatVectors.length > 0) threatsCount += res.threatVectors.length;
      }

      app.permissions.forEach((p) => {
        const def = KNOWN_PERMISSIONS[p];
        if (def && def.weight >= 20) {
          sensitiveCount++;
        }
      });
    });

    const avgRisk = apps.length > 0 ? totalRisk / apps.length : 0;
    return {
      totalApps: apps.length,
      sensitiveCount,
      mismatchCount,
      threatsCount,
      avgRisk,
    };
  }, [apps]);

  const healthScore = useMemo(() => {
    return Math.max(0, Math.min(100, Math.round(100 - stats.avgRisk)));
  }, [stats.avgRisk]);

  const { healthStatus, healthLevel, healthDescription } = useMemo(() => {
    if (healthScore >= 80) {
      return {
        healthStatus: 'Secured Mobile Privacy Environment',
        healthLevel: 'HEALTHY' as const,
        healthDescription:
          'All application permissions align cleanly with declared functional baselines.',
      };
    } else if (healthScore >= 50) {
      return {
        healthStatus: 'Moderate Privacy Anomalies Detected',
        healthLevel: 'CAUTION' as const,
        healthDescription: `${stats.mismatchCount} applications request permissions outside their functional domain.`,
      };
    } else {
      return {
        healthStatus: 'Critical Privacy Exposure Alert',
        healthLevel: 'AT RISK' as const,
        healthDescription: `${stats.mismatchCount} apps show severe context drift, including ${stats.threatsCount} active threat vectors.`,
      };
    }
  }, [healthScore, stats.mismatchCount, stats.threatsCount]);

  const triggerAuditScan = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsScanning(true);
    setScanProgress(0);

    const steps = [
      'Enumerating PackageManager installed packages...',
      'Resolving 3-tier application contextual taxonomies...',
      'Executing CBPRA Context-Permission Matrix matching...',
      'Synthesizing deterministic AI explanations & recommendations...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setScanStep(steps[i]);
      setScanProgress(((i + 1) / steps.length) * 100);
      try {
        Haptics.selectionAsync();
      } catch {}
      await new Promise((res) => setTimeout(res, 550));
    }

    setApps((prev) => getAuditedInventory([...prev]));
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    await new Promise((res) => setTimeout(res, 350));
    setIsScanning(false);
  };

  const findAppById = (id: string) => {
    return apps.find((a) => a.id === id);
  };

  const updateAppPermissions = (id: string, newPerms: PermissionKey[]) => {
    setApps((prev) => {
      const updated = prev.map((app) => {
        if (app.id === id) {
          return { ...app, permissions: newPerms };
        }
        return app;
      });
      return getAuditedInventory(updated);
    });
  };

  const toggleCameraPermission = (id: string, allow: boolean) => {
    setApps((prev) => {
      const updated = prev.map((app) => {
        if (app.id === id || app.packageName === id) {
          const current = app.permissions || [];
          const nextPerms = allow
            ? (current.includes('CAMERA') ? current : [...current, 'CAMERA' as PermissionKey])
            : current.filter((p) => p !== 'CAMERA');
          return { ...app, permissions: nextPerms };
        }
        return app;
      });
      return getAuditedInventory(updated);
    });
  };

  const toggleMicPermission = (id: string, allow: boolean) => {
    setApps((prev) => {
      const updated = prev.map((app) => {
        if (app.id === id || app.packageName === id) {
          const current = app.permissions || [];
          const nextPerms = allow
            ? (current.includes('RECORD_AUDIO') ? current : [...current, 'RECORD_AUDIO' as PermissionKey])
            : current.filter((p) => p !== 'RECORD_AUDIO');
          return { ...app, permissions: nextPerms };
        }
        return app;
      });
      return getAuditedInventory(updated);
    });
  };

  return (
    <AuditContext.Provider
      value={{
        apps,
        stats,
        healthScore,
        healthStatus,
        healthLevel,
        healthDescription,
        currentFilter,
        setCurrentFilter,
        isScanning,
        scanStep,
        scanProgress,
        triggerAuditScan,
        findAppById,
        updateAppPermissions,
        toggleCameraPermission,
        toggleMicPermission,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = (): AuditContextType => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};
