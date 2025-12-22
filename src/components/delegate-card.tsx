
"use client";

import { Card, CardContent } from '@/components/ui/card';
import type { Delegate } from '@/lib/types';
import { Badge } from './ui/badge';
import { Phone, UserSquare } from 'lucide-react';

interface DelegateCardProps {
  delegate: Delegate;
}

export function DelegateCard({ delegate }: DelegateCardProps) {

  return (
    <Card className="w-full max-w-md animate-in fade-in-50 duration-500 shadow-lg hover:shadow-primary/20 transition-shadow border-primary/20 bg-card/80 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary group-hover:h-full transition-all duration-300 opacity-20 group-hover:opacity-10" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-900/10 via-transparent to-green-900/10 opacity-50"/>
      <CardContent className="p-6 text-center">
        <div className="mb-4">
            <Badge variant="secondary" className="text-lg font-bold font-headline tracking-widest bg-primary/20 text-primary-foreground/80 border-primary/30">{delegate.DelegateNo}</Badge>
        </div>
        <h2 className="font-headline text-4xl text-primary-foreground font-bold uppercase tracking-wide">{delegate.Name || 'Unknown Name'}</h2>
        <p className="font-body text-2xl font-bold text-primary mt-1">{delegate.Committee || 'N/A'}</p>
        {(delegate.Class && delegate.Class !== 'N/A') || (delegate.Number && delegate.Number !== 'N/A') ? (
          <div className="mt-4 pt-4 border-t border-primary/10 flex justify-center items-center flex-wrap gap-x-6 gap-y-2 text-primary-foreground/80">
            {delegate.Class && delegate.Class !== 'N/A' && (
                <div className="flex items-center gap-2">
                    <UserSquare className="w-4 h-4 text-green-400/80"/>
                    <span className="font-bold">Class:</span> {delegate.Class}
                </div>
            )}
            {delegate.Number && delegate.Number !== 'N/A' && (
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-400/80"/>
                    <span className="font-bold">Phone:</span> {delegate.Number}
                </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
