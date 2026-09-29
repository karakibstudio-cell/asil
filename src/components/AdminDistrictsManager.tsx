import React, { useState, useMemo } from 'react';
import { District, Hotel } from '../types';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Building2, 
  Search, 
  Check, 
  X, 
  AlertTriangle,
  ArrowUpDown,
  Navigation
} from 'lucide-react';
import { 
  saveDistrictToDb, 
  deleteDistrictFromDb, 
  syncDistrictRenameToHotels 
} from '../services/firebase';

interface AdminDistrictsManagerProps {
  districts: District[];
  hotels: Hotel[];
  onRefreshDistricts: () => Promise<void>;
  onRefreshHotels: () => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onViewDistrictHotels?: (districtName: string) => void;
}

export const AdminDistrictsManager: React.FC<AdminDistrictsManagerProps> = ({
  districts,
  hotels,
  onRefreshDistricts,
  onRefreshHotels,
  onShowToast,
  onViewDistrictHotels
}) => {
  const [selectedCity, setSelectedCity] = useState<'all' | 'مكة المكرمة' | 'المدينة المنورة'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [initialDistrictName, setInitialDistrictName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [cascadeRename, setCascadeRename] = useState(true);

  // Form state
  const [districtForm, setDistrictForm] = useState<District>({
    id: '',
    name: '',
    city: 'مكة المكرمة',
    description: '',
    distanceRange: '',
    order: 0,
    createdAt: Date.now()
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    district: District | null;
    linkedHotelsCount: number;
  }>({
    isOpen: false,
    district: null,
    linkedHotelsCount: 0
  });

  // Count hotels per district name
  const hotelCountsByDistrict = useMemo(() => {
    const counts: Record<string, number> = {};
    hotels.forEach(h => {
      if (h.district) {
        counts[h.district] = (counts[h.district] || 0) + 1;
      }
    });
    return counts;
  }, [hotels]);

  // Filtered districts list
  const filteredDistricts = useMemo(() => {
    return districts.filter(d => {
      const matchCity = selectedCity === 'all' || d.city === selectedCity;
      const matchSearch = !searchQuery.trim() || 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCity && matchSearch;
    });
  }, [districts, selectedCity, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingDistrictId(null);
    setInitialDistrictName('');
    setDistrictForm({
      id: 'dist_' + Date.now(),
      name: '',
      city: selectedCity !== 'all' ? selectedCity : 'مكة المكرمة',
      description: '',
      distanceRange: '',
      order: districts.length + 1,
      createdAt: Date.now()
    });
    setCascadeRename(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (district: District) => {
    setEditingDistrictId(district.id);
    setInitialDistrictName(district.name);
    setDistrictForm({ ...district });
    setCascadeRename(true);
    setIsModalOpen(true);
  };

  const handleSaveDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtForm.name.trim()) {
      onShowToast('يرجى إدخال اسم المنطقة أو الحي', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveDistrictToDb(districtForm);

      // Check if name changed and cascade rename is selected
      if (editingDistrictId && initialDistrictName && initialDistrictName !== districtForm.name.trim() && cascadeRename) {
        const updatedCount = await syncDistrictRenameToHotels(initialDistrictName, districtForm.name.trim());
        if (updatedCount > 0) {
          await onRefreshHotels();
          onShowToast(`تم تحديث اسم الحي وتعديل ${updatedCount} فندق مرتبط به بنجاح`, 'success');
        }
      }

      await onRefreshDistricts();
      setIsModalOpen(false);
      onShowToast(editingDistrictId ? 'تم تعديل بيانات الحي بنجاح' : 'تمت إضافة الحي الجديد بنجاح', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حفظ الحي', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteDistrict = (district: District) => {
    const linked = hotelCountsByDistrict[district.name] || 0;
    setDeleteModal({
      isOpen: true,
      district,
      linkedHotelsCount: linked
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModal.district) return;
    try {
      await deleteDistrictFromDb(deleteModal.district.id);
      await onRefreshDistricts();
      onShowToast(`تم حذف حي "${deleteModal.district.name}" بنجاح`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حذف الحي', 'error');
    } finally {
      setDeleteModal({ isOpen: false, district: null, linkedHotelsCount: 0 });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-cairo font-bold text-stone-900">إدارة المناطق والأحياء</h2>
          </div>
          <p className="text-xs text-stone-500">
            تحديد أسماء الأحياء وربطها مع الفنادق في مكة المكرمة والمدينة المنورة (إضافة، تعديل، حذف)
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          id="admin-add-district-btn"
          className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة حي جديد</span>
        </button>
      </div>

      {/* Stats and Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 block">إجمالي الأحياء المعتمدة</span>
            <strong className="text-xl font-cairo font-bold text-stone-900">{districts.length}</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B38A34] flex items-center justify-center font-bold">
            {districts.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 block">أحياء مكة المكرمة</span>
            <strong className="text-xl font-cairo font-bold text-[#B38A34]">
              {districts.filter(d => d.city === 'مكة المكرمة').length}
            </strong>
          </div>
          <span className="text-xs px-2 py-1 rounded-md bg-[#C9A24B]/15 text-[#B38A34] font-semibold">
            مكة
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 block">أحياء المدينة المنورة</span>
            <strong className="text-xl font-cairo font-bold text-emerald-700">
              {districts.filter(d => d.city === 'المدينة المنورة').length}
            </strong>
          </div>
          <span className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold">
            المدينة
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedCity('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCity === 'all'
                ? 'bg-[#C9A24B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            الكل ({districts.length})
          </button>
          <button
            onClick={() => setSelectedCity('مكة المكرمة')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCity === 'مكة المكرمة'
                ? 'bg-[#C9A24B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            مكة المكرمة ({districts.filter(d => d.city === 'مكة المكرمة').length})
          </button>
          <button
            onClick={() => setSelectedCity('المدينة المنورة')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCity === 'المدينة المنورة'
                ? 'bg-[#C9A24B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            المدينة المنورة ({districts.filter(d => d.city === 'المدينة المنورة').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن حي أو منطقة..."
            className="w-full pr-9 pl-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:outline-none focus:bg-white focus:border-[#C9A24B]"
          />
        </div>
      </div>

      {/* Districts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500 text-xs font-semibold">
              <th className="pb-3 pr-2">اسم الحي / المنطقة</th>
              <th className="pb-3">المدينة</th>
              <th className="pb-3">الوصف ونطاق المسافة</th>
              <th className="pb-3 text-center">الفنادق المرتبطة</th>
              <th className="pb-3 pl-2 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredDistricts.map((district) => {
              const linkedCount = hotelCountsByDistrict[district.name] || 0;
              return (
                <tr key={district.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3.5 pr-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#B38A34] flex items-center justify-center shrink-0 border border-amber-200/50">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-stone-900 font-bold block text-sm">
                          حي {district.name}
                        </strong>
                        <span className="text-[11px] text-stone-400 font-mono">
                          ID: {district.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                      district.city === 'مكة المكرمة'
                        ? 'bg-[#C9A24B]/15 text-[#B38A34] border border-[#C9A24B]/30'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {district.city}
                    </span>
                  </td>

                  <td className="py-3.5 max-w-[280px]">
                    <div className="space-y-0.5">
                      <span className="text-stone-700 text-xs line-clamp-1">
                        {district.description || 'لا يوجد وصف'}
                      </span>
                      {district.distanceRange && (
                        <span className="text-[11px] text-[#B38A34] font-medium flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          <span>{district.distanceRange}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-200">
                      <Building2 className="w-3.5 h-3.5 text-[#B38A34]" />
                      <span>{linkedCount} فندق</span>
                    </div>
                  </td>

                  <td className="py-3.5 pl-2 text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(district)}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors"
                        title="تعديل الحي"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDeleteDistrict(district)}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors"
                        title="حذف الحي"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredDistricts.length === 0 && (
          <div className="py-12 text-center text-xs text-stone-500">
            لا توجد أحياء مطابقة لمعايير البحث
          </div>
        )}
      </div>

      {/* Add / Edit District Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  {editingDistrictId ? 'تعديل بيانات الحي' : 'إضافة حي أو منطقة جديدة'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDistrict} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">اسم الحي / المنطقة: *</label>
                <input
                  type="text"
                  required
                  value={districtForm.name}
                  onChange={(e) => setDistrictForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: أجياد، المسفلة، العزيزية، محبس الجن..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">المدينة التابع لها: *</label>
                <select
                  value={districtForm.city}
                  onChange={(e) => setDistrictForm(prev => ({ ...prev, city: e.target.value as any }))}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                >
                  <option value="مكة المكرمة">مكة المكرمة</option>
                  <option value="المدينة المنورة">المدينة المنورة</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">نطاق المسافة أو قرب الحرم:</label>
                <input
                  type="text"
                  value={districtForm.distanceRange || ''}
                  onChange={(e) => setDistrictForm(prev => ({ ...prev, distanceRange: e.target.value }))}
                  placeholder="مثال: ١٠٠ - ٤٠٠ م، أو باصات ترددية مجانية 24/7"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">وصف موجز للمنطقة / المعالم القريبة:</label>
                <textarea
                  rows={3}
                  value={districtForm.description || ''}
                  onChange={(e) => setDistrictForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="مثال: شارع أجياد العام، بالقرب من أبراج البيت وباب الملك عبدالعزيز..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              {/* Cascade update notice if editing */}
              {editingDistrictId && initialDistrictName && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="cascade-rename-checkbox"
                    checked={cascadeRename}
                    onChange={(e) => setCascadeRename(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C9A24B] accent-[#C9A24B] mt-0.5"
                  />
                  <label htmlFor="cascade-rename-checkbox" className="text-xs text-amber-900 cursor-pointer">
                    <strong>تحديث تلقائي للفنادق المرتبطة:</strong> عند تغيير اسم الحي، قم بتعديل اسم الحي تلقائياً لجميع الفنادق التابعة لهذا الحي ({hotelCountsByDistrict[initialDistrictName] || 0} فندق).
                  </label>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : editingDistrictId ? 'حفظ التعديلات' : 'إضافة الحي'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete District Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-cairo font-bold text-xl text-stone-900 text-center mb-2">تأكيد حذف الحي</h3>
            <p className="text-xs sm:text-sm text-stone-600 text-center leading-relaxed mb-4">
              هل أنت متأكد من رغبتك في حذف حي <strong className="text-stone-900">"{deleteModal.district?.name}"</strong>؟
            </p>

            {deleteModal.linkedHotelsCount > 0 && (
              <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center font-medium">
                تنبيه: يوجد حالياً <strong>{deleteModal.linkedHotelsCount} فندق</strong> مسجل تحت هذا الحي. لن يتم حذف الفنادق لكن الحي لن يكون متاحاً في القائمة المعتمدة.
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleExecuteDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                نعم، احذف الحي
              </button>
              <button
                onClick={() => setDeleteModal({ isOpen: false, district: null, linkedHotelsCount: 0 })}
                className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
