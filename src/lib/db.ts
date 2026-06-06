import fs from "fs";
import path from "path";

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;       // human readable date (e.g. "Sunday, May 31")
  time: string;       // human readable time (e.g. "4:00 PM - 7:00 PM")
  location: string;   // human readable location (e.g. "Dubai Studio City")
  price: number;      // AED
  deadline: string;   // ISO string date
  maxSlots: number;
  image: string;      // Image URL or identifier
  status: "active" | "draft" | "completed";
  instagramUrl?: string; // Link to past event instagram post
}

export interface Booking {
  id: string;
  eventId: string;
  name: string;
  email: string;
  whatsapp: string;   // formatted as +9715xxxxxxx
  status: "pending" | "paid" | "failed";
  createdAt: string;
  amount: number;
  paymentId?: string;
}

interface DatabaseSchema {
  events: Event[];
  bookings: Booking[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Helper to secure directory and file initialization
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    // Generate default/sample data
    const initialData: DatabaseSchema = {
      events: [
        {
          id: "painting-planting-2026",
          title: "Painting & Planting Workshop",
          description: "Design your own custom clay pot, plant your new leafy green buddy, and relax in a beautifully curated creative space with the best aesthetic vibes.",
          date: "Sunday, June 7",
          time: "4:00 PM - 6:30 PM",
          location: "Secret Garden Cafe, Jumeirah, Dubai",
          price: 180,
          // Set booking deadline to 5 days from now (default mock)
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          maxSlots: 15,
          image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800",
          status: "active"
        },
        {
          id: "past-game-night",
          title: "Dubai Game Night",
          description: "An evening of board games, laughter, and high energy. Baddies only, with custom drinks, snacks, and wonderful conversations.",
          date: "Saturday, May 16, 2026",
          time: "7:00 PM onwards",
          location: "Palm Jumeirah Villa, Dubai",
          price: 120,
          deadline: "2026-05-15T18:00:00.000Z",
          maxSlots: 20,
          image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800",
          status: "completed",
          instagramUrl: "https://www.instagram.com/chaiandbaeclub/"
        },
        {
          id: "past-jam-session",
          title: "Jam Session Alert",
          description: "Unplugged music, cozy seating, hot chai, and gorgeous acoustic tunes. Connect over your favorite beats and sing along with the girlies.",
          date: "Friday, April 17, 2026",
          time: "9:00 PM - 11:00 PM",
          location: "Sukkar Cafe, Sharjah",
          price: 90,
          deadline: "2026-04-16T18:00:00.000Z",
          maxSlots: 12,
          image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800",
          status: "completed",
          instagramUrl: "https://www.instagram.com/chaiandbaeclub/"
        },
        {
          id: "past-girls-night-out",
          title: "Girls Night Out: Games & Vibes",
          description: "A super cozy, laughter-filled night of team games, trivia, and community building, enjoying fresh pastries and mocktails.",
          date: "Friday, April 3, 2026",
          time: "9:00 PM - 11:00 PM",
          location: "Sukkar Cafe, Sharjah",
          price: 85,
          deadline: "2026-04-02T18:00:00.000Z",
          maxSlots: 15,
          image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800",
          status: "completed",
          instagramUrl: "https://www.instagram.com/chaiandbaeclub/"
        }
      ],
      bookings: []
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

export function readDb(): DatabaseSchema {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data) as DatabaseSchema;
  } catch (err) {
    console.error("Error reading JSON database:", err);
    return { events: [], bookings: [] };
  }
}

export function writeDb(data: DatabaseSchema): boolean {
  initDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing JSON database:", err);
    return false;
  }
}

// Database Helpers
export const db = {
  getEvents: (): Event[] => {
    const data = readDb();
    return data.events;
  },

  getEventById: (id: string): Event | undefined => {
    const data = readDb();
    return data.events.find(e => e.id === id);
  },

  createEvent: (event: Event): boolean => {
    const data = readDb();
    // Check if event already exists
    const idx = data.events.findIndex(e => e.id === event.id);
    if (idx !== -1) {
      data.events[idx] = event; // Update
    } else {
      data.events.push(event); // Create
    }
    return writeDb(data);
  },

  updateEvent: (id: string, updatedFields: Partial<Event>): boolean => {
    const data = readDb();
    const idx = data.events.findIndex(e => e.id === id);
    if (idx === -1) return false;
    data.events[idx] = { ...data.events[idx], ...updatedFields };
    return writeDb(data);
  },

  deleteEvent: (id: string): boolean => {
    const data = readDb();
    data.events = data.events.filter(e => e.id !== id);
    data.bookings = data.bookings.filter(b => b.eventId !== id); // Cascade delete bookings
    return writeDb(data);
  },

  getBookings: (): Booking[] => {
    const data = readDb();
    return data.bookings;
  },

  getBookingsByEventId: (eventId: string): Booking[] => {
    const data = readDb();
    return data.bookings.filter(b => b.eventId === eventId);
  },

  getBookingById: (id: string): Booking | undefined => {
    const data = readDb();
    return data.bookings.find(b => b.id === id);
  },

  createBooking: (booking: Booking): boolean => {
    const data = readDb();
    data.bookings.push(booking);
    return writeDb(data);
  },

  updateBookingStatus: (id: string, status: "pending" | "paid" | "failed", paymentId?: string): boolean => {
    const data = readDb();
    const idx = data.bookings.findIndex(b => b.id === id);
    if (idx === -1) return false;
    data.bookings[idx].status = status;
    if (paymentId) {
      data.bookings[idx].paymentId = paymentId;
    }
    return writeDb(data);
  },

  deleteBooking: (id: string): boolean => {
    const data = readDb();
    data.bookings = data.bookings.filter(b => b.id !== id);
    return writeDb(data);
  }
};
