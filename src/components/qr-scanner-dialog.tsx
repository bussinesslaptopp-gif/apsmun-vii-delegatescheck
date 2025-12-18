
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
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

export function QrScannerDialog({ open, onOpenChange, onScanSuccess }: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const stopStream = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
     if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      if (!open) return;

      setIsLoading(true);
      setHasPermission(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera access is not supported by this browser.");
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setHasPermission(true);
          setIsLoading(false);
          requestRef.current = requestAnimationFrame(tick);
        } else {
            throw new Error("Video element not found.");
        }
      } catch (err: any) {
        console.error("[QR Scanner] Camera Error:", err);
        setHasPermission(false);
        setIsLoading(false);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Camera Error",
            description: err.message || "Could not start the camera.",
          });
        }
      }
    };

    if (open) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [open, toast, stopStream]);

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            onScanSuccess(code.data);
            onOpenChange(false);
            return; // Stop scanning
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };


  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Starting Camera...</p>
            </div>
        );
    }

    if (hasPermission === false) {
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
    }
    
    // Video element is always in the DOM but hidden until permission is granted and loading is false.
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Delegate QR Code</DialogTitle>
          <DialogDescription>
            Center the delegate's QR code in the frame to scan.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-muted self-center">
          <video
            ref={videoRef}
            className={`h-full w-full object-cover transition-opacity duration-300 ${!isLoading && hasPermission ? 'opacity-100' : 'opacity-0'}`}
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {renderContent()}
        </div>
        <DialogFooter>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
