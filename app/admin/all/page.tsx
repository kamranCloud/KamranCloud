"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Loader2, Edit, Trash, ExternalLink, MoreVertical, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { collection, getDocs, doc, updateDoc, arrayRemove, arrayUnion, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course, Year, Subject, Chapter, Content } from "@/types";
import { toast } from "sonner";

// Extend content to include its location for easier filtering/moving
interface ContentWithLocation extends Content {
  courseId: string;
  yearId: string;
  subjectId: string;
  chapterId: string;
  chapterName: string;
}

// A specific card for the admin panel with action buttons
const AdminContentCard = ({ content, onEdit, onDelete }: { content: ContentWithLocation, onEdit: () => void, onDelete: () => void }) => {
  if (content.type === 'notes') {
    return (
      <div className="flex flex-col h-full bg-destructive/10 rounded-2xl border-2 border-destructive/20 shadow-doodle overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-destructive">
          <FileText className="w-10 h-10 mb-2" />
          <h4 className="font-bold text-sm md:text-md text-foreground mb-1 line-clamp-2">{content.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">Chapter: {content.chapterName}</p>
        </div>
        <div className="p-2 bg-card/50 border-t-2 border-destructive/20 flex justify-evenly items-center gap-2">
          <Button size="sm" variant="ghost" asChild><a href={content.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
          <Button size="sm" variant="ghost" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  }

  // Video/Playlist Card
  const thumbnailUrl = content.thumbnail || `https://img.youtube.com/vi/${content.url.split('v=')[1]?.split('&')[0]}/mqdefault.jpg`;
  
  return (
    <div className="flex flex-col h-full bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border transition-smooth overflow-hidden">
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img src={thumbnailUrl} alt={content.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h4 className="font-bold text-sm text-foreground mb-2 flex-1 line-clamp-2">{content.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">Chapter: {content.chapterName}</p>
        <div className="flex justify-evenly items-center gap-1 md:gap-2 border-t pt-2">
           <Button size="sm" variant="ghost" asChild><a href={content.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
           <Button size="sm" variant="ghost" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
           <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};


export default function AllContentPage() {
  const router = useRouter();
  
  // Data states
  const [allContent, setAllContent] = useState<ContentWithLocation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  // Loading and filter states
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    courseId: '',
    yearId: '',
    subjectId: '',
    chapterId: '',
    type: '',
  });

  // Modal/Dialog states
  const [editingContent, setEditingContent] = useState<ContentWithLocation | null>(null);
  const [deletingContent, setDeletingContent] = useState<ContentWithLocation | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '' });
  const [editLocation, setEditLocation] = useState({ courseId: '', yearId: '', subjectId: '', chapterId: ''});

  // State for edit modal dropdowns
  const [modalYears, setModalYears] = useState<Year[]>([]);
  const [modalSubjects, setModalSubjects] = useState<Subject[]>([]);
  const [modalChapters, setModalChapters] = useState<Chapter[]>([]);

  // Effect to populate edit form when `editingContent` changes
  useEffect(() => {
    if (editingContent) {
      setEditFormData({
        title: editingContent.title,
        description: editingContent.description || '',
      });
      setEditLocation({
        courseId: editingContent.courseId,
        yearId: editingContent.yearId,
        subjectId: editingContent.subjectId,
        chapterId: editingContent.chapterId,
      });
    }
  }, [editingContent]);

  // Cascading logic for EDIT MODAL
  useEffect(() => {
    if (editLocation.courseId) {
      const fetchYears = async () => {
        const querySnapshot = await getDocs(collection(db, `courses/${editLocation.courseId}/years`));
        setModalYears(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Year)).sort((a,b) => a.order - b.order));
      };
      fetchYears();
    }
  }, [editLocation.courseId]);

  useEffect(() => {
    if (editLocation.yearId) {
      const fetchSubjects = async () => {
        const querySnapshot = await getDocs(collection(db, `courses/${editLocation.courseId}/years/${editLocation.yearId}/subjects`));
        setModalSubjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)).sort((a,b) => a.order - b.order));
      };
      fetchSubjects();
    }
  }, [editLocation.yearId]);

  useEffect(() => {
    if (editLocation.subjectId) {
      const fetchChapters = async () => {
        const querySnapshot = await getDocs(collection(db, `courses/${editLocation.courseId}/years/${editLocation.yearId}/subjects/${editLocation.subjectId}/chapters`));
        setModalChapters(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter)).sort((a,b) => a.order - b.order));
      };
      fetchChapters();
    }
  }, [editLocation.subjectId]);

  // Fetch all data on initial load
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesData: Course[] = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)).sort((a,b) => a.order - b.order);
        setCourses(coursesData);
        
        let contentList: ContentWithLocation[] = [];
        for (const course of coursesData) {
          const yearsSnapshot = await getDocs(collection(db, `courses/${course.id}/years`));
          for (const yearDoc of yearsSnapshot.docs) {
            const subjectsSnapshot = await getDocs(collection(db, `courses/${course.id}/years/${yearDoc.id}/subjects`));
            for (const subjectDoc of subjectsSnapshot.docs) {
              const chaptersSnapshot = await getDocs(collection(db, `courses/${course.id}/years/${yearDoc.id}/subjects/${subjectDoc.id}/chapters`));
              chaptersSnapshot.forEach(chapterDoc => {
                const chapterData = chapterDoc.data() as Chapter;
          if (chapterData.content && Array.isArray(chapterData.content)) {
                  const contentWithLocation = chapterData.content.map(c => ({
                    ...c,
                    courseId: course.id,
                    yearId: yearDoc.id,
                    subjectId: subjectDoc.id,
                    chapterId: chapterDoc.id,
                    chapterName: chapterData.name,
                  }));
                  contentList.push(...contentWithLocation);
                }
              });
            }
          }
        }
        setAllContent(contentList);
      } catch (error) {
        console.error("Error fetching all content:", error);
        toast.error("Failed to load content.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Cascading logic for filters
  useEffect(() => {
    if (filters.courseId) {
      const fetchYears = async () => {
        const querySnapshot = await getDocs(collection(db, `courses/${filters.courseId}/years`));
        setYears(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Year)).sort((a,b) => a.order - b.order));
      };
      fetchYears();
    } else {
      setYears([]);
    }
  }, [filters.courseId]);

  useEffect(() => {
    if (filters.yearId) {
      const fetchSubjects = async () => {
        const querySnapshot = await getDocs(collection(db, `courses/${filters.courseId}/years/${filters.yearId}/subjects`));
        setSubjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)).sort((a,b) => a.order - b.order));
      };
      fetchSubjects();
    } else {
      setSubjects([]);
    }
  }, [filters.yearId]);

  useEffect(() => {
    if (filters.subjectId) {
      const fetchChapters = async () => {
        const querySnapshot = await getDocs(collection(db, `courses/${filters.courseId}/years/${filters.yearId}/subjects/${filters.subjectId}/chapters`));
        setChapters(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter)).sort((a,b) => a.order - b.order));
      };
      fetchChapters();
    } else {
      setChapters([]);
    }
  }, [filters.subjectId]);

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'courseId') {
        newState.yearId = '';
        newState.subjectId = '';
        newState.chapterId = '';
      }
      if (field === 'yearId') {
        newState.subjectId = '';
        newState.chapterId = '';
      }
      if (field === 'subjectId') {
        newState.chapterId = '';
      }
      return newState;
    });
  };

  // Memoized filtering logic
  const filteredContent = useMemo(() => {
    return allContent
      .filter(c => filters.courseId ? c.courseId === filters.courseId : true)
      .filter(c => filters.yearId ? c.yearId === filters.yearId : true)
      .filter(c => filters.subjectId ? c.subjectId === filters.subjectId : true)
      .filter(c => filters.chapterId ? c.chapterId === filters.chapterId : true)
      .filter(c => filters.type ? c.type === filters.type : true)
      .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allContent, filters, searchQuery]);

  // Delete handler
  const handleDelete = async () => {
    if (!deletingContent) return;
    try {
      const response = await fetch('/api/delete-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentItem: deletingContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete content.');
      }

      // Update local state to reflect deletion
      setAllContent(prev => prev.filter(c => c.id !== deletingContent.id));
      toast.success("Content deleted successfully.");
    } catch (error: any) {
      console.error("Error deleting content:", error);
      toast.error(error.message);
    } finally {
      setDeletingContent(null);
    }
  };
  
  const handleEditLocationChange = (field: 'courseId' | 'yearId' | 'subjectId' | 'chapterId', value: string) => {
    setEditLocation(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'courseId') {
        newState.yearId = '';
        newState.subjectId = '';
        newState.chapterId = '';
        setModalSubjects([]);
        setModalChapters([]);
      }
      if (field === 'yearId') {
        newState.subjectId = '';
        newState.chapterId = '';
        setModalChapters([]);
      }
      if (field === 'subjectId') {
        newState.chapterId = '';
      }
      return newState;
    });
  };

  // Edit handler
  const handleEdit = async () => {
    if (!editingContent || !editLocation.chapterId) {
      toast.error("Please fill all fields, including the new location.");
      return;
    }

    const originalContent: Content = {
      id: editingContent.id,
      type: editingContent.type,
      title: editingContent.title,
      url: editingContent.url,
      thumbnail: editingContent.thumbnail,
      description: editingContent.description,
    };

    const originalLocation = {
      courseId: editingContent.courseId,
      yearId: editingContent.yearId,
      subjectId: editingContent.subjectId,
      chapterId: editingContent.chapterId,
    };

    const newLocation = editLocation;

    const updatedContent: Content = {
      ...originalContent,
      title: editFormData.title,
      description: editFormData.description,
    };
    
    // Clean objects by removing undefined properties before sending to Firestore
    const cleanObject = (obj: any) => JSON.parse(JSON.stringify(obj));

    try {
      const batch = writeBatch(db);

      // 1. Remove from old chapter
      const oldChapterRef = doc(db, `courses/${originalLocation.courseId}/years/${originalLocation.yearId}/subjects/${originalLocation.subjectId}/chapters/${originalLocation.chapterId}`);
      batch.update(oldChapterRef, { content: arrayRemove(cleanObject(originalContent)) });

      // 2. Add to new chapter
      const newChapterRef = doc(db, `courses/${newLocation.courseId}/years/${newLocation.yearId}/subjects/${newLocation.subjectId}/chapters/${newLocation.chapterId}`);
      batch.update(newChapterRef, { content: arrayUnion(cleanObject(updatedContent)) });

      await batch.commit();

      // 3. Update local state
      setAllContent(prev => prev.map(c => 
        c.id === editingContent.id 
        ? {
            ...updatedContent,
            ...newLocation,
            chapterName: modalChapters.find(ch => ch.id === newLocation.chapterId)?.name || ''
          }
        : c
      ));

      toast.success("Content updated successfully!");
      setEditingContent(null);

    } catch (error) {
      console.error("Error updating content:", error);
      toast.error("Failed to update content.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/admin')} className="hover:scale-105 transition-bounce">
            <ArrowLeft className="mr-2" /> <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">All Content</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Filters */}
          <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 border-border">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Select value={filters.courseId} onValueChange={value => handleFilterChange('courseId', value)}>
                <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filters.yearId} onValueChange={value => handleFilterChange('yearId', value)} disabled={!filters.courseId}>
                <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filters.subjectId} onValueChange={value => handleFilterChange('subjectId', value)} disabled={!filters.yearId}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filters.chapterId} onValueChange={value => handleFilterChange('chapterId', value)} disabled={!filters.subjectId}>
                <SelectTrigger><SelectValue placeholder="Select Chapter" /></SelectTrigger>
                <SelectContent>{chapters.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filters.type} onValueChange={value => handleFilterChange('type', value === 'all' ? '' : value)}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="playlist">Playlist</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content titles..."
              className="pl-12 h-12 rounded-full"
            />
          </div>

          {/* Content List */}
          <div>
            <p className="text-sm text-muted-foreground mb-4">{filteredContent.length} item(s) found.</p>
          {filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-card rounded-2xl p-12 border-2 border-border">
                  <p className="text-xl text-muted-foreground">No content matches your criteria.</p>
                </div>
            </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredContent.map((content) => (
                  <AdminContentCard
                    key={content.id}
                    content={content}
                    onEdit={() => setEditingContent(content)}
                    onDelete={() => setDeletingContent(content)}
                  />
              ))}
            </div>
          )}
          </div>
        </motion.div>
      </main>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>
               Update the content details and location. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingContent && (
             <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                   <Label>Title</Label>
                   <Input value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} />
                </div>
                 <div className="space-y-2">
                   <Label>Description</Label>
                   <textarea value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} rows={3} className="w-full text-sm px-3 py-2 rounded-md border bg-transparent" />
                </div>
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label>New Location</Label>
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={() => {
                      setEditLocation({
                        courseId: editingContent.courseId,
                        yearId: editingContent.yearId,
                        subjectId: editingContent.subjectId,
                        chapterId: editingContent.chapterId,
                      });
                      toast.info("Location has been reset to its original value.");
                    }}>
                      Reset Location
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <Select value={editLocation.courseId} onValueChange={value => handleEditLocationChange('courseId', value)}>
                        <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                        <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                       <Select value={editLocation.yearId} onValueChange={value => handleEditLocationChange('yearId', value)} disabled={!editLocation.courseId}>
                        <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                        <SelectContent>{modalYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                      </Select>
                       <Select value={editLocation.subjectId} onValueChange={value => handleEditLocationChange('subjectId', value)} disabled={!editLocation.yearId}>
                        <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                        <SelectContent>{modalSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                       <Select value={editLocation.chapterId} onValueChange={value => handleEditLocationChange('chapterId', value)} disabled={!editLocation.subjectId}>
                        <SelectTrigger><SelectValue placeholder="Select Chapter" /></SelectTrigger>
                        <SelectContent>{modalChapters.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                </div>
             </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContent(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!deletingContent} onOpenChange={() => setDeletingContent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the content titled "{deletingContent?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
