import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import type { Booking, Property } from "@/lib/types";

export default async function DashboardPage() {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Get user profile for display name
    const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

    const userName = profile?.name || user.email || "User";

    // Get bookings for this user
    const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id);

    const myBookings: Booking[] = (bookingsData ?? []).map((row) => ({
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

    // Resolve property names for the user's bookings
    const propertyIds = [...new Set(myBookings.map(b => b.propertyId))];
    let propertiesMap: Record<string, Property> = {};

    if (propertyIds.length > 0) {
        const { data: propertiesData } = await supabase
            .from("properties")
            .select("*")
            .in("id", propertyIds);

        for (const row of propertiesData ?? []) {
            propertiesMap[row.id] = {
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
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-10">
                <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
                <p className="text-muted-foreground mt-2">Manage your bookings and account details</p>
            </header>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Your Bookings</h2>

                {myBookings.length === 0 ? (
                    <div className="bg-muted/30 border rounded-xl p-8 text-center text-muted-foreground">
                        <p>You haven&apos;t made any bookings yet.</p>
                        <a href="/properties" className="text-primary hover:underline mt-2 inline-block">Explore our properties</a>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {myBookings.map(booking => {
                            const property = propertiesMap[booking.propertyId];
                            return (
                                <div key={booking.id} className="border rounded-xl bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg truncate w-2/3">{property?.title || "Unknown Property"}</h3>
                                        <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'rejected' ? 'destructive' : 'secondary'}>
                                            {booking.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Dates</span>
                                            <span className="font-medium text-foreground">
                                                {format(new Date(booking.startDate), "MMM d")} - {format(new Date(booking.endDate), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Guests</span>
                                            <span className="font-medium text-foreground">{booking.guestCount}</span>
                                        </div>
                                        {property && (
                                            <div className="flex justify-between">
                                                <span>Location</span>
                                                <span className="font-medium text-foreground">{property.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
