import React, { useState, useMemo } from 'react';
import { 
  AuditLogEntry, 
  PermissionModule, 
  PERMISSION_MODULES, 
  AdminUser 
} from '../types/rbac';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Layers, 
  RefreshCw, 
  Download, 
  Eye, 
  X, 
  Clock, 
  FileText,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AuditLogViewerProps {
  logs?: AuditLogEntry[];
  auditLogs?: AuditLogEntry[];
  users?: AdminUser[];
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  canExport?: boolean;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  auditLogs,
  users = [],
  onRefresh,
  onShowToast,
  canExport = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeDiffLog, setActiveDiffLog] = useState<AuditLogEntry | null>(null);

  const effectiveLogs = useMemo(() => {
    if (Array.isArray(logs)) return logs;
    if (Array.isArray(auditLogs)) return auditLogs;
    return [];
  }, [logs, auditLogs]);

  const effectiveUsers = useMemo(() => {
    return Array.isArray(users) ? users : [];
  }, [users]);

  // Filtering
  const filteredLogs = useMemo(() => {
    return effectiveLogs.filter((log) => {
      // 1. Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDetails = log.details?.toLowerCase().includes(query);
        const matchesUser = log.userName?.toLowerCase().includes(query);
        const matchesRecord = log.recordTitle?.toLowerCase().includes(query) || log.recordId?.toLowerCase().includes(query);
        const matchesAction = log.actionLabelAr?.toLowerCase().includes(query) || log.action?.toLowerCase().includes(query);
        if (!matchesDetails && !matchesUser && !matchesRecord && !matchesAction) {
          return false;
        }
      }

      // 2. User filter
      if (selectedUser !== 'all' && log.userId !== selectedUser) {
        return false;
      }

      // 3. Module filter
      if (selectedModule !== 'all' && log.module !== selectedModule) {
        return false;
      }

      // 4. Date range filter
      if (startDate) {
        const startTs = new Date(startDate).setHours(0, 0, 0, 0);
        if (log.timestamp < startTs) return false;
      }
      if (endDate) {
        const endTs = new Date(endDate).setHours(23, 59, 59, 999);
        if (log.timestamp > endTs) return false;
      }

      return true;
    });
  }, [effectiveLogs, searchTerm, selectedUser, selectedModule, startDate, endDate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      onShowToast('تم تحديث سجل العمليات بنجاح', 'success');
    } catch {
      onShowToast('حدث خطأ أثناء تحديث السجل', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      onShowToast('لا توجد سجلات لتصديرها', 'info');
      return;
    }

    const headers = ['التاريخ والوقت', 'المستخدم', 'الوحدة', 'نوع الإجراء', 'العنصر', 'التفاصيل'];
    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toLocaleString('ar-SA'),
      log.userName || log.userId,
      PERMISSION_MODULES.find(m => m.id === log.module)?.labelAr || log.module,
      log.actionLabelAr || log.action,
      log.recordTitle || log.recordId || '-',
      (log.details || '').replace(/"/g, '""')
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prestige-audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('تم تصدير سجل التدقيق إلى ملف CSV بنجاح', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#B38A34] mb-2">
            <History className="w-4 h-4" />
            <span>سجل تدقيق العمليات والأمان (Audit Log & Activity Trail)</span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            سجل العمليات والرقابة الإدارية
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            سجل موثق للقراءة فقط يوثق كافة التعديلات والتغييرات (الأسعار، التوفر، حالات الحجز، الأدوار، والإعدادات) مع هوية المسؤول وتوقيت العملية.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C9A24B]' : ''}`} />
            <span>تحديث</span>
          </button>

          {canExport && (
            <button
              onClick={handleExportCSV}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
            <input
              type="text"
              placeholder="بحث في التفاصيل أو المعرف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:bg-white focus:border-[#C9A24B] outline-none transition-all"
            />
          </div>

          {/* User Filter */}
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 absolute right-3 top-3.5 pointer-events-none" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:bg-white focus:border-[#C9A24B] outline-none transition-all cursor-pointer"
            >
              <option value="all">كل المسؤولين والمشرفين</option>
              {effectiveUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.username})
                </option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          <div className="relative">
            <Layers className="w-4 h-4 text-stone-400 absolute right-3 top-3.5 pointer-events-none" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:bg-white focus:border-[#C9A24B] outline-none transition-all cursor-pointer"
            >
              <option value="all">كافة الأقسام والوحدات</option>
              {PERMISSION_MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.labelAr}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="تاريخ البداية"
              className="w-1/2 px-2 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-700 outline-none focus:border-[#C9A24B]"
            />
            <span className="text-stone-300 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="تاريخ النهاية"
              className="w-1/2 px-2 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-700 outline-none focus:border-[#C9A24B]"
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchTerm || selectedUser !== 'all' || selectedModule !== 'all' || startDate || endDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
            <span>
              عرض <strong className="text-stone-900">{filteredLogs.length}</strong> سجل من أصل {effectiveLogs.length}
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedUser('all');
                setSelectedModule('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-[#B38A34] hover:underline font-bold cursor-pointer"
            >
              إلغاء الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">التوقيت والتاريخ</th>
                <th className="py-3.5 px-4">المسؤول</th>
                <th className="py-3.5 px-4">الوحدة</th>
                <th className="py-3.5 px-4">الإجراء</th>
                <th className="py-3.5 px-4">العنصر</th>
                <th className="py-3.5 px-4">التفاصيل</th>
                <th className="py-3.5 px-4 text-center">المقارنة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
                    <span>لا توجد سجلات تطابق الفلاتر المحددة</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const modDef = PERMISSION_MODULES.find(m => m.id === log.module);
                  const hasDiff = log.oldValue !== undefined || log.newValue !== undefined;
                  
                  return (
                    <tr key={log.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{new Date(log.timestamp).toLocaleDateString('ar-SA')}</span>
                          <span className="text-[10px] text-stone-400">{new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-stone-900">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-600">
                            {log.userName ? log.userName.charAt(0) : 'U'}
                          </span>
                          <span>{log.userName || log.userId}</span>
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                          {modDef?.labelAr || log.module}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          log.action.includes('delete') || log.action.includes('cancel')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : log.action.includes('create') || log.action.includes('confirm')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {log.actionLabelAr || log.action}
                        </span>
                      </td>

                      {/* Record */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-stone-800">
                        {log.recordTitle || log.recordId || '-'}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate" title={log.details}>
                        {log.details || '-'}
                      </td>

                      {/* Diff Modal Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {hasDiff ? (
                          <button
                            onClick={() => setActiveDiffLog(log)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
                            title="عرض تفاصيل التغيير (Diff)"
                          >
                            <Eye className="w-4 h-4 text-[#B38A34]" />
                          </button>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff / Value Inspection Modal */}
      {activeDiffLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C9A24B]" />
                <h3 className="font-bold text-stone-900 text-base">
                  تفاصيل التغيير (قبل وبعد)
                </h3>
              </div>
              <button
                onClick={() => setActiveDiffLog(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-right text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                <p className="font-bold text-stone-800 mb-1">{activeDiffLog.details}</p>
                <p className="text-stone-500 text-[11px]">
                  بواسطة: <span className="text-stone-700 font-bold">{activeDiffLog.userName}</span> في {new Date(activeDiffLog.timestamp).toLocaleString('ar-SA')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Old Value */}
                <div className="space-y-1.5">
                  <span className="font-bold text-rose-700 flex items-center gap-1">
                    القيمة السابقة (Old Value):
                  </span>
                  <pre className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/60 text-[11px] font-mono text-stone-800 overflow-x-auto max-h-60">
                    {activeDiffLog.oldValue !== undefined
                      ? JSON.stringify(activeDiffLog.oldValue, null, 2)
                      : 'لا توجد قيمة سابقة (سجل جديد)'}
                  </pre>
                </div>

                {/* New Value */}
                <div className="space-y-1.5">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    القيمة الجديدة (New Value):
                  </span>
                  <pre className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-[11px] font-mono text-stone-800 overflow-x-auto max-h-60">
                    {activeDiffLog.newValue !== undefined
                      ? JSON.stringify(activeDiffLog.newValue, null, 2)
                      : 'تم الحذف'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex justify-end">
              <button
                onClick={() => setActiveDiffLog(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
