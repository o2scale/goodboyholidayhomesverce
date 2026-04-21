import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingForm } from "@/components/booking-form";
import { notFound } from "next/navigation";
import { MapPin, Users, Wifi, Wind, Car, Utensils } from "lucide-react";
import { PropertyGallery } from "@/components/property-gallery";
import type { Property } from "@/lib/types";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function PropertyPage({ params }: PageProps) {
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    // Admin client used server-side to fetch blocked dates (RLS on bookings
    // restricts reads to the booking owner / admins; guests would otherwise
    // see zero blocked dates). We only read date ranges, never customer data.
    const admin = getSupabaseAdmin();

    const [propertyRes, bookingsRes] = await Promise.all([
        supabase.from("properties").select("*").eq("id", id).single(),
        admin
            .from("bookings")
            .select("start_date, end_date, status")
            .eq("property_id", id)
            .in("status", ["confirmed", "blocked"]),
    ]);

    if (propertyRes.error || !propertyRes.data) {
        notFound();
    }

    const row = propertyRes.data;
    const property: Property = {
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        location: row.location,
        images: row.images ?? [],
        rating: row.rating ?? 0,
        maxGuests: row.max_guests,
        amenities: row.amenities ?? [],
    };

    const blockedDates = (bookingsRes.data ?? []).map((b) => ({
        from: new Date(b.start_date as string),
        to: new Date(b.end_date as string),
    }));

    // Helper to get icon for amenity
    const getAmenityIcon = (amenity: string) => {
        const lower = amenity.toLowerCase();
        if (lower.includes("wifi")) return <Wifi className="w-4 h-4 mr-2" />;
        if (lower.includes("ac") || lower.includes("heater")) return <Wind className="w-4 h-4 mr-2" />;
        if (lower.includes("parking")) return <Car className="w-4 h-4 mr-2" />;
        if (lower.includes("kitchen")) return <Utensils className="w-4 h-4 mr-2" />;
        return <Users className="w-4 h-4 mr-2" />; // Default
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Title Header */}
            <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
                <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.location}
                </div>
            </div>

            {/* Image Gallery (Main Image) */}
            <PropertyGallery images={property.images} title={property.title} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">About this home</h2>
                        <p className="text-lg leading-relaxed text-muted-foreground">
                            {property.description}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">What this place offers</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {property.amenities.map((amenity) => (
                                <div key={amenity} className="flex items-center text-muted-foreground">
                                    {getAmenityIcon(amenity)}
                                    {amenity}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">House Rules</h2>
                        <div className="bg-muted/50 p-6 rounded-lg">
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>Check-in after 2:00 PM</li>
                                <li>Check-out before 11:00 AM</li>
                                <li>Max {property.maxGuests} guests</li>
                                <li>No smoking inside</li>
                                <li>Pets allowed (It's Goodboy Holiday Homes!)</li>
                            </ul>
                        </div>
                    </section>

                </div>

                {/* Sidebar / Booking Form */}
                <div className="md:col-span-1">
                    <BookingForm property={property} blockedDates={blockedDates} />
                </div>
            </div>
        </div>
    );
}
