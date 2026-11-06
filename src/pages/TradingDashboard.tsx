import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	Area,
	Bar,
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	type TooltipProps,
} from "recharts";
import {
	ArrowDownRight,
	ArrowUpRight,
	Activity,
	Bell,
	CandlestickChart,
	Check,
	CircleHelp,
	Clock3,
	Layers3,
	Maximize2,
	Menu,
	Plus,
	Search,
	SlidersHorizontal,
	X,
	Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type Asset = {
	symbol: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
};

type QuotesResponse = {
	success: boolean;
	error?: string;
	quotes: {
		symbol: string;
		name: string;
		currentPrice: number;
		previousClose: number;
		percentageChange: number;
	}[];
};

type SingleQuoteResponse = {
	success: boolean;
	error?: string;
	quote?: {
		symbol: string;
		currentPrice: number;
		previousClose: number;
		percentageChange: number;
	};
};

type ChartTimeframe = "1d" | "1w" | "1m" | "1y";
type ChartMode = "area" | "candles";
type ProductType = "INTRADAY" | "DELIVERY";

type ChartCandle = {
	timestamp: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	range: [number, number];
	sma20: number | null;
	sma50: number | null;
};

type ChartResponse = {
	success: boolean;
	error?: string;
	absoluteChange: number;
	percentageChange: number;
	candles: Omit<ChartCandle, "range">[];
};

type ChartChangeSummary = {
	symbol: string;
	timeframe: ChartTimeframe;
	absoluteChange: number;
	percentageChange: number;
};

type Position = {
	id: string;
	symbol: string;
	productType: ProductType;
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
	productType: ProductType;
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

const inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

const formatSignedCurrency = (value: number) =>
	`${value >= 0 ? "+" : "-"}${inr.format(Math.abs(value))}`;

const addMovingAverages = (candles: Omit<ChartCandle, "sma20" | "sma50">[]): ChartCandle[] =>
	candles.map((candle, index) => {
		const averageClose = (period: number) => {
			if (index + 1 < period) return null;
			const periodCandles = candles.slice(index + 1 - period, index + 1);
			return periodCandles.reduce((sum, item) => sum + item.close, 0) / period;
		};

		return {
			...candle,
			sma20: averageClose(20),
			sma50: averageClose(50),
		};
	});

const MarketTooltip = ({ active, payload, label }: TooltipProps<number | [number, number], string>) => {
	const candle = payload?.[0]?.payload as ChartCandle | undefined;
	if (!active || !candle) return null;

	return (
		<div className="rounded-md border border-border bg-popover px-3 py-2 shadow-xl">
			<p className="mb-2 text-xs text-muted-foreground">{new Date(label).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
			<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
				<span className="text-muted-foreground">Open</span><span className="text-right tabular-nums">{inr.format(candle.open)}</span>
				<span className="text-muted-foreground">High</span><span className="text-right tabular-nums">{inr.format(candle.high)}</span>
				<span className="text-muted-foreground">Low</span><span className="text-right tabular-nums">{inr.format(candle.low)}</span>
				<span className="text-muted-foreground">Close</span><span className="text-right tabular-nums">{inr.format(candle.close)}</span>
				<span className="text-muted-foreground">Volume</span><span className="text-right tabular-nums">{new Intl.NumberFormat("en-IN", { notation: "compact" }).format(candle.volume)}</span>
			</div>
		</div>
	);
};

const CandlestickShape = (props: {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	payload?: ChartCandle;
}) => {
	const { x = 0, y = 0, width = 0, height = 0, payload } = props;
	if (!payload) return null;

	const priceRange = payload.high - payload.low;
	const priceToY = (price: number) => priceRange === 0
		? y + height / 2
		: y + ((payload.high - price) / priceRange) * height;
	const openY = priceToY(payload.open);
	const closeY = priceToY(payload.close);
	const color = payload.close >= payload.open ? "#34d399" : "#fb7185";
	const bodyWidth = Math.max(2, Math.min(width * 0.7, 14));
	const bodyHeight = Math.max(1, Math.abs(closeY - openY));

	return (
		<g>
			<line x1={x + width / 2} x2={x + width / 2} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
			<rect
				x={x + (width - bodyWidth) / 2}
				y={Math.min(openY, closeY)}
				width={bodyWidth}
				height={bodyHeight}
				fill={color}
			/>
		</g>
	);
};

const TradingDashboard = () => {
	const [selectedSymbol, setSelectedSymbol] = useState("^NSEI");
	const [side, setSide] = useState<"buy" | "sell">("buy");
	const [orderType, setOrderType] = useState<"market" | "limit">("market");
	const [productType, setProductType] = useState<ProductType>("DELIVERY");
	const [quantity, setQuantity] = useState("1");
	const [limitPrice, setLimitPrice] = useState("");
	const [tickerSearch, setTickerSearch] = useState("");
	const [isSearchingTicker, setIsSearchingTicker] = useState(false);
	const [quotes, setQuotes] = useState<Asset[]>([]);
	const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
	const [quoteError, setQuoteError] = useState<string | null>(null);
	const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>("1d");
	const [chartMode, setChartMode] = useState<ChartMode>("area");
	const [isChartFullscreen, setIsChartFullscreen] = useState(false);
	const closeChartButtonRef = useRef<HTMLButtonElement>(null);
	const [chartData, setChartData] = useState<ChartCandle[]>([]);
	const [chartChangeSummary, setChartChangeSummary] = useState<ChartChangeSummary | null>(null);
	const [isLoadingChart, setIsLoadingChart] = useState(true);
	const [chartError, setChartError] = useState<string | null>(null);
	const [showSma20, setShowSma20] = useState(false);
	const [showSma50, setShowSma50] = useState(false);
	const [showVolume, setShowVolume] = useState(false);
	const [visibleRange, setVisibleRange] = useState<[number, number] | null>(null);
	const [isPanningChart, setIsPanningChart] = useState(false);
	const chartPlotRef = useRef<HTMLDivElement>(null);
	const chartPanRef = useRef<{ pointerId: number; startX: number; range: [number, number] } | null>(null);
	const [userId] = useState(() => sessionStorage.getItem("userId"));
	const [cashBalance, setCashBalance] = useState<number | null>(null);
	const [marginUsed, setMarginUsed] = useState<number | null>(null);
	const [positions, setPositions] = useState<Position[]>([]);
	const [orders, setOrders] = useState<PortfolioOrder[]>([]);
	const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [closingPositionId, setClosingPositionId] = useState<string | null>(null);
	const navigate = useNavigate();
	const { toast } = useToast();

	useEffect(() => {
		const plot = chartPlotRef.current;
		if (!plot || chartData.length < 2) return;

		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			const fullEnd = chartData.length - 1;
			const [start, end] = visibleRange ?? [0, fullEnd];
			const span = Math.max(1, end - start);
			const nextSpan = Math.min(fullEnd, Math.max(1, span * (event.deltaY < 0 ? 0.8 : 1.25)));
			const bounds = plot.getBoundingClientRect();
			const pointerRatio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
			const anchor = start + span * pointerRatio;
			let nextStart = anchor - (anchor - start) * (nextSpan / span);
			let nextEnd = nextStart + nextSpan;

			if (nextStart < 0) {
				nextEnd -= nextStart;
				nextStart = 0;
			}
			if (nextEnd > fullEnd) {
				nextStart -= nextEnd - fullEnd;
				nextEnd = fullEnd;
			}
			setVisibleRange([Math.max(0, nextStart), Math.min(fullEnd, nextEnd)]);
		};

		plot.addEventListener("wheel", handleWheel, { passive: false });
		return () => plot.removeEventListener("wheel", handleWheel);
	}, [chartData.length, visibleRange]);

	useEffect(() => {
		if (!isChartFullscreen) return;

		const previousOverflow = document.body.style.overflow;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsChartFullscreen(false);
		};

		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", handleKeyDown);
		closeChartButtonRef.current?.focus();

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isChartFullscreen]);

	useEffect(() => {
		let isCurrent = true;
		let isFetching = false;

		const loadQuotes = async () => {
			if (isFetching) return;
			isFetching = true;
			try {
				const response = await fetch("http://localhost:5000/api/quotes");
				const result: QuotesResponse = await response.json();
				if (!response.ok || !result.success || !Array.isArray(result.quotes)) {
					throw new Error(result.error || "Unable to load market quotes.");
				}

				const liveQuotes = result.quotes.map((quote) => ({
					symbol: quote.symbol,
					name: quote.name,
					price: Number(quote.currentPrice),
					change: Number(quote.currentPrice) - Number(quote.previousClose),
					changePercent: Number(quote.percentageChange),
				}));
				if (liveQuotes.some((quote) => !Number.isFinite(quote.price) || !Number.isFinite(quote.changePercent))) {
					throw new Error("Market data returned an invalid price.");
				}

				if (isCurrent) {
					setQuotes((current) => {
						const refreshedSymbols = new Set(liveQuotes.map((quote) => quote.symbol));
						return [...liveQuotes, ...current.filter((quote) => !refreshedSymbols.has(quote.symbol))];
					});
					setQuoteError(null);
				}
			} catch (error) {
				if (isCurrent) {
					setQuoteError(error instanceof Error ? error.message : "Unable to connect to the market data service.");
				}
			} finally {
				isFetching = false;
				if (isCurrent) setIsLoadingQuotes(false);
			}
		};

		void loadQuotes();
		const intervalId = window.setInterval(() => void loadQuotes(), 5000);
		return () => {
			isCurrent = false;
			window.clearInterval(intervalId);
		};
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		let isCurrent = true;
		setChartData([]);
		setChartChangeSummary(null);
		setVisibleRange(null);
		setChartError(null);
		setIsLoadingChart(true);

		const loadChart = async () => {
			try {
				const params = new URLSearchParams({ interval: chartTimeframe });
				const response = await fetch(
					`http://localhost:5000/api/chart/${encodeURIComponent(selectedSymbol)}?${params}`,
					{ signal: controller.signal },
				);
				const result: ChartResponse = await response.json();
				if (
					!response.ok ||
					!result.success ||
					!Array.isArray(result.candles) ||
					!Number.isFinite(result.absoluteChange) ||
					!Number.isFinite(result.percentageChange)
				) {
					throw new Error(result.error || "Unable to load historical chart data.");
				}

				const candles = result.candles.map((candle) => ({
					...candle,
					range: [candle.low, candle.high] as [number, number],
				}));
				if (isCurrent) {
					setChartData(addMovingAverages(candles));
					setChartChangeSummary({
						symbol: selectedSymbol,
						timeframe: chartTimeframe,
						absoluteChange: result.absoluteChange,
						percentageChange: result.percentageChange,
					});
				}
			} catch (error) {
				if (isCurrent && !(error instanceof DOMException && error.name === "AbortError")) {
					setChartError(error instanceof Error ? error.message : "Unable to load chart data.");
				}
			} finally {
				if (isCurrent) setIsLoadingChart(false);
			}
		};

		void loadChart();
		return () => {
			isCurrent = false;
			controller.abort();
		};
	}, [chartTimeframe, selectedSymbol]);

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

	const selectedAsset = quotes.find((asset) => asset.symbol === selectedSymbol) ?? quotes[0] ?? null;
	const fullRange: [number, number] = [0, Math.max(0, chartData.length - 1)];
	const currentRange = visibleRange ?? fullRange;
	const visibleCandles = chartData.slice(Math.floor(currentRange[0]), Math.ceil(currentRange[1]) + 1);
	const priceLow = visibleCandles.length ? Math.min(...visibleCandles.map((candle) => candle.low)) : 0;
	const priceHigh = visibleCandles.length ? Math.max(...visibleCandles.map((candle) => candle.high)) : 1;
	const pricePadding = Math.max((priceHigh - priceLow) * 0.08, Math.abs(priceHigh) * 0.001);
	const volumeAxisMaximum = Math.max(1, ...visibleCandles.map((candle) => candle.volume)) * 5;
	const displayedChange = isLoadingChart
		? selectedAsset
			? { absoluteChange: selectedAsset.change, percentageChange: selectedAsset.changePercent }
			: null
		: chartChangeSummary?.symbol === selectedSymbol && chartChangeSummary.timeframe === chartTimeframe
			? chartChangeSummary
			: null;
	const parsedQuantity = Number(quantity);
	const validQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0;
	const parsedLimitPrice = Number(limitPrice);
	const executionPrice = orderType === "limit" && parsedLimitPrice > 0 ? parsedLimitPrice : selectedAsset?.price ?? 0;
	const marginRequired = validQuantity * executionPrice;
	const totalUnrealizedPnl = positions.reduce(
		(total, position) => total + (position.lastPrice - position.averagePrice) * position.quantity,
		0,
	);
	const holdings = positions.filter((position) => position.productType === "DELIVERY");

	const renderPortfolioTable = (items: Position[], emptyMessage: string) => (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[1180px] border-collapse text-left">
				<thead>
					<tr className="border-b border-border text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
						<th className="px-5 py-3 font-medium sm:px-6">Ticker</th>
						<th className="px-4 py-3 font-medium">Product</th>
						<th className="px-4 py-3 text-right font-medium">Quantity</th>
						<th className="px-4 py-3 text-right font-medium">Average buy</th>
						<th className="px-4 py-3 text-right font-medium">Current LTP</th>
						<th className="px-4 py-3 text-right font-medium">Invested value</th>
						<th className="px-4 py-3 text-right font-medium">Market value</th>
						<th className="px-4 py-3 text-right font-medium">Total P&amp;L</th>
						<th className="px-5 py-3 text-right font-medium sm:px-6">Action</th>
					</tr>
				</thead>
				<tbody>
					{items.length === 0 ? (
						<tr>
							<td colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground sm:px-6">
								{isLoadingPortfolio ? "Loading portfolio..." : emptyMessage}
							</td>
						</tr>
					) : items.map((position) => {
						const livePrice = quotes.find((quote) => quote.symbol === position.symbol)?.price;
						const investedValue = position.quantity * position.averagePrice;
						const marketValue = livePrice === undefined ? null : position.quantity * livePrice;
						const totalPnl = livePrice === undefined
							? null
							: position.realizedPnl + (livePrice - position.averagePrice) * position.quantity;

						return (
							<tr key={position.id} className="border-b border-border/70 last:border-0 transition-colors hover:bg-secondary/40">
								<td className="px-5 py-4 sm:px-6">
									<div>
										<p className="text-sm font-semibold">{position.symbol}</p>
										<p className="mt-0.5 text-[10px] text-muted-foreground">{quotes.find((quote) => quote.symbol === position.symbol)?.name ?? "Market instrument"}</p>
									</div>
								</td>
								<td className="px-4 py-4 text-xs text-muted-foreground">{position.productType === "INTRADAY" ? "Intraday" : "Delivery"}</td>
								<td className="px-4 py-4 text-right text-sm tabular-nums">{position.quantity}</td>
								<td className="px-4 py-4 text-right text-sm tabular-nums">{inr.format(position.averagePrice)}</td>
								<td className="px-4 py-4 text-right text-sm tabular-nums">{livePrice === undefined ? "—" : inr.format(livePrice)}</td>
								<td className="px-4 py-4 text-right text-sm tabular-nums">{inr.format(investedValue)}</td>
								<td className="px-4 py-4 text-right text-sm tabular-nums">{marketValue === null ? "—" : inr.format(marketValue)}</td>
								<td className={`px-4 py-4 text-right text-sm font-medium tabular-nums ${totalPnl === null ? "text-muted-foreground" : totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
									{totalPnl === null ? "—" : formatSignedCurrency(totalPnl)}
								</td>
								<td className="px-5 py-4 text-right sm:px-6">
									<Button
										variant="outline"
										size="sm"
										disabled={closingPositionId !== null || livePrice === undefined}
										onClick={() => void handleExitPosition(position)}
										aria-label={`Exit ${position.symbol} ${position.productType.toLowerCase()} position at market`}
										className="h-8 whitespace-nowrap border-rose-500/30 px-3 text-xs text-rose-400 hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-300"
									>
										{closingPositionId === position.id ? "Exiting..." : "Exit / Sell"}
									</Button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);

	const handleChartPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0 || chartData.length < 2) return;
		const range = visibleRange ?? fullRange;
		chartPanRef.current = { pointerId: event.pointerId, startX: event.clientX, range };
		event.currentTarget.setPointerCapture(event.pointerId);
		setIsPanningChart(true);
	};

	const handleChartPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		const pan = chartPanRef.current;
		if (!pan || pan.pointerId !== event.pointerId || chartData.length < 2) return;

		const fullEnd = chartData.length - 1;
		const span = pan.range[1] - pan.range[0];
		const bounds = event.currentTarget.getBoundingClientRect();
		const shift = -((event.clientX - pan.startX) / bounds.width) * span;
		const start = Math.min(fullEnd - span, Math.max(0, pan.range[0] + shift));
		setVisibleRange([start, start + span]);
	};

	const finishChartPan = (event: React.PointerEvent<HTMLDivElement>) => {
		if (chartPanRef.current?.pointerId !== event.pointerId) return;
		chartPanRef.current = null;
		setIsPanningChart(false);
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	};

	const handleSearchTicker = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const symbol = tickerSearch.trim().toUpperCase();
		if (!/^[A-Z0-9&-]+\.(NS|BO)$/.test(symbol)) {
			toast({
				title: "Enter a valid NSE or BSE ticker",
				description: "Use an exchange suffix, for example ZOMATO.NS or ITC.NS.",
				variant: "destructive",
			});
			return;
		}

		setIsSearchingTicker(true);
		try {
			const response = await fetch(`http://localhost:5000/api/quote/${encodeURIComponent(symbol)}`);
			const result: SingleQuoteResponse = await response.json();
			if (!response.ok || !result.success || !result.quote) {
				throw new Error(result.error || `No live quote found for ${symbol}.`);
			}

			const asset: Asset = {
				symbol: result.quote.symbol,
				name: result.quote.symbol.replace(/\.(NS|BO)$/, ""),
				price: Number(result.quote.currentPrice),
				change: Number(result.quote.currentPrice) - Number(result.quote.previousClose),
				changePercent: Number(result.quote.percentageChange),
			};
			if (!Number.isFinite(asset.price) || !Number.isFinite(asset.changePercent)) {
				throw new Error(`Market data returned an invalid price for ${symbol}.`);
			}

			setQuotes((current) => {
				const existingIndex = current.findIndex((quote) => quote.symbol === asset.symbol);
				if (existingIndex < 0) return [...current, asset];
				return current.map((quote, index) => index === existingIndex ? asset : quote);
			});
			setSelectedSymbol(asset.symbol);
			setLimitPrice("");
			setTickerSearch("");
			toast({
				title: "Ticker added",
				description: `${asset.symbol} added at ${inr.format(asset.price)} and selected for trading.`,
			});
		} catch (error) {
			toast({
				title: "Ticker quote unavailable",
				description: error instanceof Error ? error.message : `Unable to fetch ${symbol}.`,
				variant: "destructive",
			});
		} finally {
			setIsSearchingTicker(false);
		}
	};

	const handlePlaceOrder = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!userId) {
			navigate("/login");
			return;
		}
		if (!selectedAsset) {
			toast({
				title: "Market data unavailable",
				description: "Wait for a live quote before placing an order.",
				variant: "destructive",
			});
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
					productType,
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

	const handleExitPosition = async (position: Position) => {
		if (!userId) {
			navigate("/login");
			return;
		}

		const liveAsset = quotes.find((asset) => asset.symbol === position.symbol);
		if (!liveAsset) {
			toast({
				title: "Live quote unavailable",
				description: `Refresh market data before exiting ${position.symbol}.`,
				variant: "destructive",
			});
			return;
		}

		setClosingPositionId(position.id);
		try {
			const response = await fetch("http://localhost:5000/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: Number(userId),
					symbol: position.symbol,
					type: "SELL",
					orderType: "MARKET",
					productType: position.productType,
					quantity: position.quantity,
					price: liveAsset.price,
				}),
			});
			const result: PortfolioResponse & { error?: string } = await response.json();
			if (!response.ok || !result.success) {
				throw new Error(result.error || "Unable to exit position.");
			}

			setCashBalance(Number(result.cashBalance));
			setMarginUsed(Number(result.marginUsed));
			setPositions(result.positions);
			setOrders(result.orders);
			toast({
				title: "Position exited",
				description: `${position.symbol} sold at ${inr.format(liveAsset.price)}. Wallet balance updated.`,
			});
		} catch (error) {
			toast({
				title: "Exit failed",
				description: error instanceof Error ? error.message : "Unable to connect to the trading server.",
				variant: "destructive",
			});
		} finally {
			setClosingPositionId(null);
		}
	};

	const tapeItems = quotes.length > 0 ? [...quotes, ...quotes] : [];
	const formatChartTime = (value: string) => {
		const date = new Date(value);
		return chartTimeframe === "1d"
			? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
			: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
	};
	const marketStatus = quoteError
		? quotes.length > 0 ? "Feed delayed" : "Quotes unavailable"
		: isLoadingQuotes ? "Loading quotes" : "Live quotes";

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
							<span className={`h-2 w-2 rounded-full ${quoteError ? "bg-amber-400" : quotes.length > 0 ? "bg-emerald-400" : "bg-muted-foreground"}`} />
							{marketStatus}
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
							{tapeItems.length === 0 ? (
								<div className="flex h-12 items-center px-5 text-xs text-muted-foreground">
									{isLoadingQuotes ? "Fetching live quotes..." : quoteError || "No live quotes available"}
								</div>
							) : tapeItems.map((asset, index) => {
								const positive = asset.changePercent >= 0;
								const MoveIcon = positive ? ArrowUpRight : ArrowDownRight;

								return (
									<div key={`${asset.symbol}-${index}`} className="flex h-12 min-w-[205px] items-center gap-3 border-r border-border px-5">
										<div className="min-w-0">
											<p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{asset.name}</p>
											<p className="whitespace-nowrap text-xs font-semibold tabular-nums">{asset.symbol} · {inr.format(asset.price)}</p>
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
						<span>Live quotes · refresh every 5 sec</span>
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
					{isChartFullscreen && (
						<div
							aria-hidden="true"
							className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm"
							onClick={() => setIsChartFullscreen(false)}
						/>
					)}
					<Card
						id="market-chart"
						role={isChartFullscreen ? "dialog" : undefined}
						aria-modal={isChartFullscreen || undefined}
						aria-label={isChartFullscreen ? "Full-screen market chart" : undefined}
						tabIndex={isChartFullscreen ? -1 : undefined}
						className={`min-w-0 rounded-lg border-border bg-card shadow-none ${isChartFullscreen ? "fixed inset-0 z-[90] flex h-[100dvh] w-screen max-w-none flex-col overflow-y-auto rounded-none bg-background shadow-2xl" : ""}`}
					>
						<div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
							<div>
								<div className="mb-2 flex items-center gap-2">
									<CandlestickChart className="h-4 w-4 text-primary" />
									<span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Market chart</span>
								</div>
								<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
									<h2 className="font-display text-xl font-semibold">{selectedAsset?.name ?? (isLoadingQuotes ? "Loading quotes" : "Quotes unavailable")}</h2>
									<span className="text-xs text-muted-foreground">{selectedAsset?.symbol}</span>
								</div>
								<div className="mt-2 flex items-center gap-2">
									<span className="font-display text-2xl font-semibold tabular-nums">{selectedAsset ? inr.format(selectedAsset.price) : "—"}</span>
										{displayedChange && (
										<span
											title={isLoadingChart ? "Live quote change" : `${chartTimeframe.toUpperCase()} period change`}
											className={`text-xs font-medium ${displayedChange.absoluteChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}
										>
											{displayedChange.absoluteChange >= 0 ? "+" : "-"}{inr.format(Math.abs(displayedChange.absoluteChange))} ({displayedChange.percentageChange >= 0 ? "+" : ""}{displayedChange.percentageChange.toFixed(2)}%)
										</span>
									)}
								</div>
							</div>
							<div className="flex flex-wrap items-center justify-end gap-2">
								<div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-1" role="group" aria-label="Chart timeframe">
									{([
										{ value: "1d", label: "1D" },
										{ value: "1w", label: "1W" },
										{ value: "1m", label: "1M" },
										{ value: "1y", label: "1Y" },
									] as const).map((timeframe) => (
										<button
											key={timeframe.value}
											type="button"
											aria-pressed={chartTimeframe === timeframe.value}
											onClick={() => setChartTimeframe(timeframe.value)}
											className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors ${chartTimeframe === timeframe.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
										>
											{timeframe.label}
										</button>
									))}
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs">
											<SlidersHorizontal className="h-3.5 w-3.5" />
											Indicators
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-48">
										<DropdownMenuLabel>Technical indicators</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuCheckboxItem checked={showSma20} onCheckedChange={(checked) => setShowSma20(checked === true)}>SMA 20</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem checked={showSma50} onCheckedChange={(checked) => setShowSma50(checked === true)}>SMA 50</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem checked={showVolume} onCheckedChange={(checked) => setShowVolume(checked === true)}>Volume bars</DropdownMenuCheckboxItem>
									</DropdownMenuContent>
								</DropdownMenu>
								<Select value={chartMode} onValueChange={(value: ChartMode) => setChartMode(value)}>
									<SelectTrigger aria-label="Chart type" className="h-8 w-[150px] bg-background text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="candles">Candlesticks</SelectItem>
										<SelectItem value="area">Area line</SelectItem>
									</SelectContent>
								</Select>
								{isChartFullscreen ? (
									<Button
									ref={closeChartButtonRef}
									type="button"
									variant="hero"
									size="sm"
									onClick={() => setIsChartFullscreen(false)}
									aria-label="Close full-screen chart"
									className="h-9 shrink-0 px-3"
								>
									<X className="h-4 w-4" />
									Close chart
								</Button>
								) : (
									<Button
									variant="outline"
									size="icon"
									type="button"
									onClick={() => setIsChartFullscreen(true)}
									aria-label="Expand chart to full screen"
									title="Expand chart to full screen"
									className="h-8 w-8"
								>
									<Maximize2 className="h-4 w-4" />
								</Button>
								)}
								<Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs">
									<Plus className="h-3.5 w-3.5" />
									Watchlist
								</Button>
							</div>
						</div>

						<div
											ref={chartPlotRef}
							onPointerDown={handleChartPointerDown}
							onPointerMove={handleChartPointerMove}
							onPointerUp={finishChartPan}
							onPointerCancel={finishChartPan}
							onDoubleClick={() => setVisibleRange(null)}
							className={`relative touch-none select-none px-2 pb-2 pt-5 sm:px-4 ${isPanningChart ? "cursor-grabbing" : "cursor-crosshair"} ${isChartFullscreen ? "min-h-0 flex-1" : "h-[290px] sm:h-[340px]"}`}
						>
							{chartData.length === 0 ? (
								<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
									{isLoadingChart ? "Loading historical prices..." : chartError || "No historical prices available."}
								</div>
							) : (
								<ResponsiveContainer width="100%" height="100%">
									<ComposedChart data={visibleCandles} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
											<defs>
												<linearGradient id="marketArea" x1="0" y1="0" x2="0" y2="1">
													<stop offset="0%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0.28} />
													<stop offset="95%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0} />
												</linearGradient>
											</defs>
											<CartesianGrid stroke="hsl(222, 30%, 18%)" strokeDasharray="3 5" vertical={false} />
											<XAxis dataKey="timestamp" tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatChartTime} minTickGap={24} />
											<YAxis yAxisId="price" orientation="right" tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)} domain={[priceLow - pricePadding, priceHigh + pricePadding]} width={58} />
											{showVolume && <YAxis yAxisId="volume" hide domain={[0, volumeAxisMaximum]} />}
											<Tooltip content={<MarketTooltip />} cursor={{ stroke: "hsl(32, 95%, 55%)", strokeDasharray: "4 4" }} />
											{showVolume && <Bar yAxisId="volume" dataKey="volume" fill="#64748b" fillOpacity={0.28} barSize={8} isAnimationActive={false} />}
											{chartMode === "area" ? (
												<Area yAxisId="price" type="monotone" dataKey="close" stroke="hsl(32, 95%, 55%)" strokeWidth={2} fill="url(#marketArea)" activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(32, 95%, 55%)" }} isAnimationActive={false} />
											) : (
												<Bar yAxisId="price" dataKey="range" shape={<CandlestickShape />} isAnimationActive={false} />
											)}
											{showSma20 && <Line yAxisId="price" type="monotone" dataKey="sma20" stroke="#38bdf8" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />}
											{showSma50 && <Line yAxisId="price" type="monotone" dataKey="sma50" stroke="#fbbf24" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />}
										</ComposedChart>
								</ResponsiveContainer>
							)}
						</div>

						<div className="grid grid-cols-3 border-t border-border px-5 py-3 sm:px-6">
							<div>
								<p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Period high</p>
								<p className="mt-1 text-sm font-medium tabular-nums">{chartData.length ? inr.format(Math.max(...chartData.map((point) => point.high))) : "—"}</p>
							</div>
							<div>
								<p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Period low</p>
								<p className="mt-1 text-sm font-medium tabular-nums">{chartData.length ? inr.format(Math.min(...chartData.map((point) => point.low))) : "—"}</p>
							</div>
							<div className="text-right">
								<p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Market status</p>
								<p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium"><span className={`h-1.5 w-1.5 rounded-full ${quoteError ? "bg-amber-400" : quotes.length > 0 ? "bg-emerald-400" : "bg-muted-foreground"}`} />{marketStatus}</p>
							</div>
						</div>
					</Card>

					<Card className="rounded-lg border-border bg-card shadow-none">
						<div className="flex items-center justify-between border-b border-border px-5 py-4">
							<div>
								<h2 className="font-display text-base font-semibold">Order ticket</h2>
								<p className="mt-1 text-xs text-muted-foreground">{quoteError ? "Showing last received prices" : "Live exchange quotes"}</p>
							</div>
							<button type="button" className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Order ticket help" title="Orders are simulated in this demo">
								<CircleHelp className="h-4 w-4" />
							</button>
						</div>
						<div className="space-y-5 p-5">
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
							<form onSubmit={handleSearchTicker} className="space-y-2">
								<Label htmlFor="ticker-search" className="text-xs text-muted-foreground">Add NSE/BSE ticker</Label>
								<div className="flex gap-2">
									<Input
										id="ticker-search"
										value={tickerSearch}
										onChange={(event) => setTickerSearch(event.target.value)}
										placeholder="e.g. ZOMATO.NS"
										maxLength={32}
										autoCapitalize="characters"
										spellCheck={false}
										className="h-10 min-w-0 bg-background text-sm uppercase"
									/>
									<Button type="submit" variant="outline" disabled={isSearchingTicker || !tickerSearch.trim()} className="h-10 shrink-0 px-3">
										<Search className="h-4 w-4" />
										{isSearchingTicker ? "Searching..." : "Add / Search"}
									</Button>
								</div>
							</form>

							<div className="space-y-2">
								<Label htmlFor="instrument" className="text-xs text-muted-foreground">Instrument</Label>
								<Select value={selectedAsset?.symbol ?? selectedSymbol} onValueChange={(value) => { setSelectedSymbol(value); setLimitPrice(""); }} disabled={quotes.length === 0}>
									<SelectTrigger id="instrument" className="h-10 bg-background text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
											{quotes.map((asset) => (
												<SelectItem key={asset.symbol} value={asset.symbol}>{asset.name} ({asset.symbol})</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">LTP <span className="font-medium text-foreground">{selectedAsset ? inr.format(selectedAsset.price) : "—"}</span></p>
							</div>
							<form onSubmit={handlePlaceOrder} className="space-y-5">

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
							<div className="space-y-2">
								<Label htmlFor="product-type" className="text-xs text-muted-foreground">Product type</Label>
								<Select value={productType} onValueChange={(value: ProductType) => setProductType(value)}>
									<SelectTrigger id="product-type" className="h-10 bg-background text-sm"><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="DELIVERY">Delivery · Holdings</SelectItem>
										<SelectItem value="INTRADAY">Intraday · Positions</SelectItem>
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
										value={orderType === "limit" ? limitPrice : selectedAsset?.price ?? ""}
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

							<Button type="submit" variant="hero" disabled={isSubmitting || isLoadingPortfolio || cashBalance === null || !selectedAsset} className={`h-11 w-full ${side === "sell" ? "bg-rose-500 text-white shadow-none hover:bg-rose-600 hover:shadow-none" : ""}`}>
								{isSubmitting ? "Submitting order..." : side === "buy" ? "Place buy order" : "Place sell order"}
							</Button>
							</form>
						</div>
					</Card>
				</div>

				<section id="positions" className="mt-5 scroll-mt-24">
					<Tabs defaultValue="positions" className="w-full">
						<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="font-display text-lg font-semibold">Portfolio &amp; positions</h2>
								<p className="mt-1 text-xs text-muted-foreground">Live market values · persistent wallet</p>
							</div>
							<TabsList className="h-10 rounded-md border border-border bg-card p-1">
								<TabsTrigger value="positions" className="rounded px-3 text-xs data-[state=active]:bg-secondary">
									Positions <span className="ml-1 text-muted-foreground">{positions.length}</span>
								</TabsTrigger>
								<TabsTrigger value="holdings" className="rounded px-3 text-xs data-[state=active]:bg-secondary">
									Holdings <span className="ml-1 text-muted-foreground">{holdings.length}</span>
								</TabsTrigger>
							</TabsList>
						</div>
						<TabsContent value="positions" className="mt-0 focus-visible:outline-none">
							<Card className="overflow-hidden rounded-lg border-border bg-card shadow-none">
								<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
									<div>
										<h3 className="text-sm font-semibold">Open positions</h3>
										<p className="mt-1 text-xs text-muted-foreground">Intraday and delivery trades · exit executes a market sell</p>
									</div>
									<span className={`text-xs font-semibold tabular-nums ${totalUnrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>Unrealized {formatSignedCurrency(totalUnrealizedPnl)}</span>
								</div>
								{renderPortfolioTable(positions, "No open positions yet. Place a trade from the order ticket.")}
								<div className="flex items-center gap-2 border-t border-border px-5 py-3 text-[10px] text-muted-foreground sm:px-6">
									<Check className="h-3.5 w-3.5 text-emerald-400" />
									Wallet and executed orders are stored by the trading server; LTP uses live quote data.
								</div>
							</Card>
						</TabsContent>
						<TabsContent value="holdings" className="mt-0 focus-visible:outline-none">
							<Card className="overflow-hidden rounded-lg border-border bg-card shadow-none">
								<div className="border-b border-border px-5 py-4 sm:px-6">
									<h3 className="text-sm font-semibold">Delivery holdings</h3>
									<p className="mt-1 text-xs text-muted-foreground">Long-term delivery assets · sell to release cash to your wallet</p>
								</div>
								{renderPortfolioTable(holdings, "No delivery holdings yet. Select Delivery when placing an order.")}
							</Card>
						</TabsContent>
					</Tabs>
				</section>

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
					<span>Quotes are indicative and may be delayed; verify prices before trading.</span>
				</footer>
			</main>
		</div>
	);
};

export default TradingDashboard;
