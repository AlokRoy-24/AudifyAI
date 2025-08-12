import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, CheckCircle2 } from "lucide-react";

interface AuditParameter {
  id: string;
  name: string;
  description: string;
  category: string;
}

const auditParameters: AuditParameter[] = [
  { id: "greeting", name: "Professional Greeting", description: "Agent properly greets the customer", category: "Opening" },
  { id: "introduction", name: "Agent Introduction", description: "Agent introduces themselves and company", category: "Opening" },
  { id: "active-listening", name: "Active Listening", description: "Agent demonstrates active listening skills", category: "Communication" },
  { id: "empathy", name: "Empathy", description: "Agent shows empathy towards customer concerns", category: "Communication" },
  { id: "clarity", name: "Clear Communication", description: "Agent speaks clearly and concisely", category: "Communication" },
  { id: "solution-oriented", name: "Solution-Oriented", description: "Agent focuses on solving customer problems", category: "Problem Solving" },
  { id: "product-knowledge", name: "Product Knowledge", description: "Agent demonstrates good product knowledge", category: "Knowledge" },
  { id: "objection-handling", name: "Objection Handling", description: "Agent effectively handles customer objections", category: "Sales" },
  { id: "closing", name: "Proper Closing", description: "Agent properly closes the call", category: "Closing" },
  { id: "follow-up", name: "Follow-up Commitment", description: "Agent commits to follow-up actions", category: "Closing" },
];

interface AuditParametersDrawerProps {
  selectedParameters: string[];
  onParametersChange: (parameters: string[]) => void;
  onComplete: () => void;
}

const AuditParametersDrawer = ({ selectedParameters, onParametersChange, onComplete }: AuditParametersDrawerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredParameters = auditParameters.filter(param =>
    param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    param.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    param.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(auditParameters.map(param => param.category))];

  const handleParameterToggle = (parameterId: string) => {
    const newParameters = selectedParameters.includes(parameterId)
      ? selectedParameters.filter(id => id !== parameterId)
      : [...selectedParameters, parameterId];
    onParametersChange(newParameters);
  };

  const handleApplyParameters = () => {
    if (selectedParameters.length > 0) {
      onComplete();
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant={selectedParameters.length > 0 ? "outline" : "cta"} className="w-full">
          {selectedParameters.length > 0 ? 'Change Parameters' : 'Select Audit Parameters'}
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Select Audit Parameters</SheetTitle>
          <SheetDescription>
            Choose the parameters you want to analyze in your call audit
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Selected count */}
          <div className="text-sm text-muted-foreground">
            {selectedParameters.length} parameters selected
          </div>

          {/* Parameters by category */}
          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {categories.map(category => (
              <div key={category}>
                <h4 className="font-medium text-sm text-foreground mb-3">{category}</h4>
                <div className="space-y-3">
                  {filteredParameters
                    .filter(param => param.category === category)
                    .map(param => (
                      <div key={param.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={param.id}
                          checked={selectedParameters.includes(param.id)}
                          onCheckedChange={() => handleParameterToggle(param.id)}
                          className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor={param.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {param.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {param.description}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Apply button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleApplyParameters} 
              className="w-full"
              disabled={selectedParameters.length === 0}
            >
              Apply Parameters ({selectedParameters.length})
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AuditParametersDrawer;