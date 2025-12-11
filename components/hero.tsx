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
import { useState, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";

export function Hero() {
    const [date, setDate] = useState<DateRange | undefined>();
    const [location, setLocation] = useState("");
    const [guests, setGuests] = useState("");
    const router = useRouter();

    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.set("location", location);
        if (guests) params.set("guests", guests);
        if (date?.from) params.set("startDate", date.from.toISOString());
        if (date?.to) params.set("endDate", date.to.toISOString());

        router.push(`/properties?${params.toString()}`);
    };

    return (
        <div ref={ref} className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
            {/* Background Image with Parallax */}
            <motion.div
                style={{ y, opacity }}
                className="absolute inset-0 z-0 bg-cover bg-center"
            >
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80')",
                    }}
                />
                <div className="absolute inset-0 bg-black/30" />
            </motion.div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10 container mx-auto px-4 text-center text-white"
            >
                <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-md">
                    Your Private <span className="text-primary-foreground">Sanctuary</span> in the Hills
                </h1>
                <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto drop-shadow-sm opacity-90">
                    Discover complete homes nestled in nature. Wake up to misty mornings in Munnar, Wayanad, and Ooty.
                </p>

                {/* Search Bar */}
                <div className="max-w-4xl mx-auto bg-background rounded-full p-2 shadow-2xl flex flex-col md:flex-row items-center gap-2 text-foreground">

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

                    <Button size="lg" className="rounded-full w-full md:w-auto px-8 h-12 text-lg" onClick={handleSearch}>
                        <Search className="w-5 h-5 mr-2" />
                        Search
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}


