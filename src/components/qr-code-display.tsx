
"use client";

import QRCode from 'react-qr-code';
import type { Delegate } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { logoUrl } from '@/app/page';

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
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <QRCode
                value={delegate.DelegateNo}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                level="H"
                viewBox={`0 0 256 256`}
            />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                padding: '5px',
                borderRadius: '50%',
            }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={logoUrl} 
                    alt="logo" 
                    style={{ width: 40, height: 40, borderRadius: '50%' }} 
                    crossOrigin="anonymous"
                />
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-2 w-full">
        <p className="text-xs text-center text-muted-foreground truncate w-full font-bold">{delegate.Name}</p>
      </CardFooter>
    </Card>
  );
}
