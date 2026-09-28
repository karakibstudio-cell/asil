import React from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Music2, 
  Globe 
} from 'lucide-react';
import { ChannelType } from '../types';

interface ChannelIconProps {
  type: ChannelType;
  className?: string;
}

export const ChannelIcon: React.FC<ChannelIconProps> = ({ type, className = 'w-5 h-5' }) => {
  switch (type) {
    case 'whatsapp':
      return <MessageCircle className={className} />;
    case 'phone':
      return <Phone className={className} />;
    case 'email':
      return <Mail className={className} />;
    case 'facebook':
      return <Facebook className={className} />;
    case 'instagram':
      return <Instagram className={className} />;
    case 'tiktok':
      return <Music2 className={className} />;
    case 'custom':
    default:
      return <Globe className={className} />;
  }
};
