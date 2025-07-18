
"use client";

import { useState, useRef, useEffect, type SVGProps } from "react";
import { useToast } from "@/hooks/use-toast";
import { pdfChat } from "@/ai/flows/pdf-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Upload, Download, Trash2, Loader2, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  role: "user" | "model";
  content: string;
};

const GeminiLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 3.5C7.02944 3.5 3 7.52944 3 12.5C3 17.4706 7.02944 21.5 12 21.5C16.9706 21.5 21 17.4706 21 12.5C21 7.52944 16.9706 3.5 12 3.5Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 3.5V2.5C17.5228 2.5 22 6.97715 22 12.5C22 18.0228 17.5228 22.5 12 22.5C6.47715 22.5 2 18.0228 2 12.5C2 6.97715 6.47715 2.5 12 2.5V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor" opacity="0.6"/>
        <path d="M12 8C12.5523 8 13 7.55228 13 7C13 6.44772 12.5523 6 12 6C11.4477 6 11 6.44772 11 7C11 7.55228 11.4477 8 12 8Z" fill="currentColor" opacity="0.4"/>
    </svg>
);

export default function Home() {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
      setPdfFile(file);
      setChatHistory([]);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfDataUri(e.target?.result as string);
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
    if (!userInput.trim() || isLoading || !pdfDataUri) return;

    const newUserMessage: Message = { role: "user", content: userInput };
    setChatHistory((prev) => [...prev, newUserMessage]);
    const currentInput = userInput;
    setUserInput("");
    setIsLoading(true);

    try {
      const historyString = chatHistory
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const response = await pdfChat({
        pdfDataUri: pdfDataUri,
        question: currentInput,
        chatHistory: historyString,
      });

      const modelMessage: Message = { role: "model", content: response.answer };
      setChatHistory((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => prev.slice(0, -1));
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

  const resetChat = () => {
    setChatHistory([]);
    setPdfFile(null);
    setPdfDataUri(null);
     if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    toast({
      title: "Chat Reset",
      description: "The chat and document have been cleared.",
    });
  };

  const downloadChat = () => {
     if (chatHistory.length === 0) {
      toast({
          title: "Nothing to download",
          description: "Chat history is empty.",
      });
      return;
    }
    const chatText = `Chat with ${pdfFile?.name || 'PDF'}\n\n` + chatHistory
      .map((msg) => `${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}: ${msg.content}`)
      .join("\n\n" + "-".repeat(20) + "\n\n");
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geminipdf-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground font-body">
      <header className="flex items-center justify-between border-b p-4 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
            <GeminiLogo className="text-primary" />
            <h1 className="text-xl font-bold">GeminiPDF Chat</h1>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Upload PDF
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
            <Button variant="outline" size="icon" onClick={downloadChat} aria-label="Download chat" disabled={chatHistory.length === 0}>
                <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={resetChat} aria-label="Reset chat">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4">
        <Card className="h-full w-full flex flex-col shadow-lg">
            {!pdfFile ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                    <svg data-ai-hint="document analysis" width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/50">
                        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 12H16V14H8V12ZM8 16H13V18H8V16Z" fill="currentColor"/>
                    </svg>
                    <h2 className="text-2xl font-semibold">Welcome to GeminiPDF Chat</h2>
                    <p className="text-muted-foreground">Upload a PDF document to start a conversation.</p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Select PDF
                    </Button>
                </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 border-b p-4">
                  <Paperclip className="text-primary h-5 w-5"/>
                  <h2 className="text-lg font-medium">{pdfFile.name}</h2>
                </div>
                <CardContent className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
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
                                {message.role === 'user' ? (
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                ) : (
                                    <div className="markdown-container text-sm">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
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
                </CardContent>
              </div>
            )}
        </Card>
      </main>

      <footer className="p-4 pt-0 shrink-0">
        <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={pdfDataUri ? "Ask a question about the PDF..." : "Upload a PDF to start chatting"}
            disabled={!pdfDataUri || isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!pdfDataUri || isLoading || !userInput.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </footer>
    </div>
  );
}
