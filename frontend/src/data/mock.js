const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const destinations = [
  { id: 'jaipur', name: 'Jaipur', region: 'Rajasthan, India', img: U('photo-1477587458883-47145ed94245') },
  { id: 'goa', name: 'Goa', region: 'Goa, India', img: U('photo-1512343879784-a960bf40e7f2') },
  { id: 'manali', name: 'Manali', region: 'Himachal Pradesh, India', img: U('photo-1506905925346-21bda4d32df4') },
  { id: 'agra', name: 'Agra', region: 'Uttar Pradesh, India', img: U('photo-1524492412937-b28074a5d7da') },
  { id: 'kyoto', name: 'Kyoto', region: 'Japan', img: U('photo-1493976040374-85c8e12f0c0e') },
  { id: 'paris', name: 'Paris', region: 'France', img: U('photo-1502602898657-3e91760cbb34') },
];

export const vibes = [
  { id: 'beach', title: 'Slow Beaches', text: 'Salt air, sunsets and nowhere to be.', img: U('photo-1507525428034-b723cf961d3e') },
  { id: 'mountain', title: 'Mountain Air', text: 'Quiet trails and crisp mornings.', img: U('photo-1506905925346-21bda4d32df4') },
  { id: 'heritage', title: 'Heritage & Culture', text: 'Forts, temples and old streets.', img: U('photo-1524492412937-b28074a5d7da') },
  { id: 'adventure', title: 'Open Road', text: 'Detours, drives and the unplanned.', img: U('photo-1469854523086-cc02fe5d8800') },
  { id: 'food', title: 'Food Trails', text: 'Eat your way through the city.', img: U('photo-1512343879784-a960bf40e7f2') },
  { id: 'city', title: 'City Lights', text: 'Rooftops, cafés and late nights.', img: U('photo-1502602898657-3e91760cbb34') },
];

export const itinerary = {
  title: 'Jaipur, the Pink City', dates: '14 – 17 Dec 2026',
  days: [
    { day: 1, title: 'Arrival & Old City', items: [
      { time: '11:00', text: 'Check in at Haveli Heritage Stay' },
      { time: '14:00', text: 'Lunch at Laxmi Misthan Bhandar' },
      { time: '17:00', text: 'Hawa Mahal at golden hour' } ] },
    { day: 2, title: 'Forts & Palaces', items: [
      { time: '08:30', text: 'Amber Fort before the crowds' },
      { time: '13:00', text: 'Panna Meena ka Kund & lunch' },
      { time: '16:00', text: 'City Palace and Jantar Mantar' } ] },
    { day: 3, title: 'Craft & Cafés', items: [
      { time: '10:00', text: 'Block printing workshop, Sanganer' },
      { time: '15:00', text: 'Bapu Bazaar shopping walk' },
      { time: '19:30', text: 'Dinner on a rooftop terrace' } ] },
    { day: 4, title: 'Slow Morning & Departure', items: [
      { time: '09:00', text: 'Breakfast at Tapri Central' },
      { time: '12:00', text: 'Check out and transfer to airport' } ] },
  ],
};

export const searchData = {
  Hotels: [
    { id: 'h1', name: 'Haveli Heritage Stay', meta: 'Old City · Breakfast included', price: 5200, rating: 4.6 },
    { id: 'h2', name: 'The Pink Courtyard', meta: 'C-Scheme · Pool', price: 7800, rating: 4.4 },
    { id: 'h3', name: 'Zostel Jaipur', meta: 'Hostel · Shared lounge', price: 900, rating: 4.2 },
    { id: 'h4', name: 'Rambagh Residency', meta: 'Palace stay · Spa', price: 18500, rating: 4.9 },
  ],
  Flights: [
    { id: 'f1', name: 'IndiGo 6E-203 · DEL → JAI', meta: '06:10 – 07:05 · Non-stop', price: 3400, rating: 4.1 },
    { id: 'f2', name: 'Air India AI-9631 · DEL → JAI', meta: '09:30 – 10:25 · Non-stop', price: 4600, rating: 4.3 },
    { id: 'f3', name: 'SpiceJet SG-8194 · DEL → JAI', meta: '18:15 – 19:10 · Non-stop', price: 3100, rating: 3.9 },
  ],
  Trains: [
    { id: 't1', name: 'Shatabdi 12015', meta: '06:05 – 10:40 · Chair car', price: 850, rating: 4.5 },
    { id: 't2', name: 'Double Decker 12985', meta: '17:50 – 22:15 · AC chair', price: 700, rating: 4.2 },
    { id: 't3', name: 'Ajmer Express 12016', meta: '22:00 – 03:30 · Sleeper', price: 380, rating: 3.8 },
  ],
  Buses: [
    { id: 'b1', name: 'RSRTC Volvo AC', meta: '07:00 – 12:30 · Seater', price: 650, rating: 4.0 },
    { id: 'b2', name: 'Raj Travels Sleeper', meta: '22:30 – 04:30 · Sleeper', price: 1100, rating: 4.3 },
  ],
  Restaurants: [
    { id: 'r1', name: 'Laxmi Misthan Bhandar', meta: 'Rajasthani · Johari Bazaar', price: 600, rating: 4.4 },
    { id: 'r2', name: 'Tapri Central', meta: 'Café · Tea & snacks', price: 450, rating: 4.5 },
    { id: 'r3', name: '1135 AD', meta: 'Fine dining · Amber Fort', price: 3500, rating: 4.7 },
  ],
  Activities: [
    { id: 'a1', name: 'Amber Fort Sunrise Tour', meta: '3 hrs · Guided', price: 1200, rating: 4.7 },
    { id: 'a2', name: 'Block Printing Workshop', meta: '2 hrs · Hands-on', price: 900, rating: 4.6 },
    { id: 'a3', name: 'Hot Air Balloon', meta: '1 hr · Sunrise', price: 12000, rating: 4.8 },
  ],
};

export const trips = {
  upcoming: {
    id: 'jaipur-udaipur', title: 'Jaipur & Udaipur', subtitle: 'A week among forts, lakes and old havelis',
    start: '2026-12-14', end: '2026-12-21', img: U('photo-1477587458883-47145ed94245'),
    budget: 60000,
    stays: [
      { id: 's1', name: 'Haveli Heritage Stay', place: 'Jaipur', dates: '14 – 17 Dec', status: 'Confirmed', ref: 'HV-48213', amount: 15600, method: 'Visa ending 4417', paid: 'Paid in full' },
      { id: 's2', name: 'Lake View Boutique Hotel', place: 'Udaipur', dates: '17 – 21 Dec', status: 'Pending', ref: 'LV-77102', amount: 24000, method: 'Pay at property', paid: 'Due on arrival' },
    ],
    transport: [
      { id: 'x1', name: 'Shatabdi 12015 · Delhi to Jaipur', place: 'Train', dates: '14 Dec, 06:05', status: 'Confirmed', ref: 'PNR 2418830912', amount: 850, method: 'UPI', paid: 'Paid in full' },
      { id: 'x2', name: 'Jaipur to Udaipur', place: 'Private cab', dates: '17 Dec, 09:00', status: 'Confirmed', ref: 'CB-30021', amount: 6200, method: 'UPI', paid: 'Paid in full' },
      { id: 'x3', name: 'IndiGo 6E-512 · Udaipur to Delhi', place: 'Flight', dates: '21 Dec, 18:20', status: 'Pending', ref: 'Awaiting ticket', amount: 4100, method: 'Visa ending 4417', paid: 'Payment processing' },
    ],
  },
  past: [
    { id: 'p1', title: 'Goa in Monsoon', year: '2026', dates: 'Aug 2026', status: 'Completed', img: U('photo-1512343879784-a960bf40e7f2'), note: 'Four slow days, two shacks, one very wet scooter.' },
    { id: 'p2', title: 'Manali Weekend', year: '2026', dates: 'May 2026', status: 'Completed', img: U('photo-1506905925346-21bda4d32df4'), note: 'Snow on the Rohtang road.' },
    { id: 'p3', title: 'Agra Day Trip', year: '2025', dates: 'Nov 2025', status: 'Completed', img: U('photo-1524492412937-b28074a5d7da'), note: 'Taj Mahal at sunrise.' },
    { id: 'p4', title: 'Rishikesh', year: '2025', dates: 'Mar 2025', status: 'Cancelled', img: U('photo-1469854523086-cc02fe5d8800'), note: 'Postponed to a later year.' },
  ],
};

export const expenses = [
  { id: 1, category: 'Stay', amount: 15600, note: 'Jaipur hotel', day: 1 },
  { id: 2, category: 'Transport', amount: 7050, note: 'Train and cab', day: 1 },
  { id: 3, category: 'Food', amount: 4200, note: 'Meals so far', day: 2 },
  { id: 4, category: 'Activities', amount: 3600, note: 'Tours and workshop', day: 3 },
  { id: 5, category: 'Shopping', amount: 2500, note: 'Bapu Bazaar', day: 3 },
];

export const connect = {
  Buddies: [
    { id: 'u1', name: 'Aarav Mehta', place: 'Delhi', bio: 'Photographer looking for a Rajasthan road-trip partner.', tags: ['Photography', 'Road trips'], img: 'https://i.pravatar.cc/200?img=12' },
    { id: 'u2', name: 'Ishita Rao', place: 'Noida', bio: 'Weekend traveller, loves forts and street food.', tags: ['Heritage', 'Food'], img: 'https://i.pravatar.cc/200?img=47' },
    { id: 'u3', name: 'Kabir Singh', place: 'Gurugram', bio: 'Trekking the Himalayas every winter.', tags: ['Trekking', 'Camping'], img: 'https://i.pravatar.cc/200?img=15' },
  ],
  Locals: [
    { id: 'l1', name: 'Meera Sharma', place: 'Jaipur', bio: 'Heritage walk guide, knows every lane of the old city.', tags: ['Guide', 'Heritage'], img: 'https://i.pravatar.cc/200?img=32' },
    { id: 'l2', name: 'Raghav Joshi', place: 'Udaipur', bio: 'Boatman turned storyteller on Lake Pichola.', tags: ['Lakes', 'Stories'], img: 'https://i.pravatar.cc/200?img=53' },
  ],
  Groups: [
    { id: 'g1', name: 'Amber Fort Sunrise Walk', place: 'Jaipur · 16 Dec', bio: '8 of 12 spots taken. Easy pace, chai after.', tags: ['Group', 'Morning'], img: U('photo-1477587458883-47145ed94245') },
    { id: 'g2', name: 'Lake Pichola Sunset Sail', place: 'Udaipur · 19 Dec', bio: '5 of 10 spots taken. Small group boat ride.', tags: ['Group', 'Evening'], img: U('photo-1493976040374-85c8e12f0c0e') },
  ],
};

export const planB = {
  reason: 'Rain is forecast for Day 2 in Jaipur (80% chance from 11:00).',
  original: [
    { time: '08:30', text: 'Amber Fort before the crowds' },
    { time: '13:00', text: 'Panna Meena ka Kund & lunch' },
    { time: '16:00', text: 'City Palace and Jantar Mantar' },
  ],
  alternative: [
    { time: '08:00', text: 'Amber Fort early, wrapped up before the rain' },
    { time: '12:30', text: 'Lunch and chai at Tapri Central' },
    { time: '14:30', text: 'Albert Hall Museum (indoors)' },
    { time: '17:00', text: 'Cooking class: dal baati churma' },
  ],
};

export const pulse = [
  { id: 1, place: 'Hawa Mahal', level: 'High', pct: 88, best: 'Before 9:00 or after 17:30' },
  { id: 2, place: 'Amber Fort', level: 'Moderate', pct: 56, best: 'Weekday mornings' },
  { id: 3, place: 'City Palace', level: 'Moderate', pct: 48, best: 'After 14:00' },
  { id: 4, place: 'Jal Mahal viewpoint', level: 'Low', pct: 22, best: 'Anytime' },
  { id: 5, place: 'Bapu Bazaar', level: 'High', pct: 79, best: 'Before 11:00' },
  { id: 6, place: 'Nahargarh Fort', level: 'Low', pct: 30, best: 'Sunset hours' },
];
