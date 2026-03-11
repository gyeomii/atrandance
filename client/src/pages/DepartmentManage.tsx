import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, CircularProgress, Chip, Avatar } from '@mui/material';
import { Delete, Add, UploadFile, Group } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { apiService } from '../apiService';
import { Department, Member } from '../types';

export default function DepartmentManagePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    const res = await apiService.getDepartments(true);
    if (res.success && res.data) {
      setDepartments(res.data as Department[]);
    }
    setLoading(false);
  };

  const handleDeptClick = (deptId: number) => {
    setSelectedDept(deptId);
    const dept = departments.find(d => d.id === deptId);
    if (dept) {
      setMembers(dept.members || []);
    }
  };

  const handleAddDept = async () => {
    if (!newDeptName.trim()) return;
    const res = await apiService.addDepartment(newDeptName);
    if (res.success) {
      fetchDepartments();
      setOpenDeptDialog(false);
      setNewDeptName('');
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (window.confirm('정말 이 부서를 삭제하시겠습니까? 소속된 부서원도 모두 삭제됩니다.')) {
      const res = await apiService.deleteDepartment(id);
      if (res.success) {
        if (selectedDept === id) {
          setSelectedDept(null);
          setMembers([]);
        }
        fetchDepartments();
      }
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !selectedDept) return;
    const res = await apiService.addMember(selectedDept, newMemberName);
    if (res.success) {
      fetchDepartments();
      // Update local members list for immediate UI feedback
      setMembers([...members, { id: Date.now(), name: newMemberName, department_id: selectedDept }]);
      setOpenMemberDialog(false);
      setNewMemberName('');
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (window.confirm('정말 이 부서원을 삭제하시겠습니까?')) {
      const res = await apiService.deleteMember(id);
      if (res.success) {
        fetchDepartments();
        setMembers(members.filter(m => m.id !== id));
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      // Expected Excel format: [{ "부서명": "1부", "이름": "홍길동" }, ...]
      const formattedData = data.map(row => ({
        department_name: row['부서명'] || row['department'],
        member_name: row['이름'] || row['name']
      })).filter(item => item.department_name && item.member_name);

      if (formattedData.length > 0) {
        setLoading(true);
        const res = await apiService.uploadExcelData(formattedData);
        if (res.success) {
          alert('데이터 업로드가 완료되었습니다.');
          fetchDepartments();
          setSelectedDept(null);
          setMembers([]);
        } else {
          alert('데이터 업로드 중 오류가 발생했습니다.');
        }
        setLoading(false);
      } else {
        alert('올바른 형식의 엑셀 파일이 아닙니다. (필수 컬럼: 부서명, 이름)');
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom color="text.primary">
            부서/부서원 관리
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            부서를 생성하고 부서원을 등록하거나 엑셀로 일괄 업로드하세요.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadFile />}
          sx={{ borderRadius: 2, height: 48, px: 3, borderStyle: 'dashed', borderWidth: 2 }}
        >
          엑셀 일괄 업로드
          <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
        </Button>
      </Box>

      {loading && <Box display="flex" justifyContent="center" mb={4}><CircularProgress /></Box>}

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }} gap={4}>
        {/* Departments List */}
        <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', height: 'fit-content' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" p={3} bgcolor="background.default" borderBottom="1px solid" borderColor="divider">
            <Typography variant="h6" fontWeight="bold">부서 목록</Typography>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenDeptDialog(true)} sx={{ borderRadius: 2 }}>
              추가
            </Button>
          </Box>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>부서명</TableCell>
                  <TableCell align="right">인원</TableCell>
                  <TableCell align="center" width={80}>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow 
                    key={dept.id} 
                    hover 
                    selected={selectedDept === dept.id}
                    onClick={() => handleDeptClick(dept.id)}
                    sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.light' } } }}
                  >
                    <TableCell sx={{ fontWeight: selectedDept === dept.id ? 700 : 500, color: selectedDept === dept.id ? 'primary.main' : 'inherit' }}>
                      {dept.name}
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={`${dept.members?.length || 0}명`} size="small" variant={selectedDept === dept.id ? "filled" : "outlined"} color={selectedDept === dept.id ? "primary" : "default"} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id); }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">등록된 부서가 없습니다.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Members List */}
        <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', height: 'fit-content' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" p={3} bgcolor="background.default" borderBottom="1px solid" borderColor="divider">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: selectedDept ? 'primary.main' : 'action.disabledBackground', width: 36, height: 36 }}>
                <Group fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {selectedDept ? `${departments.find(d => d.id === selectedDept)?.name} 부서원` : '부서원 목록'}
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<Add />} 
              onClick={() => setOpenMemberDialog(true)}
              disabled={!selectedDept}
              sx={{ borderRadius: 2 }}
            >
              추가
            </Button>
          </Box>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>이름</TableCell>
                  <TableCell align="center" width={100} sx={{ pr: 4 }}>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedDept ? (
                  members.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell sx={{ pl: 4 }}>
                        <Typography fontWeight="500">{member.name}</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ pr: 4 }}>
                        <IconButton size="small" color="error" onClick={() => handleDeleteMember(member.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 10 }}>
                      <Group sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>부서를 선택해주세요</Typography>
                      <Typography variant="body2" color="text.disabled">좌측 목록에서 부서를 선택하면 부서원을 관리할 수 있습니다.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {selectedDept && members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">등록된 부서원이 없습니다.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Add Department Dialog */}
      <Dialog open={openDeptDialog} onClose={() => setOpenDeptDialog(false)} PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>새 부서 추가</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="부서명"
            fullWidth
            variant="outlined"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpenDeptDialog(false)} color="inherit" sx={{ borderRadius: 2 }}>취소</Button>
          <Button onClick={handleAddDept} variant="contained" color="primary" sx={{ borderRadius: 2 }}>추가하기</Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={openMemberDialog} onClose={() => setOpenMemberDialog(false)} PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>새 부서원 추가</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="이름"
            fullWidth
            variant="outlined"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpenMemberDialog(false)} color="inherit" sx={{ borderRadius: 2 }}>취소</Button>
          <Button onClick={handleAddMember} variant="contained" color="primary" sx={{ borderRadius: 2 }}>추가하기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
