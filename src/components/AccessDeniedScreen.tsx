import React from 'react';
import { ShieldAlert, ArrowRight, Lock, KeyRound } from 'lucide-react';
import { PermissionModule, PERMISSION_MODULES, AdminRole, AdminUser } from '../types/rbac';
import { AdminTab } from '../utils/routing';

interface AccessDeniedScreenProps {
  module?: PermissionModule;
  tab?: AdminTab;
  currentUser?: AdminUser | null;
  userRoles?: AdminRole[];
  onNavigateTab: (tab: AdminTab) => void;
  availableTabs?: AdminTab[];
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  module,
  currentUser,
  userRoles = [],
  onNavigateTab,
  availableTabs = ['hotels']
}) => {
  const moduleDef = PERMISSION_MODULES.find(m => m.id === module);
  const fallbackTab = availableTabs.length > 0 ? availableTabs[0] : 'hotels';

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200/80 shadow-xl p-8 text-center relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated Lock Icon Capsule */}
          <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mb-6 shadow-inner">
            <ShieldAlert className="w-10 h-10 animate-pulse text-[#C9A24B]" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-3 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            صلاحية غير متوفرة (Access Restricted)
          </span>

          <h2 className="text-2xl font-black text-stone-900 mb-2">
            ليس لديك إذن للوصول إلى هذه الشاشة
          </h2>

          <p className="text-stone-600 text-sm leading-relaxed mb-6 max-w-md">
            حسابك الحالي <span className="font-bold text-stone-900 font-mono">({currentUser?.name || currentUser?.username})</span> لا يملك صلاحية عرض وحدة <span className="font-bold text-[#B38A34]">"{moduleDef?.labelAr || module || 'هذا القسم'}"</span>.
          </p>

          {/* User's Current Roles Badge */}
          <div className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-6 text-right">
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
              <span className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                الأدوار المسندة لحسابك:
              </span>
              <span className="text-[11px] font-mono text-stone-400">ID: {currentUser?.id}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {userRoles.length > 0 ? (
                userRoles.map(r => (
                  <span 
                    key={r.id} 
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-stone-200 text-stone-700 shadow-2xs"
                  >
                    {r.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-stone-400 italic">لا توجد أدوار مخصصة مسندة</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={() => onNavigateTab(fallbackTab)}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>العودة للأقسام المتاحة لك</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
