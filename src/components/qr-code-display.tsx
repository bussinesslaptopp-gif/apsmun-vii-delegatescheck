
"use client";

import type { Delegate } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { logoUrl } from '@/components/app-header';
import { CustomQrCode } from './custom-qr-code';

interface QrCodeDisplayProps {
  delegate: Delegate;
}

export function QrCodeDisplay({ delegate }: QrCodeDisplayProps) {
  if (!delegate.DelegateNo) {
    return (
      <Card className="flex flex-col items-center justify-center aspect-square shadow-md bg-destructive/20">
        <p className="text-xs text-center text-destructive-foreground">Invalid Delegate No</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-start p-2 shadow-md hover:shadow-primary/20 transition-shadow bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-2 bg-white rounded-md flex-grow flex items-center justify-center w-full">
        <CustomQrCode value={delegate.DelegateNo} logoUrl={logoUrl} />
      </CardContent>
      <CardFooter className="p-2 w-full">
        <p className="text-xs text-center text-muted-foreground truncate w-full font-bold">{delegate.Name}</p>
      </CardFooter>
    </Card>
  );
}
