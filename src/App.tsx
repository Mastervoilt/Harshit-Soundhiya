import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Search, MessageSquare, Music, Youtube, Globe, Settings, X, Volume2, VolumeX } from "lucide-react";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { AudioRecorder, AudioPlayer } from "./lib/audio";
import { tools, toolHandlers } from "./lib/tools";
import { cn } from "./lib/utils";

const SYSTEM_INSTRUCTION = `You are Jaana, a highly advanced, friendly, and efficient browser-based AI assistant. 
Your goal is to provide a seamless, human-like experience. 
You can search the web, find music on YouTube or Spotify, open websites, and help users send WhatsApp messages.
Always respond in a natural, conversational tone. 
When a user asks to do something you have a tool for, use it immediately and confirm the action.
Keep your responses concise but warm.
Your name is Jaana.`;

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(20).fill(10));

  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const visualizerIntervalRef = useRef<number | null>(null);

  const startSession = useCallback(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      playerRef.current = new AudioPlayer();
      recorderRef.current = new AudioRecorder((base64Data) => {
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
          });
        }
      });

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          tools: tools,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsListening(true);
            recorderRef.current?.start();
            console.log("Live session opened");
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && !isMuted) {
              playerRef.current?.playChunk(audioData);
            }

            // Handle Transcriptions
            const userTranscript = message.serverContent?.modelTurn?.parts?.find(p => p.text)?.text;
            if (userTranscript) {
              setTranscript(prev => prev + " " + userTranscript);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              playerRef.current?.stop();
            }

            // Handle Tool Calls
            const toolCall = message.toolCall;
            if (toolCall) {
              const responses = await Promise.all(
                toolCall.functionCalls.map(async (fc) => {
                  const handler = (toolHandlers as any)[fc.name];
                  if (handler) {
                    const result = await handler(fc.args);
                    return {
                      name: fc.name,
                      response: result,
                      id: fc.id,
                    };
                  }
                  return { name: fc.name, response: { error: "Tool not found" }, id: fc.id };
                })
              );
              session.sendToolResponse({ functionResponses: responses });
            }
          },
          onclose: () => {
            setIsConnected(false);
            setIsListening(false);
            recorderRef.current?.stop();
            console.log("Live session closed");
          },
          onerror: (err) => {
            console.error("Live session error:", err);
            setIsConnected(false);
            setIsListening(false);
          },
        },
      });

      sessionRef.current = session;
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  }, [isMuted]);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    recorderRef.current?.stop();
    playerRef.current?.stop();
    setIsListening(false);
    setIsConnected(false);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopSession();
    } else {
      startSession();
    }
  };

  // Siri-like Visualizer Effect
  useEffect(() => {
    if (isListening) {
      visualizerIntervalRef.current = window.setInterval(() => {
        setVisualizerData(prev => prev.map(() => Math.random() * 40 + 10));
      }, 100);
    } else {
      if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
      setVisualizerData(new Array(20).fill(10));
    }
    return () => {
      if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    };
  }, [isListening]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Background Siri Orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={cn(
          "w-[400px] h-[400px] rounded-full siri-orb transition-all duration-1000",
          isListening ? "bg-blue-500/30 scale-125" : "bg-purple-500/10 scale-100"
        )} />
        <div className={cn(
          "absolute w-[300px] h-[300px] rounded-full siri-orb transition-all duration-1000 delay-150",
          isListening ? "bg-purple-500/30 scale-110" : "bg-blue-500/10 scale-90"
        )} />
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold tracking-tight mb-2 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Jaana
          </h1>
          <p className="text-gray-400 text-lg">Your Personal AI Assistant</p>
        </motion.div>

        {/* Visualizer */}
        <div className="flex items-end justify-center gap-1 h-24 mb-12">
          {visualizerData.map((height, i) => (
            <motion.div
              key={i}
              animate={{ height }}
              className={cn(
                "w-1.5 rounded-full transition-colors duration-500",
                isListening ? "bg-blue-400" : "bg-gray-800"
              )}
            />
          ))}
        </div>

        {/* Transcript/Status */}
        <div className="w-full bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 mb-8 min-h-[120px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!isListening ? (
              <motion.p
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-500 text-center italic"
              >
                Tap the microphone to start speaking...
              </motion.p>
            ) : (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <p className="text-blue-400 text-sm font-medium uppercase tracking-widest">Listening</p>
                <p className="text-white text-lg leading-relaxed line-clamp-3">
                  {transcript || "I'm listening..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            {isMuted ? <VolumeX className="w-6 h-6 text-red-400" /> : <Volume2 className="w-6 h-6 text-gray-400" />}
          </button>

          <button
            onClick={toggleListening}
            className={cn(
              "p-8 rounded-full transition-all duration-500 shadow-2xl",
              isListening 
                ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/20" 
                : "bg-white hover:bg-gray-100 scale-100 shadow-white/10"
            )}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-black" />
            )}
          </button>

          <button
            onClick={() => {
              setTranscript("");
              setAiResponse("");
            }}
            className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          <QuickAction icon={<Search className="w-4 h-4" />} label="Search Web" />
          <QuickAction icon={<Youtube className="w-4 h-4" />} label="YouTube" />
          <QuickAction icon={<Music className="w-4 h-4" />} label="Spotify" />
          <QuickAction icon={<MessageSquare className="w-4 h-4" />} label="WhatsApp" />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="absolute bottom-8 text-gray-600 text-xs uppercase tracking-widest">
        Powered by Gemini 3.1 Flash Live
      </footer>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-default group">
      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-300 transition-colors">
        {label}
      </span>
    </div>
  );
}
