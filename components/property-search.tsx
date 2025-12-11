"use client";

import { Search, Calendar, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";

interface PropertySearchProps {
    defaultLocation?: string;
    defaultGuests?: string;
    defaultStartDate?: string;
    defaultEndDate?: string;
}

export function PropertySearch({
    defaultLocation = "",
    defaultGuests = "",
    defaultStartDate,
    defaultEndDate
}: PropertySearchProps) {
    const router = useRouter();

    // Initialize state from props
    const [location, setLocation] = useState(defaultLocation);
    const [guests, setGuests] = useState(defaultGuests);
    const [date, setDate] = useState<DateRange | undefined>(
        defaultStartDate && defaultEndDate ? {
            from: new Date(defaultStartDate),
            to: new Date(defaultEndDate)
        } : defaultStartDate ? {
            from: new Date(defaultStartDate),
            to: undefined
        } : undefined
    );

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.set("location", location);
        if (guests) params.set("guests", guests);
        if (date?.from) params.set("startDate", date.from.toISOString());
        if (date?.to) params.set("endDate", date.to.toISOString());

        router.push(`/properties?${params.toString()}`);
    };

    return (
        <div className="bg-card border rounded-2xl p-2 shadow-sm flex flex-col md:flex-row items-center gap-2 mb-8">

            {/* Location */}
            <div className="flex-1 w-full px-4 border-b md:border-b-0 md:border-r border-border py-2 md:py-0">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Location</span>
                </div>
                <Input
                    placeholder="Where are you going?"
                    className="border-none shadow-none p-0 h-auto text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>

            {/* Dates */}
            <div className="flex-1 w-full px-4 border-b md:border-b-0 md:border-r border-border py-2 md:py-0">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Dates</span>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"ghost"}
                            className={cn(
                                "w-full justify-start text-left font-normal p-0 h-auto hover:bg-transparent",
                                !date && "text-muted-foreground/50"
                            )}
                        >
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
                                <span>Pick dates</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Guests */}
            <div className="flex-1 w-full px-4 border-b md:border-b-0 md:border-r border-border py-2 md:py-0">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Guests</span>
                </div>
                <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger className="border-none shadow-none p-0 h-auto focus:ring-0 w-full text-foreground">
                        <SelectValue placeholder="Add guests" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1 Guest</SelectItem>
                        <SelectItem value="2">2 Guests</SelectItem>
                        <SelectItem value="4">4 Guests</SelectItem>
                        <SelectItem value="6">6+ Guests</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Search Button */}
            <Button size="lg" className="rounded-xl w-full md:w-auto px-8 h-12 text-lg" onClick={handleSearch}>
                <Search className="w-5 h-5 mr-2" />
                Update
            </Button>
        </div>
    );
}
