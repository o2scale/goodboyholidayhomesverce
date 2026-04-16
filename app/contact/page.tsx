"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export default function ContactPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);

        if (!firstName || !email || !message) {
            setStatus({ type: "error", text: "Please fill in your name, email, and message." });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, phone, message }),
            });

            if (res.ok) {
                setStatus({ type: "success", text: "Message sent! We'll get back to you soon." });
                setFirstName("");
                setLastName("");
                setEmail("");
                setPhone("");
                setMessage("");
            } else {
                const data = await res.json().catch(() => ({}));
                setStatus({ type: "error", text: data.error || "Failed to send message. Please try again." });
            }
        } catch {
            setStatus({ type: "error", text: "Network error. Please check your connection and try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                <p className="text-xl text-muted-foreground">
                    We&apos;d love to hear from you. Get in touch with us for any queries.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">

                {/* Contact Info */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-2xl font-semibold mb-6">Get in Touch</h3>
                        <p className="text-muted-foreground mb-8">
                            Have questions about a property or want to list your home with us? Reach out!
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <Mail className="w-6 h-6 text-primary mt-1" />
                            <div>
                                <h4 className="font-semibold">Email Us</h4>
                                <a
                                    href={`mailto:${siteConfig.contact.email}`}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {siteConfig.contact.email}
                                </a>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Phone className="w-6 h-6 text-primary mt-1" />
                            <div>
                                <h4 className="font-semibold">Call Us</h4>
                                <a
                                    href={`tel:${siteConfig.contact.phoneE164}`}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {siteConfig.contact.phoneDisplay}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-muted/20 p-8 rounded-2xl shadow-sm border">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    placeholder="John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message *</Label>
                            <Textarea
                                id="message"
                                placeholder="How can we help you?"
                                className="min-h-[150px]"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />
                        </div>

                        {status && (
                            <p
                                className={cn(
                                    "text-sm text-center font-medium rounded-md p-3",
                                    status.type === "success"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-red-50 text-destructive"
                                )}
                            >
                                {status.text}
                            </p>
                        )}

                        <Button className="w-full" size="lg" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Message
                        </Button>
                    </form>
                </div>

            </div >
        </div >
    );
}
