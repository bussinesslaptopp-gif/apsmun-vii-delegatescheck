
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import {
  Search,
  QrCode,
  FileWarning,
  Frown,
  Loader2,
  ShieldCheck,
  PowerOff,
  GitCompareArrows,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { QrScannerDialog } from '@/components/qr-scanner-dialog';
import { DelegateCard } from '@/components/delegate-card';
import { HostMemberCard } from '@/components/host-member-card';
import { ECMemberCard } from '@/components/ec-member-card';
import { SpecialHostCard } from '@/components/special-host-card';
import type { Delegate, HostMember, ECMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type FoundItem =
  | { type: 'delegate'; data: Delegate }
  | { type: 'dc'; data: HostMember }
  | { type: 'ec'; data: ECMember };

type ComparisonResult = {
  delegateNo: string;
  originalName: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
};

export default function UniversalVerificationPage() {
  // Main verification state
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [dcMembers, setDcMembers] = useState<HostMember[]>([]);
  const [ecMembers, setEcMembers] = useState<ECMember[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundItem, setFoundItem] = useState<FoundItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // PWA install state
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Comparison state
  const [showCompare, setShowCompare] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [addedDelegates, setAddedDelegates] = useState<Delegate[]>([]);
  const [removedDelegates, setRemovedDelegates] = useState<Delegate[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [compareFileName, setCompareFileName] = useState<string | null>(null);
  const [compareSearchQuery, setCompareSearchQuery] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast({ title: 'You are offline', description: 'App is running in offline mode. Data may be outdated.' });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator.onLine !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const fetchAndParseData = async () => {
      setDataLoaded(false);
      setLoadingError(null);

      const fetchDataFile = async (fileName: string, cacheKey: string, parser: (data: any[]) => any[]) => {
        try {
          if (navigator.onLine) {
            const response = await fetch(`/${fileName}?_=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`Could not load ${fileName}.`);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
            if (jsonData.length === 0) throw new Error(`${fileName} is empty.`);
            const parsedData = parser(jsonData);
            localStorage.setItem(cacheKey, JSON.stringify(parsedData));
            return parsedData;
          } else {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) return JSON.parse(cachedData);
            throw new Error(`Offline and no cache for ${fileName}`);
          }
        } catch (error: any) {
          console.warn(`Failed to process ${fileName}:`, error.message);
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            toast({ title: `Loaded ${cacheKey} from cache`, variant: 'default' });
            return JSON.parse(cachedData);
          }
          throw error;
        }
      };

      try {
        const delegateData = await fetchDataFile('delegates.xlsx', 'delegates', (jsonData) =>
          jsonData.map((row) => ({
            DelegateNo: String(row.DelegateNo),
            Name: String(row.Name),
            Committee: String(row.Committee || 'N/A'),
            Class: String(row['CLASS'] || 'N/A'),
            Number: String(row['CONTACT NUMBER'] || 'N/A'),
          }))
        );
        setDelegates(delegateData);

        const dcData = await fetchDataFile('dc.xlsx', 'host-team-DC', (jsonData) =>
          jsonData.map((row) => ({
            ID: String(row.ID || ''),
            Name: String(row.Name || ''),
            Department: String(row.Department || ''),
            Designation: String(row.DESIGNATION || ''),
          }))
        );
        setDcMembers(dcData);

        const ecData = await fetchDataFile('ec.xlsx', 'host-team-EC', (jsonData) =>
          jsonData.map((row) => ({
            ID: String(row.ID || ''),
            Name: String(row.Name || ''),
            Designation: String(row.DESIGNATION || ''),
          }))
        );
        setEcMembers(ecData);

        setDataLoaded(true);
        if (navigator.onLine) {
            toast({ title: 'All data loaded successfully' });
        } else {
            toast({ title: 'Running in offline mode', description: 'All data loaded from cache.' });
        }
      } catch (error: any) {
        setLoadingError(`Failed to load one or more data files. Error: ${error.message}. Please check connection or cache.`);
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
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setCompareFileName(file.name);
    setIsComparing(true);
    setComparisonResults([]);
    setAddedDelegates([]);
    setRemovedDelegates([]);
    setCompareSearchQuery('');
    toast({ title: "Comparison Started", description: "Processing your delegate file..." });

    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const parsedData: Delegate[] = jsonData.map(row => ({
            DelegateNo: String(row.DelegateNo),
            Name: String(row.Name),
            Committee: String(row.Committee || 'N/A'),
        }));

        const originalMap = new Map(delegates.map(d => [d.DelegateNo, d]));
        const newMap = new Map(parsedData.map(d => [d.DelegateNo, d]));

        const changed: ComparisonResult[] = [];
        const added: Delegate[] = [];
        const removed: Delegate[] = [];

        newMap.forEach((newDelegate, delegateNo) => {
            const originalDelegate = originalMap.get(delegateNo);
            if (originalDelegate) {
                const differences = [];
                if (originalDelegate.Name.trim() !== newDelegate.Name.trim()) {
                    differences.push({ field: 'Name', oldValue: originalDelegate.Name, newValue: newDelegate.Name });
                }
                if (originalDelegate.Committee.trim() !== newDelegate.Committee.trim()) {
                    differences.push({ field: 'Committee', oldValue: originalDelegate.Committee, newValue: newDelegate.Committee });
                }
                if (differences.length > 0) {
                    changed.push({ delegateNo, originalName: originalDelegate.Name, changes: differences });
                }
            } else {
                added.push(newDelegate);
            }
        });

        originalMap.forEach((originalDelegate, delegateNo) => {
            if (!newMap.has(delegateNo)) {
                removed.push(originalDelegate);
            }
        });
        
        setComparisonResults(changed);
        setAddedDelegates(added);
        setRemovedDelegates(removed);
        
        toast({ title: "Comparison Complete", description: `Found ${changed.length} changed, ${added.length} added, and ${removed.length} removed delegates.` });

    } catch (error) {
        console.error("Comparison error:", error);
        toast({ variant: 'destructive', title: "Error Processing File", description: "Could not read or compare the uploaded file." });
    } finally {
        setIsComparing(false);
    }
  }, [delegates, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false,
    disabled: isComparing
  });
  
  const filteredComparisonResults = useMemo(() => {
    if (!compareSearchQuery) return comparisonResults;
    const lowerQuery = compareSearchQuery.toLowerCase();
    return comparisonResults.filter(item => 
        item.delegateNo.toLowerCase().includes(lowerQuery) ||
        item.originalName.toLowerCase().includes(lowerQuery)
    );
  }, [comparisonResults, compareSearchQuery]);

  const filteredAddedDelegates = useMemo(() => {
    if (!compareSearchQuery) return addedDelegates;
    const lowerQuery = compareSearchQuery.toLowerCase();
    return addedDelegates.filter(delegate =>
        delegate.DelegateNo.toLowerCase().includes(lowerQuery) ||
        delegate.Name.toLowerCase().includes(lowerQuery)
    );
  }, [addedDelegates, compareSearchQuery]);
  
  const filteredRemovedDelegates = useMemo(() => {
    if (!compareSearchQuery) return removedDelegates;
    const lowerQuery = compareSearchQuery.toLowerCase();
    return removedDelegates.filter(delegate =>
        delegate.DelegateNo.toLowerCase().includes(lowerQuery) ||
        delegate.Name.toLowerCase().includes(lowerQuery)
    );
  }, [removedDelegates, compareSearchQuery]);

  const hasCompareResults = comparisonResults.length > 0 || addedDelegates.length > 0 || removedDelegates.length > 0;

  const findItem = (query: string): FoundItem | null => {
    const upperQuery = query.trim().toUpperCase();
    if (!upperQuery) return null;

    if (!isNaN(Number(upperQuery))) {
      const delegate = delegates.find((d) => d.DelegateNo.toUpperCase() === upperQuery);
      if (delegate) return { type: 'delegate', data: delegate };
    }

    const ecMember = ecMembers.find((m) => m.ID.toUpperCase() === upperQuery);
    if (ecMember) return { type: 'ec', data: ecMember };
    
    const dcMember = dcMembers.find((m) => m.ID.toUpperCase() === upperQuery);
    if (dcMember) return { type: 'dc', data: dcMember };

    return null;
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const item = findItem(query);
    if (item) {
        setFoundItem(item);
        setNotFound(false);
    } else {
        setFoundItem(null);
        setNotFound(query.trim() !== "" && searchResults.length === 0);
    }
  };

  const searchResults = useMemo(() => {
    if (searchQuery.trim() === '' || foundItem) return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    const delegateResults = delegates
      .filter((d) => (d.Name && d.Name.toLowerCase().includes(lowerCaseQuery)) || (d.DelegateNo && d.DelegateNo.toLowerCase().includes(lowerCaseQuery)))
      .map((d) => ({ type: 'delegate', data: d } as FoundItem));
    const ecResults = ecMembers
      .filter((m) => (m.Name && m.Name.toLowerCase().includes(lowerCaseQuery)) || (m.ID && m.ID.toLowerCase().includes(lowerCaseQuery)))
      .map((m) => ({ type: 'ec', data: m } as FoundItem));
    const dcResults = dcMembers
      .filter((m) => (m.Name && m.Name.toLowerCase().includes(lowerCaseQuery)) || (m.ID && m.ID.toLowerCase().includes(lowerCaseQuery)))
      .map((m) => ({ type: 'dc', data: m } as FoundItem));
    const results = [...delegateResults, ...ecResults, ...dcResults];
    if (results.length === 0) setNotFound(true);
    else setNotFound(false);
    return results;
  }, [searchQuery, delegates, dcMembers, ecMembers, foundItem]);

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    const item = findItem(decodedText);
    if (item) {
      setFoundItem(item);
      setNotFound(false);
      toast({ title: 'Verified Successfully', description: `Successfully found ${item.data.Name}.` });
    } else {
      setFoundItem(null);
      setNotFound(true);
      toast({ variant: 'destructive', title: 'Verification Failed', description: `No person found with ID ${decodedText}.` });
    }
  };

  const resetSearch = () => {
    setSearchQuery('');
    setFoundItem(null);
    setNotFound(false);
  };

  const handleVerifyZipClick = () => {
    if (!dataLoaded || loadingError) {
      toast({ variant: 'destructive', title: 'No Data Loaded', description: 'Cannot proceed to verification without delegate and host team data.' });
      return;
    }
    router.push('/verify-zip');
  };

  const handleInstallClick = () => {
    if (!installPrompt) {
      toast({ title: 'Installation not available', description: "The app can't be installed right now. Please try again later or use a compatible browser." });
      return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast({ title: 'Installation started!', description: 'The app is being added to your device.' });
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const renderFoundItem = (item: FoundItem) => {
    switch (item.type) {
      case 'delegate':
        return <DelegateCard delegate={item.data as Delegate} />;
      case 'dc':
        const member = item.data as HostMember;
        if (member.ID === 'DC024' || member.ID === 'DC100') return <SpecialHostCard member={member} />;
        return <HostMemberCard member={member} />;
      case 'ec':
        return <ECMemberCard member={item.data as ECMember} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (!dataLoaded) {
      return (
        <Card className="max-w-lg mx-auto animate-in fade-in-50 duration-500 bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="items-center text-center"><Loader2 className="w-12 h-12 text-primary mb-2 animate-spin" /><CardTitle className="font-headline text-3xl">Loading All Data</CardTitle><CardDescription>Please wait...</CardDescription></CardHeader>
        </Card>
      );
    }
    if (loadingError) {
      return (
        <Card className="max-w-lg mx-auto animate-in fade-in-50 duration-500 bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="items-center text-center"><FileWarning className="w-12 h-12 text-destructive mb-2" /><CardTitle className="font-headline text-3xl">Error Loading Data</CardTitle><CardDescription>{loadingError}</CardDescription></CardHeader>
          <CardContent><div className="mt-4 text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg flex items-start space-x-2"><FileWarning className="h-6 w-6 mt-1 flex-shrink-0" /><span>Please ensure `delegates.xlsx`, `dc.xlsx`, and `ec.xlsx` files are present in the `public` directory.</span></div></CardContent>
        </Card>
      );
    }
    if (showCompare) {
      return renderCompareContent();
    }
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="text" placeholder="Search by Name or ID (e.g., 42, EC001, DC001)..." className="pl-10 text-base" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} /></div>
          <Button variant="outline" onClick={() => setIsScanning(true)} className="h-10"><QrCode className="mr-2 h-5 w-5" />Scan Universal QR</Button>
        </div>
        <div className="relative min-h-[300px]">
          {foundItem && (<div className="flex flex-col items-center">{renderFoundItem(foundItem)}<Button variant="link" onClick={resetSearch} className="mt-4">Clear Search</Button></div>)}
          {!foundItem && searchResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-headline text-center">{searchResults.length} result(s) found</h2>
              <div className="grid grid-cols-1 gap-4">{searchResults.slice(0, 10).map((item) => (<div key={item.type + (item.data.DelegateNo || item.data.ID)} onClick={() => { setFoundItem(item); setSearchQuery(item.data.Name) }} className="cursor-pointer">{renderFoundItem(item)}</div>))}</div>
              {searchResults.length > 10 && (<p className="text-center text-muted-foreground">More than 10 results, please refine your search.</p>)}
            </div>
          )}
          {notFound && (<div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-12 animate-in fade-in-50 duration-500"><Frown className="h-16 w-16 mb-4" /><h3 className="text-2xl font-headline">Person Not Found</h3><p>No one matches your search for "{searchQuery}".</p><Button variant="link" onClick={resetSearch} className="mt-4">Try again</Button></div>)}
        </div>
      </div>
    );
  };
  
  const renderCompareContent = () => (
    <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
            <CardHeader><CardTitle>Compare Delegate Data</CardTitle><CardDescription>Upload a new `delegates.xlsx` file to see the differences against the current data.</CardDescription></CardHeader>
            <CardContent>
                <div {...getRootProps()} className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                    <input {...getInputProps()} />
                    {isComparing ? (
                        <><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="text-lg font-semibold">Comparing, please wait...</p></>
                    ) : (
                        <><Upload className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-lg font-semibold">Drop `delegates.xlsx` here, or click to select</p><p className="text-muted-foreground">The file will be processed entirely in your browser.</p></>
                    )}
                </div>
            </CardContent>
        </Card>

        {compareFileName && !isComparing && hasCompareResults && (
            <Card>
                <CardHeader>
                    <CardTitle>Comparison Results for <span className="text-primary">{compareFileName}</span></CardTitle>
                    <CardDescription>Comparing against the data currently loaded in the app.</CardDescription>
                    <div className="relative pt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search results by name or delegate no..."
                          className="pl-10"
                          value={compareSearchQuery}
                          onChange={(e) => setCompareSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="changed" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="changed"><AlertTriangle className="mr-2 h-4 w-4"/> Changed ({filteredComparisonResults.length})</TabsTrigger>
                            <TabsTrigger value="added"><CheckCircle className="mr-2 h-4 w-4"/> Added ({filteredAddedDelegates.length})</TabsTrigger>
                            <TabsTrigger value="removed"><XCircle className="mr-2 h-4 w-4"/> Removed ({filteredRemovedDelegates.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="changed" className="mt-4"><ComparisonTable data={filteredComparisonResults} /></TabsContent>
                        <TabsContent value="added" className="mt-4"><DelegateListTable title="Added Delegates" delegates={filteredAddedDelegates} /></TabsContent>
                        <TabsContent value="removed" className="mt-4"><DelegateListTable title="Removed Delegates" delegates={filteredRemovedDelegates} /></TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )}
    </div>
  );

  const verifyZipDisabled = !dataLoaded || !!loadingError;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary tracking-wider uppercase">
          {showCompare ? 'Compare Data' : 'Universal Verification'}
        </h1>
        <p className="text-muted-foreground mt-1 text-lg font-body">
          {showCompare ? 'Upload a new file to see differences' : 'APSMUN VII Delegate & Host Team Directory'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Button onClick={handleVerifyZipClick} disabled={verifyZipDisabled} size="lg" variant="secondary"><ShieldCheck className="mr-2 h-4 w-4" />Verify QR Code ZIP</Button>
          <Button onClick={() => setShowCompare(!showCompare)} disabled={verifyZipDisabled} size="lg" variant="secondary"><GitCompareArrows className="mr-2 h-4 w-4" />{showCompare ? 'Back to Verification' : 'Compare Delegate Data'}</Button>
          {installPrompt && (<Button onClick={handleInstallClick} size="lg" variant="outline"><PowerOff className="mr-2 h-4 w-4" />Make Available Offline</Button>)}
        </div>
      </div>

      {renderContent()}

      <QrScannerDialog open={isScanning} onOpenChange={setIsScanning} onScanSuccess={handleScanSuccess} />

      <footer className="text-center mt-12 mb-4">
        <p className="text-muted-foreground text-sm font-light">
          Made with ❤️ by{' '}
          <a href="https://www.instagram.com/abdullahishaq2025/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline hover:text-green-300 transition-colors">Abdullah Ishaq</a>
          {' '}&{' '}
          <a href="https://www.instagram.com/mahadnadeem2022/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline hover:text-green-300 transition-colors">Mahad Nadeem</a>
        </p>
      </footer>
    </>
  );
}

function ComparisonTable({ data }: { data: ComparisonResult[] }) {
    if (data.length === 0) return <p className="text-muted-foreground text-center py-8">No changed delegates found.</p>;
    return (
        <div className="border rounded-lg"><Table>
            <TableHeader><TableRow><TableHead>Delegate No</TableHead><TableHead>Name</TableHead><TableHead>Field</TableHead><TableHead>Old Value</TableHead><TableHead>New Value</TableHead></TableRow></TableHeader>
            <TableBody>
                {data.map(item =>
                    item.changes.map((change, index) => (
                        <TableRow key={`${item.delegateNo}-${change.field}`}>
                            {index === 0 && (<TableCell rowSpan={item.changes.length} className="font-medium align-top"><Badge variant="secondary">{item.delegateNo}</Badge></TableCell>)}
                            {index === 0 && (<TableCell rowSpan={item.changes.length} className="align-top">{item.originalName}</TableCell>)}
                            <TableCell className="font-semibold">{change.field}</TableCell>
                            <TableCell className="text-destructive">{change.oldValue}</TableCell>
                            <TableCell className="text-green-500">{change.newValue}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table></div>
    );
}

function DelegateListTable({ title, delegates }: { title: string, delegates: Delegate[] }) {
    if (delegates.length === 0) return <p className="text-muted-foreground text-center py-8">No {title.toLowerCase().split(' ')[0]} delegates found.</p>;
    return (
        <div className="border rounded-lg"><Table>
            <TableHeader><TableRow><TableHead>Delegate No</TableHead><TableHead>Name</TableHead><TableHead>Committee</TableHead></TableRow></TableHeader>
            <TableBody>
                {delegates.map(delegate => (
                    <TableRow key={delegate.DelegateNo}>
                        <TableCell><Badge variant="secondary">{delegate.DelegateNo}</Badge></TableCell>
                        <TableCell>{delegate.Name}</TableCell>
                        <TableCell>{delegate.Committee}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table></div>
    );
}
