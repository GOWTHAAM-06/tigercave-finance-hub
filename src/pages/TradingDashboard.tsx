import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	type TooltipProps,
} from "recharts";
import {
	ArrowDownRight,
	ArrowUpRight,
	Bell,
	CandlestickChart,
	Check,
	ChevronDown,
	CircleHelp,
	Clock3,
	Layers3,
	Menu,
	Plus,
	Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Asset = {
	symbol: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
};

type Position = {
	id: string;
	symbol: string;
	quantity: number;
	averagePrice: number;
	lastPrice: number;
	realizedPnl: number;
};

type PortfolioOrder = {
	id: number;
	symbol: string;
	type: "BUY" | "SELL";
	orderType: "MARKET" | "LIMIT";
	quantity: number;
	price: number;
	timestamp: string;
};

type PortfolioResponse = {
	success: boolean;
	cashBalance: number;
	marginUsed: number;
	positions: Position[];
	orders: PortfolioOrder[];
};

const marketTape: Asset[] = [
	{ symbol: "NIFTY 50", name: "NSE", price: 24823.15, change: 142.8, changePercent: 0.58 },
	{ symbol: "SENSEX", name: "BSE", price: 81308.12, change: 318.45, changePercent: 0.39 },
	{ symbol: "DIGITAL GOLD", name: "24K · per gram", price: 7482.0, change: 23.1, changePercent: 0.31 },
	{ symbol: "GOLD ETF", name: "GOLDBEES", price: 72.14, change: -0.28, changePercent: -0.39 },
	{ symbol: "BTC / INR", name: "CRYPTO", price: 5825410.5, change: 71426.2, changePercent: 1.24 },
	{ symbol: "ETH / INR", name: "CRYPTO", price: 314208.25, change: -1964.5, changePercent: -0.62 },
];

const instruments: Asset[] = [
	{ symbol: "NIFTY 50", name: "NIFTY 50 · NSE", price: 24823.15, change: 142.8, changePercent: 0.58 },
	{ symbol: "RELIANCE", name: "RELIANCE · NSE", price: 1405.5, change: 12.35, changePercent: 0.89 },
	{ symbol: "TCS", name: "TCS · NSE", price: 3268.4, change: -18.6, changePercent: -0.57 },
	{ symbol: "BTC / INR", name: "BITCOIN · INR", price: 5825410.5, change: 71426.2, changePercent: 1.24 },
	{ symbol: "ETH / INR", name: "ETHEREUM · INR", price: 314208.25, change: -1964.5, changePercent: -0.62 },
	{ symbol: "DIGITAL GOLD", name: "DIGITAL GOLD · 24K/g", price: 7482.0, change: 23.1, changePercent: 0.31 },
];

const inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

const formatSignedCurrency = (value: number) =>
	`${value >= 0 ? "+" : "-"}${inr.format(Math.abs(value))}`;

const makeTrend = (price: number, changePercent: number, symbol: string) => {
	const seed = symbol.split("").reduce((total, character) => total + character.charCodeAt(0), 0);

	return Array.from({ length: 24 }, (_, index) => {
		const intraday = Math.sin(index * 0.58 + seed) * 0.0035;
		const swing = Math.cos(index * 0.23 + seed) * 0.0022;
		const sessionMove = ((index / 23) * changePercent) / 100;

		return {
			time: `${String(index).padStart(2, "0")}:00`,
			price: Number((price * (1 + intraday + swing + sessionMove)).toFixed(2)),
		};
	});
};

const MarketTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
	if (!active || !payload?.length || typeof payload[0]?.value !== "number") return null;

	return (
		<div className="rounded-md border border-border bg-popover px-3 py-2 shadow-xl">
			<p className="mb-1 text-xs text-muted-foreground">{label}</p>
			<p className="font-display text-sm font-semibold text-foreground">{inr.format(payload[0].value)}</p>
		</div>
	);
};

const TradingDashboard = () => {
	const [selectedSymbol, setSelectedSymbol] = useState(instruments[0].symbol);
	const [side, setSide] = useState<"buy" | "sell">("buy");
	const [orderType, setOrderType] = useState<"market" | "limit">("market");
	const [quantity, setQuantity] = useState("1");
	const [limitPrice, setLimitPrice] = useState("");
	const [userId] = useState(() => sessionStorage.getItem("userId"));
	const [cashBalance, setCashBalance] = useState<number | null>(null);
	const [marginUsed, setMarginUsed] = useState<number | null>(null);
	const [positions, setPositions] = useState<Position[]>([]);
	const [orders, setOrders] = useState<PortfolioOrder[]>([]);
	const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();
	const { toast } = useToast();

	useEffect(() => {
		if (!userId) {
			setIsLoadingPortfolio(false);
			toast({
				title: "Sign in required",
				description: "Log in to view your portfolio and place orders.",
				variant: "destructive",
			});
			navigate("/login");
			return;
		}

		let isCurrent = true;
		const loadPortfolio = async () => {
			try {
				const response = await fetch(`http://localhost:5000/api/portfolio/${encodeURIComponent(userId)}`);
				const result: PortfolioResponse & { error?: string } = await response.json();
				if (!response.ok || !result.success) {
					throw new Error(result.error || "Unable to load your portfolio.");
				}

				if (isCurrent) {
					setCashBalance(Number(result.cashBalance));
					setMarginUsed(Number(result.marginUsed));
					setPositions(result.positions);
					setOrders(result.orders);
				}
			} catch (error) {
				if (isCurrent) {
					toast({
						title: "Portfolio unavailable",
						description: error instanceof Error ? error.message : "Unable to connect to the trading server.",
						variant: "destructive",
					});
				}
			} finally {
				if (isCurrent) setIsLoadingPortfolio(false);
			}
		};

		void loadPortfolio();
		return () => {
			isCurrent = false;
		};
	}, [navigate, toast, userId]);

	const selectedAsset = instruments.find((asset) => asset.symbol === selectedSymbol) ?? instruments[0];
	const chartData = makeTrend(selectedAsset.price, selectedAsset.changePercent, selectedAsset.symbol);
	const parsedQuantity = Number(quantity);
	const validQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0;
	const parsedLimitPrice = Number(limitPrice);
	const executionPrice = orderType === "limit" && parsedLimitPrice > 0 ? parsedLimitPrice : selectedAsset.price;
	const marginRequired = validQuantity * executionPrice;
	const totalUnrealizedPnl = positions.reduce(
		(total, position) => total + (position.lastPrice - position.averagePrice) * position.quantity,
		0,
	);

	const handlePlaceOrder = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!userId) {
			navigate("/login");
			return;
		}
		if (!validQuantity) {
			toast({
				title: "Enter a valid quantity",
				description: "Quantity must be greater than zero.",
				variant: "destructive",
			});
			return;
		}
		if (orderType === "limit" && (!Number.isFinite(parsedLimitPrice) || parsedLimitPrice <= 0)) {
			toast({
				title: "Enter a valid limit price",
				description: "Limit price must be greater than zero.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch("http://localhost:5000/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: Number(userId),
					symbol: selectedAsset.symbol,
					type: side,
					orderType,
					quantity: validQuantity,
					price: executionPrice,
				}),
			});
			const result: PortfolioResponse & { error?: string } = await response.json();
			if (!response.ok || !result.success) {
				throw new Error(result.error || "Unable to execute order.");
			}

			setCashBalance(Number(result.cashBalance));
			setMarginUsed(Number(result.marginUsed));
			setPositions(result.positions);
			setOrders(result.orders);
			setQuantity("1");
			toast({
				title: `${side === "buy" ? "Buy" : "Sell"} order placed`,
				description: `${validQuantity} ${selectedAsset.symbol} at ${inr.format(executionPrice)}. Portfolio updated.`,
			});
		} catch (error) {
			toast({
				title: "Order failed",
				description: error instanceof Error ? error.message : "Unable to connect to the trading server.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const tapeItems = [...marketTape, ...marketTape];

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="border-b border-border bg-background/95">
				<div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
					<div className="flex min-w-0 items-center gap-8">
						<Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Tigercave home">
							<span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground">
								T
							</span>
							<span className="font-display text-lg font-bold tracking-normal">
								Tiger<span className="text-primary">cave</span>
							</span>
						</Link>
						<nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
							<a href="#market-chart" className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-foreground">
								Markets
							</a>
							<a href="#positions" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
								Portfolio
							</a>
							<Link to="/digital-gold" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
								Digital gold
							</Link>
						</nav>
					</div>
					<div className="flex items-center gap-2 sm:gap-4">
						<div className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground sm:flex">
							<span className="h-2 w-2 rounded-full bg-emerald-400" />
							Markets open
						</div>
						<Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications" title="Notifications">
							<Bell className="h-4 w-4" />
						</Button>
						<div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-xs font-semibold text-primary" aria-label="User account">
							AV
						</div>
						<Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" aria-label="Open menu" title="Open menu">
							<Menu className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</header>

			<div className="ticker-viewport overflow-hidden border-b border-border bg-card" aria-label="Live market prices">
				<div className="mx-auto flex max-w-[1600px] items-center">
					<div className="z-10 flex h-12 shrink-0 items-center gap-2 border-r border-border bg-card px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:px-6">
						<span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
						Live markets
					</div>
					<div className="min-w-0 overflow-hidden">
						<div className="ticker-track flex w-max items-center">
							{tapeItems.map((asset, index) => {
								const positive = asset.changePercent >= 0;
								const MoveIcon = positive ? ArrowUpRight : ArrowDownRight;

								return (
									<div key={`${asset.symbol}-${index}`} className="flex h-12 min-w-[205px] items-center gap-3 border-r border-border px-5">
										<div className="min-w-0">
											<p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{asset.symbol}</p>
											<p className="whitespace-nowrap text-xs font-semibold tabular-nums">{inr.format(asset.price)}</p>
										</div>
										<div className={`flex items-center gap-0.5 whitespace-nowrap text-xs font-medium tabular-nums ${positive ? "text-emerald-400" : "text-rose-400"}`}>
											<MoveIcon className="h-3.5 w-3.5" />
											{Math.abs(asset.changePercent).toFixed(2)}%
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			<main className="mx-auto max-w-[1600px] px-4 pb-10 pt-7 sm:px-6 lg:px-8">
				<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
					<div>
						<div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
							<span>Workspace</span>
							<span>/</span>
							<span className="text-foreground">Trading terminal</span>
						</div>
						<h1 className="font-display text-2xl font-semibold sm:text-3xl">Market overview</h1>
						<p className="mt-1 text-sm text-muted-foreground">Track markets and manage your positions.</p>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Clock3 className="h-4 w-4" />
						<span>Simulated prices · 24-hour view</span>
					</div>
				</div>

				<section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Account summary">
					<Card className="rounded-lg border-border bg-card p-4 shadow-none">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>Cash balance</span>
							<Wallet className="h-4 w-4" />
						</div>
						<p className="mt-2 font-display text-xl font-semibold tabular-nums">{cashBalance === null ? (isLoadingPortfolio ? "Loading..." : "—") : inr.format(cashBalance)}</p>
						<p className="mt-1 text-xs text-muted-foreground">{positions.length} active {positions.length === 1 ? "position" : "positions"}</p>
					</Card>
					<Card className="rounded-lg border-border bg-card p-4 shadow-none">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>Margin used</span>
							<Layers3 className="h-4 w-4" />
						</div>
						<p className="mt-2 font-display text-xl font-semibold tabular-nums">{marginUsed === null ? (isLoadingPortfolio ? "Loading..." : "—") : inr.format(marginUsed)}</p>
						<p className="mt-1 text-xs text-muted-foreground">Cost basis of open positions</p>
					</Card>
					<Card className="rounded-lg border-border bg-card p-4 shadow-none">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>Unrealized P&amp;L</span>
							{totalUnrealizedPnl >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-rose-400" />}
						</div>
						<p className={`mt-2 font-display text-xl font-semibold tabular-nums ${totalUnrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatSignedCurrency(totalUnrealizedPnl)}</p>
						<p className="mt-1 text-xs text-muted-foreground">Based on most recent trade prices</p>
					</Card>
				</section>

				<div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
					<Card id="market-chart" className="min-w-0 rounded-lg border-border bg-card shadow-none">
						<div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
							<div>
								<div className="mb-2 flex items-center gap-2">
									<CandlestickChart className="h-4 w-4 text-primary" />
									<span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Market chart</span>
								</div>
								<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
									<h2 className="font-display text-xl font-semibold">{selectedAsset.symbol}</h2>
									<span className="text-xs text-muted-foreground">{selectedAsset.name}</span>
								</div>
								<div className="mt-2 flex items-center gap-2">
									<span className="font-display text-2xl font-semibold tabular-nums">{inr.format(selectedAsset.price)}</span>
									<span className={`text-xs font-medium ${selectedAsset.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
										{selectedAsset.change >= 0 ? "+" : "-"}{inr.format(Math.abs(selectedAsset.change))} ({selectedAsset.changePercent >= 0 ? "+" : ""}{selectedAsset.changePercent.toFixed(2)}%)
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<span className="rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium">24H</span>
								<Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs">
									<Plus className="h-3.5 w-3.5" />
									Watchlist
								</Button>
							</div>
						</div>

						<div className="h-[290px] px-2 pb-2 pt-5 sm:h-[340px] sm:px-4">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
									<defs>
										<linearGradient id="marketArea" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0.28} />
											<stop offset="95%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid stroke="hsl(222, 30%, 18%)" strokeDasharray="3 5" vertical={false} />
									<XAxis
										dataKey="time"
										tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 10 }}
										axisLine={false}
										tickLine={false}
										interval={5}
										minTickGap={24}
									/>
									<YAxis
										orientation="right"
										tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 10 }}
										axisLine={false}
										tickLine={false}
										tickFormatter={(value: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)}
										domain={["dataMin - (dataMax - dataMin) * 0.18", "dataMax + (dataMax - dataMin) * 0.18"]}
										width={58}
									/>
									<Tooltip content={<MarketTooltip />} cursor={{ stroke: "hsl(32, 95%, 55%)", strokeDasharray: "4 4" }} />
									<Area
										type="monotone"
										dataKey="price"
										stroke="hsl(32, 95%, 55%)"
										strokeWidth={2}
										fill="url(#marketArea)"
										activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(32, 95%, 55%)" }}
										isAnimationActive={false}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>

						<div className="grid grid-cols-3 border-t border-border px-5 py-3 sm:px-6">
							<div>
								<p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">24H high</p>
								<p className="mt-1 text-sm font-medium tabular-nums">{inr.format(Math.max(...chartData.map((point) => point.price)))}</p>
							</div>
							<div>
								<p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">24H low</p>
								<p className="mt-1 text-sm font-medium tabular-nums">{inr.format(Math.min(...chartData.map((point) => point.price)))}</p>
							</div>
							<div className="text-right">
								<p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Market status</p>
								<p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Open</p>
							</div>
						</div>
					</Card>

					<Card className="rounded-lg border-border bg-card shadow-none">
						<div className="flex items-center justify-between border-b border-border px-5 py-4">
							<div>
								<h2 className="font-display text-base font-semibold">Order ticket</h2>
								<p className="mt-1 text-xs text-muted-foreground">Place a simulated order</p>
							</div>
							<button type="button" className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Order ticket help" title="Orders are simulated in this demo">
								<CircleHelp className="h-4 w-4" />
							</button>
						</div>
						<form onSubmit={handlePlaceOrder} className="space-y-5 p-5">
							<div className="grid grid-cols-2 gap-2 rounded-md bg-secondary p-1">
								<button
									type="button"
									onClick={() => setSide("buy")}
									aria-pressed={side === "buy"}
									className={`h-9 rounded text-sm font-semibold transition-colors ${side === "buy" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
								>
									Buy
								</button>
								<button
									type="button"
									onClick={() => setSide("sell")}
									aria-pressed={side === "sell"}
									className={`h-9 rounded text-sm font-semibold transition-colors ${side === "sell" ? "bg-rose-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
								>
									Sell
								</button>
							</div>

							<div className="space-y-2">
								<Label htmlFor="instrument" className="text-xs text-muted-foreground">Instrument</Label>
								<Select value={selectedSymbol} onValueChange={(value) => { setSelectedSymbol(value); setLimitPrice(""); }}>
									<SelectTrigger id="instrument" className="h-10 bg-background text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{instruments.map((asset) => (
											<SelectItem key={asset.symbol} value={asset.symbol}>{asset.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">LTP <span className="font-medium text-foreground">{inr.format(selectedAsset.price)}</span></p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="order-type" className="text-xs text-muted-foreground">Order type</Label>
								<Select value={orderType} onValueChange={(value: "market" | "limit") => setOrderType(value)}>
									<SelectTrigger id="order-type" className="h-10 bg-background text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="market">Market</SelectItem>
										<SelectItem value="limit">Limit</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label htmlFor="quantity" className="text-xs text-muted-foreground">Quantity</Label>
									<Input
										id="quantity"
										type="number"
										min="0.000001"
										step="any"
										value={quantity}
										onChange={(event) => setQuantity(event.target.value)}
										className="h-10 bg-background tabular-nums"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="price" className="text-xs text-muted-foreground">{orderType === "limit" ? "Limit price" : "Market price"}</Label>
									<Input
										id="price"
										type="number"
										min="0.01"
										step="any"
										value={orderType === "limit" ? limitPrice : selectedAsset.price}
										onChange={(event) => setLimitPrice(event.target.value)}
										disabled={orderType === "market"}
										className="h-10 bg-background tabular-nums disabled:opacity-70"
										required
									/>
								</div>
							</div>

							<div className="space-y-3 border-t border-border pt-4">
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>Price per unit</span>
									<span className="tabular-nums text-foreground">{inr.format(executionPrice)}</span>
								</div>
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>Quantity</span>
									<span className="tabular-nums text-foreground">{validQuantity || "—"}</span>
								</div>
								<div className="flex items-center justify-between border-t border-border pt-3">
									<span className="text-sm font-semibold">{side === "buy" ? "Margin required" : "Sale proceeds"}</span>
									<span className="font-display text-base font-semibold tabular-nums">{inr.format(marginRequired)}</span>
								</div>
								<p className="text-[10px] leading-relaxed text-muted-foreground">Estimated notional value; buy value is deducted from cash and sell proceeds are credited.</p>
							</div>

							<Button type="submit" variant="hero" disabled={isSubmitting || isLoadingPortfolio || cashBalance === null} className={`h-11 w-full ${side === "sell" ? "bg-rose-500 text-white shadow-none hover:bg-rose-600 hover:shadow-none" : ""}`}>
								{isSubmitting ? "Submitting order..." : side === "buy" ? "Place buy order" : "Place sell order"}
							</Button>
						</form>
					</Card>
				</div>

				<Card id="positions" className="mt-5 overflow-hidden rounded-lg border-border bg-card shadow-none">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
						<div>
							<h2 className="font-display text-base font-semibold">Active positions</h2>
							<p className="mt-1 text-xs text-muted-foreground">{positions.length} open {positions.length === 1 ? "position" : "positions"}</p>
						</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span>Unrealized P&amp;L</span>
							<span className={`font-semibold tabular-nums ${totalUnrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatSignedCurrency(totalUnrealizedPnl)}</span>
							<ChevronDown className="h-4 w-4" />
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[840px] border-collapse text-left">
							<thead>
								<tr className="border-b border-border text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
									<th className="px-5 py-3 font-medium sm:px-6">Symbol</th>
									<th className="px-4 py-3 text-right font-medium">Qty</th>
									<th className="px-4 py-3 text-right font-medium">Avg. price</th>
									<th className="px-4 py-3 text-right font-medium">LTP</th>
									<th className="px-4 py-3 text-right font-medium">Realized P&amp;L</th>
									<th className="px-5 py-3 text-right font-medium sm:px-6">Unrealized P&amp;L</th>
								</tr>
							</thead>
								<tbody>
									{positions.length === 0 ? (
										<tr>
											<td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
												{isLoadingPortfolio ? "Loading positions..." : "No active positions yet."}
											</td>
										</tr>
									) : positions.map((position) => {
									const unrealizedPnl = (position.lastPrice - position.averagePrice) * position.quantity;
									const positionAsset = instruments.find((asset) => asset.symbol === position.symbol);
									const isCrypto = position.symbol.includes("INR");

									return (
										<tr key={position.id} className="border-b border-border/70 last:border-0 transition-colors hover:bg-secondary/40">
											<td className="px-5 py-4 sm:px-6">
												<div className="flex items-center gap-3">
													<span className={`flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-bold ${isCrypto ? "bg-sky-500/10 text-sky-400" : "bg-primary/10 text-primary"}`}>
														{isCrypto ? "₿" : position.symbol === "DIGITAL GOLD" ? "Au" : position.symbol.slice(0, 1)}
													</span>
													<div>
														<p className="text-sm font-semibold">{position.symbol}</p>
														<p className="text-[10px] text-muted-foreground">{positionAsset?.name ?? "Demo position"}</p>
													</div>
												</div>
											</td>
											<td className="px-4 py-4 text-right text-sm tabular-nums">{Math.abs(position.quantity)}</td>
											<td className="px-4 py-4 text-right text-sm tabular-nums">{inr.format(position.averagePrice)}</td>
											<td className="px-4 py-4 text-right text-sm tabular-nums">{inr.format(position.lastPrice)}</td>
											<td className={`px-4 py-4 text-right text-sm tabular-nums ${position.realizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatSignedCurrency(position.realizedPnl)}</td>
											<td className={`px-5 py-4 text-right text-sm font-medium tabular-nums sm:px-6 ${unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatSignedCurrency(unrealizedPnl)}</td>
										</tr>
									);
									})}
							</tbody>
						</table>
					</div>
					<div className="flex items-center gap-2 border-t border-border px-5 py-3 text-[10px] text-muted-foreground sm:px-6">
						<Check className="h-3.5 w-3.5 text-emerald-400" />
						Wallet and order history are stored by the trading server; market quotes remain simulated.
					</div>
				</Card>

				<Card className="mt-5 overflow-hidden rounded-lg border-border bg-card shadow-none">
					<div className="border-b border-border px-5 py-4 sm:px-6">
						<h2 className="font-display text-base font-semibold">Order history</h2>
						<p className="mt-1 text-xs text-muted-foreground">Most recent executed trades</p>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[700px] border-collapse text-left">
							<thead>
								<tr className="border-b border-border text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
									<th className="px-5 py-3 font-medium sm:px-6">Time</th>
									<th className="px-4 py-3 font-medium">Symbol</th>
									<th className="px-4 py-3 font-medium">Side</th>
									<th className="px-4 py-3 text-right font-medium">Qty</th>
									<th className="px-5 py-3 text-right font-medium sm:px-6">Execution price</th>
								</tr>
							</thead>
							<tbody>
								{orders.length === 0 ? (
									<tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">{isLoadingPortfolio ? "Loading order history..." : "No trades have been placed yet."}</td></tr>
								) : orders.map((order) => (
									<tr key={order.id} className="border-b border-border/70 last:border-0">
										<td className="whitespace-nowrap px-5 py-3 text-xs text-muted-foreground sm:px-6">{new Date(order.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
										<td className="px-4 py-3 text-sm font-medium">{order.symbol}</td>
										<td className={`px-4 py-3 text-xs font-semibold ${order.type === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>{order.type} · {order.orderType}</td>
										<td className="px-4 py-3 text-right text-sm tabular-nums">{order.quantity}</td>
										<td className="px-5 py-3 text-right text-sm tabular-nums sm:px-6">{inr.format(order.price)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>

				<footer className="flex flex-wrap items-center justify-between gap-2 py-5 text-[10px] text-muted-foreground">
					<span>© {new Date().getFullYear()} Tigercave Financial</span>
					<span>Market data is simulated and may not reflect real-time prices.</span>
				</footer>
			</main>
		</div>
	);
};

export default TradingDashboard;
