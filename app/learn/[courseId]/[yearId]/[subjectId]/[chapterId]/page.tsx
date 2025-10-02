"use client";

import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import DeveloperProfile from "@/components/DeveloperProfile";
import ContentCard from "@/components/ContentCard";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Chapter } from "@/types";

export default function LearningPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const yearId = params.yearId as string;
  const subjectId = params.subjectId as string;
  const chapterId = params.chapterId as string;
  const [activeTab, setActiveTab] = useState<'videos' | 'notes'>('videos');
  const [showProfile, setShowProfile] = useState(false);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchChapter = async () => {
      if (!courseId || !yearId || !subjectId || !chapterId) {
        setLoading(false);
        return;
      }
      try {
        const chapterRef = doc(db, "courses", courseId, "years", yearId, "subjects", subjectId, "chapters", chapterId);
        const chapterSnap = await getDoc(chapterRef);

        if (chapterSnap.exists()) {
          setChapter({ id: chapterSnap.id, ...chapterSnap.data() } as Chapter);
        } else {
          console.log("No such chapter!");
        }
      } catch (error) {
        console.error("Error fetching chapter: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [courseId, yearId, subjectId, chapterId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Chapter not found</h2>
          <Button onClick={() => router.push(`/courses/${courseId}/${yearId}/${subjectId}`)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  const videos = chapter.content?.filter(c => c.type === 'video' || c.type === 'playlist') || [];
  const notes = chapter.content?.filter(c => c.type === 'notes') || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/courses/${courseId}/${yearId}/${subjectId}`)}
            className="hover:scale-105 transition-bounce"
          >
            <ArrowLeft className="mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <h1 className="text-xl md:text-2xl font-bold text-foreground text-center px-2 truncate">{chapter.name}</h1>
          
          {/* This empty div helps balance the flex layout */}
          <div className="w-16 sm:w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Tab Switcher */}
        <div className="flex gap-3 justify-center mb-8">
          <Button
            variant={activeTab === 'videos' ? 'hero' : 'outline'}
            className="rounded-full px-8"
            onClick={() => setActiveTab('videos')}
          >
            Videos ({videos.length})
          </Button>
          <Button
            variant={activeTab === 'notes' ? 'success' : 'outline'}
            className="rounded-full px-8"
            onClick={() => setActiveTab('notes')}
          >
            Notes ({notes.length})
          </Button>
        </div>

        {/* Content Grid */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {activeTab === 'videos' ? (
            videos.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-card rounded-2xl p-12 border-2 border-border">
                  <p className="text-xl text-muted-foreground">No videos available yet.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {videos.map((content, index) => (
                  <ContentCard key={content.id} content={content} delay={index * 0.05} />
                ))}
              </div>
            )
          ) : (
            notes.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-card rounded-2xl p-12 border-2 border-border">
                  <p className="text-xl text-muted-foreground">No notes available yet.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {notes.map((content, index) => (
                  <ContentCard key={content.id} content={content} delay={index * 0.05} />
                ))}
              </div>
            )
          )}
        </motion.div>
      </main>

    </div>
  );
} 