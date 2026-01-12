import { Music, MapPin, Users, Star } from 'lucide-react';

const festivals = [
  { name: 'Glastonbury', icon: Music, color: 'text-primary' },
  { name: 'Coachella', icon: Star, color: 'text-primary' },
  { name: 'NYU', icon: MapPin, color: 'text-primary' },
];

export default function FestivalIcons() {
  return (
    <div className="flex flex-col gap-2">
      {festivals.map((festival, index) => (
        <div 
          key={festival.name}
          className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg px-3 py-2 animate-fade-in"
          style={{ animationDelay: `${index * 100 + 500}ms` }}
        >
          <div className="p-1.5 rounded-md bg-primary/10">
            <festival.icon className={`w-3.5 h-3.5 ${festival.color}`} />
          </div>
          <span className="text-xs font-medium text-foreground">{festival.name}</span>
        </div>
      ))}
    </div>
  );
}
