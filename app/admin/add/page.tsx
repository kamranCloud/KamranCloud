"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course, Year, Subject, Chapter } from "@/types";

type CourseFromFirestore = Omit<Course, 'years'>;
type YearFromFirestore = Omit<Year, 'subjects'>;
type SubjectFromFirestore = Omit<Subject, 'chapters'>;

interface PendingContent {
  id: string;
  type: 'video' | 'playlist' | 'notes';
  title: string;
  url: string;
  thumbnail?: string;
  description?: string;
}

export default function AddContentPage() {
  const router = useRouter();
  const [contentType, setContentType] = useState<'video' | 'notes'>('video');
  const [formData, setFormData] = useState({
    courseId: '',
    yearId: '',
    subjectId: '',
    chapterId: '',
  });
  
  const [currentUrl, setCurrentUrl] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [pendingContents, setPendingContents] = useState<PendingContent[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const [courses, setCourses] = useState<CourseFromFirestore[]>([]);
  const [years, setYears] = useState<YearFromFirestore[]>([]);
  const [subjects, setSubjects] = useState<SubjectFromFirestore[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Load state from session storage on initial render
  useEffect(() => {
    const savedFormData = sessionStorage.getItem('addContentForm');
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  // Save state to session storage whenever it changes
  useEffect(() => {
    // Prevent saving default empty state on first load
    if (formData.courseId || formData.yearId || formData.subjectId || formData.chapterId) {
      sessionStorage.setItem('addContentForm', JSON.stringify(formData));
    }
  }, [formData]);

  // Handle prefilled URL from upload page
  useEffect(() => {
    const uploadedFilesRaw = localStorage.getItem('uploadedFiles');
    if (uploadedFilesRaw) {
      try {
        const newContent: PendingContent[] = JSON.parse(uploadedFilesRaw);
        setPendingContents(prev => [...prev, ...newContent]);
        localStorage.removeItem('uploadedFiles'); // Clean up
        toast.success(`${newContent.length} file(s) loaded from upload page!`);
      } catch (e) {
        console.error("Failed to parse uploaded files from localStorage", e);
        localStorage.removeItem('uploadedFiles'); // Clean up corrupted data
      }
    }
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      const coursesCollection = collection(db, 'courses');
      const courseSnapshot = await getDocs(coursesCollection);
      const coursesData = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CourseFromFirestore[];
      setCourses(coursesData.sort((a, b) => a.order - b.order));
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchYears = async () => {
      if (!formData.courseId) {
        setYears([]); // Clear years if course is deselected
        return;
      }
      const yearsCollection = collection(db, 'courses', formData.courseId, 'years');
      const yearSnapshot = await getDocs(yearsCollection);
      const yearsData = yearSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as YearFromFirestore[];
      setYears(yearsData.sort((a, b) => a.order - b.order));
    };
    fetchYears();
  }, [formData.courseId]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.courseId || !formData.yearId) {
        setSubjects([]);
        return;
      }
      const subjectsCollection = collection(db, 'courses', formData.courseId, 'years', formData.yearId, 'subjects');
      const subjectSnapshot = await getDocs(subjectsCollection);
      const subjectsData = subjectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubjectFromFirestore[];
      setSubjects(subjectsData.sort((a, b) => a.order - b.order));
    };
    fetchSubjects();
  }, [formData.courseId, formData.yearId]);

  useEffect(() => {
    const fetchChapters = async () => {
      if (!formData.courseId || !formData.yearId || !formData.subjectId) {
        setChapters([]);
        return;
      }
      const chaptersCollection = collection(db, 'courses', formData.courseId, 'years', formData.yearId, 'subjects', formData.subjectId, 'chapters');
      const chapterSnapshot = await getDocs(chaptersCollection);
      const chaptersData = chapterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chapter[];
      setChapters(chaptersData.sort((a, b) => a.order - b.order));
    };
    fetchChapters();
  }, [formData.courseId, formData.yearId, formData.subjectId]);

  const handleLocationChange = (field: 'courseId' | 'yearId' | 'subjectId' | 'chapterId', value: string) => {
    setFormData(prev => {
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

  const handleAddContent = async () => {
    if (!currentUrl) {
      toast.error("Please enter a URL.");
      return;
    }

    setIsAdding(true);

    try {
      if (contentType === 'notes') {
        // For notes, just add with the URL
        if (!contentTitle.trim()) {
          toast.error("Please enter a title for the notes.");
          setIsAdding(false);
          return;
        }
        
        const newContent: PendingContent = {
          id: `content_${Date.now()}`,
          type: contentType,
          title: contentTitle.trim(),
          url: currentUrl,
          description: contentDescription.trim() || undefined,
        };
        setPendingContents([...pendingContents, newContent]);
        setCurrentUrl('');
        setContentTitle('');
        setContentDescription('');
        toast.success("Notes added to list!");
      } else {
        // For videos and playlists, fetch details from API
        const response = await fetch('/api/youtube-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentUrl }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || "Invalid YouTube URL");
          setIsAdding(false);
          return;
        }

        const data = await response.json();

        const newContent: PendingContent = {
          id: `content_${Date.now()}`,
          type: data.type, // 'video' or 'playlist'
          title: data.title,
          url: currentUrl,
          thumbnail: data.thumbnail,
        };

        setPendingContents([...pendingContents, newContent]);
        setCurrentUrl('');
        toast.success(`${data.type === 'playlist' ? 'Playlist' : 'Video'} added to list!`);
      }
    } catch (error) {
      console.error("Error adding content: ", error);
      toast.error("Could not fetch video details. Please check the URL.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveContent = async (id: string) => {
    const contentToRemove = pendingContents.find(c => c.id === id);
    
    // If the content is a note and was just uploaded (check localStorage flag)
    if (contentToRemove && contentToRemove.type === 'notes' && contentToRemove.url.includes('drive.google.com')) {
      const isRecentUpload = localStorage.getItem('uploadedFiles')?.includes(contentToRemove.id);
      
      // A more robust check might be needed, but this is a good start.
      // Let's assume any note removed from this list before submission MIGHT be one to delete.
      try {
        await fetch('/api/google-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: contentToRemove.url }),
        });
        toast.info(`"${contentToRemove.title}" was deleted from Google Drive.`);
      } catch (error) {
        // Silently fail or log, as the user's primary goal is to remove from list
        console.warn("Could not delete from Drive, it might already be gone:", error);
      }
    }

    setPendingContents(pendingContents.filter(c => c.id !== id));
  };

  const handleSubmitAll = async () => {
    const { courseId, yearId, subjectId, chapterId } = formData;
    
    if (!courseId || !yearId || !subjectId || !chapterId) {
      toast.error("Please select course, year, subject, and chapter.");
      return;
    }

    if (pendingContents.length === 0) {
      toast.error("Please add at least one content item.");
      return;
    }

    try {
      const chapterRef = doc(db, "courses", courseId, "years", yearId, "subjects", subjectId, "chapters", chapterId);
      
      // Add all content items in a single update using arrayUnion with spread operator
      await updateDoc(chapterRef, {
        content: arrayUnion(...pendingContents)
      });

      toast.success(`${pendingContents.length} item(s) added successfully!`);
      
      // Only clear the pending contents, keep the form data so user can add more to same chapter
      setPendingContents([]);
    } catch (error) {
      console.error("Error submitting content: ", error);
      toast.error("Failed to add content. Please check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="hover:scale-105 transition-bounce"
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Add New Content</h1>
          <div className="w-16 sm:w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Form */}
          <div className="lg:col-span-2 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Selection Section */}
          <div className="bg-card rounded-2xl p-8 border-2 border-border shadow-doodle">
                <h2 className="text-lg font-bold mb-4">Select Location</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => handleLocationChange('courseId', value)}
                  >
                  <SelectTrigger>
                      <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  <Select
                    value={formData.yearId}
                    onValueChange={(value) => handleLocationChange('yearId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => handleLocationChange('subjectId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.chapterId}
                    onValueChange={(value) => handleLocationChange('chapterId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>
          </div>

          {/* Add Content Section */}
          <div className="bg-card rounded-2xl p-8 border-2 border-border shadow-doodle">
                <h2 className="text-lg font-bold mb-4">Add Content</h2>
            
            {/* Content Type Tabs */}
            <div className="flex gap-3 mb-6">
              <Button
                variant={contentType === 'video' ? 'hero' : 'outline'}
                className="flex-1 rounded-full"
                onClick={() => setContentType('video')}
              >
                Videos (Auto-detect Video/Playlist)
              </Button>
              <Button
                variant={contentType === 'notes' ? 'success' : 'outline'}
                className="flex-1 rounded-full"
                onClick={() => setContentType('notes')}
              >
                Notes
              </Button>
            </div>

                        <div className="space-y-4">
              {/* Title and Description for Notes */}
              {contentType === 'notes' && (
                <>
                  <div className="space-y-2">
                    <Label>Title <span className="text-destructive">*</span></Label>
                    <Input
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                      placeholder="Enter notes title"
                      type="text"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <textarea
                      value={contentDescription}
                      onChange={(e) => setContentDescription(e.target.value)}
                      placeholder="Add a description for the notes"
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{contentType === 'notes' ? 'Google Drive URL' : 'YouTube URL'}</Label>
                  {contentType === 'notes' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!formData.chapterId) {
                          toast.error("Please select course, year, subject, and chapter first.");
                          return;
                        }
                        const params = new URLSearchParams({
                          courseId: formData.courseId,
                          yearId: formData.yearId,
                          subjectId: formData.subjectId,
                          chapterId: formData.chapterId,
                              courseName: courses.find(c => c.id === formData.courseId)?.name || '',
                              yearName: years.find(y => y.id === formData.yearId)?.name || '',
                              subjectName: subjects.find(s => s.id === formData.subjectId)?.name || '',
                              chapterName: chapters.find(c => c.id === formData.chapterId)?.name || '',
                        });
                        router.push(`/admin/upload-notes?${params.toString()}`);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Don't have URL? Upload file →
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                <Input
                    value={currentUrl}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                    placeholder={contentType === 'notes' ? 'https://drive.google.com/...' : 'https://youtube.com/...'}
                    type="url"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddContent();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddContent} 
                    disabled={isAdding || !currentUrl}
                    className="whitespace-nowrap"
                  >
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add to List
                  </Button>
                </div>
              </div>
            </div>
              </div>
            </motion.div>
              </div>

          {/* Right Side: Pending Content */}
          <div className="lg:col-span-1">
            <div className="bg-card p-6 rounded-2xl border-2 border-border sticky top-28">
              <h2 className="text-lg font-bold mb-4">Content to be Added ({pendingContents.length})</h2>
              <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
                {pendingContents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No content items added yet.</p>
                ) : (
                  pendingContents.map((content) => (
                  <div key={content.id} className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                    {content.thumbnail && (
                      <img src={content.thumbnail} alt={content.title} className="w-24 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{content.title}</p>
                      {content.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{content.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-1">{content.url}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                      {content.type}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveContent(content.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  ))
                )}
              </div>

              <Button
                onClick={handleSubmitAll}
                variant="hero"
                className="w-full mt-6"
                disabled={!formData.chapterId}
              >
                Submit All ({pendingContents.length} items)
              </Button>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
