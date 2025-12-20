
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import * as XLSX from "xlsx";
import { Search, QrCode, FileWarning, Frown, Loader2, CheckCircle, ShieldCheck, PowerOff } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrScannerDialog } from "@/components/qr-scanner-dialog";
import { DelegateCard } from "@/components/delegate-card";
import type { Delegate } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

export default function DelegateDirectoryPage() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [foundDelegate, setFoundDelegate] = useState<Delegate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('Service Worker registered with scope:', registration.scope))
            .catch(error => console.error('Service Worker registration failed:', error));
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (typeof navigator.onLine !== 'undefined') {
        setIsOnline(navigator.onLine);
    }

    const fetchAndParseData = async () => {
      setDataLoaded(false);
      setLoadingError(null);

      // 1. Try to load from local storage
      const cachedData = localStorage.getItem('delegates');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setDelegates(parsedData);
        setDataLoaded(true);
        toast({
            title: "Loaded from cache",
            description: `${parsedData.length} delegates loaded successfully.`,
        });
        return;
      }
      
      // 2. If not in cache, fetch from network
      try {
        const response = await fetch('/delegates.xlsx');
        if (!response.ok) {
          throw new Error('Could not load delegate data file. Make sure `delegates.xlsx` is in the `public` folder.');
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
            setLoadingError("Excel file is empty.");
            setDataLoaded(true);
            return;
        }

        const firstRow = jsonData[0];
        if (!('DelegateNo' in firstRow && 'Name' in firstRow)) {
            setLoadingError("Invalid Excel format. It must contain 'DelegateNo' and 'Name' columns.");
            setDataLoaded(true);
            return;
        }

        const formattedData: Delegate[] = jsonData.map(row => ({
            DelegateNo: String(row.DelegateNo),
            Name: String(row.Name),
            Committee: String(row.Committee || 'N/A'),
            Class: String(row.Class || 'N/A'),
            Number: String(row.Number || 'N/A'),
        }));
        
        localStorage.setItem('delegates', JSON.stringify(formattedData));

        setDelegates(formattedData);
        setDataLoaded(true);
        toast({
            title: "Success",
            description: `${formattedData.length} delegates loaded successfully.`,
        });

      } catch(e: any) {
        setLoadingError(e.message);
        setDataLoaded(true);
      }
    };

    fetchAndParseData();
    
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };

  }, [toast]);


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFoundDelegate(null);
    setNotFound(false);

    if (query.trim() === "") {
      return;
    }

    const potentialDelegateNo = query.trim().toUpperCase();
    const exactMatchByNo = delegates.find(d => d.DelegateNo.toUpperCase() === potentialDelegateNo);


    if (exactMatchByNo) {
      setFoundDelegate(exactMatchByNo);
    } else {
        // Handled by searchResults useMemo
    }
  };
  
  const searchResults = useMemo(() => {
    if (searchQuery.trim() === "" || foundDelegate) return [];
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = delegates.filter(d => 
        (d.Name && d.Name.toLowerCase().includes(lowerCaseQuery)) ||
        (d.DelegateNo && d.DelegateNo.toLowerCase().includes(lowerCaseQuery))
    );

    if (results.length === 0) {
        setNotFound(true);
    } else {
        setNotFound(false);
    }

    return results;
  }, [searchQuery, delegates, foundDelegate]);

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    const query = decodedText.trim().toUpperCase();
    const delegate = delegates.find(d => d.DelegateNo.toUpperCase() === query);
    if (delegate) {
      setFoundDelegate(delegate);
      setNotFound(false);
      toast({
        title: "Delegate Verified",
        description: `Successfully found ${delegate.Name}.`
      })
    } else {
      setFoundDelegate(null);
      setNotFound(true);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: `No delegate found with number ${decodedText}.`
      })
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    setFoundDelegate(null);
    setNotFound(false);
  };

 const handleGenerateClick = () => {
    if (!dataLoaded || delegates.length === 0 || loadingError) {
        toast({
            variant: "destructive",
            title: "No Delegates Loaded",
            description: "Cannot proceed to generation without delegate data."
        });
        return;
    }
    if (!isOnline) {
        toast({ variant: "destructive", title: "You are offline", description: "An internet connection is required to generate QR codes with logos." });
        return;
    }
    router.push('/verify');
  };

   const handleVerifyZipClick = () => {
    if (!dataLoaded || delegates.length === 0 || loadingError) {
        toast({
            variant: "destructive",
            title: "No Delegates Loaded",
            description: "Cannot proceed to verification without delegate data."
        });
        return;
    }
    router.push('/verify-zip');
  };


  const handleInstallClick = () => {
    if (!installPrompt) {
        toast({
            title: "Installation not available",
            description: "The app can't be installed right now. Please try again later or use a compatible browser.",
        });
        return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
            toast({ title: "Installation started!", description: "The app is being added to your device." });
        } else {
            console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
    });
};


  const renderContent = () => {
    if (!dataLoaded) {
      return (
        <Card className="max-w-lg mx-auto animate-in fade-in-50 duration-500 bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="items-center text-center">
            <Loader2 className="w-12 h-12 text-primary mb-2 animate-spin" />
            <CardTitle className="font-headline text-3xl">Loading Delegate Data</CardTitle>
            <CardDescription>Please wait...</CardDescription>
          </CardHeader>
        </Card>
      );
    }
    
    if (loadingError) {
      return (
        <Card className="max-w-lg mx-auto animate-in fade-in-50 duration-500 bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="items-center text-center">
            <FileWarning className="w-12 h-12 text-destructive mb-2" />
            <CardTitle className="font-headline text-3xl">Error Loading Data</CardTitle>
            <CardDescription>{loadingError}</CardDescription>
          </CardHeader>
           <CardContent>
                 <div className="mt-4 text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg flex items-start space-x-2">
                    <FileWarning className="h-6 w-6 mt-1 flex-shrink-0"/>
                    <span>Please ensure a valid `delegates.xlsx` file is present in the `public` directory. It must contain 'DelegateNo' and 'Name' columns.</span>
                </div>
            </CardContent>
        </Card>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or Delegate No..."
              className="pl-10 text-base"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setIsScanning(true)} className="h-10">
            <QrCode className="mr-2 h-5 w-5" />
            Scan to Verify
          </Button>
        </div>

        <div className="relative min-h-[300px]">
          {foundDelegate && (
            <div className="flex flex-col items-center">
              <DelegateCard delegate={foundDelegate} />
              <Button variant="link" onClick={resetSearch} className="mt-4">Clear Search</Button>
            </div>
          )}
          
          {!foundDelegate && searchResults.length > 0 && (
              <div className="space-y-4">
                  <h2 className="text-xl font-headline text-center">{searchResults.length} result(s) found</h2>
                  <div className="grid grid-cols-1 gap-4">
                      {searchResults.slice(0, 10).map((delegate) => (
                          <DelegateCard key={delegate.DelegateNo} delegate={delegate} />
                      ))}
                  </div>
                   {searchResults.length > 10 && <p className="text-center text-muted-foreground">More than 10 results, please refine your search.</p>}
              </div>
          )}

          {notFound && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-12 animate-in fade-in-50 duration-500">
              <Frown className="h-16 w-16 mb-4" />
              <h3 className="text-2xl font-headline">Delegate Not Found</h3>
              <p>No delegate matches your search for "{searchQuery}".</p>
              <Button variant="link" onClick={resetSearch} className="mt-4">Try again</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const mainButtonDisabled = !dataLoaded || !!loadingError || !isOnline;
  const verifyZipDisabled = !dataLoaded || !!loadingError;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary tracking-wider uppercase">Delegate Directory</h1>
        <p className="text-muted-foreground mt-1 text-lg font-body">
          Delegate Directory & Verification
        </p>
         <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button onClick={handleGenerateClick} disabled={mainButtonDisabled} size="lg">
                <CheckCircle className="mr-2 h-4 w-4" />
                {isOnline ? 'Generate & Download QR Codes' : 'Offline'}
            </Button>
             <Button onClick={handleVerifyZipClick} disabled={verifyZipDisabled} size="lg" variant="secondary">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify QR Code ZIP
            </Button>
            {installPrompt && (
                <Button onClick={handleInstallClick} size="lg" variant="outline">
                    <PowerOff className="mr-2 h-4 w-4" />
                    Make Available Offline
                </Button>
            )}
        </div>
      </div>

      {renderContent()}

      <QrScannerDialog open={isScanning} onOpenChange={setIsScanning} onScanSuccess={handleScanSuccess} />
      
      <footer className="text-center mt-12 mb-4">
        <p className="text-muted-foreground text-sm font-light">
          Made with ❤️ by <a href="https://www.instagram.com/abdullahishaq2025/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline hover:text-green-300 transition-colors">Abdullah Ishaq</a> & <a href="https://www.instagram.com/mahadnadeem2022/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline hover:text-green-300 transition-colors">Mahad Nadeem</a>
        </p>
      </footer>
    </>
  );
}

    