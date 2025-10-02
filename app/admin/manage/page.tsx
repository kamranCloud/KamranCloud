"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, setDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course, Year, Subject, Chapter } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

type CourseFromFirestore = Omit<Course, 'years'>;

const courseSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  icon: z.string().min(1, "Icon is required"),
  order: z.number().min(0, "Order must be a positive number"),
});

const yearSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  order: z.number().min(0, "Order must be a positive number"),
});

const subjectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  icon: z.string().min(1, "Icon is required"),
  order: z.number().min(0, "Order must be a positive number"),
});

const chapterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  order: z.number().min(0, "Order must be a positive number"),
});

type CourseFormData = z.infer<typeof courseSchema>;
type YearFormData = z.infer<typeof yearSchema>;
type SubjectFormData = z.infer<typeof subjectSchema>;
type ChapterFormData = z.infer<typeof chapterSchema>;

export default function ManageStructurePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'courses' | 'years' | 'subjects' | 'chapters'>('courses');
  const [courses, setCourses] = useState<CourseFromFirestore[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseFromFirestore | null>(null);
  const [editingYear, setEditingYear] = useState<Year | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const courseForm = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  const yearForm = useForm<YearFormData>({
    resolver: zodResolver(yearSchema),
  });

  const subjectForm = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
  });

  const chapterForm = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
  });


  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const coursesCollection = collection(db, 'courses');
      const courseSnapshot = await getDocs(coursesCollection);
      const courseList = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CourseFromFirestore[];
      courseList.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setCourses(courseList);
      if (courseList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(courseList[0].id);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchYears = async () => {
      if (!selectedCourseId) return;
      setLoading(true);
      const yearsCollection = collection(db, 'courses', selectedCourseId, 'years');
      const yearSnapshot = await getDocs(yearsCollection);
      const yearList = yearSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Year[];
      yearList.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setYears(yearList);
      if (yearList.length > 0 && !selectedYearId) {
        setSelectedYearId(yearList[0].id)
      } else if (yearList.length === 0) {
        setSelectedYearId('');
      }
      setLoading(false);
    };

    if (activeTab === 'years' || activeTab === 'subjects' || activeTab === 'chapters') {
      fetchYears();
    }
  }, [activeTab, selectedCourseId]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedCourseId || !selectedYearId) return;
      setLoading(true);
      const subjectsCollection = collection(db, 'courses', selectedCourseId, 'years', selectedYearId, 'subjects');
      const subjectSnapshot = await getDocs(subjectsCollection);
      const subjectList = subjectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
      subjectList.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setSubjects(subjectList);
      if (subjectList.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjectList[0].id)
      } else if (subjectList.length === 0) {
        setSelectedSubjectId('');
      }
      setLoading(false);
    };

    if (activeTab === 'subjects' || activeTab === 'chapters') {
      fetchSubjects();
    }
  }, [activeTab, selectedCourseId, selectedYearId]);

  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedCourseId || !selectedYearId || !selectedSubjectId) return;
      setLoading(true);
      const chaptersCollection = collection(db, 'courses', selectedCourseId, 'years', selectedYearId, 'subjects', selectedSubjectId, 'chapters');
      const chapterSnapshot = await getDocs(chaptersCollection);
      const chapterList = chapterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chapter[];
      chapterList.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setChapters(chapterList);
      setLoading(false);
    };

    if (activeTab === 'chapters') {
      fetchChapters();
    }
  }, [activeTab, selectedCourseId, selectedYearId, selectedSubjectId]);

  useEffect(() => {
    if (editingCourse) {
      courseForm.reset(editingCourse);
    } else {
      const nextOrder = courses.length > 0 ? Math.max(...courses.map(c => c.order ?? 0)) + 1 : 1;
      courseForm.reset({ name: '', description: '', icon: '', order: nextOrder });
    }
  }, [editingCourse, courses, courseForm]);

  useEffect(() => {
    if (editingYear) {
      yearForm.reset(editingYear);
    } else {
      const nextOrder = years.length > 0 ? Math.max(...years.map(y => y.order ?? 0)) + 1 : 1;
      yearForm.reset({ name: '', order: nextOrder });
    }
  }, [editingYear, years, yearForm]);

  useEffect(() => {
    if (editingSubject) {
      subjectForm.reset(editingSubject);
    } else {
      const nextOrder = subjects.length > 0 ? Math.max(...subjects.map(s => s.order ?? 0)) + 1 : 1;
      subjectForm.reset({ name: '', icon: '', order: nextOrder });
    }
  }, [editingSubject, subjects, subjectForm]);

  useEffect(() => {
    if (editingChapter) {
      chapterForm.reset(editingChapter);
    } else {
      const nextOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order ?? 0)) + 1 : 1;
      chapterForm.reset({ name: '', order: nextOrder });
    }
  }, [editingChapter, chapters, chapterForm]);

  const handleCourseDialogChange = (open: boolean) => {
    setIsCourseDialogOpen(open);
    if (!open) {
      setEditingCourse(null);
    }
  };

  const handleYearDialogChange = (open: boolean) => {
    setIsYearDialogOpen(open);
    if (!open) {
      setEditingYear(null);
    }
  };

  const handleSubjectDialogChange = (open: boolean) => {
    setIsSubjectDialogOpen(open);
    if (!open) {
      setEditingSubject(null);
    }
  };

  const handleChapterDialogChange = (open: boolean) => {
    setIsChapterDialogOpen(open);
    if (!open) {
      setEditingChapter(null);
    }
  };

  const onCourseSubmit = courseForm.handleSubmit((data) => {
    if (editingCourse) {
      handleUpdateCourse(data);
    } else {
      handleAddCourse(data);
    }
  });

  const onYearSubmit = yearForm.handleSubmit((data) => {
    if (editingYear) {
      handleUpdateYear(data);
    } else {
      handleAddYear(data);
    }
  });

  const onSubjectSubmit = subjectForm.handleSubmit((data) => {
    if (editingSubject) {
      handleUpdateSubject(data);
    } else {
      handleAddSubject(data);
    }
  });

  const onChapterSubmit = chapterForm.handleSubmit((data) => {
    if (editingChapter) {
      handleUpdateChapter(data);
    } else {
      handleAddChapter(data);
    }
  });

  const handleAddCourse = async (data: CourseFormData) => {
    try {
      const id = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const courseRef = doc(db, "courses", id);
      await setDoc(courseRef, data);
      
      toast.success("Course added successfully!");
      setCourses([...courses, { ...data, id }]);
      handleCourseDialogChange(false);
    } catch (error) {
      console.error("Error adding course: ", error);
      toast.error("Failed to add course.");
    }
  };

  const handleAddYear = async (data: YearFormData) => {
    if (!selectedCourseId) {
      toast.error("No course selected.");
      return;
    }

    try {
      const id = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const yearRef = doc(db, "courses", selectedCourseId, "years", id);
      await setDoc(yearRef, data);

      toast.success("Year added successfully!");
      setYears([...years, { ...data, id, subjects: [] }]);
      handleYearDialogChange(false);
    } catch (error) {
      console.error("Error adding year: ", error);
      toast.error("Failed to add year.");
    }
  };

  const handleAddSubject = async (data: SubjectFormData) => {
    if (!selectedCourseId || !selectedYearId) {
      toast.error("No course or year selected.");
      return;
    }

    try {
      const id = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const subjectRef = doc(db, "courses", selectedCourseId, "years", selectedYearId, "subjects", id);
      await setDoc(subjectRef, data);

      toast.success("Subject added successfully!");
      setSubjects([...subjects, { ...data, id, chapters: [] }]);
      handleSubjectDialogChange(false);
    } catch (error) {
      console.error("Error adding subject: ", error);
      toast.error("Failed to add subject.");
    }
  };

  const handleAddChapter = async (data: ChapterFormData) => {
    if (!selectedCourseId || !selectedYearId || !selectedSubjectId) {
      toast.error("No course, year, or subject selected.");
      return;
    }

    try {
      const id = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const chapterRef = doc(db, "courses", selectedCourseId, "years", selectedYearId, "subjects", selectedSubjectId, "chapters", id);
      await setDoc(chapterRef, { ...data, content: [] });

      toast.success("Chapter added successfully!");
      setChapters([...chapters, { ...data, id, content: [] }]);
      handleChapterDialogChange(false);
    } catch (error) {
      console.error("Error adding chapter: ", error);
      toast.error("Failed to add chapter.");
    }
  };


  const handleUpdateCourse = async (data: CourseFormData) => {
    if (!editingCourse) return;
    try {
      const courseRef = doc(db, "courses", editingCourse.id);
      await updateDoc(courseRef, data);
      
      toast.success("Course updated successfully!");
      setCourses(courses.map(c => c.id === editingCourse.id ? { ...editingCourse, ...data } : c));
      handleCourseDialogChange(false);
    } catch (error) {
      console.error("Error updating course: ", error);
      toast.error("Failed to update course.");
    }
  };

  const handleUpdateYear = async (data: YearFormData) => {
    if (!editingYear || !selectedCourseId) return;
    try {
      const yearRef = doc(db, "courses", selectedCourseId, "years", editingYear.id);
      await updateDoc(yearRef, data);
      
      toast.success("Year updated successfully!");
      setYears(years.map(y => y.id === editingYear.id ? { ...editingYear, ...data } : y));
      handleYearDialogChange(false);
    } catch (error) {
      console.error("Error updating year: ", error);
      toast.error("Failed to update year.");
    }
  };

  const handleUpdateSubject = async (data: SubjectFormData) => {
    if (!editingSubject || !selectedCourseId || !selectedYearId) return;
    try {
      const subjectRef = doc(db, "courses", selectedCourseId, "years", selectedYearId, "subjects", editingSubject.id);
      await updateDoc(subjectRef, data);
      
      toast.success("Subject updated successfully!");
      setSubjects(subjects.map(s => s.id === editingSubject.id ? { ...editingSubject, ...data } : s));
      handleSubjectDialogChange(false);
    } catch (error) {
      console.error("Error updating subject: ", error);
      toast.error("Failed to update subject.");
    }
  };

  const handleUpdateChapter = async (data: ChapterFormData) => {
    if (!editingChapter || !selectedCourseId || !selectedYearId || !selectedSubjectId) return;
    try {
      const chapterRef = doc(db, "courses", selectedCourseId, "years", selectedYearId, "subjects", selectedSubjectId, "chapters", editingChapter.id);
      await updateDoc(chapterRef, data);
      
      toast.success("Chapter updated successfully!");
      setChapters(chapters.map(c => c.id === editingChapter.id ? { ...editingChapter, ...data } : c));
      handleChapterDialogChange(false);
    } catch (error) {
      console.error("Error updating chapter: ", error);
      toast.error("Failed to update chapter.");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteDoc(doc(db, "courses", courseId));
      toast.success("Course deleted successfully!");
      setCourses(courses.filter(course => course.id !== courseId));
    } catch (error) {
      console.error("Error deleting course: ", error);
      toast.error("Failed to delete course.");
    }
  };

  const handleDeleteYear = async (yearId: string) => {
    if (!selectedCourseId) return;
    try {
      await deleteDoc(doc(db, "courses", selectedCourseId, "years", yearId));
      toast.success("Year deleted successfully!");
      setYears(years.filter(year => year.id !== yearId));
    } catch (error) {
      console.error("Error deleting year: ", error);
      toast.error("Failed to delete year.");
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!selectedCourseId || !selectedYearId) return;
    try {
      await deleteDoc(doc(db, "courses", selectedCourseId, "years", selectedYearId, "subjects", subjectId));
      toast.success("Subject deleted successfully!");
      setSubjects(subjects.filter(subject => subject.id !== subjectId));
    } catch (error) {
      console.error("Error deleting subject: ", error);
      toast.error("Failed to delete subject.");
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!selectedCourseId || !selectedYearId || !selectedSubjectId) return;
    try {
      await deleteDoc(doc(db, "courses", selectedCourseId, "years", selectedYearId, "subjects", selectedSubjectId, "chapters", chapterId));
      toast.success("Chapter deleted successfully!");
      setChapters(chapters.filter(chapter => chapter.id !== chapterId));
    } catch (error) {
      console.error("Error deleting chapter: ", error);
      toast.error("Failed to delete chapter.");
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">All Courses</h3>
              <Dialog open={isCourseDialogOpen} onOpenChange={handleCourseDialogChange}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingCourse(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
                    <DialogDescription>
                      {editingCourse ? 'Update the details for this course.' : 'Fill in the details below to add a new course.'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={onCourseSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...courseForm.register("name")} />
                        {courseForm.formState.errors.name && <p className="text-red-500 text-sm">{courseForm.formState.errors.name.message}</p>}
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" {...courseForm.register("description")} />
                        {courseForm.formState.errors.description && <p className="text-red-500 text-sm">{courseForm.formState.errors.description.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="icon">Icon</Label>
                        <Input id="icon" {...courseForm.register("icon")} />
                        {courseForm.formState.errors.icon && <p className="text-red-500 text-sm">{courseForm.formState.errors.icon.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="order">Order</Label>
                        <Input id="order" type="number" {...courseForm.register("order", { valueAsNumber: true })} />
                        {courseForm.formState.errors.order && <p className="text-red-500 text-sm">{courseForm.formState.errors.order.message}</p>}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">{editingCourse ? 'Save Changes' : 'Add Course'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Order</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.order}</TableCell>
                        <TableCell className="text-2xl">{course.icon}</TableCell>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>{course.description}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => {
                              setEditingCourse(course);
                              setIsCourseDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the course.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      case 'years':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold">Manage Years</h3>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isYearDialogOpen} onOpenChange={handleYearDialogChange}>
                <DialogTrigger asChild>
                  <Button disabled={!selectedCourseId} onClick={() => setEditingYear(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Year
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingYear ? 'Edit Year' : 'Add New Year'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onYearSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="yearName">Name</Label>
                        <Input id="yearName" {...yearForm.register("name")} />
                        {yearForm.formState.errors.name && <p className="text-red-500 text-sm">{yearForm.formState.errors.name.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="yearOrder">Order</Label>
                        <Input id="yearOrder" type="number" {...yearForm.register("order", { valueAsNumber: true })} />
                        {yearForm.formState.errors.order && <p className="text-red-500 text-sm">{yearForm.formState.errors.order.message}</p>}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">{editingYear ? 'Save Changes' : 'Add Year'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : (
                    years.map((year) => (
                      <TableRow key={year.id}>
                        <TableCell>{year.order}</TableCell>
                        <TableCell className="font-medium">{year.name}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => {
                              setEditingYear(year);
                              setIsYearDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the year.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteYear(year.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      case 'subjects':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold">Manage Subjects</h3>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isSubjectDialogOpen} onOpenChange={handleSubjectDialogChange}>
                <DialogTrigger asChild>
                  <Button disabled={!selectedYearId} onClick={() => setEditingSubject(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Subject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onSubjectSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subjectName">Name</Label>
                        <Input id="subjectName" {...subjectForm.register("name")} />
                        {subjectForm.formState.errors.name && <p className="text-red-500 text-sm">{subjectForm.formState.errors.name.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="subjectIcon">Icon</Label>
                        <Input id="subjectIcon" {...subjectForm.register("icon")} />
                        {subjectForm.formState.errors.icon && <p className="text-red-500 text-sm">{subjectForm.formState.errors.icon.message}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subjectOrder">Order</Label>
                      <Input id="subjectOrder" type="number" {...subjectForm.register("order", { valueAsNumber: true })} />
                      {subjectForm.formState.errors.order && <p className="text-red-500 text-sm">{subjectForm.formState.errors.order.message}</p>}
                    </div>
                    <DialogFooter>
                      <Button type="submit">{editingSubject ? 'Save Changes' : 'Add Subject'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Order</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : (
                    subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>{subject.order}</TableCell>
                        <TableCell className="text-2xl">{subject.icon}</TableCell>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => {
                              setEditingSubject(subject);
                              setIsSubjectDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the subject.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      case 'chapters':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold">Manage Chapters</h3>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isChapterDialogOpen} onOpenChange={handleChapterDialogChange}>
                <DialogTrigger asChild>
                  <Button disabled={!selectedSubjectId} onClick={() => setEditingChapter(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Chapter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingChapter ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onChapterSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="chapterName">Name</Label>
                        <Input id="chapterName" {...chapterForm.register("name")} />
                        {chapterForm.formState.errors.name && <p className="text-red-500 text-sm">{chapterForm.formState.errors.name.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="chapterOrder">Order</Label>
                        <Input id="chapterOrder" type="number" {...chapterForm.register("order", { valueAsNumber: true })} />
                        {chapterForm.formState.errors.order && <p className="text-red-500 text-sm">{chapterForm.formState.errors.order.message}</p>}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">{editingChapter ? 'Save Changes' : 'Add Chapter'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : (
                    chapters.map((chapter) => (
                      <TableRow key={chapter.id}>
                        <TableCell>{chapter.order}</TableCell>
                        <TableCell className="font-medium">{chapter.name}</TableCell>
                        <TableCell className="text-right">
                           <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => {
                              setEditingChapter(chapter);
                              setIsChapterDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteChapter(chapter.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )
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
          
          <h1 className="text-2xl font-bold text-foreground">Manage Structure</h1>
          
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            <Button
              variant={activeTab === 'courses' ? 'hero' : 'outline'}
              className="rounded-full"
              onClick={() => setActiveTab('courses')}
            >
              Courses
            </Button>
            <Button
              variant={activeTab === 'years' ? 'hero' : 'outline'}
              className="rounded-full"
              onClick={() => setActiveTab('years')}
            >
              Years
            </Button>
            <Button
              variant={activeTab === 'subjects' ? 'hero' : 'outline'}
              className="rounded-full"
              onClick={() => setActiveTab('subjects')}
            >
              Subjects
            </Button>
            <Button
              variant={activeTab === 'chapters' ? 'hero' : 'outline'}
              className="rounded-full"
              onClick={() => setActiveTab('chapters')}
            >
              Chapters
            </Button>
          </div>

          {/* Content */}
          <div className="bg-card rounded-2xl p-8 border-2 border-border shadow-doodle">
            {renderContent()}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
