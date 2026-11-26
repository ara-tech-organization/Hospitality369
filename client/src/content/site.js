/**
 * Company content sourced from hospitality369.in (typos corrected).
 * Kept in one place so marketing copy can be updated without touching layouts.
 */
import {
  Users, GraduationCap, TrendingUp, Megaphone, Cpu, Handshake, PartyPopper, ChefHat, Building2,
} from 'lucide-react';

export const COMPANY = {
  name: 'Hospitality369',
  about:
    'We help hotel, restaurant and bar owners maximise their success through effective planning and execution – from set-up and design to menu development, staffing and beyond.',
  aboutLong:
    'At Hospitality369, we specialise in setting up new hotels, restaurants and bars. Our team has years of experience in the industry, and we know that the success of every establishment depends on having the right team in place.',
  address: '9/6 Mahadevan Street, West Mambalam, Chennai – 600033',
  phone: '+91 73959 66333',
};

/** Figures as published on hospitality369.in */
export const STATS = [
  { end: 30, suffix: '+', label: 'Years of experience' },
  { end: 560, suffix: '+', label: 'Services delivered' },
  { end: 98, suffix: '%', label: 'Client satisfaction' },
  { end: 2500, suffix: '', label: 'Guests catered for in a single event', prefix: 'Up to ' },
];

/** "Covering all the hospitality service fields" */
export const SERVICES = [
  {
    icon: Users,
    title: 'Recruitment',
    image: '/images/chef.webp',
    text: 'The success of your business depends on having the right team in place. We help you recruit skilled and capable people.',
    to: '/recruiting',
  },
  {
    icon: GraduationCap,
    title: 'Training',
    image: '/images/cooking-class.webp',
    text: 'Training programmes that help your staff deliver top-notch service and increase their effectiveness.',
    to: '/training',
  },
  {
    icon: TrendingUp,
    title: 'Revenue Management',
    image: '/images/hotel-reflection.webp',
    text: 'Revenue-boosting strategies that have helped countless establishments increase profits and set up for long-term success.',
  },
  {
    icon: Megaphone,
    title: 'Sales & Marketing',
    image: '/images/team-success.webp',
    text: 'Customised solutions to drive sales – including social media marketing and ad services designed for hospitality.',
  },
  {
    icon: Cpu,
    title: 'Technology Support',
    image: '/images/hospitality-tech.webp',
    text: 'State-of-the-art software and technology support to streamline operations and improve efficiency.',
  },
  {
    icon: Handshake,
    title: 'Franchise',
    image: '/images/cafe-interior.webp',
    text: 'Every investor brings their own objectives, financial considerations and entrepreneurial dreams – we plan around yours.',
  },
  {
    icon: PartyPopper,
    title: 'Events & Wedding Support',
    image: '/images/banquet-table.webp',
    text: 'End-to-end support for weddings, banquets and events that guests remember.',
  },
  {
    icon: ChefHat,
    title: 'Catering Services',
    image: '/images/food-spread.webp',
    text: 'Catering for groups as small as 25 to as large as 2,500 people.',
  },
  {
    icon: Building2,
    title: 'Hotel Projects',
    image: '/images/resort-sunset.webp',
    text: 'Pre-opening support, project planning & design, project management, brand research, evaluation and ongoing brand support.',
  },
];

/** Clients listed on hospitality369.in */
export const CLIENTS = [
  'Ramoji Film City', 'Grand Residences by Marriott', 'Fortune Hotels', 'GRT Hotels', 'Regenta', 'Thambi Vilas',
  'WHT Hotels', 'Gold Crest Hotel', 'CR Grande', 'Gempark', 'Hotel Kodai International',
  'JC Residency', 'Hotel Sithara', 'Hotel Tara', 'Ramyas Hotels', 'Lakshmi Hotels', 'Palani Hotel',
  'Emerald', 'Lotus', 'Abhasa', 'Tranquilnest', 'Faith Hospitality', 'That Biriyani Place', 'The Summer House',
  'Mongoose Camps', 'Asta Homestay', 'Aviakul', 'Springfeel', 'NDR', 'Sangam', 'Kalimark',
];

/** Self-hosted photography (Unsplash License) used across public pages */
export const IMAGES = {
  hotel: '/images/hotel-resort-pool.webp',
  hotelNight: '/images/hotel-night-pool.webp',
  room: '/images/hotel-room.webp',
  chef: '/images/chef.webp',
  fineDining: '/images/fine-dining.webp',
  restaurant: '/images/restaurant-interior.webp',
  terrace: '/images/terrace-dining.webp',
  bar: '/images/bar-interior.webp',
  whisky: '/images/bar-whisky.webp',
  banquet: '/images/banquet-hall.webp',
  banquetTable: '/images/banquet-table.webp',
  groupDining: '/images/group-dining.webp',
  cooking: '/images/cooking-class.webp',
  team: '/images/team-success.webp',
  resort: '/images/resort-sunset.webp',
};

/** Representative photo per industry */
export const INDUSTRY_IMAGE = {
  hotel: IMAGES.room,
  restaurant: IMAGES.restaurant,
  bar: IMAGES.bar,
  banquet: IMAGES.banquet,
};

/** "Covering all the hospitality service fields" – featured services from hospitality369.in */
export const FEATURED_SERVICES = [
  {
    key: 'consulting',
    title: 'Consulting Services',
    image: '/images/consulting.webp',
    text: 'Our revenue-boosting strategies have helped countless establishments increase profits and set themselves up for long-term success.',
    points: ['Set-up & design', 'Menu development', 'Revenue strategy'],
  },
  {
    key: 'franchise',
    title: 'Franchise',
    image: '/images/franchise-owner.webp',
    text: 'Every investor brings their own objectives, financial considerations and entrepreneurial dreams to the table – our experts plan around yours.',
    points: ['Brand research', 'Evaluation & due diligence', 'Ongoing brand support'],
  },
  {
    key: 'catering',
    title: 'Catering Services',
    image: '/images/catering-buffet.webp',
    text: 'We offer catering services for groups as small as 25 to as large as 2,500 people.',
    points: ['25 – 2,500 guests', 'Weddings & banquets', 'Events support'],
  },
];
