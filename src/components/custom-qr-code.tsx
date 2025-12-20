
"use client";

import React, { useEffect, useRef } from 'react';
import QRCodeStyling, { type Options as QRCodeStylingOptions } from 'qr-code-styling';

interface CustomQrCodeProps {
  value: string;
  logoUrl: string;
}

const qrOptions: QRCodeStylingOptions = {
    width: 256,
    height: 256,
    type: 'svg',
    dotsOptions: {
        type: 'dots',
        color: '#000000'
    },
    cornersSquareOptions: {
        type: 'extra-rounded',
        color: '#000000',
    },
    cornersDotOptions: {
        type: 'dot',
        color: '#000000'
    },
    qrOptions: {
        errorCorrectionLevel: 'H'
    },
    imageOptions: {
        crossOrigin: 'anonymous',
        margin: 8
    }
};

export function CustomQrCode({ value, logoUrl }: CustomQrCodeProps) {
    const ref = useRef<HTMLDivElement>(null);
    const qrCode = useRef<QRCodeStyling>();

    useEffect(() => {
        if (ref.current) {
            qrCode.current = new QRCodeStyling({
                ...qrOptions,
                data: value,
                image: logoUrl,
            });
            qrCode.current.append(ref.current);
        }
    }, [value, logoUrl]);
    
    useEffect(() => {
        if (qrCode.current) {
            qrCode.current.update({
                data: value,
                image: logoUrl,
            });
        }
    }, [value, logoUrl]);

    return <div ref={ref} />;
}

export const getQrCodeAsPngBlob = async (value: string, logoUrl: string): Promise<Blob | null> => {
    const qr = new QRCodeStyling({
        ...qrOptions,
        width: 256,
        height: 256,
        type: 'canvas', // Use canvas for raw data generation
        data: value,
        image: logoUrl,
    });
    
    try {
        const dataUrl = await qr.getRawData('png') as string;
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return blob;
    } catch (error) {
        console.error("Failed to generate QR code blob:", error);
        return null;
    }
};
