import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Paper, useTheme, Chip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { EventAvailable, TrendingUp, TrendingDown } from '@mui/icons-material';
import { apiService } from '../apiService';
import { WeeklyDashboardData, MonthlyDashboardData } from '../types';

export default function DashboardPage() {
  const theme = useTheme();
  const [weeklyData, setWeeklyData] = useState<WeeklyDashboardData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [weeklyRes, monthlyRes] = await Promise.all([
          apiService.getWeeklyDashboard(),
          apiService.getMonthlyDashboard()
        ]);
        if (weeklyRes.success) setWeeklyData(weeklyRes.data);
        if (monthlyRes.success) setMonthlyData(monthlyRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={60} thickness={4} /></Box>;
  }

  // Transform weekly data for charts
  const weeklyChartData = weeklyData?.days.map(day => {
    const dataPoint: any = { name: day.schedule_type };
    day.departments.forEach(dept => {
      dataPoint[dept.department_name] = dept.attendance_rate * 100;
    });
    dataPoint['전체'] = day.total.attendance_rate * 100;
    return dataPoint;
  }) || [];

  // Transform monthly data for charts
  const monthlyChartData = monthlyData?.days.map(day => {
    const dataPoint: any = { name: `${day.date.slice(5)} (${day.schedule_type})` };
    day.departments.forEach(dept => {
      dataPoint[dept.department_name] = dept.attendance_rate * 100;
    });
    dataPoint['전체'] = day.total.attendance_rate * 100;
    return dataPoint;
  }) || [];

  // Get unique department names for lines/bars
  const deptNames = Array.from(new Set(
    weeklyData?.days.flatMap(d => d.departments.map(dept => dept.department_name)) || []
  ));

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom color="text.primary">
        대시보드
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        이번 주 및 이번 달의 출석 현황을 한눈에 확인하세요.
      </Typography>

      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="h6">이번 주 출석 요약</Typography>
        <Chip label={`${weeklyData?.range.start} ~ ${weeklyData?.range.end}`} size="small" color="primary" variant="outlined" />
      </Box>
      
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3} mb={5}>
        {weeklyData?.days.map((day, index) => {
          const isGood = day.total.attendance_rate >= 0.7;
          return (
            <Box key={index}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography color="text.secondary" variant="subtitle2" gutterBottom textTransform="uppercase" letterSpacing={1}>
                        {day.date} ({day.schedule_type})
                      </Typography>
                      <Typography variant="h3" component="h2" fontWeight="800" sx={{ my: 1, color: 'text.primary' }}>
                        {day.total.present_count}
                        <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 1, fontWeight: 600 }}>
                          / {day.total.total_members}명
                        </Typography>
                      </Typography>
                    </Box>
                    <AvatarIcon isGood={isGood} />
                  </Box>
                  <Box display="flex" alignItems="center" mt={2} p={1.5} bgcolor={isGood ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'} borderRadius={2}>
                    {isGood ? <TrendingUp sx={{ mr: 1, color: '#059669' }} /> : <TrendingDown sx={{ mr: 1, color: '#d97706' }} />}
                    <Typography variant="body2" sx={{ color: isGood ? '#059669' : '#d97706', fontWeight: 'bold' }}>
                      출석률 {(day.total.attendance_rate * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: 'repeat(2, 1fr)' }} gap={4}>
        <Box>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom mb={3}>
              주간 부서별 출석률 (%)
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary }} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary }} />
                <Tooltip 
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                {deptNames.map((name, i) => (
                  <Bar key={name} dataKey={name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                ))}
                <Bar dataKey="전체" fill={theme.palette.text.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        <Box>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom mb={3}>
              월간 부서별 출석률 추이 (%)
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary }} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary }} />
                <Tooltip 
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                {deptNames.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                ))}
                <Line type="monotone" dataKey="전체" stroke={theme.palette.text.primary} strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

function AvatarIcon({ isGood }: { isGood: boolean }) {
  return (
    <Box sx={{ 
      p: 1.5, 
      borderRadius: 3, 
      bgcolor: isGood ? 'primary.light' : 'secondary.light', 
      color: isGood ? 'primary.main' : 'secondary.main', 
      display: 'flex',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <EventAvailable fontSize="medium" />
    </Box>
  );
}
