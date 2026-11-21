import { Cake, Camera, CarFront, Gem, UsersRound, UtensilsCrossed } from 'lucide-react';
import type { ScheduleIconName } from '../types/wedding';

const ICONS = {
  arrival: UsersRound,
  rings: Gem,
  cake: Cake,
  camera: Camera,
  dining: UtensilsCrossed,
  car: CarFront,
} satisfies Record<ScheduleIconName, unknown>;

export function ScheduleIcon({ name }: { name: ScheduleIconName }) {
  const Icon = ICONS[name];
  return <Icon size={76} strokeWidth={0.9} aria-hidden="true" />;
}
