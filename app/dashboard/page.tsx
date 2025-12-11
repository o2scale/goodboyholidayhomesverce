import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getBookings, getProperties } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { redirect } from "next/navigation";

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "default_secret_key_change_me"
);

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
        redirect("/login");
    }

    let userEmail = "";
    let userName = "";

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        userEmail = payload.email as string;
        userName = payload.name as string;
    } catch (e) {
        redirect("/login");
    }

    const bookings = await getBookings();
    const properties = await getProperties();

    // Filter bookings for this user
    const myBookings = bookings.filter(b => b.customerEmail === userEmail);

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
                        <p>You haven't made any bookings yet.</p>
                        <a href="/properties" className="text-primary hover:underline mt-2 inline-block">Explore our properties</a>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {myBookings.map(booking => {
                            const property = properties.find(p => p.id === booking.propertyId);
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
