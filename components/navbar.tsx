"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/properties", label: "Properties" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
];

interface NavbarProps {
    user?: {
        name: string;
        email: string;
        role: string;
    } | null;
}

export function Navbar({ user }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
        router.push("/");
    };

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="relative w-10 h-10 overflow-hidden rounded-full border border-primary/20">
                        <Image
                            src="/logo.jpeg"
                            alt="Goodboy Holiday Homes"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-primary">Goodboy</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium transition-colors hover:text-primary"
                        >
                            {link.label}
                        </Link>
                    ))}

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <User className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {user.role === 'admin' ? (
                                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                                        Admin Dashboard
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                                        My Dashboard
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => router.push("/login")}>Login</Button>
                            <Button onClick={() => router.push("/register")}>Sign Up</Button>
                        </div>
                    )}
                </div>

                {/* Mobile Nav */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col gap-4 mt-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="text-lg font-medium hover:text-primary"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="border-t pt-4 mt-4 flex flex-col gap-2">
                                {user ? (
                                    <>
                                        <div className="px-2 py-2 text-sm text-muted-foreground">
                                            Signed in as <span className="text-foreground font-medium">{user.name}</span>
                                        </div>
                                        {user.role === 'admin' ? (
                                            <Button variant="outline" onClick={() => { setIsOpen(false); router.push('/admin'); }}>Admin Dashboard</Button>
                                        ) : (
                                            <Button variant="outline" onClick={() => { setIsOpen(false); router.push('/dashboard'); }}>My Dashboard</Button>
                                        )}
                                        <Button variant="destructive" onClick={() => { setIsOpen(false); handleLogout(); }}>Log out</Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={() => { setIsOpen(false); router.push("/login"); }}>Login</Button>
                                        <Button onClick={() => { setIsOpen(false); router.push("/register"); }}>Sign Up</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}
