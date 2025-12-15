"use client";

import { Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";

interface PropertySearchProps {
    defaultStartDate?: string;
    defaultEndDate?: string;
}

export function PropertySearch({
    defaultStartDate,
    defaultEndDate
}: PropertySearchProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from props
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
        const params = new URLSearchParams(searchParams.toString());
        if (date?.from) params.set("startDate", date.from.toISOString());
        else params.delete("startDate");

        if (date?.to) params.set("endDate", date.to.toISOString());
        else params.delete("endDate");

        router.push(`/properties?${params.toString()}`);
    };

    return (
        <div className="bg-card border rounded-2xl p-2 shadow-sm flex flex-col md:flex-row items-center gap-2 mb-8 max-w-2xl mx-auto">
            {/* Dates */}
            <div className="flex-1 w-full px-4 py-2 md:py-0">
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

            {/* Search Button */}
            <Button size="lg" className="rounded-xl w-full md:w-auto px-8 h-12 text-lg" onClick={handleSearch}>
                <Search className="w-5 h-5 mr-2" />
                Update
            </Button>
        </div>
    );
}
