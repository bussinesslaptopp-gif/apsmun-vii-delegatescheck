
"use client";

import { useEffect, useRef } from 'react';
import QRCodeStyling, { type ErrorCorrectionLevel } from 'qr-code-styling';
import type { Delegate } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { logoUrl } from '@/app/page';

interface QrCodeDisplayProps {
  delegate: Delegate;
}

export function QrCodeDisplay({ delegate }: QrCodeDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !delegate.DelegateNo) return;
    
    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'svg',
      data: delegate.DelegateNo,
      image: logoUrl,
      dotsOptions: { color: '#000000', type: 'dots' },
      backgroundOptions: { color: '#ffffff' },
      imageOptions: {
        crossOrigin: 'anonymous',
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 5,
      },
      qrOptions: { errorCorrectionLevel: 'H' as ErrorCorrectionLevel },
      cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
      cornersDotOptions: { type: 'dot', color: '#000000' },
    });

    ref.current.innerHTML = '';
    qrCode.append(ref.current);
  }, [delegate]);

  return (
    <Card className="flex flex-col items-center justify-start aspect-square shadow-md hover:shadow-primary/20 transition-shadow bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-2 flex-grow w-full">
        <div ref={ref} className="w-full h-full [&>svg]:w-full [&>svg]:h-full" />
      </CardContent>
      <CardFooter className="p-2 w-full">
        <p className="text-xs text-center text-muted-foreground truncate w-full font-bold">{delegate.Name}</p>
      </CardFooter>
    </Card>
  );
}

