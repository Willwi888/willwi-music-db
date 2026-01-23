import React, { useEffect, useRef, useState } from 'react';
import { PAYPAL_CLIENT_ID } from '../constants/payment';

interface PayPalButtonProps {
  buttonId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ buttonId, onSuccess, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if PayPal SDK is already loaded
    if ((window as any).paypal) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=TWD`;
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    script.onerror = () => {
      setIsLoading(false);
      onError?.('Failed to load PayPal SDK');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    // Clear previous button
    containerRef.current.innerHTML = '';

    // Render PayPal Hosted Button
    try {
      (window as any).paypal.HostedButtons({
        hostedButtonId: buttonId
      }).render(containerRef.current);
    } catch (error) {
      console.error('PayPal render error:', error);
      onError?.(error);
    }
  }, [isLoaded, buttonId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-gold border-t-transparent"></div>
        <span className="ml-2 text-slate-400 text-sm">載入 PayPal...</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      id={`paypal-container-${buttonId}`}
      className="paypal-button-container"
    />
  );
};

export default PayPalButton;
