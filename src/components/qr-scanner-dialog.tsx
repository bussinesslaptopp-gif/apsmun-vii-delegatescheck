
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, type Html5QrcodeError, type Html5QrcodeResult } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CameraOff, Loader2 } from "lucide-react";

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

const qrReaderId = "qr-reader-container";

type ScannerState = "IDLE" | "INITIALIZING" | "SCANNING" | "ERROR";

export function QrScannerDialog({ open, onOpenChange, onScanSuccess }: QrScannerDialogProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>("IDLE");
  const { toast } = useToast();

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        console.log("QR scanner stopped successfully.");
      } catch (err) {
        console.error("Error stopping the QR scanner: ", err);
      }
    }
  }, []);
  
  useEffect(() => {
    let isCancelled = false;

    const startScanner = async () => {
        if (isCancelled || !document.getElementById(qrReaderId)) return;
        
        setScannerState("INITIALIZING");
        
        const html5QrCode = new Html5Qrcode(qrReaderId);
        scannerRef.current = html5QrCode;

        try {
            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                throw new Error("No cameras found on this device.");
            }

            if (isCancelled) return;

            const onScanSuccessCallback = (decodedText: string, result: Html5QrcodeResult) => {
                if (isCancelled) return;
                onScanSuccess(decodedText);
                onOpenChange(false);
            };

            const onScanFailureCallback = (error: Html5QrcodeError) => {
                // This callback is called frequently, so we don't log every "error"
                // unless it's a critical one. "QR code not found" is expected.
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdge * 0.8);
                        return { width: qrboxSize, height: qrboxSize };
                    },
                    aspectRatio: 1.0,
                },
                onScanSuccessCallback,
                onScanFailureCallback,
            );

            if (!isCancelled) {
              setScannerState("SCANNING");
            }

        } catch (err: any) {
            if (isCancelled) return;
            
            console.error("Failed to start QR scanner:", err);
            setScannerState("ERROR");
            toast({
                variant: "destructive",
                title: "Camera Error",
                description: err.message || "Could not access the camera. Please check your browser permissions.",
            });
        }
    };
    
    if (open) {
      // Use a timeout to allow the dialog animation to complete
      const timeoutId = setTimeout(startScanner, 150);
      return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
        stopScanner();
      };
    } else {
      stopScanner();
      setScannerState("IDLE");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };
  
  const renderScannerContent = () => {
    switch (scannerState) {
        case "INITIALIZING":
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Starting Camera...</p>
                </div>
            );
        case "ERROR":
            return (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Alert variant="destructive" className="m-4 text-center">
                    <CameraOff className="h-8 w-8 mx-auto mb-2" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Camera access was denied or an error occurred. Please enable it in your browser's site settings to use the scanner.
                    </AlertDescription>
                    </Alert>
                </div>
            );
        case "SCANNING":
        case "IDLE": // IDLE is the initial state before initializing
        default:
            // The container needs to exist in the DOM for the scanner to hook into it.
            return <div id={qrReaderId} className="w-full h-full" />;
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Delegate QR Code</DialogTitle>
          <DialogDescription>
            Center the delegate's QR code in the frame to scan.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-muted self-center">
            {renderScannerContent()}
        </div>
        <DialogFooter>
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
