
import { PropertyCard } from "@/components/property-card";
import { getProperties, getBookings } from "@/lib/data";

interface PropertiesPageProps {
    searchParams: Promise<{
        location?: string;
        guests?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

import { PropertySearch } from "@/components/property-search";

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
    const { location, guests, startDate, endDate } = await searchParams;
    const allProperties = await getProperties();
    const allBookings = await getBookings();

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
                if (booking.status === 'rejected') return false; // Rejected bookings don't block

                const bookingStart = new Date(booking.startDate);
                const bookingEnd = new Date(booking.endDate);

                // Overlap formula: (StartA <= EndB) and (EndA >= StartB)
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
