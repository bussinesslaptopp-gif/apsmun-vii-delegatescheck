
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export default function SocialsPage() {
    return (
        <div className="flex justify-center items-center h-full">
            <Card className="max-w-lg mx-auto animate-in fade-in-50 duration-500 bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader className="items-center text-center">
                    <Ticket className="w-12 h-12 text-primary mb-2" />
                    <CardTitle className="font-headline text-3xl">Socials Verification</CardTitle>
                    <CardDescription>This feature is coming soon. Stay tuned!</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">
                        The verification system for social events will be available here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
