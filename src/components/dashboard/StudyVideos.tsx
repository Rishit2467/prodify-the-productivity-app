import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, Youtube } from "lucide-react";

interface Video {
  id: string;
  title: string;
  duration: string;
}

const studyVideos: Video[] = [
  { id: "aHILkO_u4xk", title: "12 Hour Study Day - Deep Focus", duration: "12:00:00" },
  { id: "4Yp7yZ3XL8s", title: "Study With Me - Pomodoro Style", duration: "3:30:00" },
  { id: "1MKL_8AAiQs", title: "Library Ambience - Silent Study", duration: "2:00:00" },
  { id: "wfJQmNqqG_o", title: "Morning Study Session", duration: "4:00:00" },
  { id: "BTYz0dGNqDs", title: "Late Night Study With Me", duration: "5:00:00" },
  { id: "lTRiuFIWV54", title: "Productive Day in My Life", duration: "15:32" },
  { id: "vbuq7w3ZDUQ", title: "How I Study Effectively", duration: "12:45" },
  { id: "p2BtXcIxJNM", title: "Focus Music for Deep Work", duration: "3:00:00" },
];

const StudyVideos = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const openInYouTube = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
  };

  const openChannel = () => {
    window.open("https://www.youtube.com/channel/UCQYMhOMi_Cdj1CEAU-fv80A", "_blank");
  };

  return (
    <Card className="h-full flex flex-col border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Study Videos
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={openChannel}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Curated study sessions from James Scholz
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {selectedVideo ? (
          <div className="p-4 space-y-3">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate flex-1">{selectedVideo.title}</p>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(null)}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100%-1rem)] px-4 pb-4">
            <div className="space-y-2">
              {studyVideos.map((video) => (
                <div
                  key={video.id}
                  className="group flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="relative w-20 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <p className="text-xs text-muted-foreground">{video.duration}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      openInYouTube(video.id);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyVideos;
