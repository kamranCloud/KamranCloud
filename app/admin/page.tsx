"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Settings, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavigationCard from "@/components/NavigationCard";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to log out.");
    }
  };

  const adminSections = [
    {
      title: "Add Content",
      description: "Upload videos and notes",
      icon: Plus,
      path: "/admin/add",
    },
    {
      title: "Manage Structure",
      description: "Manage courses, years, subjects, chapters",
      icon: Settings,
      path: "/admin/manage",
    },
    {
      title: "All Content",
      description: "View and edit all uploaded content",
      icon: Database,
      path: "/admin/all",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="hover:scale-105 transition-bounce"
          >
            <ArrowLeft className="mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <p className="mb-6 text-muted-foreground">
          Welcome to the admin dashboard. Here you can manage the content of the
          website.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {adminSections.map((section, index) => (
            <NavigationCard
              key={section.path}
              title={section.title}
              description={section.description}
              icon={section.icon}
              onClick={() => router.push(section.path)}
              delay={index * 0.1}
            />
          ))}
        </motion.div>
      </main>
    </div>
  );
} 