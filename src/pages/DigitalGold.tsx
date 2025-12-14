import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, TrendingUp, Wallet, Clock, Award, Lock } from "lucide-react";

const DigitalGold = () => {
  const [amount, setAmount] = useState("");
  const [grams, setGrams] = useState("");
  const goldPrice = 6450; // Price per gram in INR

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value) {
      setGrams((parseFloat(value) / goldPrice).toFixed(4));
    } else {
      setGrams("");
    }
  };

  const handleGramsChange = (value: string) => {
    setGrams(value);
    if (value) {
      setAmount((parseFloat(value) * goldPrice).toFixed(2));
    } else {
      setAmount("");
    }
  };

  const features = [
    {
      icon: Shield,
      title: "100% Secure",
      description: "Your gold is stored in insured vaults with 24/7 security",
    },
    {
      icon: TrendingUp,
      title: "Real-time Pricing",
      description: "Buy and sell at live market prices with zero spread",
    },
    {
      icon: Wallet,
      title: "Start with ₹1",
      description: "No minimum investment, buy gold for as low as ₹1",
    },
    {
      icon: Clock,
      title: "24/7 Trading",
      description: "Buy or sell gold anytime, any day of the year",
    },
    {
      icon: Award,
      title: "99.9% Pure Gold",
      description: "Get physical delivery of BIS hallmarked 24K gold",
    },
    {
      icon: Lock,
      title: "Fully Insured",
      description: "Your gold is covered against theft and damage",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground">
              T
            </div>
            <span className="text-xl font-bold">
              Tiger<span className="text-primary">cave</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="nav">Login</Button>
            </Link>
            <Link to="/open-account">
              <Button variant="hero" size="sm">Open Account</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-primary">Live Gold Price: ₹{goldPrice}/gram</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Invest in <span className="text-primary">Digital Gold</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                Buy 24K pure gold digitally. Safe, secure, and backed by physical gold stored in insured vaults.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/open-account">
                  <Button variant="hero" size="lg">Start Investing</Button>
                </Link>
                <Button variant="outline" size="lg">Learn More</Button>
              </div>
            </div>

            {/* Buy Gold Card */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Buy Digital Gold</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Amount in Rupees</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="h-14 bg-secondary border-border pl-8 text-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-muted-foreground">
                    =
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Gold in Grams</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Enter grams"
                      value={grams}
                      onChange={(e) => handleGramsChange(e.target.value)}
                      className="h-14 bg-secondary border-border text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">gm</span>
                  </div>
                </div>

                <div className="bg-secondary rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Live Gold Rate</span>
                    <span className="font-semibold">₹{goldPrice}/gram</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">GST (3%)</span>
                    <span className="font-semibold">₹{amount ? (parseFloat(amount) * 0.03).toFixed(2) : "0"}</span>
                  </div>
                  <div className="border-t border-border my-3" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="font-bold text-primary">
                      ₹{amount ? (parseFloat(amount) * 1.03).toFixed(2) : "0"}
                    </span>
                  </div>
                </div>

                <Link to="/open-account" className="block">
                  <Button variant="hero" size="lg" className="w-full">
                    Buy Gold Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Invest in <span className="text-primary">Digital Gold</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The smartest way to own gold without the hassle of storage or purity concerns
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Your Gold Investment Journey
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join over 1 million investors who trust Tigercave for their digital gold investments
            </p>
            <Link to="/open-account">
              <Button variant="hero" size="lg">
                Open Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DigitalGold;
