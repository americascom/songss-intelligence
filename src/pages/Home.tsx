import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music, DollarSign, Users, TrendingUp, BarChart3, Globe } from "lucide-react";
import { Suspense, lazy } from "react";
import MetricCard from "@/components/MetricCard";
import DemoChart from "@/components/DemoChart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FestivalIcons from "@/components/FestivalIcons";
import MiniRevenueChart from "@/components/MiniRevenueChart";
import ArtistSearch from "@/components/ArtistSearch";
import { useFormattedMetrics } from "@/hooks/useMetricsData";

const Globe3D = lazy(() => import("@/components/Globe3D"));

const Home = () => {
  const { totalStreams, totalRevenue, totalArtists } = useFormattedMetrics();

  // Use real data if available, otherwise show demo values
  const displayStreams = totalStreams !== "0" ? totalStreams : "11K+";
  const displayRevenue = totalRevenue !== "$0" ? totalRevenue : "$5K";
  const displayArtists = totalArtists !== "0" ? totalArtists : "51";

  return (
    <div className="min-h-screen flex flex-col bg-background dark">
      <Header />
      <main className="flex-1 pt-20 md:pt-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(179_43%_47%_/_0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(179_43%_47%_/_0.1),transparent_50%)]" />
        <div className="container py-12 md:py-20 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
                <TrendingUp className="w-4 h-4" />
                Real-time music intelligence
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
                Unlock{" "}
                <span className="text-gradient">Global Music</span>
                {" "}Insights
              </h1>
              <div className="mb-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
                <p className="text-xl md:text-2xl font-light text-foreground/80 italic tracking-tight">
                  Thinking First.
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-primary/60 mt-1">
                  by Americascom, Inc.
                </p>
              </div>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
                Track streams, revenue, and artist performance across every platform. 
                Make data-driven decisions with real-time analytics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: "300ms" }}>
                <Link to="/auth">
                  <Button size="lg" className="gradient-primary font-semibold text-base px-8 shadow-hero">
                    Sign Up Free
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="font-semibold text-base px-8 border-primary/30 hover:bg-primary/10">
                    View Demo
                  </Button>
                </Link>
              </div>

              {/* Artist Search Bar */}
              <div className="mt-10 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <ArtistSearch />
              </div>
            </div>

            {/* Right: 3D Globe with Icons and Chart */}
            <div 
              className="relative flex items-center justify-center animate-fade-in" 
              style={{ animationDelay: "400ms", overflow: "visible" }}
            >
              {/* Festival Icons - Left side */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:translate-x-0 z-10 hidden sm:block">
                <FestivalIcons />
              </div>

              {/* 3D Globe - Fully responsive container */}
              <div 
                className="w-full flex items-center justify-center"
                style={{ overflow: 'visible', minHeight: '320px' }}
              >
                <Suspense fallback={
                  <div className="w-full h-[320px] sm:h-[380px] md:h-[420px] flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-2 border-primary/30 animate-pulse" />
                  </div>
                }>
                  <Globe3D />
                </Suspense>
              </div>

              {/* Mini Revenue Chart - Right side */}
              <div className="absolute right-0 bottom-8 translate-x-4 md:translate-x-0 z-10 hidden sm:block">
                <MiniRevenueChart />
              </div>
            </div>
          </div>

          {/* Demo Metrics - Below Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mt-12 md:mt-16">
            <MetricCard
              icon={Music}
              value={displayStreams}
              label="Daily Streams"
              trend="+12%"
              delay={500}
            />
            <MetricCard
              icon={DollarSign}
              value={displayRevenue}
              label="Monthly Revenue"
              trend="+8%"
              delay={600}
            />
            <MetricCard
              icon={Users}
              value={displayArtists}
              label="Active Artists"
              trend="+3"
              delay={700}
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 md:py-16 border-t border-border/50">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-widest font-medium">
            Trusted by artists on leading platforms
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {/* Spotify */}
            <svg className="h-7 md:h-8 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 text-muted-foreground hover:text-primary" viewBox="0 0 2931 882" fill="currentColor">
              <path d="M441 0C197 0 0 197 0 441s197 441 441 441 441-197 441-441S685 0 441 0zm202 636c-8 13-25 17-38 9-104-64-236-78-391-43-15 3-30-6-33-21s6-30 21-33c170-39 315-22 433 49 13 8 17 25 8 39zm54-120c-10 16-31 21-47 11-119-73-301-94-442-52-18 5-37-5-42-23s5-37 23-42c161-49 361-25 499 59 16 10 21 31 9 47zm5-125C570 312 331 304 193 346c-22 7-45-6-51-28-7-22 6-45 28-51 158-48 421-39 587 60 20 12 26 37 15 57s-38 26-57 14zM1168 378c-90-24-106-41-106-76 0-34 32-57 79-57 46 0 92 17 140 53l2 1 3-2 48-68 1-2-1-2c-57-49-122-73-198-73-111 0-189 67-189 162 0 101 66 137 173 166 89 23 103 42 103 75 0 37-33 60-85 60-59 0-108-23-158-74l-2-2-3 1-55 63-1 2 1 2c59 62 133 94 220 94 118 0 197-66 197-165 0-85-51-131-169-158zM1498 308c-50 0-92 22-120 62v-52h-86v345h86V475c0-63 37-102 88-102 50 0 80 35 80 94v196h86V449c0-90-53-141-134-141zM1795 308c-50 0-92 22-120 62v-52h-86v345h86V475c0-63 37-102 88-102 50 0 80 35 80 94v196h86V449c0-90-53-141-134-141zM2063 308c-103 0-181 79-181 183 0 107 78 186 181 186s181-79 181-186c0-104-78-183-181-183zm0 286c-55 0-94-45-94-103 0-57 39-100 94-100s94 43 94 100c0 58-39 103-94 103zM2417 308c-49 0-90 22-116 63v-53h-86v369c0 84 47 133 129 133 28 0 55-6 82-19l-15-71c-18 8-35 12-50 12-30 0-60-15-60-63v-5c26 42 67 64 116 64 95 0 166-79 166-183 0-101-72-177-166-177zm-14 283c-53 0-96-43-96-102 0-56 42-98 96-98 55 0 93 44 93 100 0 58-39 100-93 100zM2657 169c-30 0-53 24-53 54s23 54 53 54 53-24 53-54-23-54-53-54zM2614 318h86v345h-86zM2872 398v-80h-59v-94l-86 26v68h-75v80h75v174c0 79 40 118 123 118 26 0 49-5 72-16v-74c-18 8-35 12-53 12-29 0-56-11-56-54V398h59z"/>
            </svg>
            {/* YouTube Music */}
            <svg className="h-7 md:h-8 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 text-muted-foreground hover:text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
            </svg>
            {/* Apple Music */}
            <svg className="h-7 md:h-8 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 text-muted-foreground hover:text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.994 6.124c0-.004 0-.009-.002-.013a10.023 10.023 0 00-.27-2.023 5.178 5.178 0 00-.684-1.626 5.207 5.207 0 00-1.302-1.32 5.218 5.218 0 00-1.621-.685 10.192 10.192 0 00-2.023-.27c-.355-.015-.71-.022-1.065-.025L16.37.16H7.63l-.658.002c-.355.003-.71.01-1.065.025a10.211 10.211 0 00-2.023.27A5.218 5.218 0 002.263.785 5.207 5.207 0 00.961 2.105a5.178 5.178 0 00-.684 1.626 10.023 10.023 0 00-.27 2.023c-.015.355-.022.71-.025 1.065L0 7.476v9.089l.002.657c.003.355.01.71.025 1.065a10.023 10.023 0 00.27 2.023 5.178 5.178 0 00.684 1.626 5.207 5.207 0 001.302 1.32 5.218 5.218 0 001.621.685c.674.127 1.352.21 2.023.27.355.015.71.022 1.065.025l.657.002h8.74l.657-.002c.355-.003.71-.01 1.065-.025a10.211 10.211 0 002.023-.27 5.218 5.218 0 001.621-.685 5.207 5.207 0 001.302-1.32 5.178 5.178 0 00.684-1.626 10.023 10.023 0 00.27-2.023c.015-.355.022-.71.025-1.065l.002-.657V7.476l-.002-.657c-.003-.355-.01-.71-.025-1.065zM17.255 12.22v5.563c0 .502-.29.82-.652.98-.222.101-.476.128-.704.085a1.15 1.15 0 01-.21-.063l-.006-.002a3.146 3.146 0 00-1.18-.214c-.893 0-1.7.419-2.04 1.07-.34.651-.195 1.418.38 2.023.575.605 1.404.882 2.168.742.764-.14 1.365-.598 1.578-1.21.07-.202.111-.427.111-.672V9.812c0-.412.27-.653.627-.653.357 0 .627.24.627.653v2.408h.001zm-6.65 3.39c0 1.052-.853 1.905-1.905 1.905s-1.905-.853-1.905-1.905.853-1.905 1.905-1.905 1.905.853 1.905 1.905zm1.08-7.803v.011l.009-.011V6.6c0-.412.27-.653.627-.653.357 0 .627.24.627.653v5.207h-.001v.011l.01-.011v1.228c0 .413-.27.654-.627.654-.357 0-.627-.241-.627-.654v-5.23z"/>
            </svg>
            {/* TikTok */}
            <svg className="h-7 md:h-8 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 text-muted-foreground hover:text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
            {/* Deezer */}
            <svg className="h-7 md:h-8 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 text-muted-foreground hover:text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM0 12.59v3.03h5.19v-3.03H0zm6.27 0v3.03h5.189v-3.03h-5.19zm6.27 0v3.03h5.19v-3.03h-5.19zm6.27 0v3.03H24v-3.03h-5.19zM0 16.81v3.029h5.19V16.81H0zm6.27 0v3.029h5.189V16.81h-5.19zm6.27 0v3.029h5.19V16.81h-5.19zm6.27 0v3.029H24V16.81h-5.19z"/>
            </svg>
            {/* SoundCloud */}
            <svg className="h-7 md:h-8 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 text-muted-foreground hover:text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.084-.1zm-.899 1.06c-.043 0-.085.036-.091.09l-.167 1.06.167 1.057c.006.055.048.09.09.09.043 0 .085-.035.091-.09l.188-1.057-.188-1.06c-.006-.054-.048-.09-.09-.09zm1.813-.525c-.06 0-.105.054-.112.11l-.21 1.69.21 1.635c.007.058.052.11.112.11.054 0 .105-.052.11-.11l.24-1.635-.24-1.69c-.005-.056-.056-.11-.11-.11zm.905-.384c-.067 0-.115.055-.121.117l-.191 2.058.191 2.006c.006.065.054.117.12.117.065 0 .116-.052.122-.117l.217-2.006-.217-2.058c-.006-.062-.057-.117-.12-.117zm.871-.131c-.074 0-.13.06-.136.123l-.163 2.189.163 2.084c.006.07.062.124.136.124.07 0 .13-.054.136-.124l.185-2.084-.185-2.189c-.006-.063-.066-.123-.136-.123zm.935-.04c-.081 0-.143.068-.149.136l-.136 2.23.136 2.122c.006.072.068.136.149.136.08 0 .142-.064.15-.136l.153-2.122-.152-2.23c-.008-.068-.07-.136-.15-.136zm.927-.162c-.084 0-.152.07-.159.142l-.11 2.392.11 2.173c.007.079.075.143.159.143.082 0 .152-.064.16-.143l.127-2.173-.127-2.392c-.008-.072-.078-.142-.16-.142zm.959-.06c-.091 0-.166.076-.173.151l-.083 2.453.083 2.218c.007.08.082.152.173.152.089 0 .166-.072.173-.152l.095-2.218-.095-2.453c-.007-.075-.084-.15-.173-.15zm.958.04c-.097 0-.175.082-.181.159l-.055 2.394.055 2.263c.006.085.084.16.181.16.094 0 .175-.075.181-.16l.065-2.263-.065-2.394c-.006-.077-.087-.16-.181-.16zm1.924.04c-.104 0-.187.085-.193.167l-.028 2.385.028 2.273c.006.09.089.168.193.168.102 0 .187-.078.193-.168l.033-2.273-.033-2.385c-.006-.082-.091-.168-.193-.168zm1.001-.046c-.11 0-.2.09-.206.176l.001 2.41-.001 2.309c.006.095.096.177.206.177.108 0 .2-.082.206-.177l.012-2.31-.012-2.41c-.006-.085-.098-.175-.206-.175zm.965.105c-.117 0-.21.098-.214.185v4.503c.004.09.097.185.214.185.114 0 .208-.094.213-.185V10.95c-.005-.087-.1-.185-.213-.185zm-7.06-.22c-.102 0-.181.076-.189.153l-.11 2.512.11 2.18c.008.082.087.153.189.153.102 0 .181-.07.189-.152l.126-2.18-.126-2.513c-.008-.076-.087-.152-.19-.152zm8.011.127c-.118 0-.213.098-.218.19v4.504c.005.093.1.19.218.19.117 0 .212-.097.218-.19V10.956c-.006-.092-.1-.19-.218-.19zm-9.946-.186c-.095 0-.172.07-.18.143l-.138 2.545.138 2.223c.008.077.085.146.18.146.094 0 .172-.069.18-.146l.156-2.223-.155-2.545c-.008-.073-.087-.143-.181-.143zm10.9.137c-.122 0-.222.1-.226.196v4.508c.004.096.104.197.226.197.122 0 .22-.101.226-.197v-4.508c-.007-.096-.104-.196-.226-.196zm.964.018c-.128 0-.232.104-.235.203v4.49c.003.1.107.204.235.204.127 0 .231-.104.235-.203V10.96c-.004-.1-.108-.204-.235-.204zm.95-.046c-.13 0-.238.108-.241.21v4.573c.003.105.111.21.241.21.128 0 .236-.105.24-.21v-4.574c-.004-.102-.112-.21-.24-.21zm.946-.018c-.134 0-.243.112-.248.217v4.608c.005.106.114.218.248.218.133 0 .242-.112.247-.218v-4.608c-.005-.105-.114-.217-.247-.217zm.95-.03c-.138 0-.25.117-.254.224v4.655c.004.11.116.224.254.224.136 0 .249-.114.254-.224v-4.655c-.005-.107-.118-.224-.254-.224zm.953-.02c-.142 0-.257.12-.261.23v4.692c.004.115.12.232.261.232.14 0 .257-.117.261-.232V10.82c-.004-.11-.12-.23-.261-.23zm.934.016c-.145 0-.262.122-.267.234v4.656c.005.116.122.235.267.235.143 0 .261-.12.267-.235V10.87c-.006-.112-.124-.234-.267-.234z"/>
            </svg>
            {/* Tidal */}
            <svg className="h-7 md:h-8 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 text-muted-foreground hover:text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004L0 16.004 4.004 20.008l4.004-4.004 4.004 4.004 4.004-4.004-4.004-4.004 4.004-4.004-4.004-4.004zM16.042 7.996l3.979-3.979L24 7.996l-3.979 3.979z"/>
            </svg>
            {/* Amazon Music */}
            <svg className="h-7 md:h-8 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 text-muted-foreground hover:text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.693 2.415-3.182 4.7-3.182zm3.186 7.705c-.209.189-.512.201-.745.074-1.052-.872-1.238-1.276-1.814-2.106-1.734 1.767-2.962 2.297-5.209 2.297-2.66 0-4.731-1.641-4.731-4.925 0-2.565 1.391-4.309 3.37-5.164 1.715-.754 4.11-.891 5.942-1.095v-.41c0-.753.06-1.642-.383-2.294-.385-.579-1.124-.82-1.775-.82-1.205 0-2.277.618-2.54 1.897-.054.285-.261.566-.549.58l-3.061-.333c-.259-.056-.548-.266-.472-.66C6.87 1.266 10.376 0 13.505 0c1.593 0 3.673.423 4.927 1.631 1.593 1.495 1.44 3.49 1.44 5.66v5.12c0 1.54.639 2.215 1.24 3.047.209.297.256.651-.009.872-.66.553-1.836 1.58-2.48 2.156l-.479-.309zm-13.69 3.822c-.41-.086-.693-.337-.797-.726-.048-.182-.053-.417.041-.64.232-.554.715-.994 1.22-1.316.613-.388 1.314-.662 2.048-.875 1.024-.297 2.097-.446 3.192-.446.695 0 1.382.056 2.054.166a14.37 14.37 0 011.894.426c.318.095.63.2.936.313.152.057.354.136.537.236.192.105.354.244.445.435.082.173.099.39.039.616-.126.467-.527.845-.975 1.092-.663.368-1.44.578-2.214.715-1.22.216-2.451.252-3.677.14a17.262 17.262 0 01-2.296-.387 11.165 11.165 0 01-2.448-.749z"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Trust Bar Section */}
      <section className="py-10 md:py-14 bg-background border-t border-border/30">
        <div className="container">
          <p className="text-center text-xs uppercase tracking-[0.2em] font-medium text-primary/60 mb-8">
            Enterprise Infrastructure You Can Trust
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
            {["ASCAP Member", "Powered by Cloudflare", "WWTV Play Infrastructure"].map((badge) => (
              <span
                key={badge}
                className="text-sm md:text-base font-medium text-muted-foreground/50 tracking-wide"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analytics tools designed for artists, labels, and music industry professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: BarChart3,
                title: "Stream Analytics",
                description: "Track plays across Spotify, Apple Music, YouTube, and more in real-time."
              },
              {
                icon: Globe,
                title: "Global Insights",
                description: "See where your music performs best with country and continent breakdowns."
              },
              {
                icon: DollarSign,
                title: "Revenue Tracking",
                description: "Monitor earnings across all platforms with detailed royalty reports."
              },
              {
                icon: TrendingUp,
                title: "Trend Detection",
                description: "Identify viral moments and capitalize on emerging opportunities."
              },
              {
                icon: Users,
                title: "Audience Demographics",
                description: "Understand your listeners with age, gender, and location data."
              },
              {
                icon: Music,
                title: "Playlist Tracking",
                description: "Monitor playlist placements and their impact on your streams."
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-xl border border-border shadow-card hover:shadow-hero transition-all duration-300 group"
              >
                <div className="p-3 rounded-lg gradient-primary w-fit mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chart Preview Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Visualize Your Success
              </h2>
              <p className="text-muted-foreground mb-6">
                Interactive charts and graphs help you understand trends at a glance. 
                Filter by date range, platform, or region to get the insights you need.
              </p>
              <Link to="/pricing">
                <Button className="gradient-primary font-semibold">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Stream Performance</h3>
                <span className="text-xs text-muted-foreground">Last 7 months</span>
              </div>
              <DemoChart type="area" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 gradient-primary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Music Career?
          </h2>
          <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of artists and labels using SONGSS Intelligence to make smarter decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-base px-8">
              Get Started Free
            </Button>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="border-foreground text-foreground hover:bg-foreground/10 font-semibold text-base px-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
    <Footer />
    </div>
  );
};

export default Home;
