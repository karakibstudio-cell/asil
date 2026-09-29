import React, { useState } from 'react';
import { Hotel } from '../types';
import { Star, X, CheckCircle, Send, Building2, Camera, Upload, Trash2, User } from 'lucide-react';
import { submitHotelReview } from '../services/firebase';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { useLanguage } from '../context/LanguageContext';

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotels: Hotel[];
  initialHotelId?: string;
  onReviewSubmitted?: () => void;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  isOpen,
  onClose,
  hotels,
  initialHotelId,
  onReviewSubmitted
}) => {
  const { language, translateDynamic, isRtl } = useLanguage();
  const [selectedHotelId, setSelectedHotelId] = useState(initialHotelId || (hotels[0]?.id ?? ''));
  const [authorName, setAuthorName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [countryOrTitle, setCountryOrTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(language === 'en' ? 'Image size is too large. Please select an image under 5MB.' : 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت.');
        return;
      }
      setErrorMessage('');
      try {
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const optimized = await optimizeImageFile(file, {
          maxWidth: 256,
          maxHeight: 256,
          forcePng: isPng
        });
        setAvatarUrl(optimized);
      } catch (err) {
        console.warn('Failed to optimize avatar:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) {
      setErrorMessage(language === 'en' ? 'Please enter your name and detailed review.' : 'يرجى كتابة اسمك وتجربتك بالتفصيل.');
      return;
    }

    const hotel = hotels.find((h) => h.id === selectedHotelId) || hotels[0];
    const hotelName = hotel?.name || (language === 'en' ? 'Haramain Hotel' : 'فندق في الحرمين');

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await submitHotelReview({
        hotelId: selectedHotelId || (hotel?.id ?? 'general'),
        hotelName,
        authorName: authorName.trim(),
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : undefined,
        countryOrTitle: countryOrTitle.trim() ? countryOrTitle.trim() : undefined,
        rating,
        comment: comment.trim()
      });

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setAuthorName('');
        setAvatarUrl('');
        setCountryOrTitle('');
        setComment('');
        setRating(5);
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Failed submitting review:', err);
      setErrorMessage(language === 'en' ? 'An error occurred while submitting your review.' : 'حدث خطأ أثناء إرسال التقييم.');
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="add-review-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto"
    >
      <div
        id="add-review-modal-card"
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors`}
          aria-label={language === 'en' ? 'Close' : 'إغلاق'}
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="font-cairo font-black text-2xl text-stone-900 mb-2">
              {language === 'en' ? 'Thank You for Your Feedback!' : 'شكراً لمشاركتك الكريمة!'}
            </h3>
            <p className="text-stone-600 text-sm max-w-sm leading-relaxed">
              {language === 'en' 
                ? 'Your review has been received and will be displayed after approval by Prestige Hotels Management.' 
                : 'تم استلام تقييمك بنجاح وسوف يظهر في الموقع بعد المراجعة والاعتماد من قِبل إدارة شركة برستيج.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A24B]/15 text-[#B38A34] text-xs font-bold mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Guest Reviews' : 'تقييم ضيوف الرحمن'}</span>
              </div>
              <h3 className="font-cairo font-black text-xl sm:text-2xl text-stone-900">
                {language === 'en' ? 'Share Your Stay Experience & Rating' : 'أضف تجربتك وتقييمك للإقامة'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {language === 'en'
                  ? 'Your feedback helps future pilgrims choose the best hotel for their spiritual journey.'
                  : 'رأيك يساعد زوار الحرمين الشريفين على اختيار الفندق الأمثل لرحلتهم الروحانية.'}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                {errorMessage}
              </div>
            )}

            {/* Hotel selection */}
            <div>
              <label className={`block text-xs font-bold text-stone-700 mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                {language === 'en' ? 'Reviewed Hotel:' : 'الفندق محل التقييم:'}
              </label>
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-medium focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent outline-none"
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {language === 'en' ? (h.nameEn || translateDynamic(h.name)) : h.name} ({translateDynamic(h.city)} - {translateDynamic(h.district)})
                  </option>
                ))}
              </select>
            </div>

            {/* Author Name */}
            <div>
              <label className={`block text-xs font-bold text-stone-700 mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                {language === 'en' ? 'Your Name:' : 'الاسم أو الكنية'} <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={language === 'en' ? 'e.g. Eng. Abdulrahman / Abu Mohammad' : 'مثال: المهندس عبدالرحمن السعيد / أبو محمد'}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-medium focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent outline-none"
              />
            </div>

            {/* Country or Subtitle (Optional) */}
            <div>
              <label className={`block text-xs font-bold text-stone-700 mb-1.5 ${isRtl ? 'text-right' : 'text-left'} flex items-center justify-between`}>
                <span>{language === 'en' ? 'Country / Title:' : 'البلد أو الصفة:'}</span>
                <span className="text-[11px] font-normal text-stone-400">
                  {language === 'en' ? '(Optional)' : '(اختياري - يظهر فقط إذا كتبته)'}
                </span>
              </label>
              <input
                type="text"
                value={countryOrTitle}
                onChange={(e) => setCountryOrTitle(e.target.value)}
                placeholder={language === 'en' ? 'e.g. Umrah Pilgrim from UK' : 'مثال: معتمر من الكويت / زائر من الرياض'}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-medium focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent outline-none"
              />
            </div>

            {/* Optional Customer Photo */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <label className={`block text-xs font-bold text-stone-800 mb-1 ${isRtl ? 'text-right' : 'text-left'} flex items-center justify-between`}>
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#B38A34]" />
                  <span>{language === 'en' ? 'Avatar / Photo:' : 'الصورة الشخصية:'}</span>
                </span>
                <span className="text-[10px] font-normal text-stone-500">
                  {language === 'en' ? '(Optional)' : '(اختياري)'}
                </span>
              </label>

              <div className="flex items-center gap-3 mt-2">
                {avatarUrl ? (
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#C9A24B] shrink-0">
                    <img src={avatarUrl} alt="معاينة الصورة" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      title={language === 'en' ? 'Remove Photo' : 'إزالة الصورة'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:border-[#C9A24B] text-stone-700 text-xs font-semibold shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#B38A34]" />
                    <span>{avatarUrl ? (language === 'en' ? 'Change Photo' : 'تغيير الصورة') : (language === 'en' ? 'Upload Photo' : 'رفع صورة من جهازك')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Stars rating selection */}
            <div>
              <label className={`block text-xs font-bold text-stone-700 mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                {language === 'en' ? 'Overall Rating:' : 'تقييمك العام للإقامة'} <span className="text-red-500">*</span>:
              </label>
              <div className="flex items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = (hoverRating || rating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-2xl focus:outline-none transition-transform hover:scale-125"
                      aria-label={`${starVal} ${language === 'en' ? 'stars' : 'نجوم'}`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled ? 'fill-[#C9A24B] text-[#C9A24B]' : 'text-stone-300'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-bold text-[#B38A34] mx-2">
                  {rating === 5 
                    ? (language === 'en' ? 'Excellent (5/5)' : 'ممتاز جداً (5/5)') 
                    : rating === 4 
                    ? (language === 'en' ? 'Very Good (4/5)' : 'جيد جداً (4/5)') 
                    : `${rating} ${language === 'en' ? 'Stars' : 'نجوم'}`}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className={`block text-xs font-bold text-stone-700 mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                {language === 'en' ? 'Review & Experience Details:' : 'تفاصيل التجربة ورأيك في الفندق والخدمة'} <span className="text-red-500">*</span>:
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={language === 'en' ? 'Share your feedback on cleanliness, distance to Haram, staff, and comfort...' : 'شاركنا رأيك في النظافة، القرب من الحرم، طاقم العمل، ومستوى الراحة...'}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-medium focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting 
                    ? (language === 'en' ? 'Submitting...' : 'جاري الإرسال...') 
                    : (language === 'en' ? 'Submit Review for Moderation' : 'إرسال التقييم للمراجعة')}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
