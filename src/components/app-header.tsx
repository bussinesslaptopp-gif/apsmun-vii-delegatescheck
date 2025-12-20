
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, UserCheck, Shield, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export const logoUrl = "https://bgs45urr71.ufs.sh/f/5pQTmJ38MJ42myy5VjKZqoiBjE6uNhldJH4fy3szSZkcQAgt";

export function AppHeader() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { href: "/", label: "Delegate Verification", icon: UserCheck, group: "main" },
        { href: "/host-team/dc", label: "DC Verification", icon: Shield, group: "host" },
        { href: "/host-team/ec", label: "EC Verification", icon: Shield, group: "host" },
        { href: "/host-team/socials", label: "Socials", icon: Sparkles, group: "host" }
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto flex items-center justify-between h-16">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src={logoUrl}
                        alt="APS MUN VII Logo"
                        width={40}
                        height={40}
                        className="rounded-full"
                        crossOrigin="anonymous"
                    />
                    <span className="font-headline text-2xl font-bold text-primary tracking-wider uppercase hidden sm:inline-block">
                        APSMUN VII
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-2">
                     {navLinks.filter(l => l.group === 'main').map(link => (
                         <Link key={link.href} href={link.href}>
                            <Button variant={pathname === link.href ? "secondary" : "ghost"}>
                               <link.icon className="mr-2 h-4 w-4" /> {link.label}
                            </Button>
                        </Link>
                     ))}
                      <div className="w-px h-6 bg-border mx-2" />
                     {navLinks.filter(l => l.group === 'host').map(link => (
                         <Link key={link.href} href={link.href}>
                            <Button variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}>
                               <link.icon className="mr-2 h-4 w-4" /> {link.label}
                            </Button>
                        </Link>
                     ))}
                </nav>

                <div className="md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 bg-background/95 backdrop-blur-sm p-0">
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b">
                                    <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                                        <Image
                                            src={logoUrl}
                                            alt="APS MUN VII Logo"
                                            width={32}
                                            height={32}
                                            className="rounded-full"
                                            crossOrigin="anonymous"
                                        />
                                        <span className="font-headline text-xl font-bold text-primary tracking-wider uppercase">
                                            APSMUN VII
                                        </span>
                                    </Link>
                                </div>
                                <nav className="flex-grow p-4 space-y-2">
                                     <Link href="/" onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", { "bg-muted text-primary": pathname === '/' })}>
                                        <UserCheck className="h-4 w-4"/>
                                        Delegate Verification
                                    </Link>
                                    
                                    <div className="space-y-1 pt-2">
                                        <h3 className="px-3 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Host Team</h3>
                                        {navLinks.filter(l => l.group === 'host').map(link => (
                                            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", { "bg-muted text-primary": pathname.startsWith(link.href) })}>
                                                <link.icon className="h-4 w-4"/>
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </nav>
                                <div className="p-4 mt-auto border-t">
                                    <p className="text-xs text-center text-muted-foreground">APSMUN VII</p>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
