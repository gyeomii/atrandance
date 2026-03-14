import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, CircularProgress, Chip, Avatar, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Delete, Add, UploadFile, Group, Download } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { apiService } from '../apiService';
import { DepartmentWithMembers, Member, MemberType } from '../types';

export default function DepartmentManagePage() {
  const [departments, setDepartments] = useState<DepartmentWithMembers[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberGender, setNewMemberGender] = useState<string | null>(null);
  const [newMemberType, setNewMemberType] = useState<MemberType | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    const res = await apiService.getDepartments(true);
    if (res.success && res.data) {
      setDepartments(res.data as DepartmentWithMembers[]);
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
    const res = await apiService.createDepartment(newDeptName);
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
    const res = await apiService.addMember(selectedDept, { name: newMemberName, gender: newMemberGender ?? undefined, member_type: newMemberType ?? undefined });
    if (res.success) {
      fetchDepartments();
      // Update local members list for immediate UI feedback
      setMembers([...members, { id: -Date.now(), name: newMemberName, department_id: selectedDept, is_active: true, gender: newMemberGender ?? undefined, member_type: newMemberType ?? undefined }]);
      setOpenMemberDialog(false);
      setNewMemberName('');
      setNewMemberGender(null);
      setNewMemberType(null);
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

      // Expected Excel format: [{ "부서명": "1부", "이름": "홍길동", "성별": "B", "임원 여부": "O" }, ...]
      // 임원 여부: O (대소문자 무관) = OFFICER, X 또는 빈 값 = MEMBER
      const toMemberType = (val: unknown): MemberType => {
        if (typeof val === 'string' && val.toUpperCase() === 'O') return 'OFFICER';
        return 'MEMBER';
      };
      const formattedData = data.map(row => ({
        department_name: row['부서명'] || row['department'],
        member_name: row['이름'] || row['name'],
        gender: row['성별'] || row['gender'],
        member_type: toMemberType(row['임원 여부'] ?? row['member_type']),
      })).filter(item => item.department_name && item.member_name);

      if (formattedData.length > 0) {
        setLoading(true);
        const res = await apiService.bulkUploadDepartments({ rows: formattedData, create_missing_departments: true });
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

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['부서명', '이름', '성별', '임원 여부'],
      ['1부', '홍길동', 'B', 'O'],
      ['1부', '김영희', 'S', 'X'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, '부서원');
    XLSX.writeFile(wb, '부서원_일괄업로드_템플릿.xlsx');
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
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadTemplate}
            sx={{ borderRadius: 2, height: 48, px: 3 }}
          >
            템플릿 다운로드
          </Button>
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
                  <TableCell align="center">성별</TableCell>
                  <TableCell align="center">임원 여부</TableCell>
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
                      <TableCell align="center">
                        {member.gender === 'B' ? (
                          <Chip label="형제" size="small" color="primary" variant="outlined" />
                        ) : member.gender === 'S' ? (
                          <Chip label="자매" size="small" color="secondary" variant="outlined" />
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {member.member_type === 'OFFICER' ? (
                          <Chip label="임원" size="small" color="warning" variant="outlined" />
                        ) : (
                          <Chip label="부서원" size="small" color="default" variant="outlined" />
                        )}
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
                    <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                      <Group sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>부서를 선택해주세요</Typography>
                      <Typography variant="body2" color="text.disabled">좌측 목록에서 부서를 선택하면 부서원을 관리할 수 있습니다.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {selectedDept && members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
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
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>성별</Typography>
            <ToggleButtonGroup
              value={newMemberGender}
              exclusive
              onChange={(_e, val) => setNewMemberGender(val)}
              size="small"
              fullWidth
            >
              <ToggleButton value="B" sx={{ borderRadius: 2, flex: 1 }}>형제 (B)</ToggleButton>
              <ToggleButton value="S" sx={{ borderRadius: 2, flex: 1 }}>자매 (S)</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>임원 여부</Typography>
            <ToggleButtonGroup
              value={newMemberType}
              exclusive
              onChange={(_e, val) => setNewMemberType(val)}
              size="small"
              fullWidth
            >
              <ToggleButton value="OFFICER" sx={{ borderRadius: 2, flex: 1 }}>O (임원)</ToggleButton>
              <ToggleButton value="MEMBER" sx={{ borderRadius: 2, flex: 1 }}>X (부서원)</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => { setOpenMemberDialog(false); setNewMemberGender(null); setNewMemberType(null); }} color="inherit" sx={{ borderRadius: 2 }}>취소</Button>
          <Button onClick={handleAddMember} variant="contained" color="primary" sx={{ borderRadius: 2 }}>추가하기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
