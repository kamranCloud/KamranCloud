"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, FileText, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// Define the structure for a file being uploaded
interface UploadableFile {
  id: string;
  file: File;
  title: string;
  description: string;
  progress: number;
  uploadedUrl: string | null;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function UploadNotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get params from URL
  const [location, setLocation] = useState({
    courseId: '',
    yearId: '',
    subjectId: '',
    chapterId: '',
    courseName: '',
    yearName: '',
    subjectName: '',
    chapterName: '',
  });

  useEffect(() => {
    setLocation({
      courseId: searchParams.get('courseId') || '',
      yearId: searchParams.get('yearId') || '',
      subjectId: searchParams.get('subjectId') || '',
      chapterId: searchParams.get('chapterId') || '',
      courseName: searchParams.get('courseName') || '',
      yearName: searchParams.get('yearName') || '',
      subjectName: searchParams.get('subjectName') || '',
      chapterName: searchParams.get('chapterName') || '',
    });
  }, [searchParams]);

  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileAction = useCallback((incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const newUploadableFiles = Array.from(incomingFiles).map((file): UploadableFile | null => {
      // Basic validation
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return null;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB
        toast.error(`File too large: ${file.name}`);
        return null;
      }

      return {
        id: `${file.name}-${file.lastModified}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: '',
        progress: 0,
        uploadedUrl: null,
        status: 'pending',
      };
    }).filter((f): f is UploadableFile => f !== null);

    setFiles(prev => {
      const existingIds = new Set(prev.map(pf => pf.id));
      const trulyNewFiles = newUploadableFiles.filter(nf => !existingIds.has(nf.id));
      return [...prev, ...trulyNewFiles];
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileAction(e.dataTransfer.files);
  }, [handleFileAction]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileAction(e.target.files);
    e.target.value = ''; // Reset input
  };
  
  const updateFileDetail = (id: string, key: 'title' | 'description', value: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };
  
  const removeFile = async (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (!fileToRemove) return;

    // If the file was already uploaded, delete it from Google Drive
    if (fileToRemove.status === 'completed' && fileToRemove.uploadedUrl) {
      try {
        const response = await fetch('/api/google-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: fileToRemove.uploadedUrl }),
        });
        if (!response.ok) {
          throw new Error('Failed to delete file from Google Drive.');
        }
        toast.success(`"${fileToRemove.title}" was deleted from Google Drive.`);
      } catch (error: any) {
        toast.error(error.message);
        // Don't block UI removal if API fails, as file might already be deleted
      }
    }

    setFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const handleUploadAll = async () => {
    const filesToUpload = files.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) {
      toast.info("No new files to upload.");
      return;
    }

    for (const file of filesToUpload) {
      await uploadFile(file);
    }
    toast.success("All uploads complete!");
  };

  const uploadFile = async (uploadable: UploadableFile) => {
    setFiles(prev => prev.map(f => f.id === uploadable.id ? { ...f, status: 'uploading', progress: 5 } : f));

    let accessToken = '';

    try {
      // 1. Get upload URL
      const initResponse = await fetch('/api/google-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadable.title + '.' + uploadable.file.name.split('.').pop(),
          mimeType: uploadable.file.type,
          fileSize: uploadable.file.size,
          ...location
        }),
      });

      if (!initResponse.ok) throw new Error('Failed to initialize upload');
      
      const { uploadUrl, accessToken: initialAccessToken } = await initResponse.json();
      accessToken = initialAccessToken;
      
      setFiles(prev => prev.map(f => f.id === uploadable.id ? { ...f, progress: 15 } : f));

      // 2. Upload in chunks
      const chunkSize = 5 * 1024 * 1024; // 5 MB
      let uploadedBytes = 0;

      while (uploadedBytes < uploadable.file.size) {
        const chunk = uploadable.file.slice(uploadedBytes, uploadedBytes + chunkSize);
        const endByte = uploadedBytes + chunk.size - 1;

        const chunkResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Range': `bytes ${uploadedBytes}-${endByte}/${uploadable.file.size}` },
          body: chunk,
        });
            
        if (chunkResponse.status !== 308 && chunkResponse.status !== 200 && chunkResponse.status !== 201) {
          throw new Error(`Upload failed with status ${chunkResponse.status}`);
        }
        
        uploadedBytes += chunk.size;
        const progress = 15 + Math.floor((uploadedBytes / uploadable.file.size) * 75);
        setFiles(prev => prev.map(f => f.id === uploadable.id ? { ...f, progress } : f));
        
        if (chunkResponse.status === 200 || chunkResponse.status === 201) {
          const result = await chunkResponse.json();
          const fileId = result.id;
          if (!fileId) throw new Error('File ID not found in response.');

          // 3. Set permissions
          const tokenRes = await fetch('/api/google-auth');
          const { accessToken: freshToken } = await tokenRes.json();
          accessToken = freshToken;

          await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' }),
          });

          const shareableUrl = `https://drive.google.com/file/d/${fileId}/view`;
          setFiles(prev => prev.map(f => f.id === uploadable.id ? { ...f, status: 'completed', progress: 100, uploadedUrl: shareableUrl } : f));
          break; // Exit while loop
        }
      }
    } catch (err: any) {
      setFiles(prev => prev.map(f => f.id === uploadable.id ? { ...f, status: 'error', error: err.message } : f));
    }
  };

  const handleAddFilesToPost = () => {
    const uploadedFiles = files.filter(f => f.status === 'completed' && f.uploadedUrl);
    if (uploadedFiles.length === 0) {
      toast.error("No files have been successfully uploaded.");
      return;
    }

    const contentForAddPage = uploadedFiles.map(f => ({
      id: `content_${Date.now()}_${Math.random()}`,
      type: 'notes',
      title: f.title,
      url: f.uploadedUrl,
      description: f.description,
    }));
    
    // Use localStorage to pass data to the /add page
    localStorage.setItem('uploadedFiles', JSON.stringify(contentForAddPage));
    router.push('/admin/add');
  };

  const allDone = files.length > 0 && files.every(f => f.status === 'completed' || f.status === 'error');
  const isUploading = files.some(f => f.status === 'uploading');
  const hasPending = files.some(f => f.status === 'pending');

  if (!location.courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">Invalid Access</h2>
          <p className="text-muted-foreground mb-4">Please select a location from the Add Content page first.</p>
          <Button onClick={() => router.push('/admin/add')}>Go to Add Content</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/admin/add')} className="hover:scale-105 transition-bounce">
            <ArrowLeft className="mr-2" />
            Back to Add Content
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-foreground text-center px-2">Upload Notes</h1>
          <div className="w-16 sm:w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
          {/* Location Info */}
          <div className="bg-card rounded-2xl p-6 border-2 border-border shadow-doodle">
            <h2 className="text-lg font-bold mb-4">Upload Location</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
               <div><span className="text-muted-foreground">Course:</span><p className="font-semibold">{location.courseName}</p></div>
               <div><span className="text-muted-foreground">Year:</span><p className="font-semibold">{location.yearName}</p></div>
               <div><span className="text-muted-foreground">Subject:</span><p className="font-semibold">{location.subjectName}</p></div>
               <div><span className="text-muted-foreground">Chapter:</span><p className="font-semibold">{location.chapterName}</p></div>
            </div>
          </div>

          {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-border hover:border-primary/50'}`}
                >
                  <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-lg font-semibold">Drag & Drop files here</p>
            <p className="text-muted-foreground">or</p>
            <label htmlFor="file-input" className="mt-4 inline-block">
              <Button variant="outline" asChild><span>Browse Files</span></Button>
            </label>
            <input id="file-input" type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.ppt,.pptx" />
             <p className="text-xs text-muted-foreground mt-2">Supported: PDF, DOC, DOCX, PPT, PPTX (Max 100MB)</p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-card rounded-2xl p-8 border-2 border-border shadow-doodle space-y-4">
              <h2 className="text-xl font-bold">Files to Upload</h2>
              {files.map(f => (
                <div key={f.id} className="p-4 border rounded-lg space-y-3">
                   <div className="flex items-start gap-4">
                    <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
                      <FileText className="w-8 h-8 text-muted-foreground"/>
                    </div>
                    <div className="flex-1 space-y-2">
                       <Input value={f.title} onChange={e => updateFileDetail(f.id, 'title', e.target.value)} placeholder="File title" />
                       <textarea value={f.description} onChange={e => updateFileDetail(f.id, 'description', e.target.value)} placeholder="Description (optional)" rows={2} className="w-full text-sm px-3 py-2 rounded-md border bg-transparent" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(f.id)}><X className="w-4 h-4"/></Button>
                   </div>
                   {f.status !== 'pending' && (
                     <div className="space-y-1">
                       <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                         <div className="h-full bg-primary transition-all duration-300" style={{ width: `${f.progress}%` }} />
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span className="capitalize">{f.status}</span>
                         {f.status === 'error' && <span className="text-destructive">{f.error}</span>}
                         {f.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-success" />}
                       </div>
                    </div>
                  )}
                </div>
              ))}
                  </div>
                )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {hasPending && !isUploading && (
              <Button onClick={handleUploadAll} className="flex-1" variant="hero">
                      <Upload className="w-4 h-4 mr-2" />
                Upload All Pending Files
              </Button>
                  )}
            {isUploading && (
               <Button disabled className="flex-1">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
                </Button>
            )}
            {allDone && (
              <Button onClick={handleAddFilesToPost} className="flex-1" variant="success">
                Add {files.filter(f => f.status === 'completed').length} Files to Content List
                  </Button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
} 