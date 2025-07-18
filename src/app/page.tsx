
"use client";

import { useState, useRef, useEffect, type SVGProps } from "react";
import { useToast } from "@/hooks/use-toast";
import { pdfChat } from "@/ai/flows/pdf-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Upload, Trash2, Loader2, Paperclip, Plus, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  role: "user" | "model";
  content: string;
};

type ChatSession = {
  id: string;
  pdfFile: File;
  pdfDataUri: string;
  chatHistory: Message[];
}

const GrugLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 3.5C7.02944 3.5 3 7.52944 3 12.5C3 17.4706 7.02944 21.5 12 21.5C16.9706 21.5 21 17.4706 21 12.5C21 7.52944 16.9706 3.5 12 3.5Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 3.5V2.5C17.5228 2.5 22 6.97715 22 12.5C22 18.0228 17.5228 22.5 12 22.5C6.47715 22.5 2 18.0228 2 12.5C2 6.97715 6.47715 2.5 12 2.5V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor" opacity="0.6"/>
        <path d="M12 8C12.5523 8 13 7.55228 13 7C13 6.44772 12.5523 6 12 6C11.4477 6 11 6.44772 11 7C11 7.55228 11.4477 8 12 8Z" fill="currentColor" opacity="0.4"/>
    </svg>
);

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeChatId) || null;
  const chatHistory = activeSession?.chatHistory || [];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid PDF file.",
          variant: "destructive",
        });
        return;
      }
      
      const newSessionId = Date.now().toString();

      const reader = new FileReader();
      reader.onload = (e) => {
        const newSession: ChatSession = {
          id: newSessionId,
          pdfFile: file,
          pdfDataUri: e.target?.result as string,
          chatHistory: [],
        }
        setSessions(prev => [...prev, newSession]);
        setActiveChatId(newSessionId);
        toast({
          title: "PDF Uploaded",
          description: `"${file.name}" is ready for chatting.`,
        });
      };
      reader.readAsDataURL(file);
    }
     if(event.target) {
        event.target.value = "";
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !activeSession) return;

    const newUserMessage: Message = { role: "user", content: userInput };
    const currentInput = userInput;

    // Update state immediately for better UX
    setSessions(prev => prev.map(s => 
      s.id === activeChatId ? { ...s, chatHistory: [...s.chatHistory, newUserMessage] } : s
    ));
    setUserInput("");
    setIsLoading(true);

    try {
      const historyString = activeSession.chatHistory
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const response = await pdfChat({
        pdfDataUri: activeSession.pdfDataUri,
        question: currentInput,
        chatHistory: historyString,
      });

      const modelMessage: Message = { role: "model", content: response.answer };
      setSessions(prev => prev.map(s => 
        s.id === activeChatId ? { ...s, chatHistory: [...s.chatHistory, modelMessage] } : s
      ));
    } catch (error) {
      console.error(error);
      // Revert the user message on error
       setSessions(prev => prev.map(s => 
        s.id === activeChatId ? { ...s, chatHistory: s.chatHistory.slice(0, -1) } : s
      ));
      setUserInput(currentInput);
      toast({
        title: "An error occurred",
        description: "Failed to get a response from the AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeChatId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setActiveChatId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
    toast({
      title: "Chat Deleted",
      description: "The chat and document have been removed.",
    });
  };

  const selectChat = (sessionId: string) => {
    setActiveChatId(sessionId);
  }

  const renderWelcomeScreen = () => (
     <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <svg data-ai-hint="document analysis" width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/50">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 12H16V14H8V12ZM8 16H13V18H8V16Z" fill="currentColor"/>
        </svg>
        <h2 className="text-2xl font-semibold">Welcome to Grug: PDF CHAT TOOL</h2>
        <p className="text-muted-foreground">Upload a PDF document to start a conversation.</p>
        <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Select PDF
        </Button>
    </div>
  );

  const renderChatInterface = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 border-b p-4 shrink-0">
        <Paperclip className="text-primary h-5 w-5"/>
        <h2 className="text-lg font-medium truncate">{activeSession?.pdfFile.name}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
        <div className="space-y-6">
            {chatHistory.map((message, index) => (
                <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'model' && (
                    <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="bg-primary/20 text-primary"><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                )}
                <div className={`max-w-[75%] rounded-lg p-3 shadow-sm ${
                        message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card'
                    }`}>
                     <div className="markdown-container text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                </div>
                {message.role === 'user' && (
                    <Avatar className="h-8 w-8 border">
                        <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                )}
                </div>
            ))}
            {isLoading && (
                <div className="flex items-start gap-4">
                <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-primary/20 text-primary"><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
                <div className="max-w-[75%] rounded-lg p-3 bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                    </div>
                </div>
                </div>
            )}
        </div>
      </div>
       <div className="border-t p-4 shrink-0">
          <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={activeSession ? "Ask a question about the PDF..." : "Upload a PDF to start chatting"}
              disabled={!activeSession || isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!activeSession || isLoading || !userInput.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
            </Button>
          </form>
        </div>
    </div>
  );

  return (
      <div className="flex h-screen bg-background text-foreground font-body">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col border-r">
          <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <GrugLogo className="text-primary" />
                <h1 className="text-xl font-bold">Grug</h1>
            </div>
          </div>
          <div className="p-4">
             <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Plus className="mr-2" /> New Chat
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
          </div>

          <ScrollArea className="flex-1">
              <div className="p-4 pt-0 space-y-2">
                {sessions.length === 0 && (
                    <div className="px-4 text-sm text-muted-foreground text-center">
                      Upload a PDF to start a new chat.
                    </div>
                )}
                {sessions.map(session => (
                  <div key={session.id} className="relative group">
                    <Button 
                        variant={session.id === activeChatId ? "secondary" : "ghost"}
                        onClick={() => selectChat(session.id)}
                        className="w-full justify-start truncate"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span className="truncate">{session.pdfFile.name}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100" 
                      onClick={(e) => deleteChat(e, session.id)}
                      aria-label="Delete chat"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
            <Card className="h-full w-full flex flex-col shadow-lg rounded-none border-0">
                {sessions.length === 0 ? renderWelcomeScreen() : (activeSession ? renderChatInterface() : renderWelcomeScreen())}
            </Card>
        </main>
      </div>
  );
}
