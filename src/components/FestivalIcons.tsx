import { MapPin, TrendingUp } from 'lucide-react';

const cities = [
  { name: 'Mexico City', streams: '1.9M', growth: '+8%' },
  { name: 'Lagos', streams: '1.4M', growth: '+22%' },
  { name: 'Jakarta', streams: '1.2M', growth: '+15%' },
];

export default function FestivalIcons() {
  return (
    <div className="flex flex-col gap-2">
      {cities.map((city, index) => (
        <div
          key={city.name}
          className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg px-3 py-2 animate-fade-in"
          style={{ animationDelay: `${index * 100 + 500}ms` }}
        >
          <div className="p-1.5 rounded-md bg-primary/10">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-foreground">{city.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {city.streams} streams
              <span className="ml-1 inline-flex items-center text-primary">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                {city.growth}
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
