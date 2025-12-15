"use client";


import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export function Hero() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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

                <Link href="/properties">
                    <Button size="lg" className="rounded-full px-8 h-12 text-lg">
                        Explore Properties
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}



