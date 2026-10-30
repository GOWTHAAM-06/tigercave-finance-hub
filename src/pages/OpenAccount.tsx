import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Shield, Zap, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OpenAccount = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    pan: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to create your account. Please try again.");
      }

      toast({ title: "Account created", description: "Your registration was successful." });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Unable to connect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: Shield, text: "SEBI Registered & Compliant" },
    { icon: Zap, text: "Account opened in 10 minutes" },
    { icon: Award, text: "Zero account opening charges" },
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
            <span className="text-muted-foreground text-sm">Already have an account?</span>
            <Link to="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Open Your <span className="text-primary">Free</span> Account
              </h1>
              <p className="text-muted-foreground text-lg">
                Start investing in stocks, mutual funds, and more. It only takes 10 minutes!
              </p>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {benefits.map((benefit) => (
                <div
                  key={benefit.text}
                  className="flex items-center gap-3 bg-card border border-border rounded-full px-6 py-3"
                >
                  <benefit.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center gap-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= s
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`w-16 h-1 mx-2 ${
                          step > s ? "bg-primary" : "bg-secondary"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="max-w-md mx-auto">
              <div className="bg-card border border-border rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {step === 1 && (
                    <>
                      <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name (as per PAN)</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange}
                          className="h-12 bg-secondary border-border"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          className="h-12 bg-secondary border-border"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={handleChange}
                          className="h-12 bg-secondary border-border"
                          required
                        />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <h2 className="text-xl font-semibold mb-4">Contact & Verification</h2>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Mobile Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="Enter your mobile number"
                          value={formData.phone}
                          onChange={handleChange}
                          className="h-12 bg-secondary border-border"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pan">PAN Number</Label>
                        <Input
                          id="pan"
                          name="pan"
                          placeholder="Enter your PAN number"
                          value={formData.pan}
                          onChange={handleChange}
                          className="h-12 bg-secondary border-border"
                          required
                        />
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-primary" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-4">Almost Done!</h2>
                      <p className="text-muted-foreground mb-6">
                        We've sent an OTP to your mobile number. Complete the verification to activate your account.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          placeholder="Enter 6-digit OTP"
                          className="h-12 bg-secondary border-border text-center text-xl tracking-widest"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : step === 3 ? "Verify & Complete" : "Continue"}
                  </Button>

                  {step > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setStep(step - 1)}
                    >
                      Go Back
                    </Button>
                  )}
                </form>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                By signing up, you agree to our{" "}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OpenAccount;
