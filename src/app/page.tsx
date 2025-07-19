
"use client";

import { useState, useRef, useEffect, type SVGProps } from "react";
import { useToast } from "@/hooks/use-toast";
import { pdfChat } from "@/ai/flows/pdf-chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Upload, Trash2, Loader2, Paperclip, Plus, MessageSquare, BookText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isElifMode, setIsElifMode] = useState(false);
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
        elifMode: isElifMode,
      });

      const modelMessage: Message = { role: "model", content: response.answer };
      setSessions(prev => prev.map(s => 
        s.id === activeChatId ? { ...s, chatHistory: [...s.chatHistory, modelMessage] } : s
      ));
    } catch (error) {
      console.error(error);
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

  const handleDeleteRequest = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
  };
  
  const confirmDeleteChat = () => {
    if (!sessionToDelete) return;
    const sessionName = sessions.find(s => s.id === sessionToDelete)?.pdfFile.name;

    setSessions(prev => {
        const remaining = prev.filter(s => s.id !== sessionToDelete);
        if (activeChatId === sessionToDelete) {
            setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
        }
        return remaining;
    });

    toast({
      title: "Chat Deleted",
      description: `"${sessionName}" has been removed.`,
    });
    setSessionToDelete(null);
  };

  const selectChat = (sessionId: string) => {
    setActiveChatId(sessionId);
  }

  const renderWelcomeScreen = () => (
     <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <svg data-ai-hint="document analysis" width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/50">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 12H16V14H8V12ZM8 16H13V18H8V16Z" fill="currentColor"/>
        </svg>
        <h2 className="text-2xl font-semibold">GeminiPDF Chat</h2>
        <p className="text-muted-foreground">Upload a PDF document to start a conversation.</p>
        <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Select PDF
        </Button>
    </div>
  );

  const renderChatInterface = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b p-4 shrink-0">
        <div className="flex items-center gap-3">
          <Paperclip className="text-primary h-5 w-5"/>
          <h2 className="text-lg font-medium truncate">{activeSession?.pdfFile.name}</h2>
        </div>
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
            <div className="flex items-center space-x-2 mb-4">
                <Switch id="elif-mode" checked={isElifMode} onCheckedChange={setIsElifMode} disabled={isLoading} />
                <Label htmlFor="elif-mode" className="cursor-pointer">Explain Like I'm Five</Label>
            </div>
          <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question about the PDF..."
              disabled={!activeSession || isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!activeSession || isLoading || !userInput.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
            </Button>
          </form>
           <p className="text-xs text-muted-foreground text-center mt-2">
            Running on model: googleai/gemini-flash-1.5
           </p>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground font-body">
      {/* Sidebar */}
      <aside className="w-[300px] flex-col border-r bg-card hidden sm:flex">
        <div className="p-4 border-b">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
                <BookText className="text-primary h-6 w-6" />
                <h1 className="text-xl font-bold">GeminiPDF Chat</h1>
            </div>
            <p className="text-xs text-muted-foreground ml-8">Chat with your PDFs</p>
          </div>
        </div>
        <div className="p-4">
          <Button size="sm" variant="outline" className="w-1/2 justify-start" onClick={() => fileInputRef.current?.click()}>
            <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">New Chat</span>
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
              <div key={session.id} className="group relative">
                <Button
                  size="sm"
                  variant={session.id === activeChatId ? "default" : "outline"}
                  onClick={() => selectChat(session.id)}
                  className="w-1/2 justify-start"
                >
                  <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{session.pdfFile.name}</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                  onClick={(e) => handleDeleteRequest(e, session.id)}
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
        <div className="h-full w-full flex flex-col shadow-lg">
          {sessions.length === 0 ? renderWelcomeScreen() : (activeSession ? renderChatInterface() : renderWelcomeScreen())}
        </div>
      </main>
      
      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the chat history for
              "{sessions.find(s => s.id === sessionToDelete)?.pdfFile.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChat}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
