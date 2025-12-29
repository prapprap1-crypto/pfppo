import { DashboardStats } from '@/types/po';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatusChartProps {
  stats: DashboardStats;
}

const COLORS = {
  new: 'hsl(199, 89%, 48%)',
  imported: 'hsl(213, 56%, 24%)',
  needReview: 'hsl(38, 92%, 50%)',
  verified: 'hsl(142, 76%, 36%)',
  exported: 'hsl(215, 16%, 70%)',
  error: 'hsl(0, 84%, 60%)',
};

export function StatusChart({ stats }: StatusChartProps) {
  const data = [
    { name: 'พบไฟล์ใหม่', value: stats.newPOs, color: COLORS.new },
    { name: 'นำเข้าสำเร็จ', value: stats.importedPOs, color: COLORS.imported },
    { name: 'รอตรวจสอบ', value: stats.needReviewPOs, color: COLORS.needReview },
    { name: 'ตรวจสอบสำเร็จ', value: stats.verifiedPOs, color: COLORS.verified },
    { name: 'นำออกแล้ว', value: stats.exportedPOs, color: COLORS.exported },
    { name: 'มีข้อผิดพลาด', value: stats.errorPOs, color: COLORS.error },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-card rounded-xl border p-5">
      <h3 className="font-semibold text-foreground mb-4">สถานะ PO ทั้งหมด</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} รายการ`]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
