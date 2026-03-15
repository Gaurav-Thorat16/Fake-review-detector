import React from "react";
import { useGetReviewStats, useGetReviewHistory } from "@/lib/api-client-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  BarChart3, Activity, ShieldCheck, ShieldAlert, AlertTriangle, Fingerprint
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, subtitle, delay, colorClass = "text-primary" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <Card className="glass-panel border-white/5 overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-display tracking-widest uppercase text-muted-foreground">{title}</p>
            <p className={`text-4xl font-mono font-bold ${colorClass}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-4">{subtitle}</p>}
      </CardContent>
    </Card>
  </motion.div>
);

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetReviewStats();
  const { data: history, isLoading: historyLoading } = useGetReviewHistory({ limit: 10 });

  if (statsLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl bg-white/5" />
      </div>
    );
  }

  const pieData = [
    { name: 'Authentic', value: stats.totalGenuine, color: 'hsl(184 100% 50%)' },
    { name: 'Deceptive', value: stats.totalFake, color: 'hsl(350 100% 55%)' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Activity className="w-8 h-8 text-primary" />
        <h2 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground">
          System <span className="text-primary text-glow-primary">Telemetry</span>
        </h2>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Scanned" 
          value={stats.totalAnalyzed} 
          icon={Fingerprint} 
          subtitle={`${stats.todayCount} processed today`}
          delay={0}
          colorClass="text-foreground"
        />
        <StatCard 
          title="Authentic Sources" 
          value={stats.totalGenuine} 
          icon={ShieldCheck} 
          delay={0.1}
          colorClass="text-primary"
        />
        <StatCard 
          title="Deceptive Entities" 
          value={stats.totalFake} 
          icon={ShieldAlert} 
          subtitle={`${stats.fakePercentage.toFixed(1)}% of total volume`}
          delay={0.2}
          colorClass="text-destructive"
        />
        <StatCard 
          title="Avg Confidence" 
          value={`${(stats.avgConfidence * 100).toFixed(1)}%`} 
          icon={BarChart3} 
          delay={0.3}
          colorClass="text-secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart */}
        <Card className="glass-panel border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display tracking-widest uppercase text-sm text-muted-foreground">Detection Volume Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFake" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGenuine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }} />
                  <Area type="monotone" name="Deceptive" dataKey="fake" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorFake)" />
                  <Area type="monotone" name="Authentic" dataKey="genuine" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorGenuine)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card className="glass-panel border-white/5 flex flex-col">
          <CardHeader>
            <CardTitle className="font-display tracking-widest uppercase text-sm text-muted-foreground">Entity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}80)` }} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Risk Factors */}
        <Card className="glass-panel border-white/5 lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display tracking-widest uppercase text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent" /> Frequent Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topRiskFactors.map((factor, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground">{factor.type}</span>
                    <span className="text-muted-foreground font-mono">{factor.count} occurrences</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(factor.count / Math.max(...stats.topRiskFactors.map(f=>f.count))) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-accent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent History Table */}
        <Card className="glass-panel border-white/5 lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="font-display tracking-widest uppercase text-sm text-muted-foreground">Recent Scans</CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="font-display tracking-wider">Preview</TableHead>
                  <TableHead className="font-display tracking-wider">Verdict</TableHead>
                  <TableHead className="font-display tracking-wider text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading log...</TableCell></TableRow>
                ) : history?.items.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No recent scans found.</TableCell></TableRow>
                ) : (
                  history?.items.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm font-sans">
                        {item.text}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={item.isFake ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-primary/10 text-primary border-primary/30"}>
                          {item.isFake ? "Deceptive" : "Authentic"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(item.confidence * 100).toFixed(0)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
