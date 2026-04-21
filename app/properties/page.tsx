import { PropertyCard } from "@/components/property-card";
import { PropertySearch } from "@/components/property-search";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Property } from "@/lib/types";

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
    // Admin client used server-side for bookings so the availability filter
    // works for guests too (bookings RLS restricts reads to the owner/admins).
    // Only date + property_id + status are selected — no customer data.
    const admin = getSupabaseAdmin();

    const [propertiesRes, bookingsRes] = await Promise.all([
        supabase.from("properties").select("*"),
        admin
            .from("bookings")
            .select("property_id, start_date, end_date, status")
            .in("status", ["pending", "confirmed", "blocked"]),
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

    const blockingBookings = (bookingsRes.data ?? []) as Array<{
        property_id: string;
        start_date: string;
        end_date: string;
        status: string;
    }>;

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

            // Any non-rejected booking on this property that overlaps blocks the property
            const hasConflict = blockingBookings.some(b => {
                if (b.property_id !== property.id) return false;
                const bookingStart = new Date(b.start_date);
                const bookingEnd = new Date(b.end_date);
                return (start <= bookingEnd) && (end >= bookingStart);
            });

            if (hasConflict) return false;
        }

        return true;
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <PropertySearch
                defaultLocation={location}
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
