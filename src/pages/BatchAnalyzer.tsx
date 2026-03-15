import React, { useState } from "react";
import { useBatchAnalyzeReviews } from "@/lib/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Loader2, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function BatchAnalyzer() {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();
  
  const batchMutation = useBatchAnalyzeReviews({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/reviews/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reviews/history"] });
      }
    }
  });

  const handleAnalyze = () => {
    const reviews = text.split('\n').map(r => r.trim()).filter(r => r.length > 5);
    if (reviews.length === 0) return;
    batchMutation.mutate({ data: { texts: reviews } });
  };

  const result = batchMutation.data;
  const isPending = batchMutation.isPending;

  const validLinesCount = text.split('\n').filter(r => r.trim().length > 5).length;

  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-3xl">
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Layers className="w-8 h-8 text-primary" />
          Batch <span className="text-primary text-glow-primary">Processor</span>
        </h2>
        <p className="text-muted-foreground">Submit multiple text segments simultaneously. Place each distinct review on a new line for parallel neural processing.</p>
      </div>

      <Card className="glass-panel border-white/10">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-end">
            <label className="text-sm font-display tracking-widest text-primary uppercase">Input Data Stream</label>
            <span className="text-xs font-mono text-muted-foreground bg-black/40 px-2 py-1 rounded border border-white/5">
              {validLinesCount} valid segments detected
            </span>
          </div>
          <Textarea 
            placeholder="Review 1 text...&#10;Review 2 text...&#10;Review 3 text..."
            className="min-h-[250px] bg-black/40 border-white/10 focus-visible:ring-primary/50 text-sm font-sans"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button 
              className="font-display tracking-widest uppercase font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-[0_0_15px_-3px_var(--color-secondary)] transition-all duration-300"
              onClick={handleAnalyze}
              disabled={isPending || validLinesCount === 0}
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing Batch...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Execute Batch Scan</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-display">Total Processed</span>
                <span className="text-3xl font-mono font-bold text-foreground">{result.summary.total}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-display">Authentic</span>
                <span className="text-3xl font-mono font-bold text-primary">{result.summary.genuine}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-destructive/20 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-destructive/5" />
                <span className="text-xs text-destructive uppercase tracking-wider font-display relative z-10">Deceptive</span>
                <span className="text-3xl font-mono font-bold text-destructive text-glow-destructive relative z-10">{result.summary.fake}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-display">Avg Confidence</span>
                <span className="text-3xl font-mono font-bold text-secondary">{(result.summary.avgConfidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {result.results.map((res, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx}
                >
                  <Card className={`glass-panel h-full border ${res.isFake ? 'border-destructive/30' : 'border-primary/20'}`}>
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                      <Badge variant="outline" className={res.isFake ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-primary/10 text-primary border-primary/30"}>
                        {res.isFake ? (
                          <><AlertTriangle className="w-3 h-3 mr-1" /> Deceptive</>
                        ) : (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Authentic</>
                        )}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">Conf: {(res.confidence * 100).toFixed(0)}%</span>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm text-foreground/80 line-clamp-4 font-sans leading-relaxed">{res.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
