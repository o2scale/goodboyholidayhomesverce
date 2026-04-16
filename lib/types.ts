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
  userId?: string | null;
  startDate: string;
  endDate: string;
  guestCount: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'blocked';
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  includeMeals?: boolean;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'admin' | 'customer';
}

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}
