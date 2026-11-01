import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Activity,
  BadgeCheck,
  Building2,
  ChartCandlestick,
  Check,
  Clock3,
  Coins,
  HeartPulse,
  Landmark,
  LockKeyhole,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MarketQuote = {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  percentageChange: number;
};

type MarketQuoteResponse = {
  success: boolean;
  quotes: MarketQuote[];
};

type WealthPoint = {
  year: number;
  invested: number;
  wealth: number;
};

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const products = [
  {
    id: "equity",
    label: "Stocks",
    icon: TrendingUp,
    number: "01 / EQUITY",
    title: "Stocks & equity",
    description: "Move from market discovery to execution with live NSE and BSE quotes, charting, and a clear view of every position.",
    features: ["Live market quotes and advanced charts", "Zero brokerage on equity delivery", "Market and limit order controls"],
    metric: "₹0",
    metricLabel: "delivery brokerage",
    action: "Open trading terminal",
    href: "/trading-dashboard",
  },
  {
    id: "funds",
    label: "Mutual funds",
    icon: PiggyBank,
    number: "02 / FUNDS",
    title: "Mutual funds",
    description: "Build a habit with flexible SIPs, direct plans, and portfolio information designed to make long-term choices clearer.",
    features: ["Direct mutual fund plans", "Start a SIP from ₹500 per month", "Track invested amount and estimated growth"],
    metric: "₹500",
    metricLabel: "monthly SIP entry",
    action: "Start investing",
    href: "/open-account",
  },
  {
    id: "fo",
    label: "F&O",
    icon: ChartCandlestick,
    number: "03 / DERIVATIVES",
    title: "F&O trading",
    description: "Purpose-built tools for futures and options, with margin visibility, live quotes, and risk information close to every trade.",
    features: ["Futures and options market access", "Low-margin opportunities with clear requirements", "Advanced charts and position history"],
    metric: "Live",
    metricLabel: "market monitoring",
    action: "Explore trading",
    href: "/trading-dashboard",
  },
  {
    id: "ipo",
    label: "IPOs",
    icon: Landmark,
    number: "04 / PRIMARY",
    title: "IPOs",
    description: "Follow open and upcoming public issues, review offer details, and manage applications through a UPI mandate workflow.",
    features: ["Live and upcoming issue tracking", "UPI mandate application flow", "Application status in one place"],
    metric: "UPI",
    metricLabel: "mandate-enabled applications",
    action: "Open an account",
    href: "/open-account",
  },
  {
    id: "gold",
    label: "Digi Gold",
    icon: Coins,
    number: "05 / PRECIOUS METALS",
    title: "Digital gold",
    description: "Buy 24K digital gold in rupee-sized amounts, with holdings backed by physical gold in secure vaults.",
    features: ["24K gold pricing", "Buy or sell in small increments", "Secure vault custody"],
    metric: "24K",
    metricLabel: "digital gold",
    action: "Explore digital gold",
    href: "/digital-gold",
  },
  {
    id: "insurance",
    label: "Insurance",
    icon: HeartPulse,
    number: "06 / PROTECTION",
    title: "Insurance",
    description: "Compare life and health cover with policy details presented in plain language, alongside your broader financial picture.",
    features: ["Life and health policy options", "Compare cover and policy terms", "Digital policy documentation"],
    metric: "Life +",
    metricLabel: "health protection",
    action: "Explore cover",
    href: "/open-account",
  },
];

const estimateSip = (monthlyAmount: number, annualReturn: number, years: number) => {
  const months = years * 12;
  const monthlyRate = annualReturn / 100 / 12;
  if (monthlyRate === 0) return monthlyAmount * months;
  return monthlyAmount * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
};

const WealthTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as WealthPoint | undefined;
  if (!point) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-xl">
      <p className="mb-2 text-xs text-muted-foreground">Year {label}</p>
      <div className="space-y-1 text-xs">
        <p className="flex justify-between gap-5"><span className="text-muted-foreground">Invested</span><span>{rupees.format(point.invested)}</span></p>
        <p className="flex justify-between gap-5"><span className="text-muted-foreground">Projected value</span><span className="font-semibold text-primary">{rupees.format(point.wealth)}</span></p>
      </div>
    </div>
  );
};

const Index = () => {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [quoteError, setQuoteError] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [investmentYears, setInvestmentYears] = useState(15);

  useEffect(() => {
    let active = true;
    let loading = false;

    const fetchQuotes = async () => {
      if (loading) return;
      loading = true;
      try {
        const response = await fetch("http://localhost:5000/api/quotes");
        const result: MarketQuoteResponse = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.quotes)) {
          throw new Error("Market quote request failed");
        }
        if (active) {
          setQuotes(result.quotes);
          setQuoteError(false);
        }
      } catch {
        if (active) setQuoteError(true);
      } finally {
        loading = false;
      }
    };

    void fetchQuotes();
    const intervalId = window.setInterval(() => void fetchQuotes(), 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const tickerItems = quotes.length ? [...quotes, ...quotes] : [];
  const investedAmount = monthlyAmount * investmentYears * 12;
  const projectedWealth = estimateSip(monthlyAmount, expectedReturn, investmentYears);
  const projectedGain = Math.max(0, projectedWealth - investedAmount);
  const wealthCurve: WealthPoint[] = Array.from({ length: investmentYears + 1 }, (_, year) => ({
    year,
    invested: monthlyAmount * year * 12,
    wealth: estimateSip(monthlyAmount, expectedReturn, year),
  }));

  const marketQuote = (symbol: string) => quotes.find((quote) => quote.symbol === symbol);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/70 bg-black/35">
        <div className="mx-auto flex h-10 max-w-[1600px] items-center px-4 sm:px-6 lg:px-8">
          <div className="z-10 flex h-full shrink-0 items-center gap-2 border-r border-border/70 bg-background pr-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${quoteError ? "bg-amber-400" : quotes.length ? "animate-pulse bg-emerald-400" : "bg-muted-foreground"}`} />
            {quoteError ? "Feed delayed" : quotes.length ? "Market pulse" : "Connecting"}
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="ticker-track flex w-max items-center">
              {tickerItems.length ? tickerItems.map((quote, index) => {
                const positive = quote.percentageChange >= 0;
                const MoveIcon = positive ? ArrowUpRight : ArrowDownRight;
                return (
                  <div key={`${quote.symbol}-${index}`} className="flex h-10 min-w-[190px] items-center gap-2 border-r border-border/70 px-4">
                    <span className="whitespace-nowrap text-[10px] font-semibold text-foreground">{quote.symbol}</span>
                    <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">{rupees.format(quote.currentPrice)}</span>
                    <span className={`flex items-center gap-0.5 whitespace-nowrap text-[10px] font-semibold tabular-nums ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                      <MoveIcon className="h-3 w-3" />{Math.abs(quote.percentageChange).toFixed(2)}%
                    </span>
                  </div>
                );
              }) : (
                <span className="px-4 text-[11px] text-muted-foreground">{quoteError ? "Live quotes are temporarily unavailable" : "Loading NSE and BSE quotes..."}</span>
              )}
            </div>
          </div>
          <span className="hidden shrink-0 pl-4 text-[10px] text-muted-foreground lg:block">Refreshes every 5 sec</span>
        </div>
      </div>

      <Navbar />

      <main>
        <section id="markets" className="relative scroll-mt-24 overflow-hidden border-b border-border/70">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(hsl(222 30% 18% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(222 30% 18% / 0.3) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="relative mx-auto grid max-w-[1600px] gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Markets · Investing · Protection
              </div>
              <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
                Your capital,<br />
                <span className="text-gradient">clearly in motion.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                One connected workspace for Indian markets, long-term investing, and the decisions that shape your financial future.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="hero" size="lg" className="h-12 px-6">
                  <Link to="/open-account">Open your account <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6">
                  <Link to="/trading-dashboard">Explore trading</Link>
                </Button>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" />Transparent pricing</span>
                <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-primary" />Encrypted account data</span>
                <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />NSE · BSE access</span>
              </div>
            </div>

            <div className="relative">
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Market overview</p>
                  <p className="mt-1 text-sm text-foreground">Indian benchmarks</p>
                </div>
                <Link to="/trading-dashboard" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                  Trading terminal <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {["^NSEI", "^BSESN"].map((symbol) => {
                  const quote = marketQuote(symbol);
                  const positive = (quote?.percentageChange ?? 0) >= 0;
                  const MoveIcon = positive ? ArrowUpRight : ArrowDownRight;
                  return (
                    <Card key={symbol} className="overflow-hidden rounded-lg border-border/80 bg-card/80 p-5 shadow-card backdrop-blur-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{quote?.name ?? (symbol === "^NSEI" ? "Nifty 50" : "Sensex")}</p>
                          <p className="mt-3 font-display text-2xl font-semibold tabular-nums">{quote ? rupees.format(quote.currentPrice) : "—"}</p>
                        </div>
                        <span className="rounded-md border border-border/80 bg-background/70 p-2 text-primary"><Activity className="h-4 w-4" /></span>
                      </div>
                      <div className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                        {quote ? <><MoveIcon className="h-3.5 w-3.5" />{Math.abs(quote.percentageChange).toFixed(2)}% today</> : "Waiting for quote"}
                      </div>
                    </Card>
                  );
                })}
              </div>
              <Card className="mt-3 rounded-lg border-primary/20 bg-primary/[0.04] px-5 py-4 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary"><Clock3 className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Live market feed</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Indicative quotes · refreshed every five seconds</p>
                    </div>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">{quotes.length} instruments</span>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-b border-border/70 bg-black/10" aria-label="Market snapshot">
          <div className="mx-auto grid max-w-[1600px] grid-cols-2 divide-x divide-y divide-border/70 px-4 sm:grid-cols-4 sm:divide-y-0 sm:px-6 lg:px-8">
            {[
              { label: "Nifty 50", quote: marketQuote("^NSEI") },
              { label: "Sensex", quote: marketQuote("^BSESN") },
              { label: "Reliance", quote: marketQuote("RELIANCE.NS") },
              { label: "Infosys", quote: marketQuote("INFY.NS") },
            ].map(({ label, quote }) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-4 first:pl-0 sm:px-6 sm:py-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">{quote ? rupees.format(quote.currentPrice) : "—"}</p>
                </div>
                {quote && <span className={`text-xs font-medium tabular-nums ${quote.percentageChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{quote.percentageChange >= 0 ? "+" : ""}{quote.percentageChange.toFixed(2)}%</span>}
              </div>
            ))}
          </div>
        </section>

        <section id="products" className="scroll-mt-24 border-b border-border/70 py-16 sm:py-20">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">One platform · six product lines</p>
                <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">A broader view of your money.</h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">Choose a market or wealth product to explore its tools, pricing, and next steps.</p>
            </div>

            <Tabs defaultValue="equity" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-lg border border-border bg-card/70 p-1.5 md:grid-cols-6">
                {products.map((product) => (
                  <TabsTrigger key={product.id} value={product.id} className="min-h-11 gap-2 rounded-md px-2 text-xs data-[state=active]:bg-secondary data-[state=active]:text-foreground sm:text-sm">
                    <product.icon className="h-4 w-4 shrink-0 text-primary" />
                    {product.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {products.map((product) => (
                <TabsContent key={product.id} value={product.id} className="mt-4 focus-visible:outline-none">
                  <Card className="overflow-hidden rounded-lg border-border/80 bg-card/70 shadow-card backdrop-blur-xl">
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="p-6 sm:p-9 lg:p-11">
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                          <product.icon className="h-4 w-4" />{product.number}
                        </div>
                        <h3 className="mt-5 font-display text-2xl font-semibold sm:text-3xl">{product.title}</h3>
                        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{product.description}</p>
                        <Button asChild variant="hero" className="mt-7 h-11 px-5">
                          <Link to={product.href}>{product.action}<ArrowRight className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                      <div className="flex flex-col justify-between border-t border-border/70 bg-black/15 p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-11">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">At a glance</p>
                          <ul className="mt-5 space-y-4">
                            {product.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-8 border-t border-border/70 pt-5">
                          <p className="font-display text-3xl font-semibold text-primary">{product.metric}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{product.metricLabel}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        <section id="tools" className="scroll-mt-24 border-b border-border/70 py-16 sm:py-20">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Plan with a range, not a promise</p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">See what a steady SIP could become.</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">Adjust the assumptions to explore a hypothetical monthly investment. Returns are illustrative, not guaranteed.</p>
            </div>

            <Card className="overflow-hidden rounded-lg border-border/80 bg-card/70 shadow-card backdrop-blur-xl">
              <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-8 p-6 sm:p-8 lg:p-10">
                  <div>
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <label htmlFor="sip-monthly" className="text-sm font-medium">Monthly investment</label>
                      <span className="font-display text-xl font-semibold tabular-nums text-primary">{rupees.format(monthlyAmount)}</span>
                    </div>
                    <Slider id="sip-monthly" aria-label="Monthly investment amount" min={500} max={100000} step={500} value={[monthlyAmount]} onValueChange={(value) => setMonthlyAmount(value[0])} />
                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>₹500</span><span>₹1,00,000</span></div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <label htmlFor="sip-return" className="text-sm font-medium">Expected annual return</label>
                      <span className="font-display text-xl font-semibold tabular-nums text-primary">{expectedReturn.toFixed(1)}%</span>
                    </div>
                    <Slider id="sip-return" aria-label="Expected annual return" min={1} max={30} step={0.5} value={[expectedReturn]} onValueChange={(value) => setExpectedReturn(value[0])} />
                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>1%</span><span>30%</span></div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <label htmlFor="sip-duration" className="text-sm font-medium">Investment period</label>
                      <span className="font-display text-xl font-semibold tabular-nums text-primary">{investmentYears} years</span>
                    </div>
                    <Slider id="sip-duration" aria-label="Investment period in years" min={1} max={40} step={1} value={[investmentYears]} onValueChange={(value) => setInvestmentYears(value[0])} />
                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>1 year</span><span>40 years</span></div>
                  </div>
                </div>

                <div className="border-t border-border/70 bg-black/15 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Estimated value</p>
                      <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-primary sm:text-4xl">{rupees.format(projectedWealth)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:pt-1">
                      <div><p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Invested</p><p className="mt-2 text-sm font-semibold tabular-nums">{rupees.format(investedAmount)}</p></div>
                      <div><p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Growth</p><p className="mt-2 text-sm font-semibold tabular-nums text-emerald-400">{rupees.format(projectedGain)}</p></div>
                    </div>
                  </div>
                  <div className="mt-7 h-[250px] sm:h-[290px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={wealthCurve} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="wealthArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="hsl(222, 30%, 18%)" strokeDasharray="3 5" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value}y`} minTickGap={24} />
                        <YAxis orientation="right" tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => compactRupees.format(value)} width={68} />
                        <Tooltip content={<WealthTooltip />} />
                        <Area type="monotone" dataKey="wealth" stroke="hsl(32, 95%, 55%)" strokeWidth={2} fill="url(#wealthArea)" isAnimationActive={false} />
                        <Line type="monotone" dataKey="invested" stroke="#94a3b8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-5 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><span className="h-1.5 w-4 rounded-full bg-primary" />Projected value</span>
                    <span className="inline-flex items-center gap-2"><span className="h-1.5 w-4 rounded-full bg-slate-400" />Amount invested</span>
                    <span>Illustration only; actual returns vary.</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="trust" className="scroll-mt-24 border-b border-border/70 py-14 sm:py-16">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Built around informed decisions</p>
                <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">A financial workspace with clarity at every step.</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-3 lg:w-[58%]">
                {[
                  { icon: ShieldCheck, title: "Risk, made visible", copy: "See order value, margin, and position information before you act." },
                  { icon: LockKeyhole, title: "Privacy by design", copy: "Account and activity data are handled through protected workflows." },
                  { icon: BadgeCheck, title: "Transparent choices", copy: "Understand pricing, product terms, and illustrative assumptions." },
                ].map((item) => (
                  <div key={item.title} className="border-l border-primary/40 pl-4">
                    <item.icon className="h-4 w-4 text-primary" />
                    <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-border/70 pt-7">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <span>NSE &amp; BSE market access</span><span>UPI-enabled IPO applications</span><span>24K digital gold</span><span>Life &amp; health cover</span>
              </div>
              <Button asChild variant="outline" size="sm"><Link to="/pricing">View pricing <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-base font-semibold text-foreground">Tiger<span className="text-primary">cave</span></Link>
        <p>Investing involves market risk. Projections are illustrative and not guaranteed. Verify live prices before trading.</p>
        <div className="flex gap-4"><Link to="/login" className="hover:text-foreground">Login</Link><Link to="/open-account" className="hover:text-foreground">Open account</Link></div>
      </footer>
    </div>
  );
};

export default Index;
