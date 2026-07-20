import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, FileText, TrendingUp, Calendar, User as UserIcon, Plus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const MANAGE_SUBSCRIPTION_URL = "https://buyer.americaspay.com/p/login/bJe4gz9tjbuTfSa1zL3cc00";

const planLimitFor = (planName: string | null | undefined, limits: Record<string, number>): number => {
  if (!planName) return 0;
  const lower = planName.toLowerCase();
  const key = Object.keys(limits)
    .filter((k) => lower.includes(k))
    .sort((a, b) => b.length - a.length)[0];
  return key ? limits[key] : 0;
};

interface Report {
  id: string;
  session_id: string;
  artist_name: string | null;
  plan_name: string | null;
  created_at: string;
  customer_email: string | null;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [planLimits, setPlanLimits] = useState<Record<string, number>>({});
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.email) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("intelligence_reports")
        .select("id, session_id, artist_name, plan_name, created_at, customer_email")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });
      if (!error && data) setReports(data as Report[]);
      setLoading(false);
    };
    if (user) fetchReports();
  }, [user]);

  useEffect(() => {
    const fetchPlanLimits = async () => {
      const { data, error } = await (supabase
        .from("plan_limits" as any)
        .select("plan_key, monthly_limit") as any);
      if (!error && data) {
        const limits: Record<string, number> = {};
        for (const row of data as { plan_key: string; monthly_limit: number }[]) {
          limits[row.plan_key] = row.monthly_limit;
        }
        setPlanLimits(limits);
      }
    };
    fetchPlanLimits();
  }, []);

  const handleRequestNewReport = async () => {
    setRequesting(true);
    setRequestError(null);
    const { data, error } = await (supabase
      .rpc("request_new_report" as any, { p_artist_name: null }) as any);
    if (error) {
      setRequestError(error.message);
      setRequesting(false);
      return;
    }
    navigate(`/submit/${data}`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Quota: reports this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const reportsThisMonth = reports.filter(
    (r) => new Date(r.created_at) >= startOfMonth
  );
  const currentPlan = reports[0]?.plan_name ?? null;
  const limit = planLimitFor(currentPlan, planLimits);
  const used = reportsThisMonth.length;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Your Intelligence Dashboard
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <UserIcon className="w-4 h-4" />
                {user.email}
              </p>
            </div>
            <a
              href={MANAGE_SUBSCRIPTION_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                Manage Subscription
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>

          {/* Quota */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Monthly Report Quota
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  Plan: <span className="text-foreground font-semibold">{currentPlan ?? "—"}</span>
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold text-foreground">
                  {used}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}/ {limit || "—"} reports
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">This month</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {limit > 0 && used >= limit && (
                <p className="text-sm text-destructive mt-3">
                  Monthly quota reached. Upgrade your plan for more reports.
                </p>
              )}
              {requestError && (
                <p className="text-sm text-destructive mt-3">{requestError}</p>
              )}
              <Button
                className="gradient-primary mt-4"
                onClick={handleRequestNewReport}
                disabled={requesting || (limit > 0 && used >= limit)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {requesting ? "Requesting..." : "Request New Report"}
              </Button>
            </CardContent>
          </Card>

          {/* Reports list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Your Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-muted-foreground animate-pulse">
                  Loading reports...
                </div>
              ) : reports.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    No reports yet. Reports generated after checkout will appear here.
                  </p>
                  <Link to="/pricing">
                    <Button className="gradient-primary">View Plans</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Artist
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Plan
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Date
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reports.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4 font-medium text-foreground">
                            {r.artist_name ?? "Untitled"}
                          </td>
                          <td className="px-4 py-4 text-foreground/80">
                            {r.plan_name ?? "—"}
                          </td>
                          <td className="px-4 py-4 text-foreground/80">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {new Date(r.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link to={`/report/${r.session_id}`}>
                              <Button size="sm" variant="outline">
                                View Report
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
