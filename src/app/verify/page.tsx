
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import QRCodeStyling, { type ErrorCorrectionLevel } from 'qr-code-styling';
import { Download, Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Delegate } from '@/lib/types';
import { QrCodeDisplay } from '@/components/qr-code-display';
import { logoUrl } from '@/app/page';

export default function VerifyPage() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedDelegates = sessionStorage.getItem('delegates');
    if (storedDelegates) {
      setDelegates(JSON.parse(storedDelegates));
    } else {
      toast({
        variant: 'destructive',
        title: 'No delegate data found',
        description: 'Please go back to the main page and load the data first.',
      });
      router.push('/');
    }
    setLoading(false);
  }, [router, toast]);

  const handleDownloadAllQRCodes = async () => {
    if (!delegates.length) {
      toast({ variant: "destructive", title: "No delegates to process" });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(`(0/${delegates.length})`);
    toast({
        title: "Generating ZIP...",
        description: `Processing ${delegates.length} QR codes. Please wait.`,
    });

    const zip = new JSZip();
    const delegatesWithQr = delegates.filter(d => d.DelegateNo);

    try {
      for (let i = 0; i < delegatesWithQr.length; i++) {
        const delegate = delegatesWithQr[i];
        
        const qrCode = new QRCodeStyling({
            width: 300,
            height: 300,
            type: 'png',
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

        const blob = await qrCode.getRawData("png");
        if (!blob) {
            console.warn(`Skipping delegate ${delegate.DelegateNo} due to QR generation failure.`);
            continue;
        }

        const fileName = `qr${i + 2}.png`;
        zip.file(fileName, blob);
        
        setDownloadProgress(`(${i + 1}/${delegatesWithQr.length})`);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const content = await zip.generateAsync({ type: "blob" });
  
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = "delegate-qrcodes.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
          
      toast({
          title: "Download Complete",
          description: "The ZIP file with all QR codes has been downloaded.",
      });

    } catch (error: any) {
        console.error("Failed to generate ZIP file:", error);
        toast({
            variant: "destructive",
            title: "ZIP Generation Failed",
            description: error.message || "An error occurred.",
        });
    } finally {
        setIsDownloading(false);
        setDownloadProgress(null);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const downloadButtonText = isDownloading 
    ? `Generating... ${downloadProgress}` 
    : 'Download All as ZIP';

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="font-headline text-4xl font-bold text-primary tracking-wider uppercase">Generate QR Codes</h1>
                <p className="text-muted-foreground">Visually inspect all generated QR codes before downloading.</p>
            </div>
        </div>
        <Button onClick={handleDownloadAllQRCodes} disabled={isDownloading} size="lg">
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {downloadButtonText}
        </Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {delegates.map(delegate => (
          <QrCodeDisplay key={delegate.DelegateNo} delegate={delegate} />
        ))}
      </div>
    </main>
  );
}

