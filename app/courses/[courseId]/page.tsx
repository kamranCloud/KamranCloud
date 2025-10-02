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
import { Year, Course } from "@/types";

export default function YearsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const [showProfile, setShowProfile] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseAndYears = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }
      try {
        // Fetch course details
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);

        if (courseSnap.exists()) {
          setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
        } else {
          console.log("No such course!");
        }

        // Fetch years subcollection
        const yearsCollection = collection(db, "courses", courseId, "years");
        const yearSnapshot = await getDocs(yearsCollection);
        const yearList = yearSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })) as Year[];
        yearList.sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
        setYears(yearList);

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndYears();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => router.push('/courses')}>Back to Courses</Button>
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
            onClick={() => router.push('/courses')}
            className="hover:scale-105 transition-bounce"
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          
          <h1 className="text-2xl font-bold text-foreground">{course.name} - Select Year</h1>
          
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
        {years.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-card rounded-2xl p-12 border-2 border-border max-w-md mx-auto">
              <p className="text-xl text-muted-foreground">No years available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon!</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {years.map((year, index) => (
              <NavigationCard
                key={year.id}
                title={year.name}
                description={year.description}
                icon={year.icon}
                onClick={() => router.push(`/courses/${courseId}/${year.id}`)}
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