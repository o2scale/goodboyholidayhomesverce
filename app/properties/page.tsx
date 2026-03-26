import { PropertyCard } from "@/components/property-card";
import { PropertySearch } from "@/components/property-search";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Property, Booking } from "@/lib/types";

interface PropertiesPageProps {
    searchParams: Promise<{
        location?: string;
        guests?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
    const { location, guests, startDate, endDate } = await searchParams;

    const supabase = await createSupabaseServerClient();

    const [propertiesRes, bookingsRes] = await Promise.all([
        supabase.from("properties").select("*"),
        supabase.from("bookings").select("*"),
    ]);

    const allProperties: Property[] = (propertiesRes.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        location: row.location,
        images: row.images ?? [],
        rating: row.rating ?? 0,
        maxGuests: row.max_guests,
        amenities: row.amenities ?? [],
    }));

    const allBookings: Booking[] = (bookingsRes.data ?? []).map((row) => ({
        id: row.id,
        propertyId: row.property_id,
        userId: row.user_id ?? null,
        startDate: row.start_date,
        endDate: row.end_date,
        guestCount: row.guest_count,
        status: row.status,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone ?? null,
        includeMeals: row.include_meals ?? false,
    }));

    // Filtering Logic
    const filteredProperties = allProperties.filter(property => {
        // 1. Location Filter
        if (location && !property.location.toLowerCase().includes(location.toLowerCase()) && !property.title.toLowerCase().includes(location.toLowerCase())) {
            return false;
        }

        // 2. Guests Filter
        if (guests && property.maxGuests < parseInt(guests)) {
            return false;
        }

        // 3. Availability Filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Check for any confirmed booking that overlaps
            const hasConflict = allBookings.some(booking => {
                if (booking.propertyId !== property.id) return false;
                if (booking.status === 'rejected') return false;

                const bookingStart = new Date(booking.startDate);
                const bookingEnd = new Date(booking.endDate);

                return (start <= bookingEnd) && (end >= bookingStart);
            });

            if (hasConflict) return false;
        }

        return true;
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <PropertySearch
                defaultStartDate={startDate}
                defaultEndDate={endDate}
            />

            <h1 className="text-3xl font-bold mb-8">
                {filteredProperties.length} Properties Found
            </h1>

            {filteredProperties.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl">
                    <h2 className="text-2xl font-semibold mb-2">No properties found</h2>
                    <p className="text-muted-foreground">Try adjusting your search filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProperties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            )}
        </div>
    );
}
