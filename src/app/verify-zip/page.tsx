
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle, Download, Search } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Delegate } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type VerificationResult = {
  fileName: string;
  status: 'verified' | 'failed';
  decodedText?: string;
  delegate?: Delegate;
  imageData?: Blob;
};

export default function VerifyZipPage() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();
  const { toast } = useToast();
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

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
  }, [router, toast]);
  
  useEffect(() => {
    // Initialize scanner instance. The div is hidden.
    if (!qrScannerRef.current) {
        // The library requires a DOM element ID.
        const scannerElement = document.getElementById('qr-reader-hidden');
        if (scannerElement) {
            qrScannerRef.current = new Html5Qrcode('qr-reader-hidden');
        }
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsVerifying(true);
    setVerificationResults([]);
    setProgress(0);
    setSearchQuery('');
    toast({ title: "Verification Started", description: "Processing your ZIP file..." });

    const zip = await JSZip.loadAsync(file);
    const imageFiles = Object.values(zip.files).filter(f => !f.dir && (f.name.endsWith('.png') || f.name.endsWith('.jpg')));
    const totalFiles = imageFiles.length;
    let processedFiles = 0;
    let localFailedCount = 0;

    const results: VerificationResult[] = [];

    for (const imageFile of imageFiles) {
        const imageData = await imageFile.async('blob');
        const imageUrl = URL.createObjectURL(imageData);
        
        try {
            if (!qrScannerRef.current) throw new Error("QR scanner not initialized.");

            const decodedText = await qrScannerRef.current.scanFile(new File([imageData], imageFile.name), false);
            
            const delegate = delegates.find(d => d.DelegateNo === decodedText);

            if (delegate) {
                results.push({ fileName: imageFile.name, status: 'verified', decodedText, delegate, imageData });
            } else {
                localFailedCount++;
                results.push({ fileName: imageFile.name, status: 'failed', decodedText, imageData });
            }
        } catch (error) {
            localFailedCount++;
            console.error(`Failed to scan ${imageFile.name}:`, error);
            results.push({ fileName: imageFile.name, status: 'failed', imageData });
        } finally {
            URL.revokeObjectURL(imageUrl);
            processedFiles++;
            setProgress((processedFiles / totalFiles) * 100);
        }
    }
    
    setVerificationResults(results);
    setIsVerifying(false);
    toast({ title: "Verification Complete", description: `Verified: ${processedFiles - localFailedCount}, Failed: ${localFailedCount}` });

  }, [delegates, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
    disabled: isVerifying
  });

  const filteredResults = useMemo(() => {
    if (!searchQuery) return verificationResults;
    return verificationResults.filter(r => r.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [verificationResults, searchQuery]);

  const failedResults = filteredResults.filter(r => r.status === 'failed');
  const verifiedResults = filteredResults.filter(r => r.status === 'verified');
  
  const verifiedCount = verificationResults.filter(r => r.status === 'verified').length;
  const failedCount = verificationResults.filter(r => r.status === 'failed').length;

  const downloadFailedQRs = async () => {
    const failedToDownload = verificationResults.filter(r => r.status === 'failed' && r.imageData);
    if (failedToDownload.length === 0) {
        toast({ title: "No failed QR codes to download." });
        return;
    }

    const zip = new JSZip();
    for (const qr of failedToDownload) {
        zip.file(qr.fileName, qr.imageData!);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'failed-qr-codes.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Download Started", description: "Downloading a ZIP of failed QR codes." });
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* Hidden element for QR scanner initialization */}
      <div id="qr-reader-hidden" style={{ display: 'none' }}></div>

      <header className="flex items-center mb-8 gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-headline text-4xl font-bold text-primary tracking-wider uppercase">Verify QR Code ZIP</h1>
          <p className="text-muted-foreground">Upload your generated ZIP file to automatically scan and verify every QR code.</p>
        </div>
      </header>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div {...getRootProps()} className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
            <input {...getInputProps()} />
            {isVerifying ? (
                <>
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-lg font-semibold">Verifying, please wait...</p>
                    <p className="text-muted-foreground">{Math.round(progress)}% complete</p>
                    <Progress value={progress} className="w-full max-w-sm mt-4" />
                </>
            ) : (
                <>
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold">Drop your 'delegate-qrcodes.zip' here, or click to select</p>
                    <p className="text-muted-foreground">The file will be processed entirely in your browser.</p>
                </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {verificationResults.length > 0 && !isVerifying && (
         <div className="space-y-8">
            {/* Summary Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Verification Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-4xl font-bold text-green-500">{verifiedCount}</p>
                        <p className="text-muted-foreground">Verified</p>
                    </div>
                     <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-4xl font-bold text-destructive">{failedCount}</p>
                        <p className="text-muted-foreground">Failed</p>
                    </div>
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search results by filename..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                </CardContent>
                 {failedCount > 0 && (
                    <CardContent className="pt-0">
                         <Button onClick={downloadFailedQRs} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Download {failedCount} Failed QR{failedCount > 1 ? 's' : ''}
                        </Button>
                    </CardContent>
                )}
            </Card>
            
            {/* Failed Results Section */}
            {failedResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2"><XCircle/> Failed QR Codes ({failedResults.length})</CardTitle>
                        <CardDescription>These QR codes could not be scanned or did not match any delegate.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                           {failedResults.map(result => (
                             <div key={result.fileName} className="text-center">
                               <img src={URL.createObjectURL(result.imageData!)} alt={result.fileName} className="w-full aspect-square rounded-md border-2 border-destructive"/>
                               <p className="text-xs text-muted-foreground mt-1 truncate">{result.fileName}</p>
                             </div>
                           ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Verified Results Section */}
            {verifiedResults.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-green-500 flex items-center gap-2"><CheckCircle/> Verified Delegates ({verifiedResults.length})</CardTitle>
                        <CardDescription>These QR codes were successfully scanned and matched.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       {verifiedResults.map(result => (
                         <div key={result.fileName} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                           <div className="flex items-center gap-3">
                                <Badge variant="secondary">{result.delegate?.DelegateNo}</Badge>
                                <div>
                                    <p className="font-semibold">{result.delegate?.Name}</p>
                                    <p className="text-xs text-muted-foreground">{result.fileName}</p>
                                </div>
                           </div>
                           <CheckCircle className="h-5 w-5 text-green-500" />
                         </div>
                       ))}
                    </CardContent>
                </Card>
            )}
         </div>
      )}
    </main>
  );
}

    
