
"use client";

import React from 'react';
import QRCode from 'react-qr-code';

interface QrCodeWithLogoProps {
    value: string;
    logoUrl: string;
    logoWidth?: number;
}

export function QrCodeWithLogo({ value, logoUrl, logoWidth = 50 }: QrCodeWithLogoProps) {
    return (
        <div style={{ height: "auto", margin: "0 auto", maxWidth: 256, width: "100%", position: 'relative' }}>
            <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={value}
                viewBox={`0 0 256 256`}
                level="H" // High error correction level for logo
            />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: logoWidth,
                height: logoWidth,
                background: 'white',
                padding: '4px', // Padding around the logo
                borderRadius: '4px', // Slightly rounded corners for the background
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={logoUrl} 
                    alt="logo" 
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }} 
                    crossOrigin="anonymous"
                />
            </div>
        </div>
    );
}
