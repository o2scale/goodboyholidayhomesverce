"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [registered, setRegistered] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password }),
            });
            const data = await res.json();

            if (res.ok) {
                setRegistered(true);
            } else {
                setError(data.error || "Registration failed");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (registered) {
        return (
            <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
                <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border shadow-lg text-center">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-primary/10 p-4">
                            <MailCheck className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Check your email</h1>
                        <p className="text-muted-foreground">
                            We&apos;ve sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
                            Click the link in that email to verify your account, then come back here to sign in.
                        </p>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted/40 rounded-md p-3 text-left">
                        <p className="font-medium text-foreground mb-1">Tip:</p>
                        <p>If you don&apos;t see the email within a couple of minutes, check your spam folder.</p>
                    </div>
                    <div className="space-y-3">
                        <Link href="/login" className="block">
                            <Button className="w-full">Go to Sign In</Button>
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setRegistered(false);
                                setName("");
                                setEmail("");
                                setPhone("");
                                setPassword("");
                            }}
                            className="text-sm text-muted-foreground hover:text-primary"
                        >
                            Register a different account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Create Account</h1>
                    <p className="text-muted-foreground mt-2">Join Goodboy Holiday Homes</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
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
                            placeholder="+91..."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-muted-foreground">At least 6 characters.</p>
                    </div>

                    <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Create Account
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                        We&apos;ll send a confirmation link to your email. You&apos;ll need to verify before you can sign in.
                    </p>
                </form>

                <div className="text-center text-sm">
                    <p className="text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
