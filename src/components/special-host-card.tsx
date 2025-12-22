
'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { HostMember } from '@/lib/types';
import { Badge } from './ui/badge';
import { Shield, Briefcase, Crown, Sparkles } from 'lucide-react';

interface SpecialHostCardProps {
  member: HostMember;
}

export function SpecialHostCard({ member }: SpecialHostCardProps) {
  const isCreator = member.ID === 'DC024';

  return (
    <Card className="w-full max-w-md animate-in fade-in-50 duration-500 shadow-lg hover:shadow-primary/40 transition-shadow border-primary/40 bg-card/80 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-800/20 via-transparent to-green-800/20 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-primary animate-pulse" />
      
      <CardContent className="p-6 text-center relative z-10">
        <div className="mb-4 flex justify-center items-center gap-2">
          {isCreator && <Crown className="w-6 h-6 text-yellow-400" />}
          <Badge variant="secondary" className="text-lg font-bold font-headline tracking-widest bg-primary/20 text-primary-foreground/80 border-primary/30">
            {member.ID}
          </Badge>
           {!isCreator && <Sparkles className="w-6 h-6 text-yellow-400" />}
        </div>
        
        <h2 className="font-headline text-4xl text-primary-foreground font-bold uppercase tracking-wide">
          {member.Name || 'Unknown Name'}
        </h2>
        
        <div className="mt-4 pt-4 border-t border-primary/10 flex flex-col items-center justify-center gap-2 text-primary-foreground/80">
            <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-green-400/80"/>
                <span className="font-bold">Department:</span> {member.Department}
            </div>
            {member.Designation && (
                 <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400/80"/>
                    <span className="font-bold">Post:</span> {member.Designation}
                </div>
            )}
        </div>
        
        {isCreator && (
            <div className="mt-4 pt-4 border-t border-primary/20">
                <p className="text-sm font-bold text-yellow-400 flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4"/>
                    App Creator
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

    
