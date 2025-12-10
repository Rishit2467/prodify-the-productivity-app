import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, ExternalLink, Youtube, Code, Cpu, Zap } from "lucide-react";

interface Video {
  id: string;
  title: string;
  duration: string;
  channel: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  videos: Video[];
}

const categories: Category[] = [
  {
    id: "digital",
    name: "Digital Electronics",
    icon: <Cpu className="h-4 w-4" />,
    videos: [
      { id: "M0mx8S05v60", title: "Digital Electronics Full Course", duration: "4:30:00", channel: "Neso Academy" },
      { id: "dQw4w9WgXcQ", title: "Number Systems - Binary, Octal, Hex", duration: "25:30", channel: "Neso Academy" },
      { id: "JQBRzsPhw2w", title: "Logic Gates Explained", duration: "15:42", channel: "Ben Eater" },
      { id: "QZwneRb-zqA", title: "Boolean Algebra & K-Maps", duration: "32:15", channel: "Neso Academy" },
      { id: "6E5zaMs_s6Y", title: "Flip Flops & Sequential Circuits", duration: "45:20", channel: "Neso Academy" },
      { id: "ShbKS1GEhGE", title: "Counters and Registers", duration: "28:45", channel: "Neso Academy" },
      { id: "FwFLrzPQX3M", title: "Microprocessor 8085 Basics", duration: "1:20:00", channel: "Gate Smashers" },
      { id: "lNuPy-r1GuQ", title: "VHDL Tutorial for Beginners", duration: "55:30", channel: "NPTEL" },
    ],
  },
  {
    id: "python",
    name: "Python",
    icon: <Code className="h-4 w-4" />,
    videos: [
      { id: "_uQrJ0TkZlc", title: "Python Tutorial for Beginners", duration: "6:14:00", channel: "Programming with Mosh" },
      { id: "rfscVS0vtbw", title: "Learn Python - Full Course", duration: "4:26:52", channel: "freeCodeCamp" },
      { id: "8DvywoWv6fI", title: "Python for Data Science", duration: "12:00:00", channel: "freeCodeCamp" },
      { id: "HGOBQPFzWKo", title: "100 Days of Python", duration: "3:45:00", channel: "Angela Yu" },
      { id: "XKHEtdqhLK8", title: "Python OOP Tutorial", duration: "1:30:00", channel: "Corey Schafer" },
      { id: "sugvnHA7ElY", title: "Python DSA - Full Course", duration: "5:22:00", channel: "freeCodeCamp" },
      { id: "tb8gHvYlCFs", title: "Django Tutorial for Beginners", duration: "4:00:00", channel: "Dennis Ivy" },
      { id: "GGL8W8DHKCI", title: "Flask Web Dev Tutorial", duration: "2:45:00", channel: "Tech With Tim" },
    ],
  },
  {
    id: "c",
    name: "C Programming",
    icon: <Zap className="h-4 w-4" />,
    videos: [
      { id: "KJgsSFOSQv0", title: "C Programming Full Course", duration: "3:46:13", channel: "freeCodeCamp" },
      { id: "87SH2Cn0s9A", title: "C Tutorial for Beginners", duration: "4:00:00", channel: "Bro Code" },
      { id: "rLf3jnHxSmU", title: "Pointers in C Explained", duration: "1:30:00", channel: "Neso Academy" },
      { id: "udfbq4M2Kfc", title: "Data Structures in C", duration: "2:15:00", channel: "Jenny's Lectures" },
      { id: "B31LgI4Y4DQ", title: "Dynamic Memory Allocation", duration: "45:30", channel: "Neso Academy" },
      { id: "lh_yI9fbM3A", title: "File Handling in C", duration: "35:20", channel: "Gate Smashers" },
      { id: "EK6iYFMaW3c", title: "C Projects for Beginners", duration: "2:00:00", channel: "Code With Harry" },
      { id: "si-KFFOW2gk", title: "Advanced C Concepts", duration: "1:45:00", channel: "Jacob Sorber" },
    ],
  },
  {
    id: "ece",
    name: "ECE Core",
    icon: <Cpu className="h-4 w-4" />,
    videos: [
      { id: "Vd2UJiIPbag", title: "Signals & Systems Complete", duration: "8:00:00", channel: "Neso Academy" },
      { id: "AgQDIDBnMfs", title: "Control Systems Full Course", duration: "6:30:00", channel: "NPTEL" },
      { id: "pGeDsLarOn4", title: "Analog Electronics Basics", duration: "3:45:00", channel: "Neso Academy" },
      { id: "d8_xXNcGYgo", title: "Electromagnetic Theory", duration: "5:20:00", channel: "NPTEL" },
      { id: "XuD4Ezaj1nI", title: "Communication Systems", duration: "4:15:00", channel: "Gate Smashers" },
      { id: "O0xOBLcvVi4", title: "VLSI Design Fundamentals", duration: "2:30:00", channel: "NPTEL" },
      { id: "H2rTecSO0gk", title: "Microcontroller 8051", duration: "3:00:00", channel: "Tutorials Point" },
      { id: "VZlFUbzLzpQ", title: "Embedded Systems Basics", duration: "2:45:00", channel: "Great Learning" },
    ],
  },
];

const StudyVideos = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeCategory, setActiveCategory] = useState("digital");

  const openInYouTube = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
  };

  return (
    <Card className="h-full flex flex-col border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          Study Materials
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        {selectedVideo ? (
          <div className="p-4 space-y-3 flex-1 flex flex-col">
            <div className="aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium line-clamp-2">{selectedVideo.title}</p>
                <p className="text-xs text-muted-foreground">{selectedVideo.channel} • {selectedVideo.duration}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(null)}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-2 grid grid-cols-4 h-auto">
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="text-xs py-1.5 px-2">
                    <span className="hidden sm:inline">{cat.name}</span>
                    <span className="sm:hidden">{cat.icon}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="flex-1 mt-2 overflow-hidden">
                  <ScrollArea className="h-full px-4 pb-4">
                    <div className="space-y-2">
                      {category.videos.map((video) => (
                        <div
                          key={video.id}
                          className="group flex items-center gap-3 p-2.5 rounded-lg bg-background/50 hover:bg-background/80 border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
                          onClick={() => setSelectedVideo(video)}
                        >
                          <div className="relative w-16 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="h-4 w-4 text-white fill-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-2">{video.title}</p>
                            <p className="text-[10px] text-muted-foreground">{video.channel} • {video.duration}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openInYouTube(video.id);
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyVideos;
