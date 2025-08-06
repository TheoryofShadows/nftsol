import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, DollarSign, Shield, Zap, Users, Star, X } from "lucide-react";

export default function QuickOnboarding() {
  const [isOpen, setIsOpen] = useState(false);

  const highlights = [
    {
      icon: <DollarSign className="w-5 h-5 text-green-500" />,
      title: "95.5% Seller Rate",
      description: "Industry's highest payout rate",
      detail: "Only 2% platform + 2.5% royalty = 95.5% to you"
    },
    {
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      title: "CLOUT Rewards",
      description: "Earn tokens for every action",
      detail: "50 CLOUT for listings, 100 CLOUT for sales"
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      title: "100% Transparent",
      description: "No hidden fees or algorithms",
      detail: "Everything is open and clearly explained"
    },
    {
      icon: <Users className="w-5 h-5 text-orange-500" />,
      title: "Real Solana Data",
      description: "Authentic NFT collections",
      detail: "Mad Lads, DeGods, SMB - all real market data"
    }
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 border-0 text-white">
            <Info className="w-4 h-4 mr-1" />
            Guide
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Welcome to NFTSol - The Transparent NFT Marketplace
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              NFTSol puts creators first with industry-leading rates and complete transparency.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highlights.map((item, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {item.icon}
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-400 mb-1">{item.description}</p>
                        <p className="text-xs text-gray-500">{item.detail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-900/50 to-green-900/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Why Choose NFTSol?</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Highest seller retention rate (95.5%) in the industry</li>
                <li>• Real market data from authentic Solana collections</li>
                <li>• CLOUT token rewards for platform participation</li>
                <li>• AI-powered personalized NFT recommendations</li>
                <li>• Complete transparency - no hidden fees or algorithms</li>
              </ul>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Badge variant="secondary" className="bg-green-600 text-white">
                33M+ NFTs • 3B+ SOL Volume • 178K Users
              </Badge>
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700"
              >
                Start Exploring
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating info button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-12 h-12 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 shadow-xl border-2 border-white/20"
            size="sm"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      )}
    </>
  );
}