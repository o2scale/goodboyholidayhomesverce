"use client";

import { ShieldCheck, Dog, Home, Heart, Star, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function FeaturesSection() {
    const features = [
        {
            icon: Mountain,
            title: "Scenic Locations",
            description: "Handpicked homes with breathtaking views of tea plantations and valleys."
        },
        {
            icon: Home,
            title: "Complete Privacy",
            description: "You get the whole house. No sharing, just you and nature."
        },
        {
            icon: ShieldCheck,
            title: "Vetted Excellence",
            description: "Every home is verified for comfort, safety, and hygiene."
        },
        {
            icon: Heart,
            title: "Home Cooked Meals",
            description: "Authentic local cuisine prepared by our dedicated caretakers."
        }
    ];

    return (
        <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Goodboy?</h2>
                <p className="text-muted-foreground text-lg">
                    Discover the difference of a truly private, scenic homestay.
                </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
                {features.map((feature, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                            <feature.icon className="w-8 h-8" />
                        </div>
                        <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function TestimonialsSection() {
    const testimonials = [
        {
            name: "The Menon Family",
            location: "Kochi",
            text: "Staying at the Munnar villa was magical. The view of the mist rolling over the hills from our balcony was unforgettable. Truly a home away from home.",
            rating: 5
        },
        {
            name: "Sarah & Friends",
            location: "Bangalore",
            text: "We wanted a quiet weekend escape and Goodboy delivered. The Wayanad house was so private and peaceful. The campfire night was the highlight!",
            rating: 5
        },
        {
            name: "Rahul D.",
            location: "Chennai",
            text: "Excellent service. The property in Ooty was spotless and the caretaker made the best chicken curry. Highly recommend for families.",
            rating: 5
        }
    ];

    return (
        <section className="container mx-auto px-4 py-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Guest Love</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((t, i) => (
                    <Card key={i} className="bg-card border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex gap-1 text-primary mb-4">
                                {Array.from({ length: t.rating }).map((_, s) => <Star key={s} className="w-4 h-4 fill-current" />)}
                            </div>
                            <p className="text-lg mb-6 italic text-muted-foreground">"{t.text}"</p>
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                                    <AvatarFallback>{t.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{t.name}</div>
                                    <div className="text-xs text-muted-foreground">{t.location}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}

export function CTASection() {
    return (
        <section className="bg-primary text-primary-foreground py-20">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready for your Retreat?</h2>
                <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                    Escape the noise. Find your peace in the hills today.
                </p>
                <Link href="/properties">
                    <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto rounded-full font-semibold">
                        Explore Properties
                    </Button>
                </Link>
            </div>
        </section>
    );
}
