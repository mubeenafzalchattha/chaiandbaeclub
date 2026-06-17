import { MongoClient, Db } from "mongodb";

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

// const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/chaiandbaeclub";
const uri = process.env.chaiandbae_MONGODB_URI || "mongodb://localhost:27017/chaiandbaeclub";
let client: MongoClient;
let dbInstance: Db;

async function getDb(): Promise<Db> {
  if (dbInstance) return dbInstance;

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }

  dbInstance = client.db();
  // Seed data is no longer needed; removed to rely entirely on DB contents.
  return dbInstance;
}

async function seedDb(db: Db) {
  const eventsCollection = db.collection("events");
  const count = await eventsCollection.countDocuments();
  if (count === 0) {
    const initialEvents: Event[] = [
      {
        id: "painting-planting-2026",
        title: "Painting & Planting Workshop",
        description: "Design your own custom clay pot, plant your new leafy green buddy, and relax in a beautifully curated creative space with the best aesthetic vibes.",
        date: "Sunday, June 7",
        time: "4:00 PM - 6:30 PM",
        location: "Secret Garden Cafe, Jumeirah, Dubai",
        price: 180,
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
    ];
    await eventsCollection.insertMany(initialEvents);
  }
}

// Database Helpers backed by MongoDB
export const db = {
  getEvents: async (): Promise<Event[]> => {
    const database = await getDb();
    const items = await database.collection("events").find({}).toArray();
    return items.map(item => {
      const { _id, ...rest } = item;
      return rest as unknown as Event;
    });
  },

  getEventById: async (id: string): Promise<Event | undefined> => {
    const database = await getDb();
    const item = await database.collection("events").findOne({ id });
    if (!item) return undefined;
    const { _id, ...rest } = item;
    return rest as unknown as Event;
  },

  createEvent: async (event: Event): Promise<boolean> => {
    const database = await getDb();
    await database.collection("events").updateOne(
      { id: event.id },
      { $set: event },
      { upsert: true }
    );
    return true;
  },

  updateEvent: async (id: string, updatedFields: Partial<Event>): Promise<boolean> => {
    const database = await getDb();
    const res = await database.collection("events").updateOne(
      { id },
      { $set: updatedFields }
    );
    return res.modifiedCount > 0 || res.matchedCount > 0;
  },

  deleteEvent: async (id: string): Promise<boolean> => {
    const database = await getDb();
    await database.collection("events").deleteOne({ id });
    await database.collection("bookings").deleteMany({ eventId: id });
    return true;
  },

  getBookings: async (): Promise<Booking[]> => {
    const database = await getDb();
    const items = await database.collection("bookings").find({}).toArray();
    return items.map(item => {
      const { _id, ...rest } = item;
      return rest as unknown as Booking;
    });
  },

  getBookingsByEventId: async (eventId: string): Promise<Booking[]> => {
    const database = await getDb();
    const items = await database.collection("bookings").find({ eventId }).toArray();
    return items.map(item => {
      const { _id, ...rest } = item;
      return rest as unknown as Booking;
    });
  },

  getBookingById: async (id: string): Promise<Booking | undefined> => {
    const database = await getDb();
    const item = await database.collection("bookings").findOne({ id });
    if (!item) return undefined;
    const { _id, ...rest } = item;
    return rest as unknown as Booking;
  },

  createBooking: async (booking: Booking): Promise<boolean> => {
    const database = await getDb();
    await database.collection("bookings").insertOne(booking);
    return true;
  },

  updateBookingStatus: async (id: string, status: "pending" | "paid" | "failed", paymentId?: string): Promise<boolean> => {
    const database = await getDb();
    const updateDoc: any = { status };
    if (paymentId) {
      updateDoc.paymentId = paymentId;
    }
    const res = await database.collection("bookings").updateOne(
      { id },
      { $set: updateDoc }
    );
    return res.modifiedCount > 0 || res.matchedCount > 0;
  },

  deleteBooking: async (id: string): Promise<boolean> => {
    const database = await getDb();
    const res = await database.collection("bookings").deleteOne({ id });
    return res.deletedCount > 0;
  }
};
