import { 
  Palette, 
  Code, 
  BookOpen, 
  Users, 
  Coffee,
  Clock,
  BarChart3,
  Calendar,
  Flame,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Volume2,
  VolumeX,
  Check,
  Award,
  LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Palette,
  Code,
  BookOpen,
  Users,
  Coffee,
  Clock,
  BarChart3,
  Calendar,
  Flame,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Volume2,
  VolumeX,
  Check,
  Award,
};

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function DynamicIcon({ name, className = '', size = 20 }: DynamicIconProps) {
  const IconComponent = iconMap[name] || Clock; // Fallback to Clock if not found
  return <IconComponent className={className} size={size} />;
}
