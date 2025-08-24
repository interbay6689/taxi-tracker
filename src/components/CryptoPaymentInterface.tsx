import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Bitcoin, 
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CryptoPaymentInterfaceProps {
  tripAmount: number;
  onPaymentComplete?: (txHash: string, cryptoType: string) => void;
}

export const CryptoPaymentInterface = ({ tripAmount, onPaymentComplete }: CryptoPaymentInterfaceProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const { toast } = useToast();

  // כתובות ארנק דמה לקבלת תשלומים
  const walletAddresses = {
    BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    ETH: '0x742b5c2c8a9c5a8c8c8c8c8c8c8c8c8c8c8c8c8c',
    USDT: '0x742b5c2c8a9c5a8c8c8c8c8c8c8c8c8c8c8c8c8c',
    LTC: 'LTC1qw508d6qejxtdg4y5r3zarvary0c5xw7k'
  };

  // שערי חליפין דמה (בפרקטיקה יגיעו מ-API)
  const exchangeRates = {
    BTC: 280000, // ₪ per BTC
    ETH: 12000,   // ₪ per ETH  
    USDT: 3.7,    // ₪ per USDT
    LTC: 400      // ₪ per LTC
  };

  const cryptoOptions = [
    { id: 'BTC', name: 'Bitcoin', icon: '₿', color: 'text-orange-500' },
    { id: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'text-blue-500' },
    { id: 'USDT', name: 'Tether', icon: '₮', color: 'text-green-500' },
    { id: 'LTC', name: 'Litecoin', icon: 'Ł', color: 'text-gray-500' }
  ];

  // ארנקים נתמכים
  const walletOptions = [
    { 
      id: 'metamask', 
      name: 'MetaMask', 
      icon: '🦊', 
      description: 'הארנק הפופולרי ביותר',
      deepLink: (address: string, amount: string) => `https://metamask.app.link/send/${address}?value=${amount}`
    },
    { 
      id: 'bit', 
      name: 'ביט (Bit)', 
      icon: '🇮🇱', 
      description: 'הארנק הישראלי הפופולרי',
      deepLink: (address: string, amount: string) => `bit://send?address=${address}&amount=${amount}`
    },
    { 
      id: 'binance', 
      name: 'Binance', 
      icon: '🟡', 
      description: 'ארנק בינאנס',
      deepLink: (address: string, amount: string) => `binance://send?address=${address}&amount=${amount}`
    },
    { 
      id: 'trust', 
      name: 'Trust Wallet', 
      icon: '🛡️', 
      description: 'ארנק מאובטח',
      deepLink: (address: string, amount: string) => `trust://send?address=${address}&amount=${amount}`
    },
    { 
      id: 'coinbase', 
      name: 'Coinbase Wallet', 
      icon: '🔵', 
      description: 'ארנק Coinbase',
      deepLink: (address: string, amount: string) => `coinbase://send?address=${address}&amount=${amount}`
    }
  ];

  useEffect(() => {
    // חישוב כמות הקריפטו לפי השער
    const rate = exchangeRates[selectedCrypto as keyof typeof exchangeRates];
    if (rate) {
      setCryptoAmount(tripAmount / rate);
      setExchangeRate(rate);
    }
  }, [selectedCrypto, tripAmount]);

  // חיבור לארנק או פתיחת אפליקציה
  const connectToWallet = async (walletId: string) => {
    const wallet = walletOptions.find(w => w.id === walletId);
    if (!wallet) return;

    setSelectedWallet(walletId);

    try {
      if (walletId === 'metamask') {
        // MetaMask - חיבור web3
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts',
          });
          
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setWalletConnected(true);
            toast({
              title: "ארנק מחובר",
              description: `${wallet.name} חובר בהצלחה למערכת`
            });
          }
        } else {
          toast({
            title: "MetaMask לא מותקן",
            description: "אנא התקן MetaMask או בחר ארנק אחר",
            variant: "destructive"
          });
        }
      } else {
        // ארנקים אחרים - פתיחת deep link
        const address = walletAddresses[selectedCrypto as keyof typeof walletAddresses];
        const amount = cryptoAmount.toFixed(8);
        const deepLinkUrl = wallet.deepLink(address, amount);
        
        // ניסיון פתיחת האפליקציה
        window.open(deepLinkUrl, '_blank');
        
        // סימון כמחובר לדמו
        setWalletAddress('demo-wallet-' + walletId);
        setWalletConnected(true);
        toast({
          title: `פתיחת ${wallet.name}`,
          description: "האפליקציה נפתחת עם פרטי התשלום"
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "שגיאה בחיבור",
        description: `נכשל בחיבור ל${wallet.name}`,
        variant: "destructive"
      });
    }
  };

  // העתקת כתובת ארנק
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "הועתק",
      description: "כתובת הארנק הועתקה ללוח"
    });
  };

  // יצירת QR לתשלום מהיר
  const generatePaymentQR = () => {
    const address = walletAddresses[selectedCrypto as keyof typeof walletAddresses];
    const amount = cryptoAmount.toFixed(8);
    
    // קישור לתשלום (תלוי בסוג המטבע)
    let paymentUrl = '';
    switch (selectedCrypto) {
      case 'BTC':
        paymentUrl = `bitcoin:${address}?amount=${amount}`;
        break;
      case 'ETH':
      case 'USDT':
        paymentUrl = `ethereum:${address}?value=${amount}`;
        break;
      case 'LTC':
        paymentUrl = `litecoin:${address}?amount=${amount}`;
        break;
    }
    
    // בפרקטיקה, כאן היינו יוצרים QR code עם ספרייה כמו qrcode
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentUrl)}`, '_blank');
  };

  // אישור תשלום (בפרקטיקה יהיה מעקב אחר טרנזקציה)
  const confirmPayment = (txHash: string = '') => {
    setPaymentStatus('completed');
    onPaymentComplete?.(txHash || 'demo-tx-hash', selectedCrypto);
    toast({
      title: "תשלום בוצע",
      description: `התשלום ב${selectedCrypto} הושלם בהצלחה`
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bitcoin className="h-5 w-5" />
          תשלום בקריפטו
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* בחירת מטבע קריפטו */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">בחר מטבע קריפטוגרפי</h4>
          <div className="grid grid-cols-2 gap-2">
            {cryptoOptions.map((crypto) => (
              <Button
                key={crypto.id}
                variant={selectedCrypto === crypto.id ? "default" : "outline"}
                onClick={() => setSelectedCrypto(crypto.id)}
                className="flex items-center gap-2 h-auto p-3"
              >
                <span className={`text-lg ${crypto.color}`}>
                  {crypto.icon}
                </span>
                <div className="text-right">
                  <div className="text-xs font-medium">{crypto.name}</div>
                  <div className="text-xs opacity-70">{crypto.id}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* פרטי תשלום */}
        <div className="space-y-3">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>סכום לתשלום:</span>
              <span className="font-medium">₪{tripAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>שער חליפין:</span>
              <span className="font-medium">₪{exchangeRate.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary">
              <span>לתשלום ב{selectedCrypto}:</span>
              <span>{cryptoAmount.toFixed(8)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* אפשרויות תשלום */}
        <div className="space-y-4">
          {/* בחירת ארנק */}
          {!walletConnected ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">בחר ארנק דיגיטלי</h4>
              <div className="grid grid-cols-1 gap-2">
                {walletOptions.map((wallet) => (
                  <Button
                    key={wallet.id}
                    variant="outline"
                    onClick={() => connectToWallet(wallet.id)}
                    className="flex items-center justify-between p-4 h-auto text-right"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{wallet.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{wallet.name}</div>
                        <div className="text-xs text-muted-foreground">{wallet.description}</div>
                      </div>
                    </div>
                    <Wallet className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                ארנק מחובר ({walletOptions.find(w => w.id === selectedWallet)?.name})
              </div>
              <div className="text-xs text-muted-foreground break-all">
                {walletAddress}
              </div>
              <Button 
                onClick={() => confirmPayment()}
                className="w-full"
                disabled={paymentStatus === 'pending'}
              >
                בצע תשלום מהארנק
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">או</div>

          {/* תשלום ידני */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium">תשלום ידני</h5>
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">כתובת לתשלום:</div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background p-1 rounded flex-1 break-all">
                  {walletAddresses[selectedCrypto as keyof typeof walletAddresses]}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyAddress(walletAddresses[selectedCrypto as keyof typeof walletAddresses])}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={generatePaymentQR}
                className="flex-1 flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                QR לתשלום
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // בפרקטיקה - פתיחת אפליקציית ארנק
                  const address = walletAddresses[selectedCrypto as keyof typeof walletAddresses];
                  window.open(`https://blockchair.com/${selectedCrypto.toLowerCase()}/address/${address}`, '_blank');
                }}
                className="flex-1 flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                פתח ארנק
              </Button>
            </div>
          </div>
        </div>

        {/* אישור תשלום ידני */}
        <div className="space-y-3">
          <Input
            placeholder="הזן Hash של הטרנזקציה לאישור"
            className="text-xs"
          />
          <Button 
            variant="secondary" 
            onClick={() => confirmPayment()}
            className="w-full"
          >
            אשר תשלום ידני
          </Button>
        </div>

        {/* סטטוס תשלום */}
        {paymentStatus !== 'idle' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            {paymentStatus === 'completed' ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">תשלום הושלם בהצלחה</span>
              </>
            ) : paymentStatus === 'pending' ? (
              <>
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">מעבד תשלום...</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">התשלום נכשל</span>
              </>
            )}
          </div>
        )}

        {/* הערות בטיחות */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <div className="font-medium mb-1">הערות חשובות:</div>
          <ul className="space-y-1">
            <li>• ודא שהכתובת נכונה לפני העברת כספים</li>
            <li>• תשלומי קריפטו אינם הפיכים</li>
            <li>• שמור את Hash הטרנזקציה לצורך מעקב</li>
            <li>• זמן אישור תלוי ברשת הבלוקצ'יין</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};