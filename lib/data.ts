import { promises as fs } from 'fs';
import path from 'path';

export interface Property {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    images: string[];
    rating: number;
    maxGuests: number;
    amenities: string[];
}

export interface Booking {
    id: string;
    propertyId: string;
    startDate: string;
    endDate: string;
    guestCount: number;
    status: 'pending' | 'confirmed' | 'rejected';
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'customer';
    phone?: string;
}

interface DataSchema {
    properties: Property[];
    bookings: Booking[];
    users: User[];
}

const DATA_FILE = path.join(process.cwd(), 'data.json');

const INITIAL_PROPERTIES: Property[] = [
    {
        id: '1',
        title: 'Misty Mountain Villa',
        description: 'A private 3-bedroom villa nestled in the tea plantations of Munnar. Enjoy panoramic views of the Western Ghats from your balcony. Perfect for families seeking complete privacy and nature.',
        price: 450,
        location: 'Munnar, Kerala',
        images: [
            'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600596542815-27b88e39e569?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&q=80'
        ],
        rating: 4.9,
        maxGuests: 8,
        amenities: ['Mountain View', 'Private Garden', 'Campfire area', 'Full Kitchen', 'Caretaker']
    },
    {
        id: '2',
        title: 'Wayanad Cloud Home',
        description: 'Experience living in the clouds. This heritage bungalow offers a serene escape with modern comforts. Surrounded by coffee estates and spice gardens.',
        price: 350,
        location: 'Wayanad, Kerala',
        images: [
            'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&q=80'
        ],
        rating: 4.8,
        maxGuests: 6,
        amenities: ['Valley View', 'Spice Plantation Walk', 'Home Cooked Meals', 'Wifi', 'Parking']
    },
    {
        id: '3',
        title: 'Ooty Heritage Cottage',
        description: 'A charming colonial-style cottage in the heart of the Nilgiris. Cozy up by the fireplace after a day of exploring. Walking distance to the lake.',
        price: 300,
        location: 'Ooty, Tamil Nadu',
        images: [
            'https://images.unsplash.com/photo-1518780664697-55e3ad913afb?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80'
        ],
        rating: 4.7,
        maxGuests: 5,
        amenities: ['Fireplace', 'Lawn', 'Heater', 'Kitchen', 'Pet Friendly']
    }
];

async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
        // Migration check: ensure users array exists
        const content = await fs.readFile(DATA_FILE, 'utf-8');
        let data: any = JSON.parse(content);
        if (!data.users) {
            data.users = [];
            await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        }
    } catch {
        const initialData: DataSchema = {
            properties: INITIAL_PROPERTIES,
            bookings: [],
            users: []
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
}

export async function getProperties(): Promise<Property[]> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;
    return data.properties;
}

export async function getProperty(id: string): Promise<Property | undefined> {
    const properties = await getProperties();
    return properties.find(p => p.id === id);
}

export async function getBookings(): Promise<Booking[]> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;
    return data.bookings;
}

export async function createBooking(booking: Omit<Booking, 'id' | 'status'>): Promise<Booking> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;

    const newBooking: Booking = {
        ...booking,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending'
    };

    data.bookings.push(newBooking);
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return newBooking;
}

export async function createProperty(property: Omit<Property, 'id'>): Promise<Property> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;

    const newProperty: Property = {
        ...property,
        id: Math.random().toString(36).substr(2, 9),
    };

    data.properties.push(newProperty);
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return newProperty;
}

export async function updateProperty(property: Property): Promise<Property> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;

    const index = data.properties.findIndex(p => p.id === property.id);
    if (index === -1) {
        throw new Error("Property not found");
    }

    data.properties[index] = property;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return property;
}

export async function updateBookingStatus(id: string, status: Booking['status']) {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;

    const index = data.bookings.findIndex(b => b.id === id);
    if (index !== -1) {
        const bookingToUpdate = data.bookings[index];

        if (status === 'confirmed') {
            const hasConflict = data.bookings.some(b => {
                if (b.id === id) return false;
                if (b.propertyId !== bookingToUpdate.propertyId) return false;
                if (b.status !== 'confirmed') return false;

                const startA = new Date(bookingToUpdate.startDate);
                const endA = new Date(bookingToUpdate.endDate);
                const startB = new Date(b.startDate);
                const endB = new Date(b.endDate);

                return (startA <= endB) && (endA >= startB);
            });

            if (hasConflict) {
                throw new Error("Booking conflict: Dates are already booked.");
            }
        }

        data.bookings[index].status = status;
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;
    return data.users.find(u => u.email === email);
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;

    if (data.users.find(u => u.email === user.email)) {
        throw new Error("User already exists");
    }

    const newUser: User = {
        ...user,
        id: Math.random().toString(36).substr(2, 9),
    };

    data.users.push(newUser);
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return newUser;
}

export async function getUsers(): Promise<User[]> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;
    return data.users;
}

export async function deleteUser(id: string): Promise<void> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;

    // Prevent deleting last admin if implementing safety checks, but for now just delete
    const newUsers = data.users.filter(u => u.id !== id);
    if (newUsers.length === data.users.length) {
        throw new Error("User not found");
    }

    data.users = newUsers;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function updateUserRole(id: string, role: 'admin' | 'customer'): Promise<User> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;

    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) {
        throw new Error("User not found");
    }

    data.users[index].role = role;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return data.users[index];
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
    await ensureDataFile();
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as DataSchema;

    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) {
        throw new Error("User not found");
    }

    // Prevent ID change
    const { id: _, ...safeUpdates } = updates;

    data.users[index] = { ...data.users[index], ...safeUpdates };
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return data.users[index];
}
