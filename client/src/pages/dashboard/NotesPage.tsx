import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/RichTextEditor";
import { 
  Plus, Trash2, Loader2, BookOpen, FileText, Maximize2, Minimize2,
  Type, Palette, Grid3x3, X
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Notebook {
  id: number;
  userId: number;
  title: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface Note {
  id: number;
  notebookId: number;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

// Removed multiple background colors - now just light/dark mode

const FONTS = [
  { name: "Sans Serif", value: "system-ui, -apple-system, sans-serif" },
  { name: "Serif", value: "Georgia, serif" },
  { name: "Monospace", value: "monospace" },
  { name: "Handwriting", value: "'Comic Sans MS', cursive" },
];

const PAPER_STYLES = [
  { name: "Blank", value: "blank" },
  { name: "Ruled", value: "ruled" },
  { name: "Grid", value: "grid" },
  { name: "Dotted", value: "dotted" },
];

export default function NotesPage() {
  const queryClient = useQueryClient();
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editor customization states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const backgroundColor = isDarkMode ? "#1E1E1E" : "#FFFFFF";
  const textColor = isDarkMode ? "#FFFFFF" : "#000000";
  const [fontFamily, setFontFamily] = useState("system-ui, -apple-system, sans-serif");
  const [paperStyle, setPaperStyle] = useState("blank");

  // Fetch notebooks
  const { data: notebooks = [], isLoading: loadingNotebooks } = useQuery<Notebook[]>({
    queryKey: ["/api/notes/notebooks"],
  });

  // Fetch notes for selected notebook
  const { data: notes = [], isLoading: loadingNotes } = useQuery<Note[]>({
    queryKey: ["/api/notes/notebooks", selectedNotebook?.id, "notes"],
    enabled: !!selectedNotebook,
  });

  // Create notebook mutation
  const createNotebookMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch("/api/notes/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title,
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
        }),
      });
      if (!response.ok) throw new Error("Failed to create notebook");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/notebooks"] });
      setShowNewNotebook(false);
      setNewNotebookTitle("");
    },
  });

  // Delete notebook mutation
  const deleteNotebookMutation = useMutation({
    mutationFn: async (notebookId: number) => {
      const response = await fetch(`/api/notes/notebooks/${notebookId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete notebook");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/notebooks"] });
      if (selectedNotebook) {
        setSelectedNotebook(null);
        setSelectedNote(null);
      }
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedNotebook) return;
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId: selectedNotebook.id,
          title: "Untitled Note",
          content: "",
        }),
      });
      if (!response.ok) throw new Error("Failed to create note");
      return response.json();
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/notebooks", selectedNotebook?.id, "notes"] });
      setSelectedNote(newNote);
      setNoteTitle(newNote.title);
      setNoteContent(newNote.content || "");
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, title, content }: { noteId: number; title: string; content: string }) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!response.ok) throw new Error("Failed to update note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/notebooks", selectedNotebook?.id, "notes"] });
      setIsSaving(false);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/notebooks", selectedNotebook?.id, "notes"] });
      setSelectedNote(null);
      setNoteTitle("");
      setNoteContent("");
    },
  });

  // Auto-save effect
  useEffect(() => {
    if (selectedNote && (noteContent !== selectedNote.content || noteTitle !== selectedNote.title)) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      
      setIsSaving(true);
      const timeout = setTimeout(() => {
        updateNoteMutation.mutate({
          noteId: selectedNote.id,
          title: noteTitle,
          content: noteContent,
        });
      }, 2000);
      
      setAutoSaveTimeout(timeout);
    }
  }, [noteContent, noteTitle]);

  // Load selected note
  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteContent(selectedNote.content || "");
    }
  }, [selectedNote]);

  // Handle delete notebook
  const handleDeleteNotebook = (notebook: Notebook) => {
    if (confirm(`Are you sure you want to delete "${notebook.title}"? All notes in this notebook will be deleted.`)) {
      deleteNotebookMutation.mutate(notebook.id);
    }
  };

  // Handle delete note
  const handleDeleteNote = (note: Note) => {
    if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
      deleteNoteMutation.mutate(note.id);
    }
  };

  // Get paper style CSS
  const getPaperStyleCSS = () => {
    switch (paperStyle) {
      case "ruled":
        return {
          backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #ccc 31px, #ccc 32px)",
          backgroundSize: "100% 32px",
          backgroundPosition: "0 8px", // Align with text baseline
        };
      case "grid":
        return {
          backgroundImage: "linear-gradient(#e0e0e0 1px, transparent 1px), linear-gradient(90deg, #e0e0e0 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        };
      case "dotted":
        return {
          backgroundImage: "radial-gradient(circle, #e0e0e0 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        };
      default:
        return {};
    }
  };

  // Full-screen editor component
  if (isFullScreen && selectedNote) {
    return (
      <div 
        className="fixed inset-0 z-50 flex flex-col"
        style={{ 
          backgroundColor,
          color: textColor,
          ...getPaperStyleCSS()
        }}
      >
        {/* Full-screen toolbar */}
        <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: backgroundColor === "#1E1E1E" ? "#2D2D2D" : "rgba(255,255,255,0.95)", color: textColor, borderColor: backgroundColor === "#1E1E1E" ? "#444" : "#e0e0e0" }}>
          <Input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="text-2xl font-bold border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ color: textColor }}
            placeholder="Note title"
          />
          <div className="flex items-center gap-2">
            {isSaving && <span className="text-sm text-muted-foreground">Saving...</span>}

            {/* Font selector */}
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="px-3 py-2 border rounded bg-white text-black"
            >
              {FONTS.map(font => (
                <option key={font.value} value={font.value}>{font.name}</option>
              ))}
            </select>

            {/* Paper style selector */}
            <select
              value={paperStyle}
              onChange={(e) => setPaperStyle(e.target.value)}
              className="px-3 py-2 border rounded bg-white text-black"
            >
              {PAPER_STYLES.map(style => (
                <option key={style.value} value={style.value}>{style.name}</option>
              ))}
            </select>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsFullScreen(false)}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Full-screen editor */}
        <div className="flex-1 overflow-auto" style={{ fontFamily }}>
          <RichTextEditor
            content={noteContent}
            onChange={setNoteContent}
            fullScreen={true}
            textColor={textColor}
          />
        </div>
      </div>
    );
  }

  // Normal three-panel layout
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Notebooks panel */}
      <div className="w-64 border-r pr-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Notebooks
          </h3>
          <Button size="sm" onClick={() => setShowNewNotebook(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto space-y-2">
          {loadingNotebooks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : notebooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notebooks yet. Create one to get started!
            </p>
          ) : (
            notebooks.map(notebook => (
              <div
                key={notebook.id}
                className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors group ${
                  selectedNotebook?.id === notebook.id ? "bg-accent" : ""
                }`}
                onClick={() => setSelectedNotebook(notebook)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: notebook.color }}
                    />
                    <span className="text-sm font-medium truncate">{notebook.title}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotebook(notebook);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notes list panel */}
      <div className="w-64 border-r pr-4 flex flex-col">
        {selectedNotebook ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </h3>
              <Button 
                size="sm" 
                onClick={() => createNoteMutation.mutate()}
                disabled={createNoteMutation.isPending}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-2">
              {loadingNotes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No notes yet. Create one!
                </p>
              ) : (
                notes.map(note => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors group ${
                      selectedNote?.id === note.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1">{note.title}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center">
              Select a notebook to view notes
            </p>
          </div>
        )}
      </div>

      {/* Editor panel */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="text-2xl font-bold border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                placeholder="Note title"
              />
              <div className="flex items-center gap-2">
                {isSaving && <span className="text-sm text-muted-foreground">Saving...</span>}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsFullScreen(true)}
                  title="Full screen"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <RichTextEditor
                content={noteContent}
                onChange={setNoteContent}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-muted-foreground">
              {selectedNotebook 
                ? "Select a note to start editing"
                : "Select a notebook to view notes"}
            </p>
          </div>
        )}
      </div>

      {/* Create notebook dialog */}
      <Dialog open={showNewNotebook} onOpenChange={setShowNewNotebook}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Notebook</DialogTitle>
            <DialogDescription>Create a new notebook to organize your notes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Notebook Title *</Label>
              <Input
                id="title"
                value={newNotebookTitle}
                onChange={(e) => setNewNotebookTitle(e.target.value)}
                placeholder="e.g., Class Notes, Personal"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewNotebook(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createNotebookMutation.mutate(newNotebookTitle)}
                disabled={!newNotebookTitle || createNotebookMutation.isPending}
              >
                {createNotebookMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
