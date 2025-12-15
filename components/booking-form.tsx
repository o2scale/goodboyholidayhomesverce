"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Property } from "@/lib/data";
import { DateRange } from "react-day-picker";

interface BookingFormProps {
    property: Property;
    blockedDates?: { from: Date; to: Date }[];
}

export function BookingForm({ property, blockedDates = [] }: BookingFormProps) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    })
    const [guests, setGuests] = useState(1);
    const [includeMeals, setIncludeMeals] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    const isDateBlocked = (checkDate: Date) => {
        return blockedDates.some(range =>
            checkDate >= range.from && checkDate <= range.to
        );
    };

    const handleBooking = async () => {
        setMessage(""); // Clear previous messages

        // Phone is strictly required now.
        if (!date?.from || !date?.to || !name || !phone) {
            setMessage("Please fill in all required fields (dates, name, phone).");
            return;
        }

        // Validate date range doesn't include blocked dates
        let current = new Date(date.from);
        const end = new Date(date.to);
        while (current <= end) {
            if (isDateBlocked(current)) {
                setMessage("Selected range includes dates that are already booked.");
                return;
            }
            current = addDays(current, 1);
        }

        setIsSubmitting(true);
        // Simulate API call
        try {
            await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    propertyId: property.id,
                    startDate: date.from.toISOString(),
                    endDate: date.to.toISOString(),
                    guestCount: guests,
                    customerName: name,
                    customerEmail: email,
                    customerPhone: phone,
                    includeMeals,
                }),
            });
            setMessage("Booking request sent! We will contact you shortly.");
            setDate(undefined);
            setName("");
            setEmail("");
            setPhone("");
            setIncludeMeals(false);
        } catch (e) {
            setMessage("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="sticky top-24 shadow-lg border-muted">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>${property.price} <span className="text-sm font-normal text-muted-foreground">/ night</span></span>
                    <span className="text-sm font-normal text-muted-foreground">★ {property.rating}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Dates</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                disabled={blockedDates}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label>Guests</Label>
                    <Input
                        type="number"
                        min={1}
                        max={property.maxGuests}
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                    />
                </div>

                <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
                    <Checkbox
                        id="meals"
                        checked={includeMeals}
                        onCheckedChange={(checked) => setIncludeMeals(checked as boolean)}
                    />
                    <Label htmlFor="meals" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        Include Homely Meals (Pre-order)
                    </Label>
                </div>

                <div className="space-y-2">
                    <Label>Your Details</Label>
                    <Input placeholder="Full Name *" value={name} onChange={(e) => setName(e.target.value)} required />
                    <Input placeholder="Phone Number *" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    <Input placeholder="Email (Optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                {message && (
                    <p className={cn("text-sm text-center font-medium", message.includes("request sent") ? "text-green-600" : "text-destructive")}>
                        {message}
                    </p>
                )}
            </CardContent>
            <CardFooter>
                <Button className="w-full" size="lg" onClick={handleBooking} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request to Book
                </Button>
            </CardFooter>
        </Card>
    );
}


