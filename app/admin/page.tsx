"use client";

import { useEffect, useState } from "react";
import { Booking, Property } from "@/lib/data";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { PropertyForm } from "@/components/admin/property-form";
import { Plus, Check, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { UserForm } from "@/components/admin/user-form";

export default function AdminPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [selectedProperty, setSelectedProperty] = useState(""); // For blocking dates
    const [blockDate, setBlockDate] = useState<DateRange | undefined>();
    const [blockReason, setBlockReason] = useState("Admin Block");
    const [isBlocking, setIsBlocking] = useState(false);

    // Property Editing State
    const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<Property | undefined>();
    const [isCreating, setIsCreating] = useState(false);

    const fetchData = async () => {
        try {
            const [bookingsRes, propertiesRes] = await Promise.all([
                fetch('/api/bookings'),
                fetch('/api/properties')
            ]);
            const bookingsData = await bookingsRes.json();
            const propertiesData = await propertiesRes.json();
            setBookings(bookingsData);
            setProperties(propertiesData);
        } catch (e) {
            console.error("Failed to fetch data", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (id: string, status: 'confirmed' | 'rejected') => {
        try {
            await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
        } catch (e) {
            alert("Failed to update status");
        }
    };

    const handleCreateBlock = async () => {
        if (!selectedProperty || !blockDate?.from || !blockDate?.to) {
            alert("Please select a property and date range.");
            return;
        }

        setIsBlocking(true);
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: selectedProperty,
                    startDate: blockDate.from.toISOString(),
                    endDate: blockDate.to.toISOString(),
                    guestCount: 0,
                    customerName: blockReason,
                    customerEmail: "admin@goodboy.com"
                }),
            });

            if (res.ok) {
                const newBooking = await res.json();
                // Auto-confirm valid admin blocks if needed, but the API creates them as pending.
                // Let's manually confirm it immediately to ensure it blocks calendar.
                await handleStatusUpdate(newBooking.id, 'confirmed');

                // Refresh bookings
                const updatedBookingsRes = await fetch('/api/bookings');
                setBookings(await updatedBookingsRes.json());

                // Reset form
                setBlockDate(undefined);
                setBlockReason("Admin Block");
                setSelectedProperty("");
                alert("Dates blocked successfully.");
            }
        } catch (e) {
            alert("Failed to block dates.");
        } finally {
            setIsBlocking(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <Tabs defaultValue="bookings" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="block-dates">Block Dates</TabsTrigger>
                    <TabsTrigger value="properties">Properties</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>

                <TabsContent value="bookings" className="mt-0">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Booking ID</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bookings found</TableCell>
                                    </TableRow>
                                ) : (
                                    bookings.map((booking) => {
                                        const property = properties.find(p => p.id === booking.propertyId);
                                        return (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-mono text-xs">{booking.id.substring(0, 6)}...</TableCell>
                                                <TableCell className="max-w-[150px] truncate" title={property?.title || booking.propertyId}>
                                                    {property?.title || booking.propertyId}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{booking.customerName}</div>
                                                    <div className="text-xs text-muted-foreground">{booking.customerEmail}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {format(new Date(booking.startDate), "MMM d")} - {format(new Date(booking.endDate), "MMM d")}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{booking.guestCount} Guests</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={booking.status === 'confirmed' ? "default" : booking.status === 'rejected' ? "destructive" : "secondary"}>
                                                        {booking.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(booking.id, 'confirmed')}>
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            </Button>
                                                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(booking.id, 'rejected')}>
                                                                <X className="w-4 h-4 text-red-600" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="block-dates">
                    <div className="max-w-xl mx-auto border rounded-xl p-6 bg-card">
                        <h2 className="text-xl font-semibold mb-6">Block Dates Manually</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Property</label>
                                <select
                                    className="w-full p-2 border rounded-md bg-background"
                                    value={selectedProperty}
                                    onChange={(e) => setSelectedProperty(e.target.value)}
                                >
                                    <option value="">-- Select Property --</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Dates</label>
                                <div className="border rounded-md p-2 flex justify-center bg-background">
                                    <Calendar
                                        mode="range"
                                        selected={blockDate}
                                        onSelect={setBlockDate}
                                        numberOfMonths={1}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reason / Note</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-md bg-background"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                />
                            </div>

                            <Button onClick={handleCreateBlock} disabled={isBlocking} className="w-full">
                                {isBlocking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Block Dates
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="properties">
                    <div className="max-w-4xl mx-auto">
                        {!selectedPropertyForEdit && !isCreating ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
                                    <div>
                                        <h2 className="text-2xl font-bold">Properties</h2>
                                        <p className="text-muted-foreground">Manage your property listings</p>
                                    </div>
                                    <Button onClick={() => setIsCreating(true)} size="lg">
                                        <Plus className="w-5 h-5 mr-2" /> Add New Property
                                    </Button>
                                </div>

                                <div className="grid gap-4">
                                    {properties.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-4 border rounded-xl bg-card hover:shadow-md transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden relative shadow-sm">
                                                    {p.images && p.images[0] ? (
                                                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                                                            <ImageIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold">{p.title}</h3>
                                                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                                                        <span className="mr-3">📍 {p.location}</span>
                                                        <span>★ {p.rating}</span>
                                                    </div>
                                                    <div className="mt-2 flex gap-2">
                                                        {p.amenities.slice(0, 3).map(a => (
                                                            <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                                                        ))}
                                                        {p.amenities.length > 3 && <Badge variant="secondary" className="text-xs">+{p.amenities.length - 3}</Badge>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold mb-2">₹{p.price.toLocaleString('en-IN')} <span className="text-sm font-normal text-muted-foreground">/ night</span></div>
                                                <Button size="sm" variant="outline" onClick={() => setSelectedPropertyForEdit(p)}>
                                                    Edit Property
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <div className="mb-6 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold">{isCreating ? "Add New Property" : `Edit ${selectedPropertyForEdit?.title}`}</h2>
                                        <p className="text-muted-foreground">
                                            {isCreating ? "Create a new listing for your portfolio." : "Update property details, images, and pricing."}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setIsCreating(false);
                                        setSelectedPropertyForEdit(undefined);
                                    }}>
                                        Back to List
                                    </Button>
                                </div>

                                <PropertyForm
                                    key={selectedPropertyForEdit?.id || 'new'}
                                    initialData={selectedPropertyForEdit}
                                    onSubmit={async (data) => {
                                        try {
                                            const url = isCreating ? '/api/properties' : '/api/properties';
                                            const method = isCreating ? 'POST' : 'PUT';

                                            const res = await fetch(url, {
                                                method,
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(data)
                                            });

                                            if (res.ok) {
                                                alert(isCreating ? "Property created!" : "Property updated!");
                                                await fetchData(); // Refresh
                                                setIsCreating(false);
                                                setSelectedPropertyForEdit(undefined);
                                            } else {
                                                alert("Operation failed.");
                                            }
                                        } catch (e) {
                                            alert("Error occurred.");
                                        }
                                    }}
                                    onCancel={() => {
                                        setIsCreating(false);
                                        setSelectedPropertyForEdit(undefined);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="users">
                    <UserManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        if (res.ok) {
            setUsers(await res.json());
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        fetchUsers();
    };

    const handleFormSubmit = async (data: any) => {
        const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
        const method = editingUser ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            setIsEditing(false);
            setEditingUser(null);
            fetchUsers();
        } else {
            alert("Operation failed");
        }
    };

    return (
        <div className="space-y-6">
            {!isEditing ? (
                <>
                    <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
                        <div>
                            <h2 className="text-2xl font-bold">User Management</h2>
                            <p className="text-muted-foreground">Manage users and admins</p>
                        </div>
                        <Button onClick={() => { setEditingUser(null); setIsEditing(true); }}>
                            <Plus className="w-5 h-5 mr-2" /> Add New User
                        </Button>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => { setEditingUser(user); setIsEditing(true); }}>
                                                Edit
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            ) : (
                <div className="bg-card p-6 rounded-xl border shadow-sm max-w-2xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">{editingUser ? `Edit User: ${editingUser.name}` : "Create New User"}</h2>
                        <p className="text-muted-foreground">
                            {editingUser ? "Update user details and access." : "Add a new user to the system."}
                        </p>
                    </div>
                    <UserForm
                        initialData={editingUser}
                        onSubmit={handleFormSubmit}
                        onCancel={() => { setIsEditing(false); setEditingUser(null); }}
                    />
                </div>
            )}
        </div>
    );
}
