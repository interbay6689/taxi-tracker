import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TagsManagementProps {
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
}

export const TagsManagement = ({ tags, onUpdateTags }: TagsManagementProps) => {
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) {
      toast({
        title: "שגיאה",
        description: "אנא הזן שם תיוג",
        variant: "destructive",
      });
      return;
    }
    
    if (tags.includes(trimmed)) {
      toast({
        title: "שגיאה", 
        description: "התיוג כבר קיים",
        variant: "destructive",
      });
      return;
    }

    onUpdateTags([...tags, trimmed]);
    setNewTag("");
    
    toast({
      title: "תיוג נוסף",
      description: `התיוג "${trimmed}" נוסף בהצלחה`,
    });
  };

  const handleDeleteTag = (tagToDelete: string) => {
    onUpdateTags(tags.filter(tag => tag !== tagToDelete));
    
    toast({
      title: "תיוג נמחק",
      description: `התיוג "${tagToDelete}" נמחק בהצלחה`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          ניהול תיוגים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="הזן תיוג חדש"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleAddTag} size="sm">
            <Plus className="h-4 w-4 ml-1" />
            הוסף
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm">תיוגים קיימים:</Label>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-muted-foreground text-sm">אין תיוגים</p>
            ) : (
              tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-2 px-2 py-1"
                >
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTag(tag)}
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};