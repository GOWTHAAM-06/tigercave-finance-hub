import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Basic",
    price: "₹0",
    period: "/month",
    description: "Perfect for beginners",
    features: [
      "Zero brokerage on equity delivery",
      "₹20 per order for intraday",
      "Basic charting tools",
      "Email support",
      "Mobile app access",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "₹299",
    period: "/month",
    description: "For active traders",
    features: [
      "Zero brokerage on all trades",
      "Advanced charting tools",
      "Priority support",
      "API access",
      "Real-time market data",
      "Research reports",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "₹999",
    period: "/month",
    description: "For professional traders",
    features: [
      "Everything in Pro",
      "Dedicated relationship manager",
      "Algo trading support",
      "Margin funding at lower rates",
      "Premium research & tips",
      "Early access to new features",
    ],
    popular: false,
  },
];

const Pricing = () => {
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

      {/* Pricing Content */}
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="text-primary">Transparent</span> Pricing
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the plan that fits your trading style. No hidden charges, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border ${
                  plan.popular
                    ? "border-primary bg-primary/5 shadow-glow"
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/open-account">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "hero" : "outline"}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Brokerage Charges */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">
              Brokerage <span className="text-primary">Charges</span>
            </h2>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-semibold">Segment</th>
                    <th className="text-left p-4 font-semibold">Brokerage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="p-4">Equity Delivery</td>
                    <td className="p-4 text-primary font-semibold">FREE</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-4">Equity Intraday</td>
                    <td className="p-4">₹20 per order or 0.03%</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-4">Futures & Options</td>
                    <td className="p-4">₹20 per order</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-4">Currency & Commodity</td>
                    <td className="p-4">₹20 per order</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
