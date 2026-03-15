import React, { useState } from "react";
import { useAnalyzeReview } from "@/lib/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, AlertTriangle, CheckCircle, ShieldAlert, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const SAMPLE_REVIEWS = [
  {
    label: "Genuine Review",
    text: "I've been using this keyboard for a month now. The mechanical switches feel great and the build quality is solid. My only minor complaint is the software can be a bit clunky to set up macros, but otherwise it's a fantastic purchase.",
  },
  {
    label: "Fake/Bot Review",
    text: "OMG!!! THIS IS THE BEST PRODUCT IN THE UNIVERSE!!! It completely changed my entire life and cured all my problems!!! You MUST buy this right now immediately!!! 10/10 AMAZING FLAWLESS PERFECT!!!",
  },
  {
    label: "Suspicious Review",
    text: "Very good item. Working perfect. Buy it now. Fast shipping and good price. Best seller on this website.",
  }
];

export default function Analyzer() {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();
  
  const analyzeMutation = useAnalyzeReview({
    mutation: {
      onSuccess: () => {
        // Invalidate stats and history to keep dashboard fresh
        queryClient.invalidateQueries({ queryKey: ["/api/reviews/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reviews/history"] });
      }
    }
  });

  const handleAnalyze = () => {
    if (text.trim().length < 5) return;
    analyzeMutation.mutate({ data: { text } });
  };

  const result = analyzeMutation.data;
  const isPending = analyzeMutation.isPending;

  // Render a circular progress ring
  const CircularScore = ({ value, isFake }: { value: number, isFake: boolean }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    const color = isFake ? "text-destructive" : "text-primary";
    
    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full">
          <circle cx="56" cy="56" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/30" />
          <motion.circle 
            cx="56" cy="56" r="36" 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={color} 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-2xl font-display font-bold ${isFake ? "text-glow-destructive" : "text-glow-primary"}`}>
            {Math.round(value)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Input */}
      <div className="lg:col-span-5 space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-bold text-foreground">
            Neural <span className="text-primary text-glow-primary">Scanner</span>
          </h2>
          <p className="text-muted-foreground">Input text to evaluate authenticity using deep sentiment analysis and pattern recognition.</p>
        </div>

        <Card className="glass-panel border-primary/20">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Textarea 
                placeholder="Paste review content here for analysis..."
                className="min-h-[200px] resize-none bg-black/40 border-white/10 focus-visible:ring-primary/50 text-base font-sans"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground font-mono">
                {text.length} chars
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {SAMPLE_REVIEWS.map((sample, idx) => (
                <Button 
                  key={idx} 
                  variant="outline" 
                  size="sm"
                  className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50 text-xs"
                  onClick={() => setText(sample.text)}
                >
                  <Sparkles className="w-3 h-3 mr-1 text-primary" />
                  {sample.label}
                </Button>
              ))}
            </div>

            <Button 
              className="w-full font-display tracking-widest uppercase font-bold bg-primary hover:bg-primary/90 text-primary-foreground box-glow-primary transition-all duration-300"
              size="lg"
              onClick={handleAnalyze}
              disabled={isPending || text.trim().length < 5}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Vectors...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Initialize Scan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Results */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {!result && !isPending && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <ShieldAlert className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display text-muted-foreground">Awaiting Input Data</h3>
              <p className="text-sm text-muted-foreground/70">System ready for sentiment sequence.</p>
            </motion.div>
          )}

          {isPending && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[400px] flex flex-col items-center justify-center border border-primary/20 rounded-xl glass-panel relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent animate-pulse" />
              <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-display text-primary text-glow-primary tracking-widest uppercase">Analyzing Neural Patterns</h3>
            </motion.div>
          )}

          {result && !isPending && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Verdict Card */}
              <Card className={`glass-panel overflow-hidden border-2 ${result.isFake ? "border-destructive/50 box-glow-destructive" : "border-primary/50 box-glow-primary"}`}>
                <div className={`h-1 w-full ${result.isFake ? "bg-destructive" : "bg-primary"}`} />
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <CircularScore value={result.confidence * 100} isFake={result.isFake} />
                    
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        {result.isFake ? (
                          <AlertTriangle className="w-6 h-6 text-destructive" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-primary" />
                        )}
                        <h3 className="text-3xl font-display font-bold uppercase tracking-wider">
                          {result.isFake ? (
                            <span className="text-destructive text-glow-destructive">Deceptive Entity</span>
                          ) : (
                            <span className="text-primary text-glow-primary">Authentic Source</span>
                          )}
                        </h3>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Confidence level indicates the AI model's certainty regarding its classification.
                      </p>
                      
                      <div className="pt-4 space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-destructive">Fake Probability</span>
                            <span>{Math.round(result.fakeProbability * 100)}%</span>
                          </div>
                          <Progress value={result.fakeProbability * 100} className="h-1.5 bg-black/50" indicatorColor="bg-destructive" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-primary">Genuine Probability</span>
                            <span>{Math.round(result.genuineProbability * 100)}%</span>
                          </div>
                          <Progress value={result.genuineProbability * 100} className="h-1.5 bg-black/50" indicatorColor="bg-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid for Risk Factors & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk Factors */}
                <Card className="glass-panel border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-accent" />
                      Detected Anomalies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.riskFactors.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No significant anomalies detected.</p>
                    ) : (
                      <ul className="space-y-3">
                        {result.riskFactors.map((factor, idx) => {
                          const isHigh = factor.severity === 'high';
                          const isMed = factor.severity === 'medium';
                          return (
                            <li key={idx} className="flex flex-col gap-1 p-2 rounded-lg bg-black/30 border border-white/5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">{factor.type}</span>
                                <Badge variant="outline" className={
                                  isHigh ? "bg-destructive/10 text-destructive border-destructive/30" :
                                  isMed ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
                                  "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                }>
                                  {factor.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{factor.description}</p>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {/* Text Metrics */}
                <Card className="glass-panel border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Linguistic Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Word Count</span>
                        <span className="text-xl font-mono text-foreground">{result.textStats.wordCount}</span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Word Len</span>
                        <span className="text-xl font-mono text-foreground">{result.textStats.avgWordLength.toFixed(1)}</span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Exclamations</span>
                        <span className={`text-xl font-mono ${result.textStats.exclamationCount > 3 ? 'text-destructive' : 'text-foreground'}`}>
                          {result.textStats.exclamationCount}
                        </span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sentiment</span>
                        <span className="text-xl font-mono text-primary">
                          {result.textStats.sentimentScore > 0 ? '+' : ''}{result.textStats.sentimentScore.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
