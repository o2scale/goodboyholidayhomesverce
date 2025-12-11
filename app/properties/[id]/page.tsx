import { getProperty, getProperties } from "@/lib/data";
import { BookingForm } from "@/components/booking-form";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Users, Wifi, Wind, Car, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

// Generate static params for all known properties
export async function generateStaticParams() {
    const properties = await getProperties();
    return properties.map((p) => ({
        id: p.id,
    }));
}

import { PropertyGallery } from "@/components/property-gallery";

export default async function PropertyPage({ params }: PageProps) {
    const { id } = await params;
    const property = await getProperty(id);

    if (!property) {
        notFound();
    }

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
                    <BookingForm property={property} />
                </div>
            </div>
        </div>
    );
}
