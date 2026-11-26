import { Compass, GraduationCap, Target, Users, MessagesSquare, Route, Award, BookOpenCheck, Wrench, TrendingUp, Mic, HeartHandshake } from 'lucide-react';

/**
 * Landing-page copy for the professional development modules.
 * Programmes themselves come from the API (/public/programs) so they can be managed
 * from the database as these modules expand (sessions, registrations, dashboards).
 */
export const PROGRAM_CONTENT = {
  mentoring: {
    icon: Compass,
    eyebrow: 'Mentoring',
    title: ['Learn from leaders', 'who run the pass.'],
    intro: 'One-to-one guidance from hotel and F&B leaders.',
    image: '/images/team-success.webp',
    benefits: [
      { icon: Users, title: 'Matched with care', text: 'We pair you with a mentor from your part of the industry – kitchen, front office, bar or events.' },
      { icon: MessagesSquare, title: 'Real conversations', text: 'Regular sessions focused on your goals, challenges and next career move.' },
      { icon: Route, title: 'A clear path forward', text: 'Leave with a personal development plan you can act on immediately.' },
    ],
    steps: ['Share your goals', 'Get matched with a mentor', 'Meet regularly & grow'],
    cta: 'Request a mentor',
  },
  training: {
    icon: GraduationCap,
    eyebrow: 'Training',
    title: ['Skills that make', 'service shine.'],
    intro: 'Job-ready skills for front office, F&B, bar and banquets.',
    image: '/images/cooking-class.webp',
    benefits: [
      { icon: Wrench, title: 'Hands-on learning', text: 'Practise real service scenarios, systems and techniques – not just theory.' },
      { icon: BookOpenCheck, title: 'Industry standards', text: 'Courses built around the standards that hotels, restaurants and bars actually hire for.' },
      { icon: Award, title: 'Certificate of completion', text: 'Show employers you have the skills – and stand out in your next application.' },
    ],
    steps: ['Choose a course', 'Learn & practise', 'Get certified & apply'],
    cta: 'Enquire about training',
  },
  coaching: {
    icon: Target,
    eyebrow: 'Coaching',
    title: ['Lead teams.', 'Grow your career.'],
    intro: 'Leadership & career coaching for hospitality managers.',
    image: '/images/consulting.webp',
    benefits: [
      { icon: TrendingUp, title: 'Leadership growth', text: 'Build the confidence and habits to lead high-performing hospitality teams.' },
      { icon: Mic, title: 'Interview-ready', text: 'Targeted coaching to land supervisor, manager and head-of-department roles.' },
      { icon: HeartHandshake, title: 'Service culture', text: 'Team coaching that lifts guest experience, reviews and retention.' },
    ],
    steps: ['Book a discovery call', 'Agree your coaching goals', 'Coach, apply, measure'],
    cta: 'Book coaching',
  },
};
