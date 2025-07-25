
"use client";
import { useState, useRef, useEffect, type SVGProps, memo, use } from "react";
import { useToast } from "@/hooks/use-toast";
import { pdfChat } from "@/ai/flows/pdf-chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Upload, Trash2, Loader2, Paperclip, Plus, MessageSquare } from 'lucide-react';
import { GrugIcon } from "@/components/icons/custom-icon";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '@/components/app/header';
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

type Message = {
  role: "user" | "model";
  content: string;
};

type ChatSession = {
  id: string;
  fileName: string; 
  fileDataUri: string;
  chatHistory: Message[];
}

// A version of ChatSession that is safe to store in localStorage
type SerializableChatSession = Omit<ChatSession, 'pdfFile'>;


const WelcomeIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
        width="100"
        height="100"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 12H16V14H8V12ZM8 16H13V18H8V16Z"
            fill="currentColor"
        />
    </svg>
);

const AnimatedMessage = ({ message, onAnimationComplete }: { message: Message, onAnimationComplete: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const fullContent = message.content;

  useEffect(() => {
    setDisplayedContent('');
    if (message.role === 'model') {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedContent(fullContent.slice(0, i + 1));
        i++;
        if (i > fullContent.length) {
          clearInterval(intervalId);
          onAnimationComplete();
        }
      }, 20); // Adjust typing speed here
      return () => clearInterval(intervalId);
    } else {
      setDisplayedContent(fullContent);
      onAnimationComplete();
    }
  }, [fullContent, message.role, onAnimationComplete]);

  return (
      <div className="markdown-container text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayedContent}
          </ReactMarkdown>
      </div>
  );
};

const ChatMessages = memo(({ chatHistory, isLoading, isLastMessageAnimating }: { chatHistory: Message[], isLoading: boolean, isLastMessageAnimating: boolean}) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isLoading]);

    const lastMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;

    return (
      <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
        <div className="space-y-6">
            {chatHistory.slice(0, -1).map((message, index) => (
                <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'model' && (
                    <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="bg-primary/20 text-primary"><GrugIcon className="h-5 w-5"/></AvatarFallback>
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

            {lastMessage && (
                 <div key={chatHistory.length -1} className={`flex items-start gap-4 ${lastMessage.role === 'user' ? 'justify-end' : ''}`}>
                    {lastMessage.role === 'model' && (
                        <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="bg-primary/20 text-primary"><GrugIcon className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                    )}
                    <div className={`max-w-[75%] rounded-lg p-3 shadow-sm ${
                            lastMessage.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card'
                        }`}>
                            {lastMessage.role === 'model' && isLastMessageAnimating ? (
                                <AnimatedMessage message={lastMessage} onAnimationComplete={scrollToBottom} />
                            ) : (
                                <div className="markdown-container text-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {lastMessage.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                    </div>
                    {lastMessage.role === 'user' && (
                        <Avatar className="h-8 w-8 border">
                            <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                    )}
                </div>
            )}

            {isLoading && (
                <div className="flex items-start gap-4">
                <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-primary/20 text-primary"><GrugIcon className="h-5 w-5"/></AvatarFallback>
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
    );
});
ChatMessages.displayName = 'ChatMessages';

const Page = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex h-full bg-background text-foreground font-body">
                <Header />
                <aside className="w-1/6 flex-col border-r bg-card hidden sm:flex p-4 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </aside>
                <main className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </main>
            </div>
        );
    }
    
    return <Home />;
}

export default Page;


function Home() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);

  const getStorageKey = () => user ? `chatSessions_${user.uid}` : null;

  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const savedSessions = localStorage.getItem(storageKey);
      if (savedSessions) {
        const parsedSessions: SerializableChatSession[] = JSON.parse(savedSessions);
        setSessions(parsedSessions);
        if (parsedSessions.length > 0 && !activeChatId) {
            setActiveChatId(parsedSessions[0].id);
        }
      }
    } catch (error) {
        console.error("Failed to load sessions from localStorage", error);
        toast({
            title: "Could not load chats",
            description: "Your previous chat history could not be restored from this browser.",
            variant: "destructive",
        })
    }
  }, [user]);

  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }

    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    try {
        const sessionsToSave: SerializableChatSession[] = sessions.map(({ fileName, fileDataUri, ...rest }) => ({
            ...rest,
            fileName,
            fileDataUri,
        }));
        localStorage.setItem(storageKey, JSON.stringify(sessionsToSave));
    } catch (error) {
        console.error("Failed to save sessions to localStorage", error);
        toast({
            title: "Could not save chats",
            description: "There was an issue saving your chats to this browser.",
            variant: "destructive",
        })
    }
  }, [sessions, user]);


  const activeSession = sessions.find(s => s.id === activeChatId) || null;
  const chatHistory = activeSession?.chatHistory || [];

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
      setIsAnimating(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        const newSession: ChatSession = {
          id: newSessionId,
          fileName: file.name,
          fileDataUri: e.target?.result as string,
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
    const originalHistory = activeSession.chatHistory;
    
    setIsAnimating(false);

    const updatedHistoryWithUser = [...originalHistory, newUserMessage];
    setSessions(prev => prev.map(s => 
      s.id === activeChatId ? { ...s, chatHistory: updatedHistoryWithUser } : s
    ));
    setUserInput("");
    setIsLoading(true);

    try {
      const historyString = updatedHistoryWithUser
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const response = await pdfChat({
        documentDataUri: activeSession.fileDataUri,
        question: currentInput,
        chatHistory: historyString,
      });

      const modelMessage: Message = { role: "model", content: response.answer };
      setSessions(prev => prev.map(s => 
        s.id === activeChatId ? { ...s, chatHistory: [...updatedHistoryWithUser, modelMessage] } : s
      ));
      setIsAnimating(true);
    } catch (error) {
      console.error(error);
       setSessions(prev => prev.map(s => 
        s.id === activeChatId ? { ...s, chatHistory: originalHistory } : s
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
    const sessionName = sessions.find(s => s.id === sessionToDelete)?.fileName;
    setIsAnimating(false);

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
    setIsAnimating(false);
    setActiveChatId(sessionId);
  }

  const renderWelcomeScreen = () => (
     <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <WelcomeIcon className="text-muted-foreground/50" />
        <h2 className="text-2xl font-semibold">Grug (Rhymes with Grug)</h2>
        <p className="text-muted-foreground">Upload a PDF document to start a conversation.</p>
        <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Select PDF
        </Button>
    </div>
  );

  const renderChatInterface = () => {
    const isLastMessageAnimating = isAnimating && !isLoading && (chatHistory.at(-1)?.role === 'model');

    return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b p-4 shrink-0">
        <div className="flex items-center gap-3">
          <Paperclip className="text-primary h-5 w-5"/>
          <h2 className="text-lg font-medium truncate">{activeSession?.fileName}</h2>
        </div>
      </div>
      <ChatMessages chatHistory={chatHistory} isLoading={isLoading} isLastMessageAnimating={isLastMessageAnimating} />
       <div className="border-t p-4 shrink-0">
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
            Running on model: googleai/gemini-2.0-flash-lite
           </p>
        </div>
    </div>
  )};

  return (
    <div className="flex h-full bg-background text-foreground font-body">
      <Header />
      {/* Sidebar */}
      <aside className="w-1/6 flex-col border-r bg-card hidden sm:flex">
        <div className="p-4">
          <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
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
              <div key={session.id} className="group relative w-full">
                <Button
                  size="sm"
                  variant={session.id === activeChatId ? "default" : "outline"}
                  onClick={() => selectChat(session.id)}
                  className="w-full justify-start pr-8 grid grid-cols-[auto,1fr] items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="overflow-hidden text-left">
                    <span className="truncate block">{session.fileName}</span>
                  </div>
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
              "{sessions.find(s => s.id === sessionToDelete)?.fileName}".
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
