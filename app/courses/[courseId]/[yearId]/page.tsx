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
import { Subject, Year } from "@/types";

export default function SubjectsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const yearId = params.yearId as string;
  const [showProfile, setShowProfile] = useState(false);
  const [year, setYear] = useState<Year | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchYearAndSubjects = async () => {
      if (!courseId || !yearId) {
        setLoading(false);
        return;
      }
      try {
        const yearRef = doc(db, "courses", courseId, "years", yearId);
        const yearSnap = await getDoc(yearRef);

        if (yearSnap.exists()) {
          setYear({ id: yearSnap.id, ...yearSnap.data() } as Year);
        } else {
          console.log("No such year!");
        }

        const subjectsCollection = collection(db, "courses", courseId, "years", yearId, "subjects");
        const subjectSnapshot = await getDocs(subjectsCollection);
        const subjectList = subjectSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })) as Subject[];
        subjectList.sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
        setSubjects(subjectList);

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchYearAndSubjects();
  }, [courseId, yearId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!year) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Year not found</h2>
          <Button onClick={() => router.push(`/courses/${courseId}`)}>Back</Button>
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
            onClick={() => router.push(`/courses/${courseId}`)}
            className="hover:scale-105 transition-bounce"
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          
          <h1 className="text-2xl font-bold text-foreground">{year.name} - Select Subject</h1>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setShowProfile(true)}
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-card rounded-2xl p-12 border-2 border-border max-w-md mx-auto">
              <p className="text-xl text-muted-foreground">No subjects available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon!</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {subjects.map((subject, index) => (
              <NavigationCard
                key={subject.id}
                title={subject.name}
                description={subject.description}
                icon={subject.icon}
                onClick={() => router.push(`/courses/${courseId}/${yearId}/${subject.id}`)}
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