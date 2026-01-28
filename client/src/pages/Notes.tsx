import React, { useState, useRef, useEffect } from "react";
import { useGamification } from "@/lib/gamification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Sparkles, CheckSquare, Share2, Plus, Search, FileText, MoreVertical, 
  ArrowLeft, Link as LinkIcon, Download, Copy, Users, Globe, Lock, Edit, 
  Trash2, Printer, Bold, Italic, Underline, Highlighter, List, ListOrdered, 
  Minus, Type, Heading1, Heading2, Palette, Strikethrough, Star, Filter, X,
  SortAsc, Calendar, Clock, BookmarkPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Note, InsertNote } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export default function Notes() {
  const { addXp } = useGamification();
  const { toast } = useToast();
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "title" | "updated">("date");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { userId } = useGamification(); // Get authenticated user ID
  
  // Forward ref for debounced save to use in speech recognition
  const debouncedSaveRef = useRef<((id: string, updates: Partial<InsertNote>) => void) | null>(null);

  // Speech recognition hook
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onTranscript: (text) => {
      // Append transcribed text to the note body
      if (editorRef.current && currentNote) {
        const currentContent = editorRef.current.innerHTML;
        editorRef.current.innerHTML = currentContent + (currentContent ? ' ' : '') + text;
        
        // Trigger auto-save with debounced save (using ref to avoid circular dependency)
        if (debouncedSaveRef.current) {
          debouncedSaveRef.current(currentNote.id, { body: editorRef.current.innerHTML });
        }
        
        toast({
          title: "Voice transcribed",
          description: `Added: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Voice recognition error",
        description: error,
        variant: "destructive",
      });
    },
    continuous: true,
  });

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
    queryFn: async () => {
      const res = await fetch(`/api/notes?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    staleTime: 0,
    gcTime: 0
  });

  const summarizeMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}/summarize`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate summary");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Summary Generated",
        description: "AI summary has been created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (note: InsertNote) => {
      const res = await apiRequest("POST", "/api/notes", { ...note, userId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create note");
      }
      return res.json();
    },
    onSuccess: (newNote) => {
      queryClient.setQueryData(["/api/notes"], (old: Note[] | undefined) => {
        return old ? [newNote, ...old] : [newNote];
      });
      setActiveNote(newNote.id);
      setIsEditing(true);
      toast({ title: "Note created" });
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot create note",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: Partial<InsertNote> }) => {
      const res = await apiRequest("PATCH", `/api/notes/${id}`, note);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      // Only show toast when explicitly stopping edit mode (not during auto-save)
      if (!saveTimeoutRef.current) {
        toast({ title: "Note saved" });
      }
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setActiveNote(null);
      toast({ title: "Note deleted" });
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const note = notes.find(n => n.id === id);
      if (!note) throw new Error("Note not found");
      const res = await apiRequest("PATCH", `/api/notes/${id}`, { 
        isFavorite: !note.isFavorite 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    }
  });

  const currentNote = notes.find(n => n.id === activeNote);

  // Sync content when entering edit mode
  useEffect(() => {
    if (isEditing && editorRef.current && currentNote) {
      editorRef.current.innerHTML = currentNote.body;
      setEditingTitle(currentNote.title);
    }
  }, [isEditing, activeNote]);

  // Debounced save function
  const debouncedSave = (id: string, updates: Partial<InsertNote>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 1 second of no typing
    saveTimeoutRef.current = setTimeout(() => {
      updateNoteMutation.mutate({ id, note: updates });
    }, 1000);
  };
  
  // Update ref so speech recognition can use it
  debouncedSaveRef.current = debouncedSave;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSummarize = () => {
    if (!activeNote) return;
    addXp(15);
    toast({ title: "AI Summary created" });
  };

  const handleTextToTask = () => {
    if (!activeNote) return;
    addXp(10);
    toast({ title: "Tasks added to Planner" });
  };

  const toggleRecord = () => {
    if (!isSpeechSupported) {
      toast({
        title: "Not supported",
        description: "Voice recognition is not supported in your browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (!currentNote) {
      toast({
        title: "No note selected",
        description: "Please create or select a note first.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      stopListening();
      toast({
        title: "Voice recording stopped",
        description: "Your speech has been transcribed to the note.",
      });
    } else {
      startListening();
      toast({
        title: "Listening...",
        description: "Speak clearly into your microphone.",
      });
    }
  };

  const handleDownload = () => {
    if (!currentNote) return;

    const content = `${currentNote.title}\n\n${editorRef.current?.innerText || currentNote.body}`;
    
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${currentNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    addXp(5);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://levelup.app/notes/share/${activeNote}`);
    toast({ title: "Link copied to clipboard" });
    addXp(5);
  };

  const handleCopyAll = () => {
    if (!currentNote) return;
    navigator.clipboard.writeText(`${currentNote.title}\n\n${editorRef.current?.innerText || ""}`);
    toast({ title: "Note content copied" });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    if (activeNote && confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(activeNote);
    }
  };

  const handleStopEditing = () => {
    if (activeNote && editorRef.current) {
      // Clear any pending debounced saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save immediately when stopping edit mode
      updateNoteMutation.mutate({
        id: activeNote,
        note: { 
          title: editingTitle,
          body: editorRef.current.innerHTML 
        }
      });
    }
    setIsEditing(false);
  };

  const handleCreateNote = () => {
    createNoteMutation.mutate({
      title: "Untitled Note",
      body: "",
      tags: "[]"
    });
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      notes.flatMap(note => {
        try {
          return JSON.parse(note.tags);
        } catch {
          return [];
        }
      })
    )
  );

  // Filter and sort notes
  let filteredNotes = notes.filter(n => {
    // Search filter
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tag filter
    const matchesTag = !selectedTag || (() => {
      try {
        const noteTags = JSON.parse(n.tags);
        return noteTags.includes(selectedTag);
      } catch {
        return false;
      }
    })();
    
    // Favorites filter
    const matchesFavorite = !showFavoritesOnly || n.isFavorite;
    
    return matchesSearch && matchesTag && matchesFavorite;
  });

  // Sort notes
  filteredNotes = filteredNotes.sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "updated") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Formatting Commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertChecklist = () => {
    const html = '<ul style="list-style: none; padding-left: 0;"><li style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" style="margin: 0; width: 1.2em; height: 1.2em; accent-color: hsl(var(--primary));"> <span>Checklist Item</span></li></ul>';
    document.execCommand('insertHTML', false, html);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6">
      {/* Sidebar List */}
      <div className={cn(
        "w-full md:w-80 flex-col gap-4 h-full",
        activeNote ? "hidden md:flex" : "flex"
      )}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search notes..." 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button size="icon" onClick={handleCreateNote}><Plus className="h-4 w-4" /></Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button 
              variant={showFavoritesOnly ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="flex-1"
            >
              <Star className={cn("h-4 w-4 mr-2", showFavoritesOnly && "fill-current")} />
              Favorites
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("date")}>
                  <Calendar className="mr-2 h-4 w-4" /> Created Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("updated")}>
                  <Clock className="mr-2 h-4 w-4" /> Last Updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title")}>
                  <Type className="mr-2 h-4 w-4" /> Title (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Tags:
              </span>
              {selectedTag && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setSelectedTag(null)}
                  className="h-6 px-2 text-xs"
                >
                  All
                  <X className="h-3 w-3 ml-1" />
                </Button>
              )}
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className="h-6 px-2 text-xs"
                >
                  #{tag}
                </Button>
              ))}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div 
                key={note.id}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm text-left relative group",
                  activeNote === note.id ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border"
                )}
              >
                <div onClick={() => setActiveNote(note.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold truncate flex-1">{note.title}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteMutation.mutate(note.id);
                        toast({
                          title: note.isFavorite ? "Removed from favorites" : "Added to favorites",
                        });
                      }}
                    >
                      <Star className={cn("h-4 w-4", note.isFavorite && "fill-amber-400 text-amber-400")} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {note.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                     {JSON.parse(note.tags).map((tag: string) => (
                       <span key={tag} className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-md font-medium">#{tag}</span>
                     ))}
                     <span className="text-[10px] text-muted-foreground ml-auto">
                       {new Date(note.createdAt).toLocaleDateString()}
                     </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Editor Area */}
      <div className={cn(
        "flex-1 flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-full",
        activeNote ? "flex" : "hidden md:flex"
      )}>
        {activeNote && currentNote ? (
          <>
            {/* Toolbar */}
            <div className="border-b border-border p-4 flex flex-col gap-4 bg-muted/30">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden mr-1" 
                    onClick={() => setActiveNote(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant={isListening ? "destructive" : "outline"} 
                    size="sm" 
                    onClick={toggleRecord}
                    className={cn("gap-2 rounded-full transition-all whitespace-nowrap", isListening && "animate-pulse")}
                    disabled={!isSpeechSupported}
                  >
                    <Mic className="h-4 w-4" /> {isListening ? "Stop" : "Voice"}
                  </Button>
                  <div className="h-4 w-px bg-border mx-1"></div>
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50 hover:text-purple-700 whitespace-nowrap" onClick={handleSummarize}>
                    <Sparkles className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">AI Summarize</span><span className="sm:hidden">AI</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleTextToTask} className="whitespace-nowrap">
                    <CheckSquare className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Text-to-Task</span><span className="sm:hidden">Tasks</span>
                  </Button>
                  
                  {/* Tags Editor */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="whitespace-nowrap">
                        <BookmarkPlus className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Tags</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage Tags</DialogTitle>
                        <DialogDescription>
                          Add or remove tags to organize this note.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {currentNote && JSON.parse(currentNote.tags).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              #{tag}
                              <button
                                onClick={() => {
                                  const currentTags = JSON.parse(currentNote.tags);
                                  const newTags = currentTags.filter((t: string) => t !== tag);
                                  updateNoteMutation.mutate({
                                    id: activeNote!,
                                    note: { tags: JSON.stringify(newTags) }
                                  });
                                }}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            id="new-tag" 
                            placeholder="Add new tag..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && currentNote) {
                                const input = e.currentTarget;
                                const newTag = input.value.trim().toLowerCase();
                                if (newTag) {
                                  const currentTags = JSON.parse(currentNote.tags);
                                  if (!currentTags.includes(newTag)) {
                                    updateNoteMutation.mutate({
                                      id: activeNote!,
                                      note: { tags: JSON.stringify([...currentTags, newTag]) }
                                    });
                                  }
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <Button 
                            onClick={() => {
                              const input = document.getElementById('new-tag') as HTMLInputElement;
                              const newTag = input.value.trim().toLowerCase();
                              if (newTag && currentNote) {
                                const currentTags = JSON.parse(currentNote.tags);
                                if (!currentTags.includes(newTag)) {
                                  updateNoteMutation.mutate({
                                    id: activeNote!,
                                    note: { tags: JSON.stringify([...currentTags, newTag]) }
                                  });
                                }
                                input.value = '';
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Share Note</DialogTitle>
                        <DialogDescription>
                          Collaborate with friends or export your notes.
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="link" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="link">Share Link</TabsTrigger>
                          <TabsTrigger value="export">Export File</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="link" className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="access" className="text-sm font-medium">
                                General Access
                              </Label>
                              <Select defaultValue="viewer">
                                <SelectTrigger className="w-[130px] h-9">
                                  <SelectValue placeholder="Access" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">
                                    <div className="flex items-center gap-2">
                                      <Lock className="h-3 w-3" />
                                      <span>Viewer</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="commenter">Commenter</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex gap-2">
                              <div className="flex-1 flex items-center gap-2 rounded-md border px-3 py-2.5 bg-muted/30">
                                <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <input 
                                  type="text" 
                                  readOnly 
                                  value={`https://levelup.app/notes/share/${activeNote?.substring(0, 8)}`}
                                  className="text-sm bg-transparent border-none outline-none flex-1 min-w-0 text-muted-foreground"
                                />
                              </div>
                              <Button size="sm" className="h-auto px-3 py-2.5" onClick={handleCopyLink}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-sm font-medium">Share to Platform</h4>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-full text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://levelup.app/notes/share/${activeNote}`)}`, '_blank')}
                                  title="Share on Facebook"
                                >
                                  <Globe className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-full text-sky-500 border-sky-200 bg-sky-50 hover:bg-sky-100"
                                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://levelup.app/notes/share/${activeNote}`)}&text=${encodeURIComponent("Check out my study notes on LevelUp!")}`, '_blank')}
                                  title="Share on Twitter"
                                >
                                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-full text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://levelup.app/notes/share/${activeNote}`)}`, '_blank')}
                                  title="Share on LinkedIn"
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="export" className="space-y-4">
                          <div className="rounded-lg border p-4 bg-muted/20">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">Text File (.txt)</h4>
                                <p className="text-sm text-muted-foreground">Simple text format, editable in any editor.</p>
                              </div>
                            </div>
                          </div>
                          <Button className="w-full" onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" /> Download Note
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => isEditing ? handleStopEditing() : setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" /> {isEditing ? "Stop Editing" : "Edit Note"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyAll}>
                        <Copy className="mr-2 h-4 w-4" /> Copy All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Formatting Bar - Only visible in edit mode */}
              {isEditing && (
                <div className="flex flex-wrap items-center gap-1 p-1 bg-background rounded-lg border animate-in slide-in-from-top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1 px-2">
                        <Type className="h-4 w-4" /> <span className="sr-only">Style</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => execCmd('formatBlock', 'H1')}><Heading1 className="mr-2 h-4 w-4" /> Heading 1</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => execCmd('formatBlock', 'H2')}><Heading2 className="mr-2 h-4 w-4" /> Heading 2</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => execCmd('formatBlock', 'P')}>Paragraph</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="w-px h-4 bg-border mx-1" />

                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('bold')} title="Bold"><Bold className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('italic')} title="Italic"><Italic className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('underline')} title="Underline"><Underline className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('strikeThrough')} title="Strikethrough"><Strikethrough className="h-4 w-4" /></Button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8" title="Text Color"><Palette className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-3">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Text Color</p>
                        <div className="grid grid-cols-6 gap-2">
                          {['#000000', '#374151', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#FFFFFF'].map(color => (
                            <button 
                              key={color} 
                              className="w-6 h-6 rounded border border-border shadow-sm hover:scale-110 transition-transform" 
                              style={{ backgroundColor: color }}
                              onClick={() => execCmd('foreColor', color)}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8" title="Highlight"><Highlighter className="h-4 w-4 text-yellow-500" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2">
                      <div className="grid grid-cols-4 gap-2">
                        {['#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FF0000', '#FFA500', '#FFFFFF', 'transparent'].map(color => (
                          <button 
                            key={color} 
                            className="w-6 h-6 rounded-full border border-border shadow-sm" 
                            style={{ backgroundColor: color }}
                            onClick={() => execCmd('hiliteColor', color)}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="w-px h-4 bg-border mx-1" />

                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('insertUnorderedList')} title="Bullet List"><List className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('insertOrderedList')} title="Numbered List"><ListOrdered className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertChecklist()} title="Checklist"><CheckSquare className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('insertHTML', '<hr/>')} title="Divider"><Minus className="h-4 w-4" /></Button>
                  
                  <div className="w-px h-4 bg-border mx-1" />
                  
                  <Select onValueChange={(val) => execCmd('fontSize', val)}>
                    <SelectTrigger className="w-[60px] h-8 border-none shadow-none">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                       {[1, 2, 3, 4, 5, 6, 7].map(size => (
                         <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-8 font-serif text-lg leading-relaxed outline-none overflow-y-auto relative">
              {isEditing ? (
                <div className="h-full flex flex-col gap-4">
                  <Input 
                    value={editingTitle} 
                    onChange={(e) => {
                      setEditingTitle(e.target.value);
                      debouncedSave(activeNote, { title: e.target.value });
                    }}
                    className="text-3xl font-bold font-heading h-auto p-2 border-none focus-visible:ring-0 px-0"
                    placeholder="Note Title"
                  />
                  <div 
                    ref={editorRef}
                    className="flex-1 outline-none font-serif text-lg leading-relaxed prose prose-lg max-w-none dark:prose-invert empty:before:content-['Start_typing...'] empty:before:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                      if (editorRef.current) {
                        debouncedSave(activeNote, { body: editorRef.current.innerHTML });
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold font-heading mb-6 text-foreground">{currentNote.title}</h1>
                  <div 
                    className="whitespace-pre-wrap mb-8 prose prose-lg max-w-none dark:prose-invert [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1"
                    dangerouslySetInnerHTML={{ __html: currentNote.body }} 
                  />
                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg my-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> AI Summary
                      </h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => summarizeMutation.mutate(currentNote.id)}
                        disabled={summarizeMutation.isPending}
                        className="bg-white hover:bg-yellow-50"
                      >
                        {summarizeMutation.isPending ? (
                          <>
                            <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            {currentNote.aiSummary ? "Regenerate" : "Generate Summary"}
                          </>
                        )}
                      </Button>
                    </div>
                    {currentNote.aiSummary ? (
                      <p className="text-sm text-yellow-900">{currentNote.aiSummary}</p>
                    ) : (
                      <p className="text-sm text-yellow-700 italic">
                        Click "Generate Summary" to create an AI-powered summary of this note.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 opacity-20" />
            <p>{isLoading ? "Loading notes..." : "Select a note to start editing or creating."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
