"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavigationCard from "@/components/NavigationCard";
import { useState, useEffect } from "react";
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/types";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesCollection = collection(db, 'courses');
        const courseSnapshot = await getDocs(coursesCollection);
        const courseList = courseSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })) as Course[];
        courseList.sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
        setCourses(courseList);
      } catch (error) {
        console.error("Error fetching courses: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="hover:scale-105 transition-bounce hover:bg-primary/10 font-semibold"
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Select Course
          </h1>
          
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {courses.map((course, index) => (
              <NavigationCard
                key={course.id}
                title={course.name}
                description={course.description}
                icon={course.icon}
                onClick={() => router.push(`/courses/${course.id}`)}
                delay={index * 0.1}
              />
            ))}
          </motion.div>
        )}
      </main>

    </div>
  );
} 