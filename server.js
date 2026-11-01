const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// เปิดไฟล์หน้าเว็บจากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public'))); 

const dataFile = path.join(__dirname, 'data.json');

// อ่านข้อมูลคิว
function loadData() {
    if (fs.existsSync(dataFile)) {
        return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
    // เพิ่มตัวนับแยกประเภท
    return { queues: [], shortCount: 0, longCount: 0 }; 
}

function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// API: ดึงข้อมูลคิวทั้งหมด
app.get('/api/queues', (req, res) => {
    res.json(loadData().queues);
});

// API: ลงทะเบียนคิวใหม่
app.post('/api/register', (req, res) => {
    const data = loadData();
    const { name, gunType, round } = req.body;

    let qId;
    // แยกเลขคิว S (Short) และ L (Long)
    if (gunType === 'ปืนสั้น/Pistol') {
        data.shortCount = (data.shortCount || 0) + 1;
        qId = 'S' + data.shortCount;
    } else {
        data.longCount = (data.longCount || 0) + 1;
        qId = 'L' + data.longCount;
    }

    const newQueue = {
        id: qId,
        name: name,
        gunType: gunType,
        round: round,
        status: 'รอเรียก'
    };
    
    data.queues.push(newQueue);
    saveData(data);

    res.json({ success: true, qId: qId });
});

// API: อัปเดตสถานะคิว
app.put('/api/status', (req, res) => {
    const data = loadData();
    const { id, action } = req.body; 
    
    const q = data.queues.find(item => item.id === id);
    if (q) {
        if (action === 'call') {
            q.status = (q.status === 'รอเรียก') ? 'กำลังยิง' : 'เสร็จสิ้น';
        } else if (action === 'finish') {
            q.status = 'เสร็จสิ้น';
        }
        saveData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

// API: รีเซ็ตระบบ
app.post('/api/reset', (req, res) => {
    saveData({ queues: [], shortCount: 0, longCount: 0 });
    res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});