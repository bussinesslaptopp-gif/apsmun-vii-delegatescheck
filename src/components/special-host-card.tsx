
'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { HostMember } from '@/lib/types';
import { Badge } from './ui/badge';
import { Shield, Briefcase, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpecialHostCardProps {
  member: HostMember;
}

export function SpecialHostCard({ member }: SpecialHostCardProps) {
  const isCreator = member.ID === 'DC024';
  const isFriend = member.ID === 'DC100';

  return (
    <Card className={cn(
        "w-full max-w-md animate-in fade-in-50 duration-700 shadow-2xl transition-all border-0 bg-neutral-900/80 backdrop-blur-sm relative overflow-hidden group",
        isCreator ? "shadow-yellow-500/30 hover:shadow-yellow-400/40" : "shadow-neutral-400/30 hover:shadow-neutral-300/40"
    )}>
      {/* Shimmer Effect */}
      <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_4s_infinite]"/>
      
      {/* Border Glow */}
      <div className={cn(
          "absolute inset-0 rounded-lg border-2 border-transparent transition-all duration-300",
          isCreator ? "group-hover:border-yellow-400/50" : "group-hover:border-neutral-400/50"
      )}/>
      
      {/* Pulsating corner lights */}
      <div className={cn("absolute top-2 right-2 h-2 w-2 rounded-full animate-pulse", isCreator ? "bg-yellow-400": "bg-neutral-400")} />
      <div className={cn("absolute bottom-2 left-2 h-2 w-2 rounded-full animate-pulse", isCreator ? "bg-yellow-400": "bg-neutral-400")} />

      <CardContent className="p-6 text-center relative z-10">
        <div className="mb-4 flex justify-center items-center gap-2">
          <Badge variant="secondary" className="text-lg font-bold font-headline tracking-widest bg-neutral-800 text-neutral-200 border-neutral-700">
            {member.ID}
          </Badge>
        </div>
        
        <h2 className="font-headline text-5xl text-white font-bold uppercase tracking-wide">
          {member.Name || 'Unknown Name'}
        </h2>
        
        <div className="mt-6 pt-4 border-t border-neutral-700 flex flex-col items-center justify-center gap-3 text-neutral-300">
            <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-neutral-400"/>
                <span className="font-bold">Department:</span> {member.Department}
            </div>
            {member.Designation && (
                 <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-neutral-400"/>
                    <span className="font-bold">Post:</span> {member.Designation}
                </div>
            )}
        </div>
        
        {(isCreator || isFriend) && (
            <div className="mt-6 pt-4 border-t border-neutral-700/50">
                <p className={cn(
                    "text-lg font-bold flex items-center justify-center gap-2",
                    isCreator ? "text-yellow-400" : "text-neutral-300"
                )}>
                    {isCreator ? <Crown className="w-5 h-5"/> : <Star className="w-5 h-5" />}
                    {isCreator ? "App Creator" : "Core Contributor"}
                </p>
            </div>
        )}
      </CardContent>
       <style jsx>{`
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
    </Card>
  );
}
