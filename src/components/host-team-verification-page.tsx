
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Search, QrCode, FileWarning, Frown, Loader2, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrScannerDialog } from '@/components/qr-scanner-dialog';
import type { HostMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { HostMemberCard } from './host-member-card';

interface HostTeamVerificationPageProps {
  department: 'DC' | 'EC';
}

export function HostTeamVerificationPage({ department }: HostTeamVerificationPageProps) {
  const [members, setMembers] = useState<HostMember[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundMember, setFoundMember] = useState<HostMember | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchAndParseData = async () => {
        setDataLoaded(false);
        setLoadingError(null);
        const cacheKey = `host-team-${department}`;

        const parseAndSetData = (jsonData: any[], source: 'cache' | 'network') => {
            if (jsonData.length === 0) {
              throw new Error("Excel file is empty or contains no host team members.");
            }
            const firstRow = jsonData[0];
            if (!('ID' in firstRow && 'Name' in firstRow && 'Department' in firstRow)) {
              throw new Error("Invalid Excel format. It must contain 'ID', 'Name', and 'Department' columns.");
            }

            const allMembers: HostMember[] = jsonData.map((row) => ({
                ID: String(row.ID),
                Name: String(row.Name),
                Department: String(row.Department),
            }));
        
            const departmentMembers = allMembers.filter(
              (member) => member.Department && member.Department.trim().toUpperCase() === department
            );

            if (departmentMembers.length === 0) {
                throw new Error(`No members found for the ${department} department in the Excel file.`);
            }

            setMembers(departmentMembers);
            setDataLoaded(true);

            if (source === 'network') {
                localStorage.setItem(cacheKey, JSON.stringify(departmentMembers));
                toast({
                    title: 'Success',
                    description: `${departmentMembers.length} members loaded for ${department} from the server.`,
                });
            } else {
                toast({
                    title: 'Loaded from Cache',
                    description: `${departmentMembers.length} members loaded for ${department}. You are offline.`,
                });
            }
        };

        try {
            if (navigator.onLine) {
                const response = await fetch('/host-team.xlsx');
                if (!response.ok) throw new Error('Could not load host team data file.');
                
                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
                parseAndSetData(jsonData, 'network');
            } else {
                throw new Error("Offline mode");
            }
        } catch (networkError: any) {
            console.warn("Network fetch failed, attempting to load from cache.", networkError.message);
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                try {
                    const parsedData = JSON.parse(cachedData);
                    parseAndSetData(parsedData, 'cache');
                } catch (cacheError: any) {
                    setLoadingError(`Failed to load data for ${department}. Cache is corrupted.`);
                    setDataLoaded(true);
                }
            } else {
                 setLoadingError(networkError.message === 'Offline mode' ? `You are offline and no data is cached for ${department}.` : `Failed to load data for ${department}. Please check connection.`);
                 setDataLoaded(true);
            }
        }
    };

    fetchAndParseData();
  }, [toast, department]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFoundMember(null);
    setNotFound(false);

    if (query.trim() === '') {
      return;
    }

    const potentialId = query.trim().toUpperCase();
    const exactMatchById = members.find((m) => m.ID.toUpperCase() === potentialId);

    if (exactMatchById) {
      setFoundMember(exactMatchById);
    }
  };

  const searchResults = useMemo(() => {
    if (searchQuery.trim() === '' || foundMember) return [];

    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = members.filter(
      (m) =>
        (m.Name && m.Name.toLowerCase().includes(lowerCaseQuery)) ||
        (m.ID && m.ID.toLowerCase().includes(lowerCaseQuery))
    );
    
    if (results.length === 0) {
        setNotFound(true);
    } else {
        setNotFound(false);
    }

    return results;
  }, [searchQuery, members, foundMember]);

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    const query = decodedText.trim().toUpperCase();
    const member = members.find((m) => m.ID.toUpperCase() === query);
    if (member) {
      setFoundMember(member);
      setNotFound(false);
      toast({
        title: 'Member Verified',
        description: `Successfully found ${member.Name}.`,
      });
    } else {
      setFoundMember(null);
      setNotFound(true);
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: `No ${department} member found with ID ${decodedText}.`,
      });
    }
  };

  const resetSearch = () => {
    setSearchQuery('');
    setFoundMember(null);
    setNotFound(false);
  };
  
  const handleGenerateClick = () => {
    if (!dataLoaded || members.length === 0 || loadingError) {
      toast({
          variant: "destructive",
          title: "No Members Loaded",
          description: "Cannot proceed to generation without member data."
      });
      return;
    }
    router.push(`/host-team/${department.toLowerCase()}/generate`);
  };

  const renderContent = () => {
    if (!dataLoaded) {
      return (
        <Card className="max-w-lg mx-auto animate-in fade-in-50 duration-500 bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="items-center text-center">
            <Loader2 className="w-12 h-12 text-primary mb-2 animate-spin" />
            <CardTitle className="font-headline text-3xl">Loading {department} Data</CardTitle>
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
                    <span>Please ensure a valid `host-team.xlsx` file is present in the `public` directory. It must contain 'ID', 'Name', and 'Department' columns.</span>
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
              placeholder={`Search by name or ${department} ID...`}
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
          {foundMember && (
            <div className="flex flex-col items-center">
              <HostMemberCard member={foundMember} />
              <Button variant="link" onClick={resetSearch} className="mt-4">
                Clear Search
              </Button>
            </div>
          )}

          {!foundMember && searchResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-headline text-center">
                {searchResults.length} result(s) found
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {searchResults.slice(0, 10).map((member) => (
                  <HostMemberCard key={member.ID} member={member} />
                ))}
              </div>
              {searchResults.length > 10 && <p className="text-center text-muted-foreground">More than 10 results, please refine your search.</p>}
            </div>
          )}

          {notFound && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-12 animate-in fade-in-50 duration-500">
              <Frown className="h-16 w-16 mb-4" />
              <h3 className="text-2xl font-headline">Member Not Found</h3>
              <p>No {department} member matches your search for "{searchQuery}".</p>
              <Button variant="link" onClick={resetSearch} className="mt-4">
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary tracking-wider uppercase">
          {department} Verification
        </h1>
        <p className="text-muted-foreground mt-1 text-lg font-body">
          Host Team Verification
        </p>
         <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button onClick={handleGenerateClick} disabled={!dataLoaded || !!loadingError} size="lg">
                <Download className="mr-2 h-4 w-4" />
                Generate & Download QR Codes
            </Button>
        </div>
      </div>

      {renderContent()}

      <QrScannerDialog
        open={isScanning}
        onOpenChange={setIsScanning}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}

    