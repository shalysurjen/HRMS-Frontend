import { toast } from "sonner";

export const notify = {
  success: (title: string, description?: string) => 
    toast.success(title, { description }),
    
  error: (title: string, description?: string) => 
    toast.error(title, { description }),
    
  info: (title: string, description?: string) => 
    toast.info(title, { description }),
  leaveAction: (status: string, name: string, isCompOff: boolean = false , isOD : boolean = false) => {
    const typeLabel = isCompOff ? "Comp-Off" : isOD ? "On-Duty" : "leave";

    const messages: Record<string, any> = {
      APPROVED: { 
        type: toast.success, 
        text: `Approved ${typeLabel} for ${name}` 
      },
      REJECTED: { 
        type: toast.error, 
        text: `Rejected ${typeLabel} for ${name}` 
      },
      MEETING_REQUIRED: { 
        type: toast.info, 
        text: `Discussion requested with ${name}` 
      },
    };
    
    const action = messages[status];
    if (action) action.type(action.text);
  }
};