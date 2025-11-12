import { TournamentCard, EventCard } from '../types/events';

export const featuredTournaments: TournamentCard[] = [
  {
    id: '1',
    category: 'Blitz',
    date: 'Dec 15, 2024',
    title: 'Winter Blitz Championship',
    description: 'Fast-paced 5-minute games. Open to all skill levels. Prize pool: $2,500',
    price: '$25',
    icon: '🏆',
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-amber-600',
  },
  {
    id: '2',
    category: 'Rapid',
    date: 'Dec 22, 2024',
    title: 'Holiday Rapid Open',
    description: '15+10 time control. Swiss system. Perfect for intermediate players.',
    price: '$30',
    icon: '♟️',
    gradientFrom: 'from-purple-400',
    gradientTo: 'to-purple-600',
  },
  {
    id: '3',
    category: 'Classical',
    date: 'Jan 5, 2025',
    title: 'New Year Grand Prix',
    description: '90+30 time control. FIDE rated. Elite competition with $5,000 prize fund.',
    price: '$50',
    icon: '👑',
    gradientFrom: 'from-green-400',
    gradientTo: 'to-green-600',
  },
];

export const upcomingEvents: EventCard[] = [
  {
    id: '1',
    category: 'Workshop',
    title: 'Opening Theory Masterclass',
    description: 'Learn advanced opening principles',
    price: '$15',
    gradientFrom: 'from-red-400',
    gradientTo: 'to-red-600',
  },
  {
    id: '2',
    category: 'Simul',
    title: 'GM Simultaneous Exhibition',
    description: 'Play against a Grandmaster',
    price: 'Free',
    gradientFrom: 'from-indigo-400',
    gradientTo: 'to-indigo-600',
  },
  {
    id: '3',
    category: 'Blitz',
    title: 'Friday Night Blitz',
    description: 'Weekly casual tournament',
    price: '$10',
    gradientFrom: 'from-teal-400',
    gradientTo: 'to-teal-600',
  },
  {
    id: '4',
    category: 'Rapid',
    title: 'Youth Championship',
    description: 'Ages 8-18 only',
    price: '$20',
    gradientFrom: 'from-pink-400',
    gradientTo: 'to-pink-600',
  },
];

