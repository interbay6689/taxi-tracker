import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag } from "lucide-react";

interface QuickTagsBarProps {
  selectedTag?: string;
  onSelectTag: (tag: string) => void;
  onClearTag: () => void;
}

export const QuickTagsBar = ({ selectedTag, onSelectTag, onClearTag }: QuickTagsBarProps) => {
  const quickTags = ["שדה", "תחנה", "הזמנה", "שדה תעופה", "נסיעה ארוכה", "עיר"];
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          תיוגים מהירים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!selectedTag ? "default" : "outline"}
            size="sm"
            onClick={onClearTag}
            className="h-8 text-xs"
          >
            ללא תיוג
          </Button>
          {quickTags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectTag(tag)}
              className="h-8 text-xs hover-scale"
            >
              {tag}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};