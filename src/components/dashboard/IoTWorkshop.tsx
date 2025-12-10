import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Cpu, Zap, Lightbulb, CircuitBoard, Wifi, Settings } from "lucide-react";

interface Resource {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  type: "simulator" | "tutorial" | "project";
}

const resources: Resource[] = [
  {
    title: "Tinkercad Circuits",
    description: "Design & simulate Arduino circuits online",
    url: "https://www.tinkercad.com/circuits",
    icon: <CircuitBoard className="h-5 w-5" />,
    type: "simulator",
  },
  {
    title: "Tinkercad Arduino",
    description: "Program Arduino with blocks or C++",
    url: "https://www.tinkercad.com/learn/circuits",
    icon: <Cpu className="h-5 w-5" />,
    type: "simulator",
  },
  {
    title: "Wokwi Simulator",
    description: "Advanced ESP32, Arduino & Raspberry Pi Pico",
    url: "https://wokwi.com/",
    icon: <Wifi className="h-5 w-5" />,
    type: "simulator",
  },
  {
    title: "Falstad Circuit Sim",
    description: "Analog circuit simulation",
    url: "https://www.falstad.com/circuit/",
    icon: <Zap className="h-5 w-5" />,
    type: "simulator",
  },
  {
    title: "LED Blink Project",
    description: "Your first Arduino project",
    url: "https://www.tinkercad.com/things/8IvKi3TGamQ",
    icon: <Lightbulb className="h-5 w-5" />,
    type: "project",
  },
  {
    title: "Traffic Light System",
    description: "Build a traffic light controller",
    url: "https://www.tinkercad.com/learn/circuits/lessons/traffic-light",
    icon: <CircuitBoard className="h-5 w-5" />,
    type: "project",
  },
  {
    title: "Temperature Sensor",
    description: "Read temperature with Arduino",
    url: "https://www.tinkercad.com/learn/circuits/lessons/temperature-sensor",
    icon: <Settings className="h-5 w-5" />,
    type: "project",
  },
  {
    title: "Servo Motor Control",
    description: "Control servo motors with code",
    url: "https://www.tinkercad.com/learn/circuits/lessons/servo-motor",
    icon: <Cpu className="h-5 w-5" />,
    type: "project",
  },
];

const IoTWorkshop = () => {
  const openResource = (url: string) => {
    window.open(url, "_blank");
  };

  const simulators = resources.filter((r) => r.type === "simulator");
  const projects = resources.filter((r) => r.type === "project");

  return (
    <Card className="h-full flex flex-col border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CircuitBoard className="h-5 w-5 text-primary" />
          IoT Workshop
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Practice circuits & IoT using online simulators
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="space-y-4">
            {/* Quick Launch - Tinkercad */}
            <div
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/30 p-4 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => openResource("https://www.tinkercad.com/dashboard")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Open Tinkercad</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Launch your workspace
                  </p>
                </div>
                <Button size="sm" variant="default" className="gap-1">
                  Launch <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Simulators */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Online Simulators
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {simulators.map((resource) => (
                  <div
                    key={resource.title}
                    className="group p-3 rounded-lg bg-background/50 hover:bg-background/80 border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => openResource(resource.url)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-primary">{resource.icon}</div>
                      <span className="text-xs font-medium truncate">{resource.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {resource.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Starter Projects */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Starter Projects
              </h4>
              <div className="space-y-2">
                {projects.map((resource) => (
                  <div
                    key={resource.title}
                    className="group flex items-center gap-3 p-2.5 rounded-lg bg-background/50 hover:bg-background/80 border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => openResource(resource.url)}
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      {resource.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{resource.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {resource.description}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Section */}
            <div className="rounded-lg bg-muted/50 p-3">
              <h4 className="text-xs font-semibold mb-2">💡 Quick Tips</h4>
              <ul className="text-[10px] text-muted-foreground space-y-1">
                <li>• Create free Tinkercad account to save projects</li>
                <li>• Use Wokwi for ESP32 & WiFi projects</li>
                <li>• Falstad is best for analog circuit analysis</li>
                <li>• Export code from simulators to real hardware</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default IoTWorkshop;
