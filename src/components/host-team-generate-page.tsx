
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
import type { HostMember } from '@/lib/types';
import { logoUrl } from '@/components/app-header';
import { HostQrCodeDisplay } from './host-qr-code-display';

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

interface HostTeamGeneratePageProps {
  department: 'DC' | 'EC';
}

export function HostTeamGeneratePage({ department }: HostTeamGeneratePageProps) {
  const [members, setMembers] = useState<HostMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedMembers = localStorage.getItem(`host-team-${department}`);
    if (storedMembers) {
      setMembers(JSON.parse(storedMembers));
    } else {
      toast({
        variant: 'destructive',
        title: `No ${department} data found`,
        description: `Please go back to the ${department} verification page and load the data first.`,
      });
      router.push(`/host-team/${department.toLowerCase()}`);
    }
    setLoading(false);
  }, [router, toast, department]);

  const handleDownloadAllQRCodes = async () => {
    if (!members.length) {
      toast({ variant: "destructive", title: "No members to process" });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(`(0/${members.length})`);
    toast({
        title: "Generating ZIP...",
        description: `Processing ${members.length} QR codes. This may take a moment.`,
    });

    const zip = new JSZip();
    const membersWithId = members.filter(d => d.ID);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      for (let i = 0; i < membersWithId.length; i++) {
        const member = membersWithId[i];
        
        const qrHtmlString = renderToStaticMarkup(
            <QrCodeForImageGeneration value={member.ID} />
        );
        container.innerHTML = qrHtmlString;
        const node = container.firstChild as HTMLElement;

        if (!node) continue;

        const dataUrl = await toPng(node, { 
            cacheBust: true,
            pixelRatio: 2,
        });
        const blob = await (await fetch(dataUrl)).blob();

        // Use numerical filenames 1.png, 2.png, etc.
        const fileName = `${i + 1}.png`;
        zip.file(fileName, blob);
        
        setDownloadProgress(`(${i + 1}/${membersWithId.length})`);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const content = await zip.generateAsync({ type: "blob" });
  
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${department}-qrcodes.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
          
      toast({
          title: "Download Complete",
          description: `The ZIP file with all ${department} QR codes has been downloaded.`,
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
            <Button variant="outline" size="icon" onClick={() => router.push(`/host-team/${department.toLowerCase()}`)}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="font-headline text-4xl font-bold text-primary tracking-wider uppercase">Generate {department} QR Codes</h1>
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
        {members.map(member => (
          <HostQrCodeDisplay key={member.ID} member={member} />
        ))}
      </div>
    </div>
  );
}

    