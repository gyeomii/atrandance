import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, FormControl, InputLabel, Select, MenuItem, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, useTheme, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EmojiEvents, Search } from '@mui/icons-material';
import { apiService } from '../apiService';
import { ScheduleType, AttendanceByDepartmentData, RankingByDateData } from '../types';

export default function StatisticsPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Chart State
  const [chartScheduleType, setChartScheduleType] = useState<ScheduleType>('SUN');
  const [chartStartDate, setChartStartDate] = useState('2026-03-01');
  const [chartEndDate, setChartEndDate] = useState('2026-03-31');
  const [chartData, setChartData] = useState<AttendanceByDepartmentData | null>(null);

  // Ranking State
  const [rankScheduleType, setRankScheduleType] = useState<ScheduleType>('SUN');
  const [rankDate, setRankDate] = useState('2026-03-08');
  const [rankData, setRankData] = useState<RankingByDateData | null>(null);

  const fetchChartData = async () => {
    setLoading(true);
    const res = await apiService.getAttendanceByDepartment(chartScheduleType, chartStartDate, chartEndDate);
    if (res.success && res.data) {
      setChartData(res.data);
    }
    setLoading(false);
  };

  const fetchRankData = async () => {
    setLoading(true);
    const res = await apiService.getRankingByDate(rankDate, rankScheduleType);
    if (res.success && res.data) {
      setRankData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tabValue === 0) fetchChartData();
    else fetchRankData();
  }, [tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formattedChartData = chartData?.dates.map(dateEntry => {
    const dataPoint: any = { name: dateEntry.date.slice(5) }; // MM-DD
    dateEntry.departments.forEach(dept => {
      dataPoint[dept.department_name] = dept.present_count;
    });
    return dataPoint;
  }) || [];

  const deptNames = Array.from(new Set(
    chartData?.dates.flatMap(d => d.departments.map(dept => dept.department_name)) || []
  ));

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom color="text.primary">
        통계 모니터링
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        다양한 지표를 통해 부서별 출석 현황을 분석하세요.
      </Typography>

      <Paper elevation={0} sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary" 
          textColor="primary" 
          variant="fullWidth"
          sx={{ '& .MuiTab-root': { py: 2, fontWeight: 600, fontSize: '1rem' } }}
        >
          <Tab label="기간별 부서 출석 추이" />
          <Tab label="특정일 부서 출석 순위" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4 }}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(4, 1fr)' }} gap={2} alignItems="center" mb={5}>
            <Box>
              <FormControl fullWidth>
                <InputLabel>일정 종류</InputLabel>
                <Select
                  value={chartScheduleType}
                  label="일정 종류"
                  onChange={(e) => setChartScheduleType(e.target.value as ScheduleType)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="WED">수요말씀</MenuItem>
                  <MenuItem value="SAT">토요교제</MenuItem>
                  <MenuItem value="SUN">주일</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="시작일"
                type="date"
                value={chartStartDate}
                onChange={(e) => setChartStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="종료일"
                type="date"
                value={chartEndDate}
                onChange={(e) => setChartEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <Box>
              <Button fullWidth variant="contained" color="primary" size="large" onClick={fetchChartData} startIcon={<Search />} sx={{ height: 56, borderRadius: 2 }}>
                조회
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" my={8}><CircularProgress size={60} thickness={4} /></Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom align="center" mb={4}>
                부서별 출석 인원 수 (명)
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={formattedChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                  {deptNames.map((name, i) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4 }}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} gap={2} alignItems="center" mb={5}>
            <Box>
              <FormControl fullWidth>
                <InputLabel>일정 종류</InputLabel>
                <Select
                  value={rankScheduleType}
                  label="일정 종류"
                  onChange={(e) => setRankScheduleType(e.target.value as ScheduleType)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="WED">수요말씀</MenuItem>
                  <MenuItem value="SAT">토요교제</MenuItem>
                  <MenuItem value="SUN">주일</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="기준일"
                type="date"
                value={rankDate}
                onChange={(e) => setRankDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <Box>
              <Button fullWidth variant="contained" color="primary" size="large" onClick={fetchRankData} startIcon={<Search />} sx={{ height: 56, borderRadius: 2 }}>
                조회
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" my={8}><CircularProgress size={60} thickness={4} /></Box>
          ) : rankData ? (
            <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" width="10%">순위</TableCell>
                    <TableCell width="30%">부서명</TableCell>
                    <TableCell align="right" width="20%">출석 인원</TableCell>
                    <TableCell align="right" width="20%">전체 인원</TableCell>
                    <TableCell align="right" width="20%">출석률</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankData.departments.map((dept) => (
                    <TableRow key={dept.department_id} hover>
                      <TableCell align="center">
                        {dept.rank === 1 ? <EmojiEvents sx={{ color: '#fbbf24', fontSize: 32 }} /> :
                         dept.rank === 2 ? <EmojiEvents sx={{ color: '#9ca3af', fontSize: 28 }} /> :
                         dept.rank === 3 ? <EmojiEvents sx={{ color: '#b45309', fontSize: 24 }} /> :
                         <Typography fontWeight="bold" color="text.secondary" variant="h6">{dept.rank}</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{dept.department_name}</TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight="600">{dept.present_count} 명</Typography>
                      </TableCell>
                      <TableCell align="right" color="text.secondary">{dept.total_members} 명</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${(dept.attendance_rate * 100).toFixed(1)}%`} 
                          color={dept.attendance_rate >= 0.7 ? "success" : "warning"}
                          variant="outlined"
                          sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {rankData.departments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary">해당 날짜의 데이터가 없습니다.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Paper>
      )}
    </Box>
  );
}
