"use client";

import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavigationCard from "@/components/NavigationCard";
import { useState, useEffect } from "react";
import DeveloperProfile from "@/components/DeveloperProfile";
import { collection, doc, getDoc, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Chapter, Subject } from "@/types";

export default function ChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const yearId = params.yearId as string;
  const subjectId = params.subjectId as string;
  const [showProfile, setShowProfile] = useState(false);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjectAndChapters = async () => {
      if (!courseId || !yearId || !subjectId) {
        setLoading(false);
        return;
      }
      try {
        const subjectRef = doc(db, "courses", courseId, "years", yearId, "subjects", subjectId);
        const subjectSnap = await getDoc(subjectRef);

        if (subjectSnap.exists()) {
          setSubject({ id: subjectSnap.id, ...subjectSnap.data() } as Subject);
        } else {
          console.log("No such subject!");
        }

        const chaptersCollection = collection(db, "courses", courseId, "years", yearId, "subjects", subjectId, "chapters");
        const chapterSnapshot = await getDocs(chaptersCollection);
        const chapterList = chapterSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chapter[];
        chapterList.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setChapters(chapterList);

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectAndChapters();
  }, [courseId, yearId, subjectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Subject not found</h2>
          <Button onClick={() => router.push(`/courses/${courseId}/${yearId}`)}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/courses/${courseId}/${yearId}`)}
            className="hover:scale-105 transition-bounce"
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          
          <h1 className="text-xl md:text-2xl font-bold text-foreground text-center px-2">{subject.name}</h1>
          
          {/* This empty div helps balance the flex layout */}
          <div className="w-16"></div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {chapters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-card rounded-2xl p-12 border-2 border-border max-w-md mx-auto">
              <p className="text-xl text-muted-foreground">No chapters available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon!</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {chapters.map((chapter, index) => (
              <NavigationCard
                key={chapter.id}
                title={chapter.name}
                description={chapter.description}
                icon="📖"
                onClick={() => router.push(`/learn/${courseId}/${yearId}/${subjectId}/${chapter.id}`)}
                delay={index * 0.1}
              />
            ))}
          </motion.div>
        )}
      </main>

      <DeveloperProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
} 