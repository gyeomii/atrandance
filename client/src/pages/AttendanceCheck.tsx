import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip, Avatar } from '@mui/material';
import { CheckCircle, Cancel, Search } from '@mui/icons-material';
import { apiService } from '../apiService';
import { Department, ScheduleType, AttendanceListData } from '../types';

export default function AttendanceCheckPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | ''>('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('SUN');
  const [date, setDate] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AttendanceListData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      const res = await apiService.getDepartments(false);
      if (res.success && res.data) {
        setDepartments(res.data as Department[]);
      }
    };
    fetchDepts();
  }, []);

  // Set default date based on schedule type
  useEffect(() => {
    // Get current time in KST
    const kstString = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
    const todayKST = new Date(kstString);
    
    const currentDay = todayKST.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    let targetDay = 0; // Default SUN

    if (scheduleType === 'WED') targetDay = 3;
    else if (scheduleType === 'SAT') targetDay = 6;
    else if (scheduleType === 'SUN') targetDay = 0;

    const diff = todayKST.getDate() - currentDay + targetDay;
    const targetDate = new Date(todayKST.setDate(diff));
    
    // If the target date is in the future for this week, go back one week
    const currentKST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    if (targetDate > currentKST && currentDay !== targetDay) {
      targetDate.setDate(targetDate.getDate() - 7);
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
  }, [scheduleType]);

  const handleSearch = async () => {
    if (!selectedDept || !scheduleType || !date) return;
    setLoading(true);
    const res = await apiService.getAttendanceList(Number(selectedDept), scheduleType, date);
    if (res.success && res.data) {
      setAttendanceData(res.data);
    }
    setLoading(false);
  };

  const handleToggleAttendance = async (memberId: number, currentStatus: boolean) => {
    if (!attendanceData || !selectedDept) return;
    
    // Optimistic update
    setAttendanceData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        members: prev.members.map(m => 
          m.member_id === memberId ? { ...m, present: !currentStatus } : m
        )
      };
    });

    await apiService.markAttendance({
      schedule_id: attendanceData.schedule.id,
      member_id: memberId,
      department_id: Number(selectedDept),
      present: !currentStatus
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (!selectedDate) {
      setDate('');
      return;
    }

    // Parse as UTC to avoid local timezone offset issues
    const dayOfWeek = new Date(selectedDate).getUTCDay();
    let isValid = false;

    if (scheduleType === 'WED' && dayOfWeek === 3) isValid = true;
    else if (scheduleType === 'SAT' && dayOfWeek === 6) isValid = true;
    else if (scheduleType === 'SUN' && dayOfWeek === 0) isValid = true;

    if (isValid) {
      setDate(selectedDate);
    } else {
      const dayNames = { 'WED': '수요일', 'SAT': '토요일', 'SUN': '일요일' };
      alert(`선택하신 일정 종류(${dayNames[scheduleType]})에 맞는 요일만 선택 가능합니다.`);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom color="text.primary">
        출석 체크
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        부서와 일정을 선택하고 부서원들의 출석을 마킹하세요.
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }} gap={3} alignItems="flex-start">
          <Box>
            <FormControl fullWidth size="medium">
              <InputLabel>부서 선택</InputLabel>
              <Select
                value={selectedDept}
                label="부서 선택"
                onChange={(e) => setSelectedDept(e.target.value as number)}
                sx={{ borderRadius: 2 }}
              >
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FormControl fullWidth size="medium">
              <InputLabel>일정 종류</InputLabel>
              <Select
                value={scheduleType}
                label="일정 종류"
                onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
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
              label="날짜"
              type="date"
              value={date}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              helperText={
                scheduleType === 'WED' ? '수요일만 선택 가능' :
                scheduleType === 'SAT' ? '토요일만 선택 가능' :
                '일요일만 선택 가능'
              }
            />
          </Box>
          <Box sx={{ pt: { xs: 0, md: 1 } }}>
            <Button 
              fullWidth 
              variant="contained" 
              color="primary" 
              size="large" 
              startIcon={<Search />}
              onClick={handleSearch}
              disabled={!selectedDept || !scheduleType || !date}
              sx={{ height: 56, borderRadius: 2 }}
            >
              조회하기
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress size={60} thickness={4} /></Box>
      ) : attendanceData ? (
        <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" p={3} bgcolor="background.default" borderBottom="1px solid" borderColor="divider">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                {departments.find(d => d.id === selectedDept)?.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {departments.find(d => d.id === selectedDept)?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {date} 출석 명단
                </Typography>
              </Box>
            </Box>
            <Chip 
              label={`출석 ${attendanceData.members.filter(m => m.present).length} / ${attendanceData.members.length}명`} 
              color="primary" 
              variant="filled"
              sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2.5, px: 1, borderRadius: 3 }}
            />
          </Box>
          <TableContainer>
            <Table sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 4, width: '60%' }}>이름</TableCell>
                  <TableCell align="center" sx={{ pr: 4 }}>출석 상태 (클릭하여 변경)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceData.members.map(member => (
                  <TableRow 
                    key={member.member_id} 
                    hover 
                    onClick={() => handleToggleAttendance(member.member_id, member.present)}
                    sx={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                  >
                    <TableCell sx={{ pl: 4 }}>
                      <Typography variant="subtitle1" fontWeight="500">{member.name}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ pr: 4 }}>
                      {member.present ? (
                        <Chip 
                          icon={<CheckCircle />} 
                          label="출석" 
                          color="success" 
                          variant="filled"
                          sx={{ minWidth: 100, fontWeight: 'bold' }}
                          clickable
                        />
                      ) : (
                        <Chip 
                          icon={<Cancel />} 
                          label="결석" 
                          color="default" 
                          variant="outlined"
                          sx={{ minWidth: 100, color: 'text.secondary' }}
                          clickable
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {attendanceData.members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.secondary">등록된 부서원이 없습니다.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 4, bgcolor: 'transparent' }}>
          <Search sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            조회할 데이터를 선택해주세요
          </Typography>
          <Typography variant="body2" color="text.disabled">
            상단의 필터를 설정하고 조회 버튼을 누르면 명단이 나타납니다.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
