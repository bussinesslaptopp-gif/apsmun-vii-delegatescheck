
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { renderToStaticMarkup } from 'react-dom/server';
import { toPng } from 'html-to-image';
import { Download, Loader2, ArrowLeft } from 'lucide-react';
import QRCode from 'react-qr-code';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Delegate } from '@/lib/types';
import { QrCodeDisplay } from '@/components/qr-code-display';
import { logoUrl } from '@/components/app-header';

// This is a helper component used only for server-side rendering to an image.
const QrCodeForImageGeneration = ({ value }: { value: string }) => (
    <div style={{ background: 'white', padding: '16px', display: 'inline-block' }}>
      <div style={{ position: 'relative', width: 256, height: 256 }}>
        <QRCode value={value} size={256} level="H" />
         <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'white', padding: '5px', borderRadius: '50%',
        }}>
            <img 
                src={logoUrl} alt="logo" 
                style={{ width: 40, height: 40, borderRadius: '50%' }} 
                crossOrigin="anonymous"
            />
        </div>
      </div>
    </div>
);


export default function VerifyPage() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedDelegates = localStorage.getItem('delegates');
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
        description: `Processing ${delegates.length} QR codes. This may take a moment.`,
    });

    const zip = new JSZip();
    const delegatesWithQr = delegates.filter(d => d.DelegateNo);

    // Create a hidden div to render the QR codes for image generation
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      for (let i = 0; i < delegatesWithQr.length; i++) {
        const delegate = delegatesWithQr[i];
        
        // Render QR code to a string
        const qrHtmlString = renderToStaticMarkup(
            <QrCodeForImageGeneration value={delegate.DelegateNo} />
        );
        container.innerHTML = qrHtmlString;
        const node = container.firstChild as HTMLElement;

        if (!node) continue;

        // Convert the rendered HTML to a PNG image
        const dataUrl = await toPng(node, { 
            cacheBust: true,
            pixelRatio: 2, // Higher resolution
        });
        const blob = await (await fetch(dataUrl)).blob();

        const fileName = `${delegate.Name.replace(/ /g, '_')}_${delegate.DelegateNo}.png`;
        zip.file(fileName, blob);
        
        setDownloadProgress(`(${i + 1}/${delegatesWithQr.length})`);
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
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
        document.body.removeChild(container);
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
    <div>
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
    </div>
  );
}

    