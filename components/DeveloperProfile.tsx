"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Heart, Github, Linkedin, Instagram, Mail, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DeveloperProfile = () => {
  const socialLinks = [
    {
      href: "https://github.com/iamaako",
      icon: <Github className="w-5 h-5" />,
      label: "GitHub",
    },
    {
      href: "https://www.linkedin.com/in/iamaako/",
      icon: <Linkedin className="w-5 h-5" />,
      label: "LinkedIn",
    },
    {
      href: "https://www.instagram.com/i.am.aako/",
      icon: <Instagram className="w-5 h-5" />,
      label: "Instagram",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="fixed top-4 right-4 bg-black text-white hover:bg-gray-800 shadow-lg flex items-center z-50"
        >
          <span className="mr-2 pointer-events-none">Developed by Aarif Khan</span>
          <Heart className="w-5 h-5 text-red-500 fill-current pointer-events-none" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Image
              src="https://raw.githubusercontent.com/mattroot007/IMG-BTECHNODE/main/IMAGES/IMG_20250111_214046_860.jpg"
              alt="Developer's profile picture"
              width={120}
              height={120}
              className="rounded-full border-4 border-primary"
            />
                </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Aarif Khan
          </DialogTitle>
          <DialogDescription className="text-center">
            Full Stack Developer | AI Student
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-sm text-muted-foreground">
            Hi, I'm Aarif Khan, a passionate developer creating modern web
            applications. Feel free to connect with me!
          </p>
          <p className="text-center text-sm font-medium mt-2">
            Aligarh Muslim University | 2024-2028
          </p>
                  </div>
        <div className="flex justify-center gap-4">
          {socialLinks.map((link) => (
                  <Button
              asChild
              key={link.label}
                    variant="outline"
                    size="icon"
              className="rounded-full"
                  >
              <Link href={link.href} target="_blank">
                {link.icon}
                <span className="sr-only">{link.label}</span>
              </Link>
                  </Button>
          ))}
                </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeveloperProfile;
