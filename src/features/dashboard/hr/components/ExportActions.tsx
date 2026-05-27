
import { Button } from '@/shared/components';
import { Card, CardContent } from '@/shared/components/Card';
import { Download, FileText, BarChart3, ChevronRight } from 'lucide-react';

import { Link } from 'react-router-dom';

export default function ExportActions() {
  return (
    <Card>
      <CardContent className="py-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Export Reports</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" /> Employee Leave (CSV)
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" /> Department (CSV)
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports">
              <BarChart3 className="h-4 w-4 mr-2" /> Full Audit Log
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}













// export function ExportActions() {
//   return (
//     <div className="p-4 bg-white shadow rounded">
//       <button className="px-4 py-2 bg-blue-500 text-white rounded">
//         Export Report
//       </button>
//     </div>
//   );
// }
