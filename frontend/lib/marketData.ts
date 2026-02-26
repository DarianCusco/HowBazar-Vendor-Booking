// lib/marketData.ts
export const SPRING_MARKET_DATES = [
  // March 2026
  { date: '2026-03-06', status: 'available', notes: '' },
  { date: '2026-03-07', status: 'available', notes: '' },
  { date: '2026-03-08', status: 'available', notes: '' },
  { date: '2026-03-13', status: 'available', notes: '' },
  { date: '2026-03-14', status: 'available', notes: '' },
  { date: '2026-03-15', status: 'available', notes: '' },
  { date: '2026-03-20', status: 'available', notes: '' },
  { date: '2026-03-21', status: 'available', notes: '' },
  { date: '2026-03-22', status: 'available', notes: '' },
  { date: '2026-03-27', status: 'available', notes: '' },
  { date: '2026-03-28', status: 'available', notes: '' },
  { date: '2026-03-29', status: 'available', notes: '' },
  
  // April 2026
  { date: '2026-04-03', status: 'available', notes: '' },
  { date: '2026-04-04', status: 'available', notes: '' },
  { date: '2026-04-05', status: 'available', notes: '' },
  { date: '2026-04-10', status: 'big_festival', notes: 'BIG Festival Weekend! 🎉' },
  { date: '2026-04-11', status: 'big_festival', notes: 'BIG Festival Weekend! 🎉' },
  { date: '2026-04-12', status: 'big_festival', notes: 'BIG Festival Weekend! 🎉' },
  { date: '2026-04-17', status: 'tentative', notes: 'Tentative - Join waitlist' },
  { date: '2026-04-18', status: 'tentative', notes: 'Tentative - Join waitlist' },
  { date: '2026-04-19', status: 'tentative', notes: 'Tentative - Join waitlist' },
  { date: '2026-04-24', status: 'tentative', notes: 'Tentative - Join waitlist' },
  { date: '2026-04-25', status: 'tentative', notes: 'Tentative - Join waitlist' },
  { date: '2026-04-26', status: 'tentative', notes: 'Tentative - Join waitlist' },
  
  // May 2026
  { date: '2026-05-01', status: 'tentative', notes: 'Tentative - Join waitlist' },
  { date: '2026-05-02', status: 'tentative', notes: 'Tentative - Join waitlist' },
  { date: '2026-05-03', status: 'tentative', notes: 'Tentative - Join waitlist' },
];

export const VENDOR_CONFIG = {
  regular: {
    price: 35,
    spotsPerDay: 24,
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    lightBg: 'bg-green-50',
    border: 'border-green-200',
    icon: '🛍️',
  },
  food: {
    price: 50,
    spotsPerDay: 2,
    color: 'yellow',
    gradient: 'from-yellow-500 to-orange-500',
    lightBg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: '🍔',
  },
};

export const getEventTime = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00Z');
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek === 0 ? '12:00 PM - 5:00 PM' : '4:00 PM - 10:00 PM';
};

export const getMarketType = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00Z');
  const dayOfWeek = date.getUTCDay();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  
  if (dayOfWeek === 0) return `${dayName} Day Market`;
  return `${dayName} Night Market`;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

export const getShortDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

export const getDaySuffix = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00Z');
  const day = date.getUTCDate();
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

export const getFullFormattedDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00Z');
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const day = date.getUTCDate();
  const suffix = getDaySuffix(dateString);
  const year = date.getUTCFullYear();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  return `${weekday}, ${month} ${day}${suffix}, ${year}`;
};