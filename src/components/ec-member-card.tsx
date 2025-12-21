
'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { HostMember } from '@/lib/types';
import { Badge } from './ui/badge';
import { Shield } from 'lucide-react';

interface ECMemberCardProps {
  member: HostMember;
}

export function ECMemberCard({ member }: ECMemberCardProps) {
  return (
    <Card className="w-full max-w-md animate-in fade-in-50 duration-500 shadow-lg hover:shadow-primary/20 transition-shadow border-primary/20 bg-card/80 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary group-hover:h-full transition-all duration-300 opacity-20 group-hover:opacity-10" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-900/10 via-transparent to-green-900/10 opacity-50"/>
      <CardContent className="p-6 text-center">
        <div className="mb-4">
          <Badge variant="secondary" className="text-lg font-bold font-headline tracking-widest bg-primary/20 text-primary-foreground/80 border-primary/30">
            {member.ID}
          </Badge>
        </div>
        <h2 className="font-headline text-4xl text-primary-foreground font-bold uppercase tracking-wide">
          {member.Name || 'Unknown Name'}
        </h2>
        <div className="mt-4 pt-4 border-t border-primary/10 flex justify-center items-center gap-2 text-primary-foreground/80">
            <Shield className="w-4 h-4 text-green-400/80"/>
            <span className="font-bold">Post:</span> {member.Department}
        </div>
      </CardContent>
    </Card>
  );
}
