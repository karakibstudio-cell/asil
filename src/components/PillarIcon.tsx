import React from 'react';
import { 
  ShieldCheck, 
  HeartHandshake, 
  Award, 
  Building2, 
  Star, 
  Clock, 
  PhoneCall, 
  Users, 
  CheckCircle2, 
  Compass, 
  Medal, 
  Heart, 
  Crown, 
  BadgeCheck, 
  Gift, 
  Check, 
  Zap, 
  Lock, 
  MapPin,
  Bookmark
} from 'lucide-react';

interface PillarIconProps {
  iconName?: string;
  customIconUrl?: string;
  className?: string;
}

export const ICON_OPTIONS = [
  { name: 'ShieldCheck', label: 'درع الحماية والضمان (Shield)' },
  { name: 'HeartHandshake', label: 'رعاية ومصادقة (Care & Handshake)' },
  { name: 'Award', label: 'وسام وعقود (Award)' },
  { name: 'Bookmark', label: 'علامة الموثوقية (Bookmark)' },
  { name: 'Crown', label: 'تاج الضيافة الملكية (Crown)' },
  { name: 'Building2', label: 'فندق ومبنى (Hotel)' },
  { name: 'Star', label: 'نجمة تقييم (Star)' },
  { name: 'Clock', label: 'خدمة 24/7 (24/7 Clock)' },
  { name: 'PhoneCall', label: 'اتصال مباشر (Phone)' },
  { name: 'Users', label: 'فريق وضيوف (Users)' },
  { name: 'CheckCircle2', label: 'اعتماد رسمي (Check)' },
  { name: 'BadgeCheck', label: 'شارة التوثيق (Verified Badge)' },
  { name: 'Compass', label: 'بوصلة الموقع (Compass)' },
  { name: 'Heart', label: 'عناية ومحبة (Heart)' },
  { name: 'Gift', label: 'عروض ومزايا (Gift)' },
  { name: 'MapPin', label: 'دبابيس الموقع (Map Pin)' },
];

export const PillarIcon: React.FC<PillarIconProps> = ({
  iconName = 'ShieldCheck',
  customIconUrl,
  className = 'w-6 h-6'
}) => {
  if (customIconUrl) {
    return (
      <img 
        src={customIconUrl} 
        alt="أيقونة الركيزة" 
        className={`${className} object-contain rounded-md`}
      />
    );
  }

  switch (iconName) {
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Bookmark':
      return <Bookmark className={className} />;
    case 'Sparkles':
      return <Crown className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Star':
      return <Star className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'PhoneCall':
      return <PhoneCall className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'BadgeCheck':
      return <BadgeCheck className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'MapPin':
      return <MapPin className={className} />;
    case 'Medal':
      return <Medal className={className} />;
    case 'ShieldCheck':
    default:
      return <ShieldCheck className={className} />;
  }
};
